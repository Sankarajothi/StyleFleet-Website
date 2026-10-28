import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, type PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface InvoicePdfData {
  invoiceNumber: string;
  billId?: string;
  issuedAt?: string | Date;
  customerName?: string;
  customerPhone?: string;
  shop: {
    shopName?: string;
    phone?: string;
    street?: string;
    city?: string;
    pincode?: string;
    email?: string;
    upiId?: string;
  };
  items: Array<{
    name: string;
    staff?: string;
    qty?: number;
    price: number;
    amount?: number;
  }>;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'partially_paid' | 'pending';
}

/**
 * Generates an official StyleFleet Luxury Invoice PDF matching the authentic brand template.
 * Deep Navy (#0F1A36), Champagne Gold (#D4A515), Cream (#FBF8EF).
 * Output size: ~45KB with font subsetting and native Rupee (₹) symbol support.
 */
export async function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // Load fonts
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Arial.ttf');
  const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Arial-Bold.ttf');

  let fontBytes: Buffer;
  let fontBoldBytes: Buffer;

  if (fs.existsSync(fontPath) && fs.existsSync(fontBoldPath)) {
    fontBytes = fs.readFileSync(fontPath);
    fontBoldBytes = fs.readFileSync(fontBoldPath);
  } else {
    // Windows fallback
    fontBytes = fs.readFileSync('C:/Windows/Fonts/arial.ttf');
    fontBoldBytes = fs.readFileSync('C:/Windows/Fonts/arialbd.ttf');
  }

  const customFont = await doc.embedFont(fontBytes, { subset: true });
  const customFontBold = await doc.embedFont(fontBoldBytes, { subset: true });

  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Color Palette
  const navy = rgb(0.059, 0.102, 0.212); // #0F1A36
  const gold = rgb(0.835, 0.651, 0.082); // #D4A515
  const cream = rgb(0.984, 0.973, 0.937); // #FBF8EF
  const lineCol = rgb(0.867, 0.882, 0.910); // #DDE1E8
  const goldBorder = rgb(0.914, 0.863, 0.663); // #E9DCB5
  const white = rgb(1, 1, 1);
  const grayText = rgb(0.40, 0.44, 0.52);

  const shopName = data.shop.shopName || 'StyleFleet Salon';
  const shopPhone = (data.shop.phone || '').replace(/\D/g, '').slice(-10);
  const formattedShopPhone = shopPhone ? `+91 ${shopPhone.slice(0, 5)} ${shopPhone.slice(5)}` : '';
  const shopAddr = [data.shop.street, data.shop.city, data.shop.pincode].filter(Boolean).join(', ') || 'Salon Street, City';

  // 1. TOP HEADER BANNER (Deep Navy)
  page.drawRectangle({
    x: 0,
    y: height - 150,
    width,
    height: 150,
    color: navy,
  });

  // Gold accent stripe
  page.drawRectangle({
    x: 0,
    y: height - 154,
    width,
    height: 4,
    color: gold,
  });

  // Salon Initials Circle Badge
  const initials = shopName
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SF';

  const circleX = 75;
  const circleY = height - 70;
  page.drawCircle({
    x: circleX,
    y: circleY,
    size: 24,
    borderColor: gold,
    borderWidth: 1.5,
    color: rgb(0.08, 0.14, 0.28),
  });
  const initWidth = customFontBold.widthOfTextAtSize(initials, 16);
  page.drawText(initials, {
    x: circleX - initWidth / 2,
    y: circleY - 6,
    size: 16,
    font: customFontBold,
    color: gold,
  });

  // Salon Name & Contact
  page.drawText(shopName, {
    x: 115,
    y: height - 55,
    size: 19,
    font: customFontBold,
    color: white,
  });
  page.drawText(shopAddr.slice(0, 48), {
    x: 115,
    y: height - 74,
    size: 9,
    font: customFont,
    color: rgb(0.85, 0.88, 0.93),
  });
  if (formattedShopPhone) {
    page.drawText(formattedShopPhone, {
      x: 115,
      y: height - 89,
      size: 9,
      font: customFont,
      color: rgb(0.85, 0.88, 0.93),
    });
  }

  // Invoice Header (Right Side)
  page.drawText('INVOICE', {
    x: width - 150,
    y: height - 55,
    size: 20,
    font: customFontBold,
    color: white,
  });
  page.drawText('Invoice No.', {
    x: width - 150,
    y: height - 74,
    size: 8,
    font: customFont,
    color: gold,
  });
  page.drawText(data.invoiceNumber, {
    x: width - 150,
    y: height - 88,
    size: 11,
    font: customFontBold,
    color: white,
  });
  page.drawText('Invoice Date', {
    x: width - 150,
    y: height - 104,
    size: 8,
    font: customFont,
    color: gold,
  });
  const dateObj = data.issuedAt ? new Date(data.issuedAt) : new Date();
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  page.drawText(dateStr, {
    x: width - 150,
    y: height - 118,
    size: 10,
    font: customFont,
    color: white,
  });

  // 2. CLIENT CARD
  const clientCardY = height - 215;
  page.drawRectangle({
    x: 45,
    y: clientCardY,
    width: width - 90,
    height: 48,
    color: white,
    borderColor: lineCol,
    borderWidth: 1,
  });

  page.drawText('BILLED TO', { x: 60, y: clientCardY + 32, size: 7.5, font: customFontBold, color: gold });
  const custName = data.customerName || 'Client';
  page.drawText(custName.slice(0, 24), { x: 60, y: clientCardY + 16, size: 11, font: customFontBold, color: navy });

  page.drawText('MOBILE', { x: 240, y: clientCardY + 32, size: 7.5, font: customFontBold, color: gold });
  const rawCustPhone = (data.customerPhone || '').replace(/\D/g, '').slice(-10);
  const custPhoneStr = rawCustPhone ? `+91 ${rawCustPhone.slice(0, 5)} ${rawCustPhone.slice(5)}` : '—';
  page.drawText(custPhoneStr, { x: 240, y: clientCardY + 16, size: 10, font: customFont, color: navy });

  page.drawText('APPOINTMENT DATE', { x: 400, y: clientCardY + 32, size: 7.5, font: customFontBold, color: gold });
  page.drawText(dateStr, { x: 400, y: clientCardY + 16, size: 10, font: customFont, color: navy });

  // 3. ITEMS TABLE HEADER
  const tableTop = clientCardY - 24;
  page.drawRectangle({
    x: 45,
    y: tableTop - 24,
    width: width - 90,
    height: 24,
    color: navy,
  });
  page.drawText('SERVICE', { x: 60, y: tableTop - 16, size: 8, font: customFontBold, color: white });
  page.drawText('STYLIST', { x: 230, y: tableTop - 16, size: 8, font: customFontBold, color: white });
  page.drawText('QTY', { x: 340, y: tableTop - 16, size: 8, font: customFontBold, color: white });
  page.drawText('PRICE', { x: 410, y: tableTop - 16, size: 8, font: customFontBold, color: white });
  page.drawText('AMOUNT', { x: 480, y: tableTop - 16, size: 8, font: customFontBold, color: white });

  // 4. ITEMS ROWS
  let curY = tableTop - 24;
  const itemsList = data.items.length > 0 ? data.items : [{ name: 'Salon Service', price: data.total, qty: 1 }];

  itemsList.forEach((item, idx) => {
    curY -= 26;
    if (idx % 2 === 1) {
      page.drawRectangle({
        x: 45,
        y: curY,
        width: width - 90,
        height: 26,
        color: cream,
      });
    }
    // Bottom border
    page.drawLine({
      start: { x: 45, y: curY },
      end: { x: width - 45, y: curY },
      color: lineCol,
      thickness: 0.8,
    });

    const qty = item.qty || 1;
    const lineAmt = item.amount ?? item.price * qty;

    page.drawText(item.name.slice(0, 26), { x: 60, y: curY + 8, size: 9, font: customFontBold, color: navy });
    page.drawText((item.staff || 'Stylist').slice(0, 18), { x: 230, y: curY + 8, size: 9, font: customFont, color: grayText });
    page.drawText(String(qty), { x: 348, y: curY + 8, size: 9, font: customFont, color: navy });
    
    const pStr = `₹${item.price.toLocaleString('en-IN')}`;
    page.drawText(pStr, { x: 410, y: curY + 8, size: 9, font: customFont, color: navy });

    const totStr = `₹${lineAmt.toLocaleString('en-IN')}`;
    page.drawText(totStr, { x: 480, y: curY + 8, size: 9, font: customFontBold, color: navy });
  });

  // 5. PAYMENT STATUS BADGE & TOTALS
  const summaryY = curY - 30;
  const isPaid = (data.dueAmount || 0) <= 0 || data.paymentStatus === 'paid';
  const isPartial = (data.dueAmount || 0) > 0 && (data.paidAmount || 0) > 0;
  const statusText = isPaid ? 'PAID' : (isPartial ? 'PARTIAL' : 'PENDING');
  const payMethod = data.paymentMethod || 'UPI';

  // Left side payment badge
  page.drawRectangle({
    x: 45,
    y: summaryY - 30,
    width: 90,
    height: 24,
    color: navy,
    borderColor: gold,
    borderWidth: 1,
  });
  const statusWidth = customFontBold.widthOfTextAtSize(statusText, 10);
  page.drawText(statusText, {
    x: 45 + (90 - statusWidth) / 2,
    y: summaryY - 22,
    size: 10,
    font: customFontBold,
    color: gold,
  });
  page.drawText(`via ${payMethod}`, { x: 45, y: summaryY - 44, size: 9, font: customFont, color: grayText });

  // Right side breakdown
  const rightX = 350;
  const valX = width - 60;
  const drawRow = (label: string, val: string, y: number, isBold = false) => {
    page.drawText(label, { x: rightX, y, size: 9, font: isBold ? customFontBold : customFont, color: isBold ? navy : grayText });
    const textWidth = (isBold ? customFontBold : customFont).widthOfTextAtSize(val, 9);
    page.drawText(val, { x: valX - textWidth, y, size: 9, font: isBold ? customFontBold : customFont, color: navy });
  };

  drawRow('Subtotal', `₹${data.subtotal.toLocaleString('en-IN')}`, summaryY - 10);
  drawRow('Discount', `– ₹${(data.discount || 0).toLocaleString('en-IN')}`, summaryY - 26);
  drawRow('Tax (GST)', `₹${(data.tax || 0).toLocaleString('en-IN')}`, summaryY - 42);

  // TOTAL AMOUNT BANNER
  page.drawRectangle({
    x: rightX - 10,
    y: summaryY - 82,
    width: width - 45 - (rightX - 10),
    height: 32,
    color: navy,
  });
  page.drawText('TOTAL AMOUNT', { x: rightX, y: summaryY - 70, size: 8, font: customFontBold, color: gold });
  const totVal = `₹${data.total.toLocaleString('en-IN')}`;
  const totWidth = customFontBold.widthOfTextAtSize(totVal, 14);
  page.drawText(totVal, { x: valX - totWidth, y: summaryY - 73, size: 14, font: customFontBold, color: white });

  drawRow('Paid Amount', `₹${data.paidAmount.toLocaleString('en-IN')}`, summaryY - 102);
  drawRow('Balance Due', `₹${data.dueAmount.toLocaleString('en-IN')}`, summaryY - 118, true);
  drawRow('Payment Method', payMethod, summaryY - 134);

  // 6. FOOTER CARD
  const footerY = 60;
  page.drawRectangle({
    x: 45,
    y: footerY,
    width: width - 90,
    height: 60,
    color: cream,
    borderColor: goldBorder,
    borderWidth: 1,
  });

  page.drawText('✂', { x: 65, y: footerY + 24, size: 16, font: customFont, color: gold });
  page.drawText(`Thank you for visiting ${shopName}.`, { x: 95, y: footerY + 34, size: 10, font: customFontBold, color: navy });
  page.drawText('We look forward to serving you again!', { x: 95, y: footerY + 18, size: 9, font: customFont, color: grayText });

  const pwrText = `POWERED BY STYLEFLEET  ·  ${shopName.toUpperCase()}`;
  const pwrWidth = customFontBold.widthOfTextAtSize(pwrText, 7.5);
  page.drawText(pwrText, {
    x: (width - pwrWidth) / 2,
    y: 35,
    size: 7.5,
    font: customFontBold,
    color: rgb(0.60, 0.64, 0.72),
  });

  return await doc.save();
}
