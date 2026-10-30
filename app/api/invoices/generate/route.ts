import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateInvoicePdfBuffer, type InvoicePdfData } from '@/lib/invoice-pdf-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shopId,
      billId,
      invoiceNumber,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      tax,
      total,
      paidAmount,
      dueAmount,
      paymentMethod,
      issuedAt,
      shopProfile,
      staff,
      staffName,
      stylist,
    } = body;

    if (!shopId || !invoiceNumber) {
      return NextResponse.json({ error: 'Missing shopId or invoiceNumber' }, { status: 400 });
    }

    // 1. Fetch shop data if not provided
    let shopData = shopProfile;
    let dbLogoPath = '';
    if (!shopData || !shopData.shopName || !shopData.logoImg) {
      const { data: sRow } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .maybeSingle();

      if (sRow) {
        dbLogoPath = sRow.logo_path || '';
        shopData = {
          shopName: shopData?.shopName || sRow.name,
          phone: shopData?.phone || sRow.phone,
          street: shopData?.address || shopData?.street || sRow.address || sRow.street,
          city: shopData?.city || sRow.city,
          pincode: shopData?.pinCode || shopData?.pincode || sRow.pin_code || sRow.pincode,
          email: shopData?.email || sRow.email,
          upiId: shopData?.upiId || sRow.upi_id,
          logoImg: shopData?.logoImg || dbLogoPath,
        };
      } else if (!shopData) {
        shopData = { shopName: 'StyleFleet Salon' };
      }
    }

    // Resolve stylist name prominently
    const resolvedStaff = stylist || staffName || staff || (items && items[0]?.staff) || 'Stylist';
    const resolvedLogo = shopData?.logoImg || shopProfile?.logoImg || dbLogoPath || '';

    // 2. Build invoice payload
    const pdfData: InvoicePdfData = {
      invoiceNumber,
      billId,
      issuedAt: issuedAt || new Date().toISOString(),
      customerName: customerName || 'Client',
      customerPhone: customerPhone || '',
      stylistName: resolvedStaff,
      shop: {
        ...shopData,
        logoImg: resolvedLogo,
      },
      items: items || [],
      subtotal: subtotal ?? total,
      discount: discount ?? 0,
      tax: tax ?? 0,
      total,
      paidAmount: paidAmount ?? total,
      dueAmount: dueAmount ?? 0,
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: (dueAmount || 0) <= 0 ? 'paid' : (paidAmount > 0 ? 'partially_paid' : 'pending'),
    };

    // 3. Generate PDF Buffer
    const pdfBytes = await generateInvoicePdfBuffer(pdfData);

    // 4. Compute standard keys matching StyleFleet mobile app parity
    const shortId = billId ? billId.replace(/-/g, '').slice(0, 4) : '0001';
    const keyWithShortId = `${invoiceNumber}_${shortId}.pdf`;
    const keyStandard = `${invoiceNumber}.pdf`;

    // 5. Upload both keys to Supabase Storage bucket `invoices`
    const upload1 = await supabase.storage.from('invoices').upload(keyWithShortId, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

    const upload2 = await supabase.storage.from('invoices').upload(keyStandard, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (upload1.error) {
      console.warn('[PDF Generator] Upload warning (shortId):', upload1.error.message);
    }
    if (upload2.error) {
      console.warn('[PDF Generator] Upload warning (standard):', upload2.error.message);
    }

    // Official production vanity URL (standard clean invoice key for 100% reliability)
    const publicPdfUrl = `https://stylefleet.tecstellar.com/b/${keyStandard}`;

    // 6. Update the bills table with the generated pdf_url
    if (billId) {
      await supabase
        .from('bills')
        .update({ pdf_url: publicPdfUrl })
        .eq('id', billId);
    }

    return NextResponse.json({
      success: true,
      filename: keyWithShortId,
      pdfUrl: publicPdfUrl,
    });
  } catch (err: any) {
    console.error('[PDF Generator] Fatal generation error:', err);
    return NextResponse.json({ error: err.message || 'PDF Generation failed' }, { status: 500 });
  }
}
