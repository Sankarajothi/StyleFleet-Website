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
