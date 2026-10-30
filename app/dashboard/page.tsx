'use client';

import React, { useState, useEffect } from 'react';
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
import { ReportsView } from '@/components/reports';
import { DeepAnalyticsView } from '@/components/deep-analytics';
import { SettingsView } from '@/components/settings';
import { InvoiceTemplate } from '@/components/invoice-template';
import { buildOfficialWhatsAppBillMessage, openWhatsAppBill } from '@/lib/salon-helpers';

function DashboardContent() {
  const router = useRouter();

  // Authentication guard
  useEffect(() => {
    try {
      const authSessionStr = localStorage.getItem('stylefleet_auth_session');
      const shopId = localStorage.getItem('stylefleet_shop_id');
      if (!authSessionStr || !shopId) {
        router.push('/');
      }
    } catch {
      router.push('/');
    }
  }, [router]);
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
    hasPermission,
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

  // WhatsApp Bill Sent & Revenue Confirmation Modal State
  const [dashboardConfirmationBill, setDashboardConfirmationBill] = useState<Bill | null>(null);
  const [dashboardReminderStatus, setDashboardReminderStatus] = useState<'Not Sent' | 'Sent' | 'Pending'>('Sent');
  const [dashboardConfirmationStatus, setDashboardConfirmationStatus] = useState<'Pending' | 'Confirmed'>('Confirmed');

  // Milestone: Review our App (10 customers + 10 bills)
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    try {
      const alreadyReviewed = localStorage.getItem('stylefleet_app_reviewed');
      const dismissed = sessionStorage.getItem('stylefleet_review_dismissed');
      const nonDeletedBills = (bills || []).filter((b) => !b.isDeleted);
      if (!alreadyReviewed && !dismissed && (customers || []).length >= 10 && nonDeletedBills.length >= 10) {
        setShowReviewPrompt(true);
      }
    } catch {}
  }, [customers, bills]);

  // New Booking Modal Form state
  const [bookingType, setBookingType] = useState<'appointment' | 'queue'>('appointment');
  const [bookingCustName, setBookingCustName] = useState('');
  const [bookingCustPhone, setBookingCustPhone] = useState('');
  const [bookingService, setBookingService] = useState('Classic Haircut');
  const [bookingStaff, setBookingStaff] = useState(() => {
    return staff[0]?.name || shopProfile?.ownerName || 'Stylist';
  });

  // Ensure booking staff is always strictly synchronized to registered staff or owner
  useEffect(() => {
    if (staff.length > 0 && (!bookingStaff || bookingStaff === 'Karthik' || bookingStaff === 'Stylist')) {
      setBookingStaff(staff[0].name);
    } else if (staff.length === 0 && (!bookingStaff || bookingStaff === 'Karthik')) {
      setBookingStaff(shopProfile?.ownerName || 'Owner');
    }
  }, [staff, shopProfile?.ownerName, bookingStaff]);
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
    if (client.staff && client.staff !== 'Karthik') {
      const matchStaff = staff.find((s) => s.name.toLowerCase() === client.staff?.toLowerCase());
      setBookingStaff(matchStaff ? matchStaff.name : (staff[0]?.name || shopProfile?.ownerName || 'Stylist'));
    } else {
      setBookingStaff(staff[0]?.name || shopProfile?.ownerName || 'Stylist');
    }
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
    const resolvedStaff = (bookingStaff && bookingStaff !== 'Karthik')
      ? bookingStaff
      : (staff[0]?.name || shopProfile?.ownerName || 'Stylist');
    addAppointment({
      cust: bookingCustName.trim(),
      phone: bookingCustPhone.trim(),
      service: bookingService,
      staff: resolvedStaff,
      startsAt: isQueue ? 'Now (In Chair)' : bookingTime,
      date: isQueue ? getTodayDateStr() : bookingDate,
      amount: Number(bookingAmount) || 500,
      status: isQueue ? 'In chair' : 'Confirmed',
    });
    if (isQueue) {
      showToast(`Client ${bookingCustName} seated in chair for ${resolvedStaff}!`);
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
                onBookAgain={handleBookAgain}
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
              !hasPermission('customers') ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 max-w-lg mx-auto my-12 shadow-xl ${
                  isDarkMode ? 'bg-[#0F1C36] border-white/10 text-[#A7B0C3]' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Access Restricted
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Your salon owner has not enabled access to <strong>Customers CRM</strong> for your stylist account.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              ) : (
                <CustomersView onOpenAddClientModal={() => setShowAddClientModal(true)} />
              )
            )}

            {/* ================= 6. PRICE LIST ================= */}
            {currentScreen === 'pricelist' && (
              <PriceListView
                onOpenAddCategory={() => setShowAddCategoryModal(true)}
                onOpenAddService={(cat?: string) => {
                  if (cat) setNewServiceCat(cat);
                  setShowAddServiceModal(true);
                }}
              />
            )}

            {/* ================= 7. STAFF TEAM ================= */}
            {currentScreen === 'staff' && (
              !hasPermission('team') ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 max-w-lg mx-auto my-12 shadow-xl ${
                  isDarkMode ? 'bg-[#0F1C36] border-white/10 text-[#A7B0C3]' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Access Restricted
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Your salon owner has not enabled access to <strong>Team Management</strong> for your stylist account.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              ) : (
                <StaffTeamView onOpenAddStaff={() => setShowAddStaffModal(true)} />
              )
            )}

            {/* ================= 8. REMINDERS & AUTOMATION ================= */}
            {currentScreen === 'reminders' && (
              !hasPermission('reminders') ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 max-w-lg mx-auto my-12 shadow-xl ${
                  isDarkMode ? 'bg-[#0F1C36] border-white/10 text-[#A7B0C3]' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Access Restricted
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Your salon owner has not enabled access to <strong>Reminders & WhatsApp</strong> for your stylist account.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              ) : (
                <RemindersView />
              )
            )}

            {/* ================= 9. WHATSAPP MARKETING ================= */}
            {currentScreen === 'whatsapp' && (
              !hasPermission('reminders') ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 max-w-lg mx-auto my-12 shadow-xl ${
                  isDarkMode ? 'bg-[#0F1C36] border-white/10 text-[#A7B0C3]' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Access Restricted
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Bulk WhatsApp Marketing is restricted by your salon owner.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              ) : (
                <WhatsAppMarketingView />
              )
            )}

            {/* ================= 10. ACCOUNTS & EXPENSES ================= */}
            {(currentScreen === 'accounts' || currentScreen === 'expenses') && (
              !hasPermission('expenses') ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 max-w-lg mx-auto my-12 shadow-xl ${
                  isDarkMode ? 'bg-[#0F1C36] border-white/10 text-[#A7B0C3]' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Access Restricted
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Your salon owner has not enabled access to <strong>Salon Expenses</strong> for your stylist account.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              ) : (
                <AccountsView onOpenAddExpense={() => setShowAddExpenseModal(true)} />
              )
            )}

            {/* ================= 11. REPORTS & BUSINESS INTELLIGENCE ================= */}
            {currentScreen === 'reports' && (
              !hasPermission('reports') ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 max-w-lg mx-auto my-12 shadow-xl ${
                  isDarkMode ? 'bg-[#0F1C36] border-white/10 text-[#A7B0C3]' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Access Restricted
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Your salon owner has not enabled access to <strong>Financial Reports</strong> for your stylist account.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              ) : (
                <ReportsView />
              )
            )}

            {/* ================= 12. DEEP ANALYTICS 360 ================= */}
            {currentScreen === 'analytics' && (
              !hasPermission('reports') ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 max-w-lg mx-auto my-12 shadow-xl ${
                  isDarkMode ? 'bg-[#0F1C36] border-white/10 text-[#A7B0C3]' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Access Restricted
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Deep Analytics 360 is restricted by your salon owner.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              ) : (
                <DeepAnalyticsView />
              )
            )}

            {/* ================= 13. SETTINGS & SHOP PROFILE ================= */}
            {currentScreen === 'settings' && (
              !hasPermission('profile') ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 max-w-lg mx-auto my-12 shadow-xl ${
                  isDarkMode ? 'bg-[#0F1C36] border-white/10 text-[#A7B0C3]' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Access Restricted
                  </h3>
                  <p className="text-xs leading-relaxed">
                    Your salon owner has not enabled access to <strong>Shop Profile & Settings</strong> for your stylist account.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('home')}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Back to Dashboard</span>
                  </button>
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
              onDelete={() => {
                deleteBill(activeInvoice.id);
                setShowInvoiceModal(false);
                showToast(`Bill #${activeInvoice.id} moved to deleted bills (30-day retention).`);
              }}
              onShareWhatsApp={() => {
                setIsWhatsAppShared(true);
                const cleanInv = (activeInvoice.id || '').replace(/\.pdf$/i, '').trim();
                const officialUrl = `https://stylefleet.tecstellar.com/b/${encodeURIComponent(cleanInv)}.pdf`;

                // Fire invoice generation in background to guarantee file is in Supabase storage
                if (shopProfile?.id) {
                  fetch('/api/invoices/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      shopId: shopProfile.id,
                      billId: activeInvoice.id,
                      invoiceNumber: cleanInv,
                      customerName: activeInvoice.cust || 'Client',
                      customerPhone: activeInvoice.phone || '',
                      items: activeInvoice.items || [],
                      subtotal: activeInvoice.total,
                      discount: activeInvoice.discount || 0,
                      total: activeInvoice.total,
                      paidAmount: activeInvoice.paidAmount,
                      dueAmount: activeInvoice.dueAmount,
                      paymentMethod: activeInvoice.mode || 'UPI',
                      issuedAt: activeInvoice.createdAt || activeInvoice.dateStr,
                      shopProfile,
                    }),
                  }).catch(() => {});
                }

                const msgText = buildOfficialWhatsAppBillMessage({
                  shopName: shopProfile.shopName || 'StyleFleet Salon',
                  shopPhone: shopProfile.phone || '',
                  upiId: shopProfile.upiId || '',
                  customerName: activeInvoice.cust || 'Client',
                  invoiceNumber: cleanInv,
                  billId: activeInvoice.id,
                  pdfUrl: officialUrl,
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
                setShowInvoiceModal(false);
                setDashboardReminderStatus(activeInvoice.reminderStatus || 'Sent');
                setDashboardConfirmationStatus(activeInvoice.confirmationStatus || 'Confirmed');
                setDashboardConfirmationBill(activeInvoice);
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

      {/* ================= MODAL: WHATSAPP BILL SENT & REVENUE CONFIRMATION ================= */}
      {dashboardConfirmationBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-md w-full space-y-4 shadow-2xl animate-scaleUp ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            {/* Header: Bill Sent & Customer Details */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 fill-emerald-400" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.131-.538-1.839-.765-3.023-2.627-3.114-2.748-.09-.122-.745-.989-.745-1.895 0-.907.472-1.352.641-1.536.17-.184.37-.23.493-.23.123 0 .247.001.355.006.114.005.267-.043.418.32.155.371.531 1.294.577 1.389.047.094.078.204.016.326-.062.123-.093.2-.185.309-.092.109-.194.244-.277.328-.093.094-.19.196-.082.381.108.185.481.794 1.031 1.285.709.632 1.306.828 1.492.92.185.093.293.078.401-.047.108-.124.463-.54.586-.726.123-.185.247-.154.416-.093.17.062 1.079.509 1.264.601.185.093.308.139.354.216.046.078.046.452-.098.857z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Bill Sent
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30">
                    Delivered
                  </span>
                </div>
                <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Invoice #{dashboardConfirmationBill.id} · ₹{dashboardConfirmationBill.total} delivered to {dashboardConfirmationBill.cust}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDashboardConfirmationBill(null)}
                className="w-7 h-7 rounded-xl border border-white/10 flex items-center justify-center text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Reminder Set Status Options (Not Sent | Sent | Pending) */}
            <div className="space-y-1.5">
              <label className={`block text-[11px] font-bold tracking-wide uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Reminder Set Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Not Sent', 'Sent', 'Pending'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDashboardReminderStatus(st)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                      dashboardReminderStatus === st
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-slate-300 hover:text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {dashboardReminderStatus === st && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>{st}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Confirmation Status Options (Pending | Confirmed) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`block text-[11px] font-bold tracking-wide uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Confirmation Status
                </label>
                <span className="text-[10px] text-[#D4AF37] font-semibold">
                  {dashboardConfirmationStatus === 'Confirmed' ? '✓ Added into Revenue' : '⏳ Revenue Pending'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['Pending', 'Confirmed'] as const).map((cs) => (
                  <button
                    key={cs}
                    type="button"
                    onClick={() => setDashboardConfirmationStatus(cs)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      dashboardConfirmationStatus === cs
                        ? cs === 'Confirmed'
                          ? 'bg-[#D4AF37] text-[#0B1F44] border-[#D4AF37] shadow-md font-black'
                          : 'bg-amber-600 text-white border-amber-500 shadow-md font-black'
                        : isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-slate-300 hover:text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {dashboardConfirmationStatus === cs && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>{cs}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Luxury WhatsApp Dispatch Preview */}
            <div className="space-y-1.5 pt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                WhatsApp Preview
              </span>
              <div
                className={`p-3.5 rounded-2xl border relative overflow-hidden ${
                  isDarkMode ? 'bg-[#0E1B33] border-[#2A3858]' : 'bg-[#EBF7F0] border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/15 text-xs">
                  <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {shopProfile.shopName || "Priya's Salon"}
                  </span>
                  <span className="text-[10px] text-slate-400">Just now</span>
                </div>
                <div className={`space-y-1 text-xs leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <p className="font-extrabold">Thanks, {dashboardConfirmationBill.cust || 'Joe'}!</p>
                  <p className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <span>📎</span> Invoice Attached · #{dashboardConfirmationBill.id}
                  </p>
                  <p className="font-semibold text-emerald-400">
                    Paid by {dashboardConfirmationBill.mode || 'Cash'} · ₹{dashboardConfirmationBill.paidAmount || dashboardConfirmationBill.total}
                  </p>
                  <p className="text-[#D4AF37] font-bold text-[11px] pt-0.5">
                    ✨ See you in 4 weeks!
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Next Bill and Done */}
            <div className="flex gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  editBill(dashboardConfirmationBill.id, {
                    reminderStatus: dashboardReminderStatus,
                    confirmationStatus: dashboardConfirmationStatus,
                  });
                  setDashboardConfirmationBill(null);
                  clearCart();
                  setBillCustName('');
                  setBillCustPhone('');
                  setCurrentScreen('billing');
                  showToast('Ready for Next Bill!', 'success');
                }}
                className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-[#121B33] border-[#2A3858] text-white hover:bg-[#1C2B4C]'
                    : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200'
                }`}
              >
                <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Next Bill</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  editBill(dashboardConfirmationBill.id, {
                    reminderStatus: dashboardReminderStatus,
                    confirmationStatus: dashboardConfirmationStatus,
                  });
                  if (dashboardConfirmationStatus === 'Confirmed') {
                    showToast(`Bill #${dashboardConfirmationBill.id} confirmed & recorded into revenue!`, 'success');
                  } else {
                    showToast(`Bill #${dashboardConfirmationBill.id} saved as Pending.`);
                  }
                  setDashboardConfirmationBill(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] font-black text-xs transition-transform active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REVIEW OUR APP (10 CUSTOMERS & 10 BILLS) ================= */}
      {showReviewPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 sm:p-7 rounded-3xl border max-w-md w-full space-y-4 shadow-2xl relative animate-scaleUp text-center ${
              isDarkMode ? 'bg-[#1A2746] border-[#D4AF37]/40 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Celebration Icon */}
            <div className="w-16 h-16 rounded-3xl bg-[#D4AF37]/20 border-2 border-[#D4AF37] text-[#D4AF37] flex items-center justify-center mx-auto shadow-lg shadow-[#D4AF37]/20">
              <svg className="w-8 h-8 fill-[#D4AF37]" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] block">
                Salon Milestone Achieved
              </span>
              <h3 className={`text-xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Enjoying StyleFleet? Review Our App
              </h3>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                You have reached <strong>10+ Customers</strong> & <strong>10+ Bills</strong>! Your rating and feedback help us continuously elevate the luxury salon experience.
              </p>
            </div>

            {/* Star Rating Select */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewStars(star)}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  <svg
                    className={`w-7 h-7 ${star <= reviewStars ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-slate-500 fill-none stroke-current'}`}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Tell us what you love or what we can improve..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className={`w-full p-3 rounded-2xl border text-xs outline-none transition-all resize-none ${
                isDarkMode
                  ? 'bg-[#121B33] border-[#2A3858] text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('stylefleet_app_reviewed', 'true');
                  } catch {}
                  setShowReviewPrompt(false);
                  window.open('https://play.google.com/store/apps/details?id=com.stylefleet.app', '_blank');
                  showToast('Thank you for rating StyleFleet on Google Play! ⭐⭐⭐⭐⭐', 'success');
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F5A623] to-[#D4AF37] hover:brightness-110 text-[#07152B] font-black text-xs shadow-lg shadow-[#D4AF37]/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-1.428V3.242c0-.555.228-1.057.609-1.428zm11.233 11.238l2.257 2.257-11.455 6.613 9.198-8.87zm0-2.104L5.644 2.078l11.455 6.613-2.257 2.257zm1.488 1.052l3.473 2.005a1.5 1.5 0 0 0 0-2.6l-3.473-2.005 1.109 1.3 1.109 1.3-2.218 0z" />
                </svg>
                <span>Review on Google Play ⭐</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      sessionStorage.setItem('stylefleet_review_dismissed', 'true');
                    } catch {}
                    setShowReviewPrompt(false);
                  }}
                  className="flex-1 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold cursor-pointer text-slate-400 hover:text-white"
                >
                  Maybe Later
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('stylefleet_app_reviewed', 'true');
                    } catch {}
                    setShowReviewPrompt(false);
                    showToast(`Thank you for rating StyleFleet ${reviewStars} Stars! ⭐`, 'success');
                  }}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
                >
                  Submit Feedback
                </button>
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
