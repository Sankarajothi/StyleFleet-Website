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
            {/* ================= 2. EXPRESS BILLING ================= */}
            {currentScreen === 'billing' && (
              <ExpressBillingView
                onOpenAddClientModal={() => setShowAddClientModal(true)}
                onOpenImportContactsModal={() => setShowImportContactsModal(true)}
                onOpenMenuCatalogModal={() => setShowMenuCatalogModal(true)}
                onInvoiceCreated={() => {
                  setIsWhatsAppShared(false);
                  setShowInvoiceModal(true);
                }}
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

            {/* ================= 5. SALES & BILLS ================= */}
            {currentScreen === 'sales' && (
              <SalesAndBillsView
                onViewInvoice={(bill) => {
                  setActiveInvoice(bill);
                  setIsWhatsAppShared(false);
                  setShowInvoiceModal(true);
                }}
              />
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



      {/* ================= MODAL: INVOICE & WHATSAPP RECEIPT ================= */}
      {showInvoiceModal && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-sm w-full space-y-4 text-center transition-all shadow-2xl relative ${
              isDarkMode
                ? 'bg-[#0F2344] border-[#D4AF37]/50 text-white'
                : 'bg-white border-[#D4AF37]/60 text-[#1F2937]'
            }`}
          >
            {/* Top-Right Close Icon Button */}
            <button
              type="button"
              onClick={() => {
                setShowInvoiceModal(false);
                setIsWhatsAppShared(false);
              }}
              className={`absolute top-4 right-4 w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${
                isDarkMode
                  ? 'bg-[#142C52] border-[#2A3858] text-[#A7B0C3] hover:text-white hover:bg-red-500/20 hover:border-red-500/40'
                  : 'bg-[#F1F5F9] border-slate-300 text-slate-600 hover:text-black hover:bg-red-100'
              }`}
              title="Close"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Salon Badge */}
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-black text-sm flex items-center justify-center mx-auto">
              SF
            </div>

            <div>
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
                {shopProfile.shopName}
              </h3>
              <p className={`text-[10px] ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#64748B]'}`}>
                Invoice #{activeInvoice.id} · {activeInvoice.dateStr}
                {activeInvoice.isEdited && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    Edited
                  </span>
                )}
              </p>
            </div>

            {/* Bill Details Summary Card */}
            <div
              className={`p-3.5 rounded-2xl text-left text-xs space-y-2.5 ${
                isDarkMode ? 'bg-[#142C52] border border-white/5' : 'bg-[#F7F9FC] border border-slate-200'
              }`}
            >
              <div className={`flex justify-between font-bold border-b pb-2 ${isDarkMode ? 'text-white border-white/10' : 'text-[#1F2937] border-slate-200'}`}>
                <span>{activeInvoice.cust}</span>
                <span className="text-[#D4AF37]">{activeInvoice.phone ? `+91 ${activeInvoice.phone}` : 'Walk-in'}</span>
              </div>

              <div className="space-y-1">
                {activeInvoice.items.map((item, idx) => (
                  <div key={idx} className={`flex justify-between ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#64748B]'}`}>
                    <span>{item.name} × {item.qty}</span>
                    <span className="font-semibold">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <div className={`border-t pt-2 flex justify-between font-extrabold text-sm ${isDarkMode ? 'text-white border-white/10' : 'text-[#1F2937] border-slate-200'}`}>
                <span>Total Amount</span>
                <span className="text-[#D4AF37]">₹ {activeInvoice.total}</span>
              </div>

              <div className="flex justify-between text-[11px] pt-1">
                <span className={isDarkMode ? 'text-[#A7B0C3]' : 'text-[#64748B]'}>
                  Paid ({activeInvoice.mode})
                </span>
                <span className="font-bold text-emerald-500">₹ {activeInvoice.paidAmount}</span>
              </div>

              {activeInvoice.dueAmount > 0 && (
                <div className="flex justify-between text-amber-500 font-bold text-xs pt-1 border-t border-amber-500/20">
                  <span>Balance Due</span>
                  <span>₹ {activeInvoice.dueAmount}</span>
                </div>
              )}
            </div>

            {/* Action State: WhatsApp Share, Print Receipt, and Close & New Bill */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsWhatsAppShared(true);
                  const itemsText = activeInvoice.items.map(it => `• ${it.name} (x${it.qty}) - ₹${it.price * it.qty}`).join('\n');
                  const msgText = `*${shopProfile.shopName.toUpperCase()}*\n` +
                    `*Invoice #${activeInvoice.id}*\n` +
                    `Date: ${activeInvoice.dateStr}\n` +
                    `Client: ${activeInvoice.cust}\n` +
                    `Stylist: ${activeInvoice.staff}\n` +
                    `--------------------\n` +
                    `*Services Availed:*\n${itemsText}\n` +
                    `--------------------\n` +
                    `Total: ₹${activeInvoice.total}\n` +
                    `Paid (${activeInvoice.mode}): ₹${activeInvoice.paidAmount}\n` +
                    (activeInvoice.dueAmount > 0 ? `Pending Due: ₹${activeInvoice.dueAmount}\n` : `Status: Fully Paid\n`) +
                    `--------------------\n` +
                    `Thank you for visiting ${shopProfile.shopName}!`;

                  const phoneTarget = activeInvoice.phone ? `91${activeInvoice.phone}` : '';
                  window.open(`https://wa.me/${phoneTarget}?text=${encodeURIComponent(msgText)}`, '_blank');
                  showToast(activeInvoice.phone ? `Invoice shared via WhatsApp to +91 ${activeInvoice.phone}!` : 'Invoice prefilled in WhatsApp!');
                }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.131-.538-1.839-.765-3.023-2.627-3.114-2.748-.09-.122-.745-.989-.745-1.895 0-.907.472-1.352.641-1.536.17-.184.37-.23.493-.23.123 0 .247.001.355.006.114.005.267-.043.418.32.155.371.531 1.294.577 1.389.047.094.078.204.016.326-.062.123-.093.2-.185.309-.092.109-.194.244-.277.328-.093.094-.19.196-.082.381.108.185.481.794 1.031 1.285.709.632 1.306.828 1.492.92.185.093.293.078.401-.047.108-.124.463-.54.586-.726.123-.185.247-.154.416-.093.17.062 1.079.509 1.264.601.185.093.308.139.354.216.046.078.046.452-.098.857z" />
                </svg>
                <span>Share Bill on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary-gold shimmer-btn w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <svg className="w-4 h-4 text-[#07152B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Bill / Thermal POS Slip</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInvoiceModal(false);
                  setIsWhatsAppShared(false);
                }}
                className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  isDarkMode ? 'border-[#2A3858] bg-white/5 text-[#A7B0C3] hover:text-white' : 'border-slate-300 bg-slate-50 text-[#374151] hover:text-slate-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Close & Generate New Bill</span>
              </button>
            </div>

            {/* Hidden on Screen / Visible on Print POS Thermal Receipt */}
            <div id="printable-receipt" className="hidden">
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0' }}>{shopProfile.shopName}</h2>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>{shopProfile.address}, {shopProfile.city}</p>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>Phone: +91 {shopProfile.phone}</p>
                {shopProfile.gstin && <p style={{ margin: '2px 0', fontSize: '10px' }}>GSTIN: {shopProfile.gstin}</p>}
                <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
              </div>

              <div style={{ fontSize: '10px', marginBottom: '6px' }}>
                <p style={{ margin: '2px 0' }}><strong>Invoice:</strong> #{activeInvoice.id}</p>
                <p style={{ margin: '2px 0' }}><strong>Date:</strong> {activeInvoice.dateStr}</p>
                <p style={{ margin: '2px 0' }}><strong>Client:</strong> {activeInvoice.cust} (+91 {activeInvoice.phone})</p>
                <p style={{ margin: '2px 0' }}><strong>Stylist:</strong> {activeInvoice.staff}</p>
                <p style={{ margin: '2px 0' }}><strong>Payment:</strong> {activeInvoice.mode}</p>
              </div>

              <div style={{ borderBottom: '1px solid #000', margin: '6px 0' }} />

              <table style={{ width: '100%', fontSize: '10px', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #000' }}>
                    <th style={{ padding: '3px 0' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '3px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '3px 0' }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {activeInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '3px 0' }}>{it.name}</td>
                      <td style={{ textAlign: 'center', padding: '3px 0' }}>{it.qty}</td>
                      <td style={{ textAlign: 'right', padding: '3px 0' }}>₹{it.price * it.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

              <div style={{ fontSize: '11px', textAlign: 'right' }}>
                <p style={{ margin: '2px 0', fontSize: '13px', fontWeight: 'bold' }}>
                  Total: ₹{activeInvoice.total}
                </p>
                <p style={{ margin: '2px 0' }}>Paid: ₹{activeInvoice.paidAmount}</p>
                {activeInvoice.dueAmount > 0 && (
                  <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Balance Due: ₹{activeInvoice.dueAmount}</p>
                )}
              </div>

              <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />

              <div style={{ textAlign: 'center', fontSize: '10px' }}>
                <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Thank You For Visiting!</p>
                <p style={{ margin: '2px 0', color: '#555' }}>Powered by StyleFleet Salon OS</p>
              </div>
            </div>
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
