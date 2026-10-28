'use client';

import React from 'react';
import { useSalon, type Bill, type ShopProfile } from '@/components/SalonContext';
import { buildOfficialWhatsAppBillMessage, openWhatsAppBill } from '@/lib/salon-helpers';

interface InvoiceTemplateProps {
  bill: Bill;
  shopProfile: ShopProfile;
  onClose?: () => void;
  onShareWhatsApp?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function InvoiceTemplate({
  bill,
  shopProfile,
  onClose,
  onShareWhatsApp,
  onEdit,
  onDelete,
}: InvoiceTemplateProps) {
  const { role, hasPermission } = useSalon();
  const canShareBills = role === 'owner' || hasPermission('share_bills');
  const [shareOptionsOpen, setShareOptionsOpen] = React.useState(false);

  // Format invoice date into DD MMM YYYY (e.g. "27 Oct 2026")
  const formatInvoiceDate = (dateVal?: string): string => {
    try {
      if (!dateVal) {
        return new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
      const cleaned = dateVal.split(',')[0].trim();
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
      return cleaned;
    } catch {
      return new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const invoiceDateStr = formatInvoiceDate(bill.createdAt || bill.dateStr);

  // Compute subtotal from items
  const itemsSubtotal = (bill.items || []).reduce(
    (acc, it) => acc + (it.price || 0) * (it.qty || 1),
    0
  );
  const discountAmount = bill.discount || 0;
  const taxAmount = (bill as any).tax || 0;
  const tipAmount = (bill as any).tip || 0;

  // Salon initial badge
  const salonInitial = shopProfile.shopName
    ? shopProfile.shopName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SF';

  // Payment status badge text
  const isPaid = (bill.dueAmount || 0) <= 0 || bill.status === 'paid';
  const isPartial = (bill.dueAmount || 0) > 0 && (bill.paidAmount || 0) > 0;
  const paymentBadgeText = isPaid ? 'PAID' : (isPartial ? 'PARTIAL' : 'PENDING');

  const handlePrint = () => {
    window.print();
  };

  const handleDefaultWhatsAppShare = () => {
    if (onShareWhatsApp) {
      onShareWhatsApp();
      return;
    }
    const msg = buildOfficialWhatsAppBillMessage({
      shopName: shopProfile.shopName || 'StyleFleet Salon',
      shopPhone: shopProfile.phone || '',
      upiId: shopProfile.upiId || '',
      customerName: bill.cust || 'Client',
      invoiceNumber: bill.id,
      billId: bill.id,
      totalAmount: bill.total,
      paidAmount: bill.paidAmount,
      dueAmount: bill.dueAmount,
      paymentMethod: bill.mode || 'UPI',
      socialLinks: {
        instagram: shopProfile.instagram,
        facebook: shopProfile.facebook,
      },
    });
    openWhatsAppBill(bill.phone, msg);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* ================= SCREEN-ONLY ACTION TOOLBAR ================= */}
      <div className="no-print w-full max-w-3xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">
            Invoice Preview · #{bill.id}
          </span>
          {bill.isEdited && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              title="Edit Bill"
              onClick={onEdit}
              className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              title="Delete Bill (30 Days)"
              onClick={onDelete}
              className="w-7 h-7 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer ml-1"
              title="Close"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ================= PRINTABLE LUXURY INVOICE SHEET ================= */}
      <div
        id="printable-luxury-invoice"
        className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 transition-all font-sans print:m-0 print:w-full print:max-w-none print:shadow-none print:rounded-none print:border-none"
        style={{
          colorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        }}
      >
        {/* 1. HEADER SECTION (NAVY BACKGROUND) */}
        <div
          className="bg-[#0B132B] text-white p-6 sm:p-8"
          style={{ backgroundColor: '#0B132B' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Salon Info Left */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full border-2 border-[#C5A059] bg-[#0B132B] flex items-center justify-center text-[#C5A059] font-black text-lg shrink-0 shadow-sm"
                style={{ borderColor: '#C5A059', backgroundColor: '#0B132B' }}
              >
                {shopProfile.logoImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shopProfile.logoImg}
                    alt={shopProfile.shopName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{salonInitial}</span>
                )}
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {shopProfile.shopName || 'StyleFleet Salon'}
                </h1>
                <p className="text-xs text-slate-300">
                  {shopProfile.address || 'Salon Address'}
                  {shopProfile.city ? `, ${shopProfile.city}` : ''}
                  {shopProfile.pinCode ? ` – ${shopProfile.pinCode}` : ''}
                </p>
                <p className="text-xs text-slate-400">
                  {shopProfile.phone ? `+91 ${shopProfile.phone}` : '+91 XXXXX XXXXX'}
                  {shopProfile.gstin ? ` · GSTIN: ${shopProfile.gstin}` : ''}
                </p>
              </div>
            </div>

            {/* Invoice Tag Right */}
            <div className="sm:text-right space-y-1">
              <h2
                className="text-2xl sm:text-3xl font-black tracking-widest uppercase"
                style={{ color: '#C5A059', letterSpacing: '3px' }}
              >
                INVOICE
              </h2>
              <div className="text-xs space-y-0.5">
                <div className="flex items-center sm:justify-end gap-2 text-slate-300">
                  <span className="text-slate-400">Invoice No.</span>
                  <strong className="text-white font-mono font-bold tracking-wide">
                    #{bill.id}
                  </strong>
                </div>
                <div className="flex items-center sm:justify-end gap-2 text-slate-300">
                  <span className="text-slate-400">Invoice Date</span>
                  <strong className="text-white font-bold">
                    {invoiceDateStr}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CHAMPAGNE GOLD ACCENT STRIPE */}
        <div
          className="h-[3.5px] w-full bg-[#C5A059]"
          style={{ backgroundColor: '#C5A059' }}
        />

        {/* 3. CUSTOMER & APPOINTMENT METADATA BAR (INFO SECTION - 3 COLUMNS) */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Column 1: Billed To */}
            <div>
              <span
                className="text-[11px] font-black uppercase tracking-wider block"
                style={{ color: '#000000' }}
              >
                BILLED TO
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {bill.cust || 'Walk-in Client'}
              </p>
            </div>

            {/* Column 2: Mobile */}
            <div>
              <span
                className="text-[11px] font-black uppercase tracking-wider block"
                style={{ color: '#000000' }}
              >
                MOBILE
              </span>
              <p className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-0.5">
                {bill.phone ? (bill.phone.startsWith('+91') ? bill.phone : `+91 ${bill.phone}`) : '+91 XXXXX XXXXX'}
              </p>
            </div>

            {/* Column 3: Appointment Date & Stylist */}
            <div className="sm:text-right">
              <span
                className="text-[11px] font-black uppercase tracking-wider block"
                style={{ color: '#000000' }}
              >
                APPOINTMENT DATE
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {invoiceDateStr}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Stylist: <span className="font-semibold text-slate-800">{bill.staff || 'Stylist'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 4. SERVICES TABLE */}
        <div className="px-4 sm:px-8 pt-5 overflow-x-auto [scrollbar-width:none]">
          <div className="min-w-[460px]">
            {/* Table Header Bar */}
            <div
              data-ui="invoice-table-header"
              className="bg-[#0B132B] text-white rounded-xl px-4 py-3 flex items-center text-xs font-black uppercase"
              style={{ backgroundColor: '#0B132B', color: '#ffffff' }}
            >
              <div className="flex-1">SERVICE</div>
              <div className="w-28 sm:w-36 text-left">STAFF</div>
              <div className="w-12 sm:w-16 text-center">QTY</div>
              <div className="w-20 sm:w-24 text-right">PRICE</div>
              <div
                className="w-20 sm:w-24 text-right text-[#C5A059]"
                style={{ color: '#C5A059' }}
              >
                AMOUNT
              </div>
            </div>

            {/* Table Body Rows: Strictly real selected services */}
            <div className="divide-y divide-slate-100">
              {bill.items && bill.items.length > 0 ? (
                bill.items.map((item, idx) => {
                  const itemQty = item.qty || 1;
                  const itemPrice = item.price || 0;
                  const itemTotal = itemPrice * itemQty;
                  const itemStaff = item.staff || bill.staff || 'Stylist';

                  return (
                    <div
                      key={idx}
                      className="px-4 py-3.5 flex items-center text-xs sm:text-sm hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex-1 font-bold text-slate-900 pr-2">
                        {item.name}
                      </div>
                      <div className="w-28 sm:w-36 text-left text-slate-600 font-medium">
                        {itemStaff}
                      </div>
                      <div className="w-12 sm:w-16 text-center font-bold text-slate-800">
                        {itemQty}
                      </div>
                      <div className="w-20 sm:w-24 text-right text-slate-700 font-mono">
                        ₹{itemPrice}
                      </div>
                      <div className="w-20 sm:w-24 text-right font-black text-slate-900 font-mono">
                        ₹{itemTotal}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center text-xs text-slate-400">
                  No items recorded on this invoice.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. PAYMENT STATUS & FINANCIAL TOTALS BREAKDOWN */}
        <div className="px-6 sm:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            {/* Left: Payment Status */}
            <div className="space-y-2">
              <span
                className="text-[11px] font-black uppercase tracking-wider block"
                style={{ color: '#000000' }}
              >
                PAYMENT
              </span>
              <div className="flex items-center gap-2">
                <span
                  data-ui="payment-badge"
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : isPartial
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  [{paymentBadgeText}]
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  via {bill.mode || 'UPI'}
                </span>
              </div>
              {shopProfile.upiId && !isPaid && (
                <p className="text-[11px] text-slate-500 font-mono mt-1">
                  UPI ID: <span className="font-bold text-slate-800">{shopProfile.upiId}</span>
                </p>
              )}
            </div>

            {/* Right: Subtotal, Discount, Tax & Grand Total */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal</span>
                <strong className="text-slate-900 font-mono font-bold">
                  ₹{itemsSubtotal}
                </strong>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-amber-700">
                  <span>Discount</span>
                  <strong className="font-mono font-bold">
                    – ₹{discountAmount}
                  </strong>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tax (GST)</span>
                  <strong className="text-slate-900 font-mono font-bold">
                    + ₹{taxAmount}
                  </strong>
                </div>
              )}

              {tipAmount > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tip</span>
                  <strong className="text-slate-900 font-mono font-bold">
                    + ₹{tipAmount}
                  </strong>
                </div>
              )}

              {/* Grand Total Banner */}
              <div
                className="bg-[#0B132B] text-white rounded-xl px-4 py-3.5 flex items-center justify-between my-2 shadow-sm"
                style={{ backgroundColor: '#0B132B', color: '#ffffff' }}
              >
                <span className="text-[11px] font-black tracking-widest uppercase">
                  TOTAL AMOUNT
                </span>
                <span
                  className="text-xl sm:text-2xl font-black font-mono text-[#C5A059]"
                  style={{ color: '#C5A059' }}
                >
                  ₹{bill.total}
                </span>
              </div>

              {/* Settlement Detail */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Paid Amount</span>
                  <strong className="text-slate-900 font-mono font-bold">
                    ₹{bill.paidAmount}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Balance Due</span>
                  <strong
                    className={`font-mono font-bold ${
                      (bill.dueAmount || 0) > 0 ? 'text-red-600' : 'text-slate-900'
                    }`}
                  >
                    ₹{bill.dueAmount || 0}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. THANK YOU BOX */}
        <div className="px-6 sm:px-8 pb-4">
          <div
            className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-center flex items-center justify-center gap-2"
          >
            <span className="text-base select-none" role="img" aria-label="scissors">✂️</span>
            <p className="text-xs sm:text-sm text-slate-700">
              Thank you for visiting <strong className="text-slate-900">{shopProfile.shopName || 'StyleFleet Salon'}</strong>. We look forward to serving you again!
            </p>
          </div>
        </div>

        {/* 7. BOTTOM ATTRIBUTION */}
        <div className="py-4 text-center border-t border-slate-100 bg-white">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            POWERED BY STYLEFLEET · {shopProfile.shopName || 'SALON'}
          </p>
        </div>

        {/* 8. SCREEN-ONLY BOTTOM TOOLBAR: Share & Close (Reveals WhatsApp, Print, Close when Share clicked) */}
        <div className="no-print p-4 bg-slate-900 border-t border-slate-800">
          {shareOptionsOpen ? (
            <div className="w-full flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                {canShareBills && (
                  <button
                    type="button"
                    onClick={handleDefaultWhatsAppShare}
                    className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.131-.538-1.839-.765-3.023-2.627-3.114-2.748-.09-.122-.745-.989-.745-1.895 0-.907.472-1.352.641-1.536.17-.184.37-.23.493-.23.123 0 .247.001.355.006.114.005.267-.043.418.32.155.371.531 1.294.577 1.389.047.094.078.204.016.326-.062.123-.093.2-.185.309-.092.109-.194.244-.277.328-.093.094-.19.196-.082.381.108.185.481.794 1.031 1.285.709.632 1.306.828 1.492.92.185.093.293.078.401-.047.108-.124.463-.54.586-.726.123-.185.247-.154.416-.093.17.062 1.079.509 1.264.601.185.093.308.139.354.216.046.078.046.452-.098.857z" />
                    </svg>
                    <span>WhatsApp</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-2 px-3.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShareOptionsOpen(false)}
                className="py-2 px-4 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShareOptionsOpen(true)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform active:scale-95"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-6 rounded-xl border border-white/20 text-white font-bold text-xs hover:bg-white/10 cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
