/**
 * Salon Utility Helpers
 * Computes prefix acronyms, invoice numbers, and time slots from booking hours.
 */

export function getShopPrefixFromShopName(name: string): string {
  if (!name || !name.trim()) return 'SF';
  // Strip special chars & split by space
  const clean = name.replace(/[&/\\#,+()$~%.'":*?<>{}-]/g, ' ');
  const words = clean
    .split(/\s+/)
    .filter((w) => w.length > 0 && w.toLowerCase() !== 'and' && w.toLowerCase() !== 'the' && w.toLowerCase() !== 'of');

  if (words.length >= 2) {
    return words
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 5);
  }
  return name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
}

export function formatInvoiceNumber(
  customPrefix: string,
  format: 'standard' | 'monthly' | 'yearly' = 'standard',
  count: number = 1,
  date: Date = new Date()
): string {
  const seq = String(count).padStart(3, '0');
  let cleanPrefix = customPrefix ? customPrefix.trim() : 'INV';
  if (cleanPrefix.endsWith('-')) {
    cleanPrefix = cleanPrefix.slice(0, -1);
  }

  if (format === 'monthly') {
    const monthShort = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${cleanPrefix}-${monthShort}-${seq}`;
  }

  if (format === 'yearly') {
    const year = date.getFullYear();
    return `${cleanPrefix}-${year}-${seq}`;
  }

  return `${cleanPrefix}-${seq}`;
}

export function generateTimeSlotsFromBookingHours(bookingHoursStr?: string): string[] {
  // Default fallback slots
  const fallback = [
    '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:30 PM', '02:30 PM', '03:30 PM',
    '04:30 PM', '05:30 PM', '06:30 PM', '07:30 PM', '08:30 PM'
  ];

  if (!bookingHoursStr || !bookingHoursStr.trim()) return fallback;

  try {
    // Expected format e.g. "09:30 AM – 08:30 PM" or "9:00 AM - 8:00 PM"
    const parts = bookingHoursStr.split(/[–—-]| to /i);
    if (parts.length < 2) return fallback;

    const parseMinutes = (timeStr: string) => {
      const match = timeStr.trim().match(/(\d+):?(\d+)?\s*(AM|PM)/i);
      if (!match) return null;
      let hour = parseInt(match[1], 10);
      const min = match[2] ? parseInt(match[2], 10) : 0;
      const meridiem = match[3].toUpperCase();
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;
      return hour * 60 + min;
    };

    const startMins = parseMinutes(parts[0]);
    const endMins = parseMinutes(parts[1]);

    if (startMins === null || endMins === null || endMins <= startMins) {
      return fallback;
    }

    const slots: string[] = [];
    for (let m = startMins; m <= endMins; m += 30) {
      let h = Math.floor(m / 60);
      const min = m % 60;
      const meridiem = h >= 12 ? 'PM' : 'AM';
      let displayHour = h % 12;
      if (displayHour === 0) displayHour = 12;
      const hourStr = String(displayHour).padStart(2, '0');
      const minStr = String(min).padStart(2, '0');
      slots.push(`${hourStr}:${minStr} ${meridiem}`);
    }

    return slots.length > 0 ? slots : fallback;
  } catch {
    return fallback;
  }
}

export interface StylistOption {
  id: string;
  name: string;
  role: string;
  isOwner: boolean;
}

/**
 * Unified stylist options list.
 * The Owner is ALWAYS defaultly present first in the list, followed by staff members.
 * Avoids duplicate if the owner's name matches a staff member.
 */
export function getAvailableStylistOptions(
  ownerName?: string | null,
  staffList: Array<{ id: string; name: string; role?: string; status?: string }> = []
): StylistOption[] {
  const effectiveOwner = ownerName && ownerName.trim() ? ownerName.trim() : 'Owner';
  const options: StylistOption[] = [
    {
      id: 'owner',
      name: effectiveOwner,
      role: 'Owner',
      isOwner: true,
    },
  ];

  const ownerLower = effectiveOwner.toLowerCase();
  for (const st of staffList) {
    if (st.status === 'inactive') continue;
    const nameTrimmed = (st.name || '').trim();
    if (!nameTrimmed) continue;
    if (nameTrimmed.toLowerCase() === ownerLower) continue;
    options.push({
      id: st.id,
      name: nameTrimmed,
      role: st.role || 'Stylist',
      isOwner: false,
    });
  }

  return options;
}

/**
 * Checks if a comma-separated stylist string contains a given target staff name (case-insensitive).
 */
export function matchStaffName(staffField?: string | null, targetName?: string | null): boolean {
  if (!targetName || !targetName.trim()) return true;
  const target = targetName.trim().toLowerCase();
  if (target === 'all') return true;
  if (!staffField || !staffField.trim()) return false;
  const parts = staffField.split(',').map((s) => s.trim().toLowerCase());
  return parts.includes(target);
}

/**
 * Parses comma-separated stylists into a clean array of trimmed names.
 */
export function parseSelectedStylists(staffString?: string | null): string[] {
  if (!staffString || !staffString.trim()) return [];
  return staffString
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Toggles a stylist selection in a comma-separated string.
 * Supports selecting Owner, Stylist, or both / multiple stylists.
 */
export function toggleStylistSelection(
  currentSelection: string | string[],
  stylistName: string,
  fallbackDefault?: string
): string {
  const currentList = Array.isArray(currentSelection)
    ? currentSelection.map((s) => s.trim()).filter(Boolean)
    : parseSelectedStylists(currentSelection);

  const nameTrimmed = stylistName.trim();
  const nameLower = nameTrimmed.toLowerCase();
  const exists = currentList.some((s) => s.toLowerCase() === nameLower);

  let updated: string[];
  if (exists) {
    updated = currentList.filter((s) => s.toLowerCase() !== nameLower);
    if (updated.length === 0 && fallbackDefault) {
      updated = [fallbackDefault.trim()];
    }
  } else {
    updated = [...currentList, nameTrimmed];
  }

  return updated.join(', ');
}

/**
 * Official StyleFleet WhatsApp Bill Templates (100% Mobile Parity)
 * Generates Template 1 (Paid), Template 2 (Partially Paid with UPI ID), or Template 3 (Pending Dues).
 */
export function buildOfficialWhatsAppBillMessage(params: {
  shopName: string;
  shopPhone: string;
  upiId?: string;
  customerName: string;
  invoiceNumber: string;
  billId?: string;
  pdfUrl?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    website?: string;
  };
}): string {
  const {
    shopName,
    shopPhone,
    upiId,
    customerName,
    invoiceNumber,
    billId,
    pdfUrl,
    totalAmount,
    paidAmount,
    dueAmount,
    paymentMethod,
    socialLinks,
  } = params;

  let billPdfUrl = (pdfUrl || '').trim();
  if (!billPdfUrl) {
    const rawInv = (invoiceNumber || billId || '').trim();
    const shortId = billId ? billId.replace(/-/g, '').slice(0, 4) : '';
    const filename = rawInv.toLowerCase().endsWith('.pdf')
      ? rawInv
      : (shortId ? `${rawInv}_${shortId}.pdf` : `${rawInv}.pdf`);
    billPdfUrl = `https://stylefleet.tecstellar.com/b/${encodeURIComponent(filename)}`;
  }
  const cleanShopPhone = (shopPhone || '').replace(/\D/g, '').slice(-10);

  // Social media block
  const socialLines: string[] = [];
  if (socialLinks?.instagram) {
    const handle = socialLinks.instagram.replace(/^@/, '').replace(/https?:\/\/(www\.)?instagram\.com\//, '');
    socialLines.push(`Instagram: https://instagram.com/${handle}`);
  }
  if (socialLinks?.facebook) {
    const page = socialLinks.facebook.replace(/https?:\/\/(www\.)?facebook\.com\//, '');
    socialLines.push(`Facebook: https://facebook.com/${page}`);
  }
  if (socialLinks?.youtube) {
    const channel = socialLinks.youtube.replace(/https?:\/\/(www\.)?youtube\.com\/@?/, '');
    socialLines.push(`YouTube: https://youtube.com/@${channel}`);
  }
  if (socialLinks?.website) {
    const site = socialLinks.website.replace(/https?:\/\//, '');
    socialLines.push(`Website: https://${site}`);
  }
  const socialSection = socialLines.length > 0 ? `\n${socialLines.join('\n')}` : '';

  // Template 1: FULLY PAID BILL
  if (dueAmount <= 0) {
    return (
      `Hi ${customerName} 👋,\n` +
      `Thank you for choosing ${shopName}! ✨\n\n` +
      `💰 Total Amount: ₹${totalAmount}\n` +
      `✅ Payment Status: PAID (${paymentMethod})\n\n` +
      `📄 View / Download your Bill:\n` +
      `${billPdfUrl}\n\n` +
      `📞 For bookings: +91 ${cleanShopPhone}\n` +
      `We look forward to seeing you again! ❤️` +
      socialSection
    );
  }

  // Template 2: PARTIALLY PAID BILL (Includes UPI ID for Balance Collection)
  if (paidAmount > 0) {
    return (
      `Hi ${customerName} 👋,\n` +
      `Thank you for choosing ${shopName}! ✨\n\n` +
      `💰 Total Amount: ₹${totalAmount}\n` +
      `💵 Total Paid: ₹${paidAmount}\n` +
      `🔴 Balance Due: ₹${dueAmount}\n` +
      `⚠️ Payment Status: PARTIALLY PAID (${paymentMethod})\n\n` +
      `📄 View / Download your Bill:\n` +
      `${billPdfUrl}\n` +
      (upiId ? `💳 UPI ID: ${upiId}\n\n` : `\n`) +
      `📞 For bookings: +91 ${cleanShopPhone}\n` +
      `We look forward to seeing you again! ❤️` +
      socialSection
    );
  }

  // Template 3: FULLY PENDING BILL (Unpaid / Dues)
  return (
    `Hi ${customerName} 👋,\n` +
    `Thank you for choosing ${shopName}! ✨\n\n` +
    `💰 Total Amount: ₹${totalAmount}\n` +
    `💵 Total Paid: ₹0\n` +
    `🔴 Balance Due: ₹${totalAmount}\n` +
    `⚠️ Payment Status: PENDING (UNPAID)\n\n` +
    `📄 View / Download your Bill:\n` +
    `${billPdfUrl}\n` +
    (upiId ? `💳 UPI ID: ${upiId}\n\n` : `\n`) +
    `📞 For bookings: +91 ${cleanShopPhone}\n` +
    `We look forward to seeing you again! ❤️` +
    socialSection
  );
}

/**
 * Direct WhatsApp Dispatch on Web
 */
export function openWhatsAppBill(customerPhone: string, message: string): void {
  const cleanPhone = (customerPhone || '').replace(/\D/g, '').slice(-10);
  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodedMsg}`;
  window.open(waUrl, '_blank');
}
