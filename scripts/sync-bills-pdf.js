const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://nqwgxkdpwpgqkezaqsrx.supabase.co';
const key = 'sb_publishable_fxLPfAbQ8EL8HM5-NS_lqQ_0AMzCWCY';
const client = createClient(url, key);

async function generatePdf(bill, shop) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fontBytes = fs.readFileSync('public/fonts/Arial.ttf');
  const fontBoldBytes = fs.readFileSync('public/fonts/Arial-Bold.ttf');
  const customFont = await doc.embedFont(fontBytes, { subset: true });
  const customFontBold = await doc.embedFont(fontBoldBytes, { subset: true });

  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const navy = rgb(0.059, 0.102, 0.212);
  const gold = rgb(0.835, 0.651, 0.082);
  const cream = rgb(0.984, 0.973, 0.937);
  const lineCol = rgb(0.867, 0.882, 0.910);
  const white = rgb(1, 1, 1);
  const grayText = rgb(0.40, 0.44, 0.52);

  // Top header banner
  page.drawRectangle({ x: 0, y: height - 150, width, height: 150, color: navy });
  page.drawRectangle({ x: 0, y: height - 154, width, height: 4, color: gold });

  // Initial Circle
  const initials = (shop.shopName || 'SF').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  page.drawCircle({ x: 75, y: height - 70, size: 24, borderColor: gold, borderWidth: 1.5, color: rgb(0.08, 0.14, 0.28) });
  page.drawText(initials, { x: 75 - (initials.length * 5), y: height - 77, size: 16, font: customFontBold, color: gold });

  // Shop Details
  page.drawText(shop.shopName || 'StyleFleet Salon', { x: 115, y: height - 55, size: 19, font: customFontBold, color: white });
  const addr = [shop.street, shop.city, shop.pincode].filter(Boolean).join(', ') || 'Main Road, City';
  page.drawText(addr, { x: 115, y: height - 74, size: 9, font: customFont, color: rgb(0.85, 0.88, 0.93) });
  page.drawText('+91 ' + (shop.phone || '').replace(/\D/g, '').slice(-10), { x: 115, y: height - 89, size: 9, font: customFont, color: rgb(0.85, 0.88, 0.93) });

  // Invoice header
  page.drawText('INVOICE', { x: width - 150, y: height - 55, size: 20, font: customFontBold, color: white });
  page.drawText('Invoice No.', { x: width - 150, y: height - 74, size: 8, font: customFont, color: gold });
  page.drawText(bill.invoice_number, { x: width - 150, y: height - 88, size: 11, font: customFontBold, color: white });
  page.drawText('Invoice Date', { x: width - 150, y: height - 104, size: 8, font: customFont, color: gold });
  const dateStr = new Date(bill.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  page.drawText(dateStr, { x: width - 150, y: height - 118, size: 10, font: customFont, color: white });

  // Client Box
  const clientCardY = height - 215;
  page.drawRectangle({ x: 45, y: clientCardY, width: width - 90, height: 48, color: white, borderColor: lineCol, borderWidth: 1 });
  page.drawText('BILLED TO', { x: 60, y: clientCardY + 32, size: 7.5, font: customFontBold, color: gold });
  const custName = bill.customers?.name || 'Bhagavathi';
  page.drawText(custName, { x: 60, y: clientCardY + 16, size: 11, font: customFontBold, color: navy });

  page.drawText('MOBILE', { x: 240, y: clientCardY + 32, size: 7.5, font: customFontBold, color: gold });
  page.drawText('+91 ' + (bill.customers?.phone || '6374281820'), { x: 240, y: clientCardY + 16, size: 10, font: customFont, color: navy });

  page.drawText('APPOINTMENT DATE', { x: 400, y: clientCardY + 32, size: 7.5, font: customFontBold, color: gold });
  page.drawText(dateStr, { x: 400, y: clientCardY + 16, size: 10, font: customFont, color: navy });

  // Items Table Header
  const tableTop = clientCardY - 24;
  page.drawRectangle({ x: 45, y: tableTop - 24, width: width - 90, height: 24, color: navy });
  page.drawText('SERVICE', { x: 60, y: tableTop - 16, size: 8, font: customFontBold, color: white });
  page.drawText('STYLIST', { x: 230, y: tableTop - 16, size: 8, font: customFontBold, color: white });
  page.drawText('QTY', { x: 340, y: tableTop - 16, size: 8, font: customFontBold, color: white });
  page.drawText('PRICE', { x: 410, y: tableTop - 16, size: 8, font: customFontBold, color: white });
  page.drawText('AMOUNT', { x: 480, y: tableTop - 16, size: 8, font: customFontBold, color: white });

  let curY = tableTop - 24;
  (bill.bill_items || []).forEach((item, idx) => {
    curY -= 26;
    if (idx % 2 === 1) {
      page.drawRectangle({ x: 45, y: curY, width: width - 90, height: 26, color: cream });
    }
    page.drawLine({ start: { x: 45, y: curY }, end: { x: width - 45, y: curY }, color: lineCol, thickness: 0.8 });
    page.drawText(item.service_name_snapshot || 'Salon Service', { x: 60, y: curY + 8, size: 9, font: customFontBold, color: navy });
    page.drawText(item.staff_snapshot || 'Stylist', { x: 230, y: curY + 8, size: 9, font: customFont, color: grayText });
    page.drawText(String(item.quantity || 1), { x: 348, y: curY + 8, size: 9, font: customFont, color: navy });
    const pStr = '₹' + Math.round((item.unit_price_minor || 0) / 100).toLocaleString('en-IN');
    page.drawText(pStr, { x: 410, y: curY + 8, size: 9, font: customFont, color: navy });
    const totStr = '₹' + Math.round((item.line_total_minor || 0) / 100).toLocaleString('en-IN');
    page.drawText(totStr, { x: 480, y: curY + 8, size: 9, font: customFontBold, color: navy });
  });

  // Payment Badge & Totals
  const summaryY = curY - 30;
  const isPaid = (bill.due_amount_minor || 0) <= 0;
  page.drawRectangle({ x: 45, y: summaryY - 30, width: 90, height: 24, color: navy, borderColor: gold, borderWidth: 1 });
  page.drawText(isPaid ? 'PAID' : 'PENDING', { x: 70, y: summaryY - 22, size: 10, font: customFontBold, color: gold });
  page.drawText('via UPI', { x: 45, y: summaryY - 44, size: 9, font: customFont, color: grayText });

  const rightX = 350;
  const valX = width - 60;
  const drawRow = (label, val, y, isBold = false) => {
    page.drawText(label, { x: rightX, y, size: 9, font: isBold ? customFontBold : customFont, color: isBold ? navy : grayText });
    const textWidth = (isBold ? customFontBold : customFont).widthOfTextAtSize(val, 9);
    page.drawText(val, { x: valX - textWidth, y, size: 9, font: isBold ? customFontBold : customFont, color: navy });
  };

  const subtotal = Math.round((bill.subtotal_minor || 0) / 100);
  const discount = Math.round((bill.discount_minor || 0) / 100);
  const total = Math.round((bill.total_minor || 0) / 100);
  const paid = Math.round((bill.paid_amount_minor || 0) / 100);
  const due = Math.round((bill.due_amount_minor || 0) / 100);

  drawRow('Subtotal', '₹' + subtotal.toLocaleString('en-IN'), summaryY - 10);
  drawRow('Discount', '– ₹' + discount.toLocaleString('en-IN'), summaryY - 26);
  drawRow('Tax (GST)', '₹0', summaryY - 42);

  page.drawRectangle({ x: rightX - 10, y: summaryY - 82, width: width - 45 - (rightX - 10), height: 32, color: navy });
  page.drawText('TOTAL AMOUNT', { x: rightX, y: summaryY - 70, size: 8, font: customFontBold, color: gold });
  const totVal = '₹' + total.toLocaleString('en-IN');
  const totWidth = customFontBold.widthOfTextAtSize(totVal, 14);
  page.drawText(totVal, { x: valX - totWidth, y: summaryY - 73, size: 14, font: customFontBold, color: white });

  drawRow('Paid Amount', '₹' + paid.toLocaleString('en-IN'), summaryY - 102);
  drawRow('Balance Due', '₹' + due.toLocaleString('en-IN'), summaryY - 118, true);
  drawRow('Payment Method', 'UPI', summaryY - 134);

  // Footer Card
  const footerY = 60;
  page.drawRectangle({ x: 45, y: footerY, width: width - 90, height: 60, color: cream, borderColor: rgb(0.914, 0.863, 0.663), borderWidth: 1 });
  page.drawText('✂', { x: 65, y: footerY + 24, size: 16, font: customFont, color: gold });
  page.drawText('Thank you for visiting ' + (shop.shopName || 'StyleFleet Salon') + '.', { x: 95, y: footerY + 34, size: 10, font: customFontBold, color: navy });
  page.drawText('We look forward to serving you again!', { x: 95, y: footerY + 18, size: 9, font: customFont, color: grayText });

  const pwrText = 'POWERED BY STYLEFLEET  ·  ' + (shop.shopName || 'SALON').toUpperCase();
  page.drawText(pwrText, { x: width / 2 - (pwrText.length * 2.2), y: 35, size: 7.5, font: customFontBold, color: rgb(0.60, 0.64, 0.72) });

  return await doc.save();
}

async function uploadExisting() {
  const shop = {
    shopName: 'Joo Salon',
    phone: '6374281820',
    street: 'Main Road',
    city: 'Chennai',
    pincode: '600001'
  };

  const { data: bills } = await client
    .from('bills')
    .select('*, bill_items(*), customers(name, phone)')
    .eq('shop_id', '51d39adb-cfbe-4699-b2d1-a9b9d88c8685');

  for (const b of bills) {
    console.log('Generating PDF for bill:', b.invoice_number);
    const pdfBuf = await generatePdf(b, shop);
    const shortId = b.id.slice(0, 4);
    const key1 = `${b.invoice_number}_${shortId}.pdf`;
    const key2 = `${b.invoice_number}.pdf`;
    const key3 = `${b.invoice_number}`;

    for (const key of [key1, key2, key3]) {
      const { error } = await client.storage.from('invoices').upload(key, pdfBuf, {
        contentType: 'application/pdf',
        upsert: true
      });
      console.log(`Uploaded to invoices/${key}:`, error ? error.message : 'SUCCESS');
    }

    const publicPdfUrl = `https://stylefleet.tecstellar.com/b/${key1}`;
    await client.from('bills').update({ pdf_url: publicPdfUrl }).eq('id', b.id);
    console.log('Updated bills row with pdf_url:', publicPdfUrl);
  }
}
uploadExisting();
