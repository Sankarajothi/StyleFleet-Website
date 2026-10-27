'use client';

import React from 'react';
import { useSalon, Bill, Appointment } from '@/components/SalonContext';
import { AnimatedCounter } from '@/components/animated-counter';

interface DashboardProps {
  onOpenNewBooking: () => void;
  onViewInvoice: (bill: Bill) => void;
}

export function DashboardView({ onOpenNewBooking, onViewInvoice }: DashboardProps) {
  const {
    role,
    loggedInStaffName,
    setCurrentScreen,
    bills,
    appointments,
    customers,
    updateAppointmentStatus,
    markArrivedAndBill,
    shopProfile,
    language,
    isDarkMode,
  } = useSalon();

  const isStylist = role === 'stylist';
  const stylistNameLower = loggedInStaffName?.trim().toLowerCase() || '';

  // Helper to get today's date string YYYY-MM-DD
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Scoped datasets: Stylists are strictly restricted to Today's chair appointments & bills; Owners see entire salon
  const effectiveAppointments = isStylist && stylistNameLower
    ? appointments.filter((a) => a.date === todayStr && a.staff?.trim().toLowerCase() === stylistNameLower)
    : appointments;

  const effectiveBills = isStylist && stylistNameLower
    ? bills.filter(
        (b) =>
          !b.isDeleted &&
          b.isToday &&
          (b.staff?.trim().toLowerCase() === stylistNameLower ||
            b.items?.some((i) => i.staff?.trim().toLowerCase() === stylistNameLower))
      )
    : bills.filter((b) => !b.isDeleted);

  // Dynamic Time-Based Greeting with Luxury Phrasing
  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (language === 'hi') {
      if (hour < 12) return { greeting: 'सुप्रभात', subtitle: 'आज का सैलून परफॉर्मेंस व शेड्यूलिंग' };
      if (hour < 17) return { greeting: 'शुभ दोपहर', subtitle: 'सैलून फ्लोर व लाइव बुकिंग्स' };
      return { greeting: 'शुभ संध्या', subtitle: 'आज का क्लोजिंग व रेवेन्यू सारांश' };
    }
    if (language === 'ta') {
      if (hour < 12) return { greeting: 'காலை வணக்கம்', subtitle: 'இன்றைய சலூன் செயல்திறன்' };
      if (hour < 17) return { greeting: 'மதிய வணக்கம்', subtitle: 'நடப்பு முன்பதிவு கண்ணோட்டம்' };
      return { greeting: 'மாலை வணக்கம்', subtitle: 'இன்றைய இறுதி கணக்கு சுருக்கம்' };
    }
    if (hour < 12) return { greeting: 'Good Morning', subtitle: 'Welcome to your salon command center' };
    if (hour < 17) return { greeting: 'Good Afternoon', subtitle: 'Floor is active with client appointments' };
    return { greeting: 'Good Evening', subtitle: 'Here is your end-of-day revenue overview' };
  };

  const greetingData = getGreetingData();

  // KPI Translations
  const getKpiLabels = () => {
    if (language === 'hi') {
      return {
        totalRev: 'कुल राजस्व',
        todayRev: 'आज का राजस्व',
        todayAppt: 'आज के अपॉइंटमेंट्स',
        todayBills: 'आज के बिल',
        pendingDues: 'बकाया राशि',
        bookAgain: 'क्विक री-बुकिंग',
        bookAgainDesc: 'हाल के ग्राहकों के लिए 1-क्लिक अपॉइंटमेंट',
        newBooking: 'नई बुकिंग',
        createBill: 'बिल बनाएं',
        todaySchedule: 'आज का शेड्यूल',
        recentBills: 'हाल के बिल',
        viewBill: 'बिल देखें',
        avgBill: 'औसत बिल',
      };
    }
    if (language === 'ta') {
      return {
        totalRev: 'மொத்த வருவாய்',
        todayRev: 'இன்றைய வருவாய்',
        todayAppt: 'இன்றைய முன்பதிவுகள்',
        todayBills: 'இன்றைய பில்கள்',
        pendingDues: 'நிலுவைத் தொகை',
        bookAgain: 'மறுமுன்பதிவு',
        bookAgainDesc: 'சமீபத்திய வாடிக்கையாளர்களுக்கான 1-கிளிக் முன்பதிவு',
        newBooking: 'புதிய முன்பதிவு',
        createBill: 'பில் உருவாக்கு',
        todaySchedule: 'இன்றைய முன்பதிவு வரிசை',
        recentBills: 'சமீபத்திய பில்கள்',
        viewBill: 'பில் பார்க்க',
        avgBill: 'சராசரி பில்',
      };
    }
    return {
      totalRev: 'Total Revenue',
      todayRev: "Today's Revenue",
      todayAppt: "Today's Appointments",
      todayBills: "Today's Invoices",
      pendingDues: 'Pending Dues',
      bookAgain: 'Repeat Clients (Book Again)',
      bookAgainDesc: 'Instant 1-click rebooking for recently visited clients',
      newBooking: 'New Booking',
      createBill: 'Create Bill',
      todaySchedule: "Today's Appointments Schedule",
      recentBills: 'Recent Invoices & Receipts',
      viewBill: 'View Receipt',
      avgBill: 'Avg Bill',
    };
  };

  const kpiLabels = getKpiLabels();

  // Helper to accurately identify if a bill occurred today
  const isBillToday = (b: Bill): boolean => {
    if (b.isToday) return true;
    if (b.createdAt && b.createdAt.startsWith(todayStr)) return true;
    if (b.dateStr && (b.dateStr.startsWith(todayStr) || b.dateStr.includes(todayStr))) return true;
    if (b.dateStr) {
      const d = new Date(b.dateStr);
      if (!isNaN(d.getTime())) {
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dStr === todayStr) return true;
      }
    }
    return false;
  };

  // Today's appointments for this chair/salon (excluding cancelled)
  const todayAppointments = effectiveAppointments.filter(
    (a) => (a.date === todayStr || a.date?.startsWith(todayStr)) && a.status !== 'Cancelled'
  );

  // Today's bills
  const todayBills = effectiveBills.filter((b) => isBillToday(b));

  // Metrics Calculation: strictly from real database records with zero artificial additions
  const totalRevenueNumber = effectiveBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
  const todayRevenueNumber = todayBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
  const totalPendingDues = isStylist
    ? todayBills.reduce((acc, b) => acc + (b.dueAmount || 0), 0)
    : effectiveBills.reduce((acc, b) => acc + (b.dueAmount || 0), 0) + customers.reduce((acc, c) => acc + (c.due || 0), 0);
  const confirmedAppointments = effectiveAppointments.filter((a) => a.status === 'Confirmed');

  // Curated repeat clients dynamically derived from real customer database
  const recentBookAgainList = customers
    .filter((c) => c.status !== 'inactive' && (c.visits > 0 || c.lastVisit))
    .slice(0, 4)
    .map((c) => ({
      cust: c.name,
      phone: c.phone,
      service: 'Salon Styling & Care',
      staff: isStylist && loggedInStaffName ? loggedInStaffName : 'Specialist',
      amount: c.spend > 0 ? Math.round(c.spend / Math.max(1, c.visits)) : 0,
      lastVisit: c.lastVisit || 'Recent',
    }));

  return (
    <section className="space-y-6 animate-fadeIn select-none">
      {/* ========================================================= */}
      {/* 1. EXECUTIVE SALON COMMAND BANNER */}
      {/* ========================================================= */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border ${
          isDarkMode
            ? 'bg-[#121B33] border-[#2A3858]'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Salon Dynamic Time Icon Badge */}
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                isDarkMode
                  ? 'bg-[#0B172E] border-[#2A3858] text-[#D4AF37]'
                  : 'bg-amber-50/70 border-amber-200 text-[#B8863B]'
              }`}
            >
              {new Date().getHours() < 17 ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`text-lg sm:text-xl font-bold tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {greetingData.greeting}{isStylist && loggedInStaffName ? `, ${loggedInStaffName}` : ''}
                </h1>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                  isDarkMode ? 'bg-[#0B172E] border-white/10 text-[#D4AF37]' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  {shopProfile.shopName} {isStylist ? '· Stylist Workspace' : ''}
                </span>
              </div>

              <p className={`text-xs mt-0.5 flex flex-wrap items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>{greetingData.subtitle}</span>
                <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                <span className={isDarkMode ? 'text-[#D4AF37]' : 'text-amber-800 font-medium'}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 pt-2 lg:pt-0">
            {/* Small background-free "View Analytics" text button for Owner */}
            {!isStylist && (
              <button
                type="button"
                onClick={() => setCurrentScreen('analytics')}
                className={`text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 px-2.5 py-2 ${
                  isDarkMode
                    ? 'text-[#D4AF37] hover:text-white'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
                title="Open Deep Analytics 360"
              >
                <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>View Analytics</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenNewBooking}
              className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] font-bold text-xs transition-colors cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4 text-[#0B1F44] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="18" rx="2.5" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{kpiLabels.newBooking}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentScreen('billing')}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer flex-1 sm:flex-initial flex items-center justify-center gap-2 active:scale-95 ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4 text-[#D4AF37] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
              <span>{kpiLabels.createBill}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. UNIFIED 4-CELL KPI CONTAINER (Curved contours + Running counter animations) */}
      {/* ========================================================= */}
      <div
        className={`rounded-[28px] rounded-tl-[12px] border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x overflow-hidden transition-colors duration-300 hover:border-[#D4AF37]/40 ${
          isDarkMode
            ? 'bg-[#121B33] border-[#2A3858] divide-[#2A3858]'
            : 'bg-white border-slate-200 divide-slate-200'
        }`}
      >
        {/* Cell 1: Today's Revenue */}
        <div className="p-5">
          <span className={`text-xs font-medium block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {kpiLabels.todayRev}
          </span>
          <span className={`text-2xl font-bold mt-1 block truncate tabular-nums tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <AnimatedCounter value={todayRevenueNumber} prefix="₹ " />
          </span>
          <span className={`text-xs mt-1 block ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <AnimatedCounter value={todayBills.length} suffix={isStylist ? " chair bills today" : " bills today"} />
          </span>
        </div>

        {/* Cell 2: Today's Appointments */}
        <div className="p-5">
          <span className={`text-xs font-medium block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {kpiLabels.todayAppt}
          </span>
          <span className={`text-2xl font-bold mt-1 block tabular-nums tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <AnimatedCounter value={todayAppointments.length} />
          </span>
          <span className={`text-xs mt-1 block ${isDarkMode ? 'text-[#D4AF37]' : 'text-amber-800'}`}>
            <AnimatedCounter value={confirmedAppointments.length} suffix=" confirmed schedule" />
          </span>
        </div>

        {/* Cell 3: Today's Invoices */}
        <div className="p-5">
          <span className={`text-xs font-medium block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {kpiLabels.todayBills}
          </span>
          <span className={`text-2xl font-bold mt-1 block tabular-nums tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <AnimatedCounter value={todayBills.length} />
          </span>
          <span className={`text-xs mt-1 block ${isDarkMode ? 'text-sky-400' : 'text-sky-700'}`}>
            <AnimatedCounter
              value={todayBills.length ? Math.round(todayRevenueNumber / todayBills.length) : 0}
              prefix="Avg ₹ "
              suffix=" per bill"
            />
          </span>
        </div>

        {/* Cell 4: Pending Dues */}
        <div className="p-5">
          <span className={`text-xs font-medium block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {kpiLabels.pendingDues}
          </span>
          <span className={`text-2xl font-bold mt-1 block truncate tabular-nums tracking-tight ${
            totalPendingDues > 0
              ? (isDarkMode ? 'text-amber-400' : 'text-amber-700')
              : (isDarkMode ? 'text-emerald-400' : 'text-emerald-700')
          }`}>
            <AnimatedCounter value={totalPendingDues} prefix="₹ " />
          </span>
          <span className={`text-xs mt-1 block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {totalPendingDues > 0 ? 'Collect on next visit' : 'All clear · Zero dues'}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. BOOK AGAIN (Instant 1-Click Repeat Client Rebooking) */}
      {/* ========================================================= */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
          isDarkMode
            ? 'bg-[#121B33] border-[#2A3858]'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{kpiLabels.bookAgain}</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {kpiLabels.bookAgainDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentScreen('customers')}
            className={`text-xs hover:underline font-bold flex items-center gap-1 group cursor-pointer ${
              isDarkMode ? 'text-[#D4AF37]' : 'text-amber-800'
            }`}
          >
            <span>All Clients</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>

        {recentBookAgainList.length === 0 ? (
          <div
            className={`p-6 rounded-xl border text-center ${
              isDarkMode ? 'bg-[#0B172E] border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <p className="text-xs">
              No repeat clients yet. As clients visit and appointments are completed, they will automatically appear here for instant 1-click rebooking.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentBookAgainList.map((client, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 ${
                  isDarkMode
                    ? 'bg-[#0B172E] border-white/5 hover:border-[#D4AF37]/30'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 ${
                      isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-[#D4AF37]' : 'bg-white border-slate-200 text-[#0B1F44]'
                    }`}>
                      {client.cust.slice(0, 1)}
                    </div>
                    <div>
                      <strong className={`text-xs block font-bold truncate max-w-[110px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {client.cust}
                      </strong>
                      <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {client.phone ? `+91 ${client.phone}` : 'Walk-in'}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    {client.lastVisit}
                  </span>
                </div>

                <div className={`pt-2.5 border-t flex items-center justify-between text-xs ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                  <div className="overflow-hidden pr-2">
                    <span className={`text-xs font-semibold block truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {client.service}
                    </span>
                    <span className={`text-[11px] block truncate tabular-nums ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      ₹{client.amount} · {client.staff}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenNewBooking}
                    className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-bold transition-colors shrink-0 cursor-pointer active:scale-95"
                  >
                    Book ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. SPLIT 2-COLUMN GRID (Appointments Schedule + Recent Bills) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (7 cols): Today's Appointments Schedule */}
        <div
          className={`lg:col-span-7 p-5 sm:p-6 rounded-2xl border space-y-4 ${
            isDarkMode
              ? 'bg-[#121B33] border-[#2A3858]'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{kpiLabels.todaySchedule}</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Today&apos;s scheduled arrivals and assigned stylists
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentScreen('appointments')}
              className={`text-xs hover:underline font-bold flex items-center gap-1 group cursor-pointer ${
                isDarkMode ? 'text-[#D4AF37]' : 'text-amber-800'
              }`}
            >
              <span>Full Schedule</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>

          <div className="space-y-2">
            {effectiveAppointments.length === 0 ? (
              <div className={`py-8 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isStylist ? 'No appointments scheduled for your chair.' : 'No appointments scheduled today.'}
              </div>
            ) : (
              effectiveAppointments.slice(0, 5).map((appt) => (
                <div
                  key={appt.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDarkMode
                      ? 'bg-[#0B172E] border-white/5 hover:border-[#D4AF37]/30'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 ${
                        isDarkMode
                          ? 'bg-[#121B33] border-[#2A3858] text-[#D4AF37]'
                          : 'bg-white border-slate-200 text-[#0B1F44]'
                      }`}
                    >
                      {appt.cust.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {appt.cust}
                        </strong>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
                          isDarkMode ? 'bg-white/5 border-white/10 text-[#D4AF37]' : 'bg-white border-slate-200 text-[#0B1F44]'
                        }`}>
                          {appt.startsAt}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {appt.service} · Stylist: <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{appt.staff}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      ₹{appt.amount}
                    </span>
                    <button
                      type="button"
                      onClick={() => markArrivedAndBill(appt)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'bg-white/5 hover:bg-[#D4AF37] hover:text-[#0B1F44] border-white/10 text-white'
                          : 'bg-white hover:bg-[#D4AF37] hover:text-[#0B1F44] border-slate-300 text-slate-800'
                      }`}
                      title="Checkout & Bill client"
                    >
                      Bill →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col (5 cols): Recent Bills & Receipts */}
        <div
          className={`lg:col-span-5 p-5 sm:p-6 rounded-2xl border space-y-4 ${
            isDarkMode
              ? 'bg-[#121B33] border-[#2A3858]'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{kpiLabels.recentBills}</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Latest generated receipts & payment status
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentScreen('sales')}
              className={`text-xs hover:underline font-bold flex items-center gap-1 group cursor-pointer ${
                isDarkMode ? 'text-[#D4AF37]' : 'text-amber-800'
              }`}
            >
              <span>Sales & Analytics</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>

          <div className="space-y-2">
            {effectiveBills.length === 0 ? (
              <div
                className={`py-8 text-center text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {isStylist ? 'No invoices generated for your chair yet.' : 'No invoices generated yet.'}
              </div>
            ) : (
              effectiveBills.slice(0, 5).map((bill) => (
                <div
                  key={bill.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDarkMode
                      ? 'bg-[#0B172E] border-white/5 hover:border-[#D4AF37]/30'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {bill.cust}
                      </strong>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        isDarkMode ? 'bg-black/20 border-white/10 text-[#D4AF37]' : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        {bill.id}
                      </span>
                      {bill.isEdited && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          Edited
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {bill.mode} · {bill.dateStr.split(',')[0]}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      ₹{bill.total}
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewInvoice(bill)}
                      className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-bold transition-colors cursor-pointer active:scale-95"
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
