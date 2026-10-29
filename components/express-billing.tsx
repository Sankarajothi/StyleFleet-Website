'use client';

import React, { useState, useMemo } from 'react';
import { useSalon, ServiceItem } from '@/components/SalonContext';
import { StylistMultiSelect } from '@/components/stylist-multi-select';
import { getMostlyUsedServices } from '@/lib/salon-helpers';

interface ExpressBillingProps {
  onOpenAddClientModal: () => void;
  onOpenImportContactsModal: () => void;
  onOpenMenuCatalogModal: () => void;
  onInvoiceCreated: () => void;
}

export function ExpressBillingView({
  onOpenAddClientModal,
  onOpenImportContactsModal,
  onOpenMenuCatalogModal,
  onInvoiceCreated,
}: ExpressBillingProps) {
  const {
    services,
    bills,
    appointments,
    staff,
    billCartItems,
    billCustName,
    setBillCustName,
    billCustPhone,
    setBillCustPhone,
    billStaffSelect,
    setBillStaffSelect,
    billDiscount,
    setBillDiscount,
    billPaymentMode,
    setBillPaymentMode,
    partialPaidAmount,
    setPartialPaidAmount,
    addCartItem,
    removeCartItem,
    updateCartItemQty,
    clearCart,
    createBill,
    setActiveInvoice,
    showToast,
    isDarkMode,
    role,
    hasPermission,
    loggedInStaffName,
    shopProfile,
  } = useSalon();

  const [billTip, setBillTip] = useState(0);

  // Dynamic Mostly Used Services from real bills & appointments
  const mostlyUsedServices = useMemo(() => {
    return getMostlyUsedServices(services, bills, appointments, 9);
  }, [services, bills, appointments]);

  const mostlyUsedIds = useMemo(() => {
    return new Set(mostlyUsedServices.map((s) => s.id));
  }, [mostlyUsedServices]);

  // Auto-select logged-in stylist or owner
  React.useEffect(() => {
    if (role === 'stylist' && loggedInStaffName) {
      setBillStaffSelect(loggedInStaffName);
    } else if (role === 'owner') {
      const owner = shopProfile?.ownerName?.trim() || 'Owner';
      setBillStaffSelect((prev) => (!prev || prev === 'Stylist' || prev === 'Staff' ? owner : prev));
    }
  }, [role, loggedInStaffName, shopProfile?.ownerName, setBillStaffSelect]);

  // Helper for date picker formatted YYYY-MM-DD
  const getTodayInputStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Bill Date state (Strictly limited: past dates or today, cannot select future dates)
  const [billDate, setBillDate] = useState<string>(getTodayInputStr());
  const canShareBills = role === 'owner' || hasPermission('share_bills');

  // Cart Calculations (Strict Section 3 Mathematical Invariant)
  const cartSubtotal = billCartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const safeDiscount = Math.min(cartSubtotal, Math.max(0, billDiscount || 0));
  const safeTip = Math.max(0, billTip || 0);
  const gstRate = shopProfile?.gstRate || 0;
  const taxAmount = shopProfile?.applyGst ? Math.round((cartSubtotal - safeDiscount) * (gstRate / 100)) : 0;
  const cartTotal = Math.max(0, cartSubtotal - safeDiscount + taxAmount + safeTip);

  let finalPaid = cartTotal;
  let finalDue = 0;
  let billStatus: 'paid' | 'partially_paid' | 'pending' = 'paid';

  if (billPaymentMode === 'Partial Pay') {
    finalPaid = Math.min(cartTotal, partialPaidAmount);
    finalDue = Math.max(0, cartTotal - partialPaidAmount);
    billStatus = finalDue > 0 ? 'partially_paid' : 'paid';
  } else if (billPaymentMode === 'Fully Pending') {
    finalPaid = 0;
    finalDue = cartTotal;
    billStatus = 'pending';
  } else {
    finalPaid = cartTotal;
    finalDue = 0;
    billStatus = 'paid';
  }

  // Handle Complete Bill Checkout
  const handleCompleteBill = (isDirectPrint: boolean = false) => {
    if (billCartItems.length === 0) {
      showToast('Please add at least one service to the bill.', 'error');
      return;
    }
    const cust = billCustName.trim() || 'Walk-in Client';
    const phone = billCustPhone.trim();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const selectedD = new Date(billDate + 'T12:00:00');
    const day = selectedD.getDate();
    const month = selectedD.toLocaleString('en-US', { month: 'short' });
    const year = selectedD.getFullYear();
    const customDateStr = `${day} ${month} ${year}, ${timeStr}`;
    const isToday = billDate === getTodayInputStr();

    const newBill = createBill({
      cust,
      phone,
      items: billCartItems,
      staff: billStaffSelect,
      total: cartTotal,
      paidAmount: finalPaid,
      dueAmount: finalDue,
      mode: billPaymentMode,
      status: billStatus,
      discount: safeDiscount,
      tax: taxAmount,
      tip: safeTip,
    }, customDateStr, isToday);

    setActiveInvoice(newBill);
    clearCart();
    setBillTip(0);
    setBillDate(getTodayInputStr());
    onInvoiceCreated();

    if (isDirectPrint) {
      setTimeout(() => {
        window.print();
      }, 350);
    }
  };

  return (
    <section className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
            Express Billing POS
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#737D92]'}`}>
            Instant multi-service checkout, discounts, tips & WhatsApp invoice delivery
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-400 hover:underline font-semibold"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Bill Date, Client & Catalog */}
        <div className="lg:col-span-7 space-y-4">
          {/* Streamlined Client Quick Info */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-md ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-[#E2E8F0] shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Client Details
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenAddClientModal}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold hover:border-[#D4AF37] transition-all flex items-center gap-1.5 ${
                    isDarkMode ? 'bg-white/[0.06] border-[#2A3858] text-[#F8FAFC]' : 'bg-[#F7F9FC] border-[#CBD5E1] text-[#0F172A]'
                  }`}
                >
                  <svg className="w-3 h-3 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Client</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenImportContactsModal}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold text-[#D4AF37] hover:border-[#D4AF37] transition-all flex items-center gap-1.5 ${
                    isDarkMode ? 'bg-[#0B1F44] border-[#2A3858]' : 'bg-[#FFFDF5] border-[#D4AF37]/50'
                  }`}
                >
                  <svg className="w-3 h-3 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Import Contact</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#4B5563]'}`}>
                  Client Name
                </label>
                <input
                  type="text"
                  placeholder="Client name (or Walk-in)"
                  value={billCustName}
                  onChange={(e) => setBillCustName(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-[#D4AF37] font-bold transition-all ${
                    isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-white placeholder:text-[#A7B0C3]/50' : 'bg-[#F7F9FC] border-[#CBD5E1] text-[#0F172A]'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#4B5563]'}`}>
                  WhatsApp Mobile
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={billCustPhone}
                  onChange={(e) => setBillCustPhone(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-[#D4AF37] font-bold transition-all ${
                    isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-white placeholder:text-[#A7B0C3]/50' : 'bg-[#F7F9FC] border-[#CBD5E1] text-[#0F172A]'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#8C6239]'}`}>
                  Bill Date (Max: Today)
                </label>
                <input
                  type="date"
                  max={getTodayInputStr()}
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs outline-none focus:border-[#D4AF37] font-bold transition-all cursor-pointer ${
                    isDarkMode ? 'bg-[#0B1F44] border-[#D4AF37]/50 text-white' : 'bg-[#FFFDF5] border-[#D4AF37] text-[#0F172A]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Quick Tap Services to Add */}
          <div
            className={`p-6 rounded-3xl border space-y-4 transition-colors shadow-lg ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-[#D4AF37]' : 'text-amber-800'}`}>
                  Tap Services to Add
                </span>
                <span className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                  (Adds immediately to bill)
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenMenuCatalogModal}
                className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/25 transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Full Catalog</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mostlyUsedServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => addCartItem(service)}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between group active:scale-95 cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#0B1F44] border-white/5 hover:border-[#D4AF37]/40 hover:bg-[#0D2348]'
                      : 'bg-[#F7F9FC] border-slate-200 hover:border-[#D4AF37] hover:bg-[#FFFDF5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="truncate pr-1">
                      <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-amber-500/15 text-amber-500 mr-1 inline-block">
                        ⭐ Mostly Used
                      </span>
                      <span className={`text-xs font-bold block truncate ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
                        {service.name}
                      </span>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold shrink-0">
                      +
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-extrabold text-[#D4AF37]">₹{service.price}</span>
                    <span className={`text-[10px] ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#737D92]'}`}>
                      {service.dur}m
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Active Cart, Stylist, Discount, Tip, 5 Payment Modes & Checkout */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 shadow-xl ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold block ${isDarkMode ? 'text-[#D4AF37]' : 'text-amber-800'}`}>
              Cart Items ({billCartItems.length})
            </span>
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Review & Checkout</span>
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {billCartItems.length === 0 ? (
              <div className={`py-8 text-center text-xs font-bold border border-dashed rounded-2xl ${isDarkMode ? 'text-[#A7B0C3] border-[#2A3858]' : 'text-[#0F172A] border-slate-300'}`}>
                No services added. Tap services from the catalog.
              </div>
            ) : (
              billCartItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-[#0B1F44] border-white/5' : 'bg-[#F7F9FC] border-slate-300'}`}
                >
                  <div>
                    <strong className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{item.name}</strong>
                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A]'}`}>₹{item.price} each</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center rounded-xl border ${isDarkMode ? 'bg-white/5 border-[#2A3858]' : 'bg-[#FFFFFF] border-slate-200'}`}>
                      <button
                        onClick={() => updateCartItemQty(idx, item.qty - 1)}
                        className={`px-2 py-0.5 text-xs hover:text-[#D4AF37] ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}
                      >
                        -
                      </button>
                      <span className={`px-2 text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>{item.qty}</span>
                      <button
                        onClick={() => updateCartItemQty(idx, item.qty + 1)}
                        className={`px-2 py-0.5 text-xs hover:text-[#D4AF37] ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}
                      >
                        +
                      </button>
                    </div>
                    <strong className="text-xs text-[#D4AF37] font-extrabold w-14 text-right">
                      ₹{item.price * item.qty}
                    </strong>
                    <button
                      type="button"
                      onClick={() => removeCartItem(idx)}
                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                      title="Remove item"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stylist Assignment with Multi-Select and Owner Default */}
          <StylistMultiSelect
            value={billStaffSelect}
            onChange={setBillStaffSelect}
            label="Serving Stylist(s)"
            sublabel="Select Owner, Stylist, or Both"
          />

          {/* Discount & Tip Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className={`block text-[11px] font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
                Discount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={billDiscount}
                onChange={(e) => setBillDiscount(Math.max(0, Number(e.target.value)))}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:border-[#D4AF37] ${isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-slate-200 text-[#1F2937]'}`}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
                Stylist Tip (₹)
              </label>
              <input
                type="number"
                min={0}
                value={billTip}
                onChange={(e) => setBillTip(Math.max(0, Number(e.target.value)))}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none focus:border-[#D4AF37] ${isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-slate-200 text-[#1F2937]'}`}
              />
            </div>
          </div>

          {/* 5 Payment Modes with Vector Icons */}
          <div>
            <label className={`block text-[11px] font-bold mb-1.5 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
              Payment Mode
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['UPI', 'Cash', 'Card', 'Partial Pay', 'Fully Pending'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBillPaymentMode(mode)}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-colors border text-center cursor-pointer ${
                    billPaymentMode === mode
                      ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0B1F44]'
                      : isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-[#A7B0C3] hover:text-white' : 'bg-[#F7F9FC] border-slate-200 text-[#374151] hover:text-[#1F2937]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Partial Pay Split Breakdown */}
          {billPaymentMode === 'Partial Pay' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 block">Partial Payment Split</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A]'}`}>Paid Today (₹)</label>
                  <input
                    type="number"
                    min={0}
                    max={cartTotal}
                    value={partialPaidAmount}
                    onChange={(e) => setPartialPaidAmount(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-black outline-none ${
                      isDarkMode ? 'bg-[#0B1F44] border-amber-500/40 text-white' : 'bg-white border-amber-500/50 text-[#0F172A]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A]'}`}>Remaining Due (₹)</label>
                  <span className={`block px-2.5 py-1.5 rounded-xl border text-xs font-black ${
                    isDarkMode ? 'bg-[#0B1F44] border-amber-500/40 text-amber-400' : 'bg-[#FFFDF5] border-amber-500/50 text-amber-800'
                  }`}>
                    ₹ {Math.max(0, cartTotal - partialPaidAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fully Pending Notice */}
          {billPaymentMode === 'Fully Pending' && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              Full bill (₹{cartTotal}) marked as pending balance.
            </div>
          )}

          {/* Total Summary */}
          <div className="pt-3 border-t border-[#2A3858] space-y-1.5 text-xs">
            <div className={`flex justify-between ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
              <span>Subtotal</span>
              <span>₹ {cartSubtotal}</span>
            </div>
            {billDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Discount</span>
                <span>- ₹ {billDiscount}</span>
              </div>
            )}
            {billTip > 0 && (
              <div className="flex justify-between text-[#D4AF37] font-semibold">
                <span>Tip</span>
                <span>+ ₹ {billTip}</span>
              </div>
            )}
            <div className={`flex justify-between font-extrabold text-base pt-1 ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
              <span>Total Bill</span>
              <span className="text-[#D4AF37]">₹ {cartTotal}</span>
            </div>
          </div>

          {/* Action Buttons: 2 Clear Options - Save & Share Bill, Close / New Bill */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => handleCompleteBill(false)}
              className="flex-1 py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4 text-[#0B1F44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{canShareBills ? 'Save & Share Bill' : 'Save Bill'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                clearCart();
                setBillCustName('');
                setBillCustPhone('');
                setBillTip(0);
                setBillDiscount(0);
                setBillDate(getTodayInputStr());
                showToast('Billing form reset. Ready for new bill.');
              }}
              className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                isDarkMode
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border-[#2A3858] text-[#F8FAFC]'
                  : 'bg-[#F7F9FC] hover:bg-slate-100 border-[#CBD5E1] text-[#0F172A]'
              }`}
              title="Close and create a new bill"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Close / New Bill</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
