'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SalonProvider, useSalon, Appointment, Bill, ServiceItem } from '@/components/SalonContext';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { DashboardView } from '@/components/dashboard';
import { ExpressBillingView } from '@/components/express-billing';
import { AppointmentsView } from '@/components/appointments';
import { CustomersView } from '@/components/customers';
import { SalesAndBillsView } from '@/components/sales-and-bills';
import { PriceListView } from '@/components/price-list';
import { StaffTeamView } from '@/components/staff-team';
import { WhatsAppMarketingView } from '@/components/whatsapp-marketing';
import { RemindersView } from '@/components/reminders';
import { AccountsView } from '@/components/accounts';
import { SettingsView } from '@/components/settings';
import { InvoiceTemplate } from '@/components/invoice-template';
import { buildOfficialWhatsAppBillMessage, openWhatsAppBill } from '@/lib/salon-helpers';

function DashboardContent() {
  const router = useRouter();
  const {
    role,
    currentScreen,
    setCurrentScreen,
    shopProfile,
    updateShopProfile,
    categories,
    addCategory,
    services,
    addService,
    toggleServiceActive,
    customers,
    addCustomer,
    staff,
    addStaff,
    appointments,
    addAppointment,
    updateAppointmentStatus,
    markArrivedAndBill,
    bills,
    createBill,
    editBill,
    deleteBill,
    expenses,
    addExpense,
    deleteExpense,
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
    activeInvoice,
    setActiveInvoice,
    showToast,
    language,
    isDarkMode,
    toggleTheme,
    isHydrated,
    isLoadingSalonData,
  } = useSalon();

  // Helper date generators for local date representation
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Billing specific states
  const [billDate, setBillDate] = useState(getTodayDateStr());
  const [billTip, setBillTip] = useState(0);
  const [isWhatsAppShared, setIsWhatsAppShared] = useState(false);

  // Modals state
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showImportContactsModal, setShowImportContactsModal] = useState(false);
  const [showMenuCatalogModal, setShowMenuCatalogModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingBillData, setEditingBillData] = useState<Bill | null>(null);

  // New Booking Modal Form state
  const [bookingType, setBookingType] = useState<'appointment' | 'queue'>('appointment');
  const [bookingCustName, setBookingCustName] = useState('');
  const [bookingCustPhone, setBookingCustPhone] = useState('');
  const [bookingService, setBookingService] = useState('Classic Haircut');
  const [bookingStaff, setBookingStaff] = useState('Karthik');
  const [bookingDate, setBookingDate] = useState(getTodayDateStr());
  const [bookingTime, setBookingTime] = useState('11:30 AM');
  const [bookingAmount, setBookingAmount] = useState<number>(350);
  const [bookingNotes, setBookingNotes] = useState('');

  // Form states for modals
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientVip, setNewClientVip] = useState(false);
  const [newClientDue, setNewClientDue] = useState<number>(0);
  const [newClientNotes, setNewClientNotes] = useState('');

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(350);
  const [newServiceDur, setNewServiceDur] = useState(30);
  const [newServiceCat, setNewServiceCat] = useState('Hair');

  const [newCategoryName, setNewCategoryName] = useState('');

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Senior Stylist');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  const [newExpenseCat, setNewExpenseCat] = useState('Products & stock');
  const [newExpenseAmount, setNewExpenseAmount] = useState(500);
  const [newExpenseNote, setNewExpenseNote] = useState('');
  const [newExpensePm, setNewExpensePm] = useState('UPI');

  // Filters
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'In chair' | 'Confirmed' | 'Done'>('all');
  const [priceListCatFilter, setPriceListCatFilter] = useState('All');
  const [menuCatalogCat, setMenuCatalogCat] = useState('All');

  // Calculations for Billing (Subtotal, Discount, Tip, Total, Paid, Due)
  const cartSubtotal = billCartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartTotal = Math.max(0, cartSubtotal - billDiscount + billTip);

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
  const handleCompleteBill = (isDirectPrint: boolean | React.MouseEvent = false) => {
    const directPrint = typeof isDirectPrint === 'boolean' ? isDirectPrint : false;
    if (billCartItems.length === 0) {
      showToast('Please add at least one service to the bill.', 'error');
      return;
    }
    const cust = billCustName.trim() || 'Walk-in Client';
    const phone = billCustPhone.trim() || '9876543210';

    // Format custom bill date string combining selected billDate with current local time
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const selectedDateObj = new Date(billDate + 'T00:00:00');
    const day = selectedDateObj.getDate();
    const month = selectedDateObj.toLocaleString('en-US', { month: 'short' });
    const year = selectedDateObj.getFullYear();
    const customDateStr = `${day} ${month} ${year}, ${timeStr}`;

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
    }, customDateStr);

    setActiveInvoice(newBill);
    setIsWhatsAppShared(false);
    setShowInvoiceModal(true);
    clearCart();
    setBillTip(0);

    if (directPrint) {
      setTimeout(() => {
        window.print();
      }, 350);
    }
  };

  // Sign out handler
  const handleConfirmSignOut = () => {
    setShowSignOutModal(false);
    try {
      localStorage.removeItem('stylefleet_auth_session');
      localStorage.removeItem('stylefleet_shop_id');
      localStorage.removeItem('stylefleet_shop_profile');
      localStorage.removeItem('stylefleet_bills_db');
      localStorage.removeItem('stylefleet_appointments_db');
      localStorage.removeItem('stylefleet_customers_db');
      localStorage.removeItem('stylefleet_staff_team_db');
      localStorage.removeItem('stylefleet_expenses_db');
    } catch {}
    showToast('Signed out of StyleFleet successfully.');
    router.push('/');
  };

  // Handlers for New Booking & Book Again
  const handleOpenNewBooking = () => {
    setCurrentScreen('appointments');
  };

  const handleBookAgain = (client: { cust: string; phone: string; service?: string; amount?: number; staff?: string }) => {
    setBookingType('appointment');
    setBookingCustName(client.cust);
    setBookingCustPhone(client.phone);
    if (client.service) setBookingService(client.service);
    if (client.amount) setBookingAmount(client.amount);
    if (client.staff) setBookingStaff(client.staff);
    setBookingDate(getTodayDateStr());
    setBookingTime('03:30 PM');
    setBookingNotes('Repeat client rebooking');
    setShowNewBookingModal(true);
    showToast(`Pre-filled rebooking for ${client.cust}`);
  };

  const handleConfirmNewBooking = () => {
    if (!bookingCustName.trim()) {
      showToast('Please enter the client name.', 'error');
      return;
    }
    const isQueue = bookingType === 'queue';
    addAppointment({
      cust: bookingCustName.trim(),
      phone: bookingCustPhone.trim(),
      service: bookingService,
      staff: bookingStaff,
      startsAt: isQueue ? 'Now (In Chair)' : bookingTime,
      date: isQueue ? getTodayDateStr() : bookingDate,
      amount: Number(bookingAmount) || 500,
      status: isQueue ? 'In chair' : 'Confirmed',
    });
    if (isQueue) {
      showToast(`Client ${bookingCustName} seated in chair for ${bookingStaff}!`);
    } else {
      showToast(`Appointment confirmed for ${bookingCustName} on ${bookingDate} at ${bookingTime}!`);
    }
    setShowNewBookingModal(false);
  };



  if (!isHydrated || isLoadingSalonData) {
    return (
      <div className="min-h-screen bg-[#07152B] flex flex-col items-center justify-center text-white select-none">
        <div className="w-10 h-10 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold tracking-[0.2em] text-[#A7B0C3] uppercase">
          Loading StyleFleet Workspace...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-200 ${
        isDarkMode ? 'bg-[#0B1F44] text-[#F8FAFC]' : 'bg-[#FAF8F3] text-[#0F172A]'
      }`}
    >
      {/* 1. Full-Height Sidebar on Left */}
      <Sidebar onOpenSignOutModal={() => setShowSignOutModal(true)} />

      {/* 2. Main Content Area: TopBar + Dynamic Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* TopBar on Right Above Content */}
        <TopBar onOpenSignOutModal={() => setShowSignOutModal(true)} />

        {/* Dynamic Viewport */}
        <main
          className={`flex-1 overflow-y-auto pb-28 md:pb-12 transition-colors duration-200 ${
            isDarkMode ? 'bg-[#0B1F44]' : 'bg-[#FAF8F3]'
          }`}
        >
          <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">

            {/* ================= 1. DASHBOARD (HOME) ================= */}
            {currentScreen === 'home' && (
              <DashboardView
                onOpenNewBooking={handleOpenNewBooking}
                onViewInvoice={(bill) => {
                  setActiveInvoice(bill);
                  setIsWhatsAppShared(false);
                  setShowInvoiceModal(true);
                }}
              />
            )}
            {/* ================= 2. SALES & EXPRESS BILLING ================= */}
            {(currentScreen === 'billing' || currentScreen === 'sales') && (
              <SalesAndBillsView
                initialOpenNewBill={currentScreen === 'billing'}
                onViewInvoice={(bill) => {
                  setActiveInvoice(bill);
                  setIsWhatsAppShared(false);
                  setShowInvoiceModal(true);
                }}
                onOpenAddClientModal={() => setShowAddClientModal(true)}
                onOpenImportContactsModal={() => setShowImportContactsModal(true)}
                onOpenMenuCatalogModal={() => setShowMenuCatalogModal(true)}
              />
            )}

            {/* ================= 3. APPOINTMENTS & LIVE QUEUE ================= */}
            {currentScreen === 'appointments' && (
              <AppointmentsView onOpenNewBooking={handleOpenNewBooking} />
            )}

            {/* ================= 4. CUSTOMERS (CRM) ================= */}
            {currentScreen === 'customers' && (
              <CustomersView onOpenAddClientModal={() => setShowAddClientModal(true)} />
            )}

            {/* ================= 6. PRICE LIST ================= */}
            {currentScreen === 'pricelist' && (
              <PriceListView
                onOpenAddCategory={() => setShowAddCategoryModal(true)}
                onOpenAddService={() => setShowAddServiceModal(true)}
              />
            )}

            {/* ================= 7. STAFF TEAM ================= */}
            {currentScreen === 'staff' && (
              role === 'stylist' ? (
                <div className="p-8 rounded-2xl border text-center text-xs bg-[#0F1C36] border-white/10 text-[#A7B0C3]">
                  Staff & Team Management is restricted to Salon Owners.
                </div>
              ) : (
                <StaffTeamView onOpenAddStaff={() => setShowAddStaffModal(true)} />
              )
            )}

            {/* ================= 8. REMINDERS & AUTOMATION ================= */}
            {currentScreen === 'reminders' && <RemindersView />}

            {/* ================= 9. WHATSAPP MARKETING ================= */}
            {currentScreen === 'whatsapp' && (
              role === 'stylist' ? (
                <div className="p-8 rounded-2xl border text-center text-xs bg-[#0F1C36] border-white/10 text-[#A7B0C3]">
                  Bulk Marketing is restricted to Salon Owners.
                </div>
              ) : (
                <WhatsAppMarketingView />
              )
            )}

            {/* ================= 10. ACCOUNTS & EXPENSES ================= */}
            {currentScreen === 'accounts' && (
              role === 'stylist' ? (
                <div className="p-8 rounded-2xl border text-center text-xs bg-[#0F1C36] border-white/10 text-[#A7B0C3]">
                  Accounts & Salon Expenses are restricted to Salon Owners.
                </div>
              ) : (
                <AccountsView onOpenAddExpense={() => setShowAddExpenseModal(true)} />
              )
            )}

            {/* ================= 11. SETTINGS & SHOP PROFILE ================= */}
            {currentScreen === 'settings' && (
              role === 'stylist' ? (
                <div className="p-8 rounded-2xl border text-center text-xs bg-[#0F1C36] border-white/10 text-[#A7B0C3]">
                  Salon Settings and Profile are restricted to Salon Owners.
                </div>
              ) : (
                <SettingsView onOpenSignOutModal={() => setShowSignOutModal(true)} />
              )
            )}

          </div>
        </main>
      </div>

      {/* ================= MODAL: ADD CLIENT ================= */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`p-6 rounded-3xl border max-w-sm w-full space-y-4 shadow-2xl ${isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1F2937]'}`}>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>Add New Client</h3>
            <div className="space-y-3.5">
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1.5 uppercase tracking-wider`}>Client Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-amber-400 outline-none transition-all placeholder:text-slate-600`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1.5 uppercase tracking-wider`}>WhatsApp Mobile *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit phone number"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value.replace(/\D/g, ''))}
                    className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-amber-400 outline-none transition-all placeholder:text-slate-600 font-mono`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1.5 uppercase tracking-wider`}>Initial Due / Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newClientDue || ''}
                  onChange={(e) => setNewClientDue(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-amber-400 outline-none transition-all font-mono placeholder:text-slate-600`}
                />
              </div>
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-[#080D1A] border-[#2A3858]' : 'bg-[#FFFDF5] border-[#D4AF37]/50'}`}>
                <span className={`text-xs font-black flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                  <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  <span>Mark as VIP / MVP</span>
                </span>
                <input
                  type="checkbox"
                  checked={newClientVip}
                  onChange={(e) => setNewClientVip(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1.5 uppercase tracking-wider`}>Client Preference or Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Skin fade cut, sensitive scalp..."
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-amber-400 outline-none transition-all placeholder:text-slate-600`}
                />
              </div>
            </div>

            <div className={`flex gap-2.5 pt-2 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-[#E2E8F0]'}`}>
              <button
                type="button"
                onClick={() => setShowAddClientModal(false)}
                className={`flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold ${isDarkMode ? 'text-[#A7B0C3] hover:text-white' : 'text-[#374151] hover:text-black'} transition-all`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newClientName || !newClientPhone) {
                    showToast('Please enter both name and mobile', 'error');
                    return;
                  }
                  addCustomer({
                    name: newClientName,
                    phone: newClientPhone,
                    vip: newClientVip,
                    due: newClientDue,
                    notes: newClientNotes,
                    lastVisit: 'Today',
                  });
                  setBillCustName(newClientName);
                  setBillCustPhone(newClientPhone);
                  setShowAddClientModal(false);
                  setNewClientName('');
                  setNewClientPhone('');
                  setNewClientDue(0);
                  setNewClientVip(false);
                  setNewClientNotes('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-slate-950 text-xs font-extrabold shadow-md shadow-[#D4AF37]/20 active:scale-98 transition-all"
              >
                Save Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: IMPORT CONTACTS ================= */}
      {showImportContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1F2937]'} max-w-sm w-full space-y-4 shadow-2xl`}>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>Select from Registered Clients</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setBillCustName(c.name);
                    setBillCustPhone(c.phone);
                    setShowImportContactsModal(false);
                    showToast(`Selected ${c.name}`);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    isDarkMode
                      ? 'bg-[#07152B] border-white/5 hover:border-[#F5A623]/50'
                      : 'bg-white border-slate-300 hover:border-[#D4AF37] shadow-sm'
                  }`}
                >
                  <div>
                    <span className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{c.name}</span>
                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#0F172A]'}`}>+91 {c.phone}</span>
                  </div>
                  <span className="text-xs text-[#F5A623] font-bold">Select →</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowImportContactsModal(false)}
              className={`w-full py-2.5 rounded-2xl border border-white/10 text-xs font-semibold ${isDarkMode ? 'text-[#A7B0C3] hover:text-white' : 'text-[#374151] hover:text-black'} transition-all`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: IMPORT FROM MENU ================= */}
      {showMenuCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1F2937]'} max-w-md w-full space-y-4 shadow-2xl`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>Add Services to Invoice</h3>
              <button
                onClick={() => setShowMenuCatalogModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white flex items-center justify-center text-xs"
                title="Close"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['All', ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMenuCatalogCat(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    menuCatalogCat === cat
                      ? 'bg-[#D4AF37] text-[#07152B] shadow-md shadow-[#D4AF37]/20'
                      : 'bg-[#07152B] border border-white/5 text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {services
                .filter((s) => s.active && (menuCatalogCat === 'All' || s.cat === menuCatalogCat))
                .map((service) => (
                  <div
                    key={service.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      isDarkMode ? 'bg-[#07152B] border-white/5' : 'bg-white border-slate-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <strong className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{service.name}</strong>
                      <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#0F172A]'}`}>₹{service.price} · {service.dur} mins</span>
                    </div>
                    <button
                      onClick={() => {
                        addCartItem(service);
                        showToast(`Added ${service.name}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-extrabold shadow-sm active:scale-[0.98] transition-all"
                    >
                      + Add
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setShowMenuCatalogModal(false)}
              className="w-full py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-white transition-all"
            >
              Done Adding Services
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD SERVICE ================= */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1F2937]'} max-w-sm w-full space-y-4 shadow-2xl`}>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>Add New Service</h3>
            <div className="space-y-3">
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Creative Beard Styling"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-[#F5A623] outline-none`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Price (₹) *</label>
                  <input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} font-bold focus:border-[#F5A623] outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Duration (mins)</label>
                  <input
                    type="number"
                    value={newServiceDur}
                    onChange={(e) => setNewServiceDur(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} font-bold focus:border-[#F5A623] outline-none`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Category</label>
                <select
                  value={newServiceCat}
                  onChange={(e) => setNewServiceCat(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-[#F5A623] outline-none cursor-pointer`}
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-[#0B1E3B]">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`flex gap-2.5 pt-2 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-[#E2E8F0]'}`}>
              <button
                type="button"
                onClick={() => setShowAddServiceModal(false)}
                className={`flex-1 py-2.5 rounded-2xl border border-white/10 text-xs font-semibold ${isDarkMode ? 'text-[#A7B0C3] hover:text-white' : 'text-[#374151] hover:text-black'} transition-all`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newServiceName) return;
                  addService({ name: newServiceName, price: newServicePrice, dur: newServiceDur, cat: newServiceCat });
                  setShowAddServiceModal(false);
                  setNewServiceName('');
                }}
                className="flex-1 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-extrabold shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] transition-all"
              >
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CATEGORY ================= */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1F2937]'} max-w-xs w-full space-y-4 shadow-2xl`}>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>Add New Category</h3>
            <div>
              <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Treatments"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-[#F5A623] outline-none`}
              />
            </div>
            <div className={`flex gap-2.5 pt-2 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-[#E2E8F0]'}`}>
              <button onClick={() => setShowAddCategoryModal(false)} className={`flex-1 py-2.5 rounded-2xl border border-white/10 text-xs font-semibold ${isDarkMode ? 'text-[#A7B0C3] hover:text-white' : 'text-[#374151] hover:text-black'} transition-all`}>
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newCategoryName) return;
                  addCategory(newCategoryName);
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="flex-1 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-extrabold shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD STAFF ================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1F2937]'} max-w-sm w-full space-y-4 shadow-2xl`}>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>Add Stylist</h3>
            <div className="space-y-3">
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Stylist Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Deepa"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-[#F5A623] outline-none`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Role / Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Color Specialist"
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-[#F5A623] outline-none`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="10-digit phone"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-[#F5A623] outline-none`}
                />
              </div>
            </div>
            <div className={`flex gap-2.5 pt-2 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-[#E2E8F0]'}`}>
              <button onClick={() => setShowAddStaffModal(false)} className={`flex-1 py-2.5 rounded-2xl border border-white/10 text-xs font-semibold ${isDarkMode ? 'text-[#A7B0C3] hover:text-white' : 'text-[#374151] hover:text-black'} transition-all`}>
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newStaffName) return;
                  addStaff({ name: newStaffName, role: newStaffRole, phone: newStaffPhone });
                  setShowAddStaffModal(false);
                  setNewStaffName('');
                  setNewStaffPhone('');
                }}
                className="flex-1 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-extrabold shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] transition-all"
              >
                Save Stylist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD EXPENSE ================= */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1F2937]'} max-w-sm w-full space-y-4 shadow-2xl`}>
            <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>Record Daily Expense</h3>
            <div className="space-y-3">
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Category</label>
                <select
                  value={newExpenseCat}
                  onChange={(e) => setNewExpenseCat(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-[#F5A623] outline-none cursor-pointer`}
                >
                  <option value="Products & stock" className="bg-[#0B1E3B]">Products & stock</option>
                  <option value="Maintenance" className="bg-[#0B1E3B]">Maintenance</option>
                  <option value="Salaries" className="bg-[#0B1E3B]">Staff Advance / Salaries</option>
                  <option value="Electricity" className="bg-[#0B1E3B]">Electricity / Utility</option>
                </select>
              </div>
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Amount (₹) *</label>
                <input
                  type="number"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} font-bold focus:border-[#F5A623] outline-none`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'} mb-1 uppercase tracking-wider`}>Note / Description</label>
                <input
                  type="text"
                  placeholder="e.g. L'Oreal Conditioner pack"
                  value={newExpenseNote}
                  onChange={(e) => setNewExpenseNote(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs ${isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#1F2937]'} focus:border-[#F5A623] outline-none`}
                />
              </div>
            </div>
            <div className={`flex gap-2.5 pt-2 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-[#E2E8F0]'}`}>
              <button onClick={() => setShowAddExpenseModal(false)} className={`flex-1 py-2.5 rounded-2xl border border-white/10 text-xs font-semibold ${isDarkMode ? 'text-[#A7B0C3] hover:text-white' : 'text-[#374151] hover:text-black'} transition-all`}>
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newExpenseAmount) return;
                  addExpense({ cat: newExpenseCat, amount: newExpenseAmount, note: newExpenseNote, pm: newExpensePm, inProfit: true });
                  setShowAddExpenseModal(false);
                  setNewExpenseNote('');
                }}
                className="flex-1 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-extrabold shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] transition-all"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ================= MODAL: INVOICE & LUXURY RECEIPT ================= */}
      {showInvoiceModal && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-3xl my-auto">
            <InvoiceTemplate
              bill={activeInvoice}
              shopProfile={shopProfile}
              onClose={() => {
                setShowInvoiceModal(false);
                setIsWhatsAppShared(false);
              }}
              onShareWhatsApp={() => {
                setIsWhatsAppShared(true);
                const msgText = buildOfficialWhatsAppBillMessage({
                  shopName: shopProfile.shopName || 'StyleFleet Salon',
                  shopPhone: shopProfile.phone || '',
                  upiId: shopProfile.upiId || '',
                  customerName: activeInvoice.cust || 'Client',
                  invoiceNumber: activeInvoice.id,
                  billId: activeInvoice.id,
                  totalAmount: activeInvoice.total,
                  paidAmount: activeInvoice.paidAmount,
                  dueAmount: activeInvoice.dueAmount,
                  paymentMethod: activeInvoice.mode || 'UPI',
                  socialLinks: {
                    instagram: shopProfile.instagram,
                    facebook: shopProfile.facebook,
                  },
                });
                openWhatsAppBill(activeInvoice.phone, msgText);
                showToast(
                  activeInvoice.phone
                    ? `Official invoice shared via WhatsApp to +91 ${activeInvoice.phone}!`
                    : 'Invoice prefilled in WhatsApp!'
                );
              }}
            />
          </div>
        </div>
      )}

      {/* ================= MODAL: SIGN OUT CONFIRMATION ================= */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`p-6 rounded-3xl border max-w-sm w-full space-y-4 text-center shadow-2xl ${isDarkMode ? 'bg-[#1A2746] border-red-500/30 text-white' : 'bg-[#FFFFFF] border-red-500/30 text-[#1F2937]'}`}>
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>Sign Out of StyleFleet?</h3>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
                Are you sure you want to end your current session for <strong className={`${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>{shopProfile.shopName}</strong>?
              </p>
            </div>
            <div className={`flex gap-2.5 pt-2 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-[#E2E8F0]'}`}>
              <button
                onClick={() => setShowSignOutModal(false)}
                className={`flex-1 py-2.5 rounded-2xl border border-white/10 text-xs font-semibold ${isDarkMode ? 'text-[#A7B0C3] hover:text-white' : 'text-[#374151] hover:text-black'} transition-all`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                className="flex-1 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SalonProvider>
      <DashboardContent />
    </SalonProvider>
  );
}
