import { NextResponse } from 'next/server';
import { authorizeQrSession } from '@/lib/qr-session-store';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, pairCode, shopId, role, phone, ownerName, staffId, staffName } = body;

    const targetKey = sessionId || pairCode;
    if (!targetKey) {
      return NextResponse.json(
        { success: false, error: 'Session ID or 6-digit PIN code is required' },
        { status: 400 }
      );
    }

    if (!phone && !shopId) {
      return NextResponse.json(
        { success: false, error: 'Salon shopId or phone number is required to authorize login' },
        { status: 400 }
      );
    }

    let finalShopId = shopId;
    let finalShopName = 'StyleFleet Salon';
    let cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    // If shopId was not directly passed, lookup from Supabase using phone
    if (!finalShopId && cleanPhone) {
      const { data: shops } = await supabase
        .from('shops')
        .select('id, name')
        .eq('phone', cleanPhone)
        .limit(1);

      if (shops && shops.length > 0) {
        finalShopId = shops[0].id;
        finalShopName = shops[0].name;
      }
    }

    if (!finalShopId) {
      return NextResponse.json(
        { success: false, error: 'Salon profile not found in database for this account' },
        { status: 404 }
      );
    }

    const authResult = authorizeQrSession(targetKey, {
      shopId: finalShopId,
      role: role === 'stylist' ? 'stylist' : 'owner',
      phone: cleanPhone,
      shopName: finalShopName,
      ownerName,
      staffId,
      staffName,
    });

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Failed to authorize session' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Desktop Web login confirmed successfully! Web screen will open immediately.',
      salon: finalShopName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error confirming QR session' },
      { status: 500 }
    );
  }
}
