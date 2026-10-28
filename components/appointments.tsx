'use client';

import React, { useState, useMemo } from 'react';
import { useSalon, Appointment, ServiceItem } from '@/components/SalonContext';
import { generateTimeSlotsFromBookingHours } from '@/lib/salon-helpers';

interface SelectedBookingService {
  id: string;
  name: string;
  price: number;
  dur: number;
  qty: number;
}

interface AppointmentsProps {
  onOpenNewBooking?: () => void;
}

export function AppointmentsView({ onOpenNewBooking }: AppointmentsProps) {
  const {
    appointments,
    addAppointment,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment,
    markArrivedAndBill,
    services,
    staff,
    customers,
    shopProfile,
    isDarkMode,
    showToast,
    role,
    loggedInStaffName,
  } = useSalon();

  const isStylist = role === 'stylist';

  // Mode: 'daily' (default, shows selected date schedule) vs 'history'
  const [viewMode, setViewMode] = useState<'daily' | 'history'>('daily');

  // Helper date generators
  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateStr();

  // Selected date for daily view (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Daily Filter state
  const [dailyStatusFilter, setDailyStatusFilter] = useState<'all' | 'Confirmed' | 'In chair' | 'Done'>('all');
  const [chairFilter, setChairFilter] = useState<string>(() => (isStylist && loggedInStaffName ? loggedInStaffName : 'all'));

  // History state: Search and Filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'past' | 'deleted'>('all');

  // Three dots menu & Edit Appointment (Time & Style only)
  const [activeMenuApptId, setActiveMenuApptId] = useState<string | null>(null);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editStartsAt, setEditStartsAt] = useState('');
  const [editService, setEditService] = useState('');

  // Modal State for New Booking
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields for New Booking
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState<SelectedBookingService[]>([]);
  const [bookingDate, setBookingDate] = useState(todayStr);
  // Available Time Slots derived dynamically from salon booking hours
  const timeSlots = useMemo(() => {
    return generateTimeSlotsFromBookingHours(shopProfile?.bookingHours);
  }, [shopProfile?.bookingHours]);

  const [bookingSlot, setBookingSlot] = useState(() => (timeSlots.length > 0 ? timeSlots[0] : '10:00 AM'));
  const [bookingStaff, setBookingStaff] = useState(() => (isStylist && loggedInStaffName ? loggedInStaffName : (staff.length > 0 ? staff[0].name : '')));
  const [specialNotes, setSpecialNotes] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  // Recent clients for 1-click selection derived strictly from real customers database
  const recentClients = customers
    .filter(c => c.status !== 'inactive')
    .map(c => ({ name: c.name, phone: c.phone, preferredService: 'Salon Service' }))
    .filter((item, idx, arr) => arr.findIndex(t => t.phone === item.phone) === idx);

  // Service categories
  const categories = ['All', ...Array.from(new Set(services.map(s => s.cat)))];

  // Handle adding service or incrementing quantity
  const handleAddOrIncrementService = (service: ServiceItem) => {
    setSelectedServices(prev => {
      const existing = prev.find(s => s.id === service.id);
      if (existing) {
        return prev.map(s => (s.id === service.id ? { ...s, qty: s.qty + 1 } : s));
      }
      return [...prev, { id: service.id, name: service.name, price: service.price, dur: service.dur, qty: 1 }];
    });
  };

  const handleDecrementService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev
        .map(s => (s.id === serviceId ? { ...s, qty: s.qty - 1 } : s))
        .filter(s => s.qty > 0)
    );
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const estimatedAmount = selectedServices.reduce((sum, s) => sum + s.price * s.qty, 0);
  const estimatedDuration = selectedServices.reduce((sum, s) => sum + s.dur * s.qty, 0);

  const sendAppointmentReminder = (appt: Appointment) => {
    const cleanPhone = (appt.phone || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Customer does not have a valid 10-digit mobile number.', 'error');
      return;
    }
    const msg = `Hello ${appt.cust}! 👋\n\nThis is a friendly appointment reminder from *${shopProfile.shopName || 'StyleFleet Salon'}* for your *${appt.service}* appointment with stylist *${appt.staff}* scheduled for *${appt.startsAt}*.\n\nWe look forward to welcoming you! Please reply if you need to reschedule.`;
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showToast(`Dispatched WhatsApp reminder to ${appt.cust}!`);
  };

  const handleSelectRecentClient = (client: { name: string; phone: string; preferredService?: string }) => {
    setClientName(client.name);
    setClientPhone(client.phone);
    if (client.preferredService && selectedServices.length === 0) {
      const match = services.find(s => s.name.toLowerCase().includes(client.preferredService!.toLowerCase()));
      if (match) {
        setSelectedServices([{ id: match.id, name: match.name, price: match.price, dur: match.dur, qty: 1 }]);
      }
    }
    showToast(`Loaded details for ${client.name}`, 'success');
  };

  const handleOpenBookingModal = () => {
    setClientName('');
    setClientPhone('');
    setSelectedServices([]);
    setSpecialNotes('');
    setBookingDate(selectedDate);
    setIsModalOpen(true);
    if (onOpenNewBooking) onOpenNewBooking();
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      showToast('Please enter the client name.', 'error');
      return;
    }
    if (selectedServices.length === 0) {
      showToast('Please select at least one service.', 'error');
      return;
    }

    const serviceSummary = selectedServices
      .map(s => (s.qty > 1 ? `${s.name} (x${s.qty})` : s.name))
      .join(', ');

    addAppointment({
      cust: clientName.trim(),
      phone: clientPhone.trim(),
      service: serviceSummary,
      staff: bookingStaff,
      startsAt: bookingSlot,
      date: bookingDate,
      amount: estimatedAmount,
      status: 'Confirmed',
    });

    showToast(`Appointment confirmed for ${clientName} on ${bookingDate} at ${bookingSlot}!`, 'success');
    setIsModalOpen(false);
  };

  // Generate 8 days range for horizontal date line (yesterday, today, next 6 days)
  const generateDateBoxes = () => {
    const list = [];
    const base = new Date();
    base.setDate(base.getDate() - 1); // start from yesterday

    for (let i = 0; i < 8; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const isToday = dateStr === todayStr;
      const isYesterday = i === 0;

      let dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      if (isToday) dayLabel = 'Today';
      else if (isYesterday) dayLabel = 'Yesterday';

      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      // Count appointments for this date (excluding cancelled)
      const count = appointments.filter(a => {
        if (a.date !== dateStr || a.status === 'Cancelled') return false;
        if (isStylist && loggedInStaffName) {
          return a.staff.toLowerCase() === loggedInStaffName.toLowerCase();
        }
        return true;
      }).length;

      list.push({
        dateStr,
        dayLabel,
        dayNumber,
        monthName,
        isToday,
        count,
      });
    }
    return list;
  };

  const dateBoxes = generateDateBoxes();

  // Filtered Appointments for Daily view
  const dailyAppointments = appointments.filter(a => {
    if (a.date !== selectedDate) return false;
    if (a.status === 'Cancelled') return false;
    if (chairFilter !== 'all' && a.staff?.toLowerCase() !== chairFilter.toLowerCase()) return false;
    if (dailyStatusFilter === 'all') return true;
    return a.status === dailyStatusFilter;
  });

  // Filtered Appointments for History view
  const historyAppointments = appointments.filter(a => {
    if (isStylist && loggedInStaffName && a.staff?.toLowerCase() !== loggedInStaffName.toLowerCase()) {
      return false;
    }
    const matchesSearch =
      a.cust.toLowerCase().includes(historySearch.toLowerCase()) ||
      a.phone.includes(historySearch) ||
      a.service.toLowerCase().includes(historySearch.toLowerCase()) ||
      a.staff.toLowerCase().includes(historySearch.toLowerCase());

    if (!matchesSearch) return false;

    if (historyFilter === 'completed') return a.status === 'Done';
    if (historyFilter === 'deleted') return a.status === 'Cancelled';
    if (historyFilter === 'past') return a.date < todayStr || a.status === 'Done';
    return true; // 'all'
  });

  return (
    <section className="space-y-6 animate-fadeIn pb-16">
      {/* ================= TOP ACTION BAR & DATE STRIP ================= */}
      <div
        className={`p-4 md:p-5 rounded-2xl border transition-all shadow-md ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-[#E2E8F0] shadow-sm'
        }`}
      >
        {/* Top Controls: Left info, Right History & Premium New Booking button */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isDarkMode ? 'border-[#2A3858]' : 'border-slate-300'}`}>
          <div>
            <h2 className={`text-base font-extrabold tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
              <span>Appointment Calendar</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-bold">
                October 2026
              </span>
            </h2>
            <p className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A]'}`}>
              Select date to manage schedules, track slots, and launch bookings
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* HISTORY BUTTON (Restricted for stylists: only owners can view historical analytics/appointments) */}
            {!isStylist && (
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'history' ? 'daily' : 'history')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  viewMode === 'history'
                    ? `bg-[#D4AF37] ${isDarkMode ? 'text-[#0B1F44]' : 'text-[#1F2937]'} border-[#D4AF37] shadow-md shadow-amber-400/20`
                    : isDarkMode
                    ? 'bg-[#1A2746] text-[#A7B0C3] border-[#2A3858] hover:text-white'
                    : 'bg-[#FFFFFF] text-[#374151] border-[#E2E8F0] hover:text-black'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{viewMode === 'history' ? 'Today\'s Schedule' : 'History'}</span>
              </button>
            )}

            {/* ULTRA-PREMIUM NEW BOOKING BUTTON (NO PLUS ICON - LUXURY VECTOR ICON) */}
            <button
              type="button"
              onClick={handleOpenBookingModal}
              className={`relative group px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] ${isDarkMode ? 'text-[#0B1F44]' : 'text-[#1F2937]'} text-xs font-black shadow-md active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer`}
            >
              {/* Premium Vector Luxury Scissors & Stars Icon */}
              <svg className="w-4 h-4 text-[#0B1F44] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm9.64-9.64L22 4V3h-3l-5 5 1.64 1.64v.72z" />
              </svg>
              <span>New Booking</span>
            </button>
          </div>
        </div>

        {/* DATE LINE BY LINE (SMALL DATE BOXES HORIZONTAL ROW) */}
        <div className="pt-3">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {dateBoxes.map((box) => {
              const isSelected = selectedDate === box.dateStr && viewMode === 'daily';

              return (
                <button
                  key={box.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(box.dateStr);
                    setViewMode('daily');
                  }}
                  className={`min-w-[80px] sm:min-w-[94px] p-2.5 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1 shrink-0 ${
                    isSelected
                      ? isDarkMode ? 'bg-[#0B1F44] border-[#D4AF37] text-[#F8FAFC] shadow-lg shadow-amber-400/15 scale-[1.03]' : 'bg-[#FEF3C7] border-[#D4AF37] text-[#1F2937] shadow-md scale-[1.03]'
                      : isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-[#A7B0C3] hover:border-[#D4AF37]/50 hover:text-white'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#374151] hover:border-[#D4AF37]'
                  }`}
                >
                  {/* Day label (Today, Yesterday, or Day of week) */}
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${
                    box.isToday ? 'text-[#D4AF37] font-extrabold' : (isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]')
                  }`}>
                    {box.dayLabel}
                  </span>

                  {/* Date number */}
                  <div className="flex items-baseline gap-0.5">
                    <span className={`text-lg sm:text-xl font-black leading-none ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#1F2937]'}`}>
                      {box.dayNumber}
                    </span>
                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#4B5563]'}`}>
                      {box.monthName}
                    </span>
                  </div>

                  {/* Appointments count badge */}
                  <div className="mt-0.5">
                    {box.count > 0 ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 ${
                        isSelected
                          ? `bg-[#D4AF37] ${isDarkMode ? 'text-[#0B1F44]' : 'text-[#1F2937]'}`
                          : isDarkMode ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-[#FEF3C7] text-[#5B2500] border border-[#D4AF37]/40'
                      }`}>
                        <span>{box.count}</span>
                        <span className="text-[9px] font-medium">{box.count === 1 ? 'appt' : 'appts'}</span>
                      </span>
                    ) : (
                      <span className={`text-[10px] font-medium ${isDarkMode ? 'text-[#737D92]' : 'text-[#4B5563]'}`}>
                        0 appts
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: DAILY APPOINTMENTS (DEFAULT) ================= */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          {/* Daily Filter Pills & Summary */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
            isDarkMode ? 'border-[#2A3858]' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#1F2937]'}`}>
                Schedule for {selectedDate === todayStr ? 'Today' : selectedDate}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-[#FEF3C7] text-[#5B2500] border border-[#D4AF37]/30'}`}>
                {dailyAppointments.length} {dailyAppointments.length === 1 ? 'booking' : 'bookings'}
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'all', label: 'All' },
                { key: 'Confirmed', label: 'Confirmed' },
                { key: 'In chair', label: 'In Chair' },
                { key: 'Done', label: 'Completed' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDailyStatusFilter(tab.key as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    dailyStatusFilter === tab.key
                      ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-amber-400/20'
                      : isDarkMode
                      ? 'bg-[#1A2746] text-[#A7B0C3] hover:text-white border border-[#2A3858]'
                      : 'bg-[#FFFFFF] text-[#374151] hover:text-black border border-[#E2E8F0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailyAppointments.length === 0 ? (
              <div
                className={`col-span-full py-16 text-center rounded-2xl border space-y-3 ${
                  isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-[#A7B0C3]' : 'bg-white border-slate-200 text-[#737D92]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>No appointments scheduled for this date</h4>
                <p className={`text-xs font-bold max-w-sm mx-auto ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A]'}`}>
                  Click the gold &ldquo;New Booking&rdquo; button above to schedule an appointment on {selectedDate}.
                </p>
                <button
                  type="button"
                  onClick={handleOpenBookingModal}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0B1F44] font-bold text-xs inline-flex items-center gap-2"
                >
                  <span>Book Appointment Now</span>
                </button>
              </div>
            ) : (
              dailyAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-md flex flex-col justify-between gap-3 ${
                    isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] hover:border-[#D4AF37]/40'
                      : 'bg-white border-[#E2E8F0] hover:border-[#D4AF37]/60 shadow-sm'
                  }`}
                >
                  {/* Top: Client Identity + Time Slot Badge + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl border text-xs font-black flex items-center justify-center shrink-0 ${
                          appt.status === 'In chair'
                            ? isDarkMode ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#FEF3C7] border-[#D4AF37] text-[#5B2500]'
                            : isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#A7B0C3]' : 'bg-[#F7F9FC] border-[#E2E8F0] text-[#374151]'
                        }`}
                      >
                        {appt.cust.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong className={`text-sm font-extrabold block tracking-tight ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#1F2937]'}`}>
                          {appt.cust}
                        </strong>
                        <span className={`text-xs block ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
                          +91 {appt.phone}
                        </span>
                        <p className="text-xs text-[#D4AF37] font-bold mt-1 leading-snug">
                          {appt.service} · <span className={`font-mono font-extrabold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>₹{appt.amount}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1 shrink-0">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-xl block font-mono ${isDarkMode ? 'text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30' : 'text-[#5B2500] bg-[#FEF3C7] border border-[#D4AF37]/40'}`}>
                        {appt.startsAt}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider block text-center ${
                          appt.status === 'In chair'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : appt.status === 'Confirmed'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Stylist details + Action buttons */}
                  <div className={`pt-2 border-t flex items-center justify-between text-xs ${isDarkMode ? 'border-[#2A3858]' : 'border-[#E2E8F0]'}`}>
                    <span className={`text-[11px] ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
                      Stylist: <strong className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-[#1F2937]'}`}>{appt.staff}</strong>
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 1. CONFIRMED STATUS: REMIND & MARK ARRIVED */}
                      {appt.status === 'Confirmed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => sendAppointmentReminder(appt)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Send WhatsApp appointment reminder"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.131-.538-1.839-.765-3.023-2.627-3.114-2.748-.09-.122-.745-.989-.745-1.895 0-.907.472-1.352.641-1.536.17-.184.37-.23.493-.23.123 0 .247.001.355.006.114.005.267-.043.418.32.155.371.531 1.294.577 1.389.047.094.078.204.016.326-.062.123-.093.2-.185.309-.092.109-.194.244-.277.328-.093.094-.19.196-.082.381.108.185.481.794 1.031 1.285.709.632 1.306.828 1.492.92.185.093.293.078.401-.047.108-.124.463-.54.586-.726.123-.185.247-.154.416-.093.17.062 1.079.509 1.264.601.185.093.308.139.354.216.046.078.046.452-.098.857z" />
                            </svg>
                            <span>Remind</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              updateAppointmentStatus(appt.id, 'In chair');
                              showToast(`${appt.cust} marked In Chair!`, 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Mark Arrived</span>
                          </button>
                        </>
                      )}

                      {/* 2. IN CHAIR STATUS: BILL & CLOSE */}
                      {appt.status === 'In chair' && (
                        <button
                          type="button"
                          onClick={() => markArrivedAndBill(appt)}
                          className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black active:scale-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-[#0B1F44]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                          </svg>
                          <span>Bill & Close</span>
                        </button>
                      )}

                      {appt.status === 'Done' && (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/25">
                          Completed
                        </span>
                      )}

                      {/* 3 VERTICAL DOTS MENU: EDIT & DELETE */}
                      <div className="relative">
                        <button
                          type="button"
                          title="Appointment actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuApptId((prev) => (prev === appt.id ? null : appt.id));
                          }}
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                            activeMenuApptId === appt.id
                              ? isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-200 border-slate-300 text-slate-900'
                              : isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#A7B0C3] hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>

                        {activeMenuApptId === appt.id && (
                          <div
                            className={`absolute right-0 mt-1.5 w-36 rounded-xl border shadow-xl p-1 z-30 animate-fadeIn ${
                              isDarkMode ? 'bg-[#1A2746] border-[#2A3858]' : 'bg-white border-[#E2E8F0]'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuApptId(null);
                                setEditingAppt(appt);
                                setEditStartsAt(appt.startsAt);
                                setEditService(appt.service);
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                                isDarkMode ? 'text-slate-200 hover:bg-slate-800 hover:text-[#D4AF37]' : 'text-slate-700 hover:bg-slate-100 hover:text-[#B8863B]'
                              }`}
                            >
                              <svg className="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuApptId(null);
                                if (confirm(`Delete appointment for ${appt.cust}?`)) {
                                  deleteAppointment(appt.id);
                                }
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-rose-500/15 text-left text-xs font-semibold text-rose-400 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: APPOINTMENT HISTORY (HISTORY BUTTON CLICKED) ================= */}
      {viewMode === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          {/* History Search & Filter Bar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
            }`}
          >
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <svg
                className="w-4 h-4 text-[#A7B0C3] absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search history by client, mobile, stylist or service..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:border-[#D4AF37] transition-all ${
      isDarkMode
        ? 'bg-[#121B33] border-[#2A3858] text-[#F8FAFC] placeholder:text-[#737D92]'
        : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#1F2937] placeholder:text-[#4B5563]'
    }`}
              />
            </div>

            {/* Filter Tabs: All, Completed, Past, Deleted */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { key: 'all', label: 'All History' },
                { key: 'completed', label: 'Completed' },
                { key: 'past', label: 'Past' },
                { key: 'deleted', label: 'Deleted / Cancelled' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setHistoryFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    historyFilter === tab.key
                      ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-amber-400/20'
                      : isDarkMode
                      ? 'bg-[#1A2746] text-[#A7B0C3] hover:text-white border border-[#2A3858]'
                      : 'bg-white text-slate-700 hover:text-black border border-slate-200 shadow-2xs'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className="text-xs font-bold text-[#D4AF37] hover:underline shrink-0"
            >
              ← Back to Today
            </button>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {historyAppointments.length === 0 ? (
              <div className={`p-12 rounded-2xl border text-center space-y-2 ${isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-300'}`}>
                <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>No history records found</p>
                <p className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A]'}`}>No appointments match the selected filter or search query.</p>
              </div>
            ) : (
              historyAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className={`p-4 rounded-2xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
      isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-[#E2E8F0] shadow-sm'
    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl border text-xs font-black flex items-center justify-center shrink-0 ${
                        appt.status === 'Done'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : appt.status === 'Cancelled'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                      }`}
                    >
                      {appt.cust.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <strong className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>{appt.cust}</strong>
                        <span className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>+91 {appt.phone}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                            appt.status === 'Done'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : appt.status === 'Cancelled'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-[#374151]'}`}>
                        {appt.service} · Stylist: <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>{appt.staff}</span>
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between md:justify-end gap-4 text-xs pt-2 md:pt-0 border-t md:border-t-0 ${
                    isDarkMode ? 'border-[#2A3858]' : 'border-slate-200'
                  }`}>
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-[#A7B0C3] block">{appt.date} at {appt.startsAt}</span>
                      <strong className="text-[#D4AF37] font-mono text-xs">₹{appt.amount}</strong>
                    </div>

                    {appt.status === 'Cancelled' ? (
                      <button
                        type="button"
                        onClick={() => updateAppointmentStatus(appt.id, 'Confirmed')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setClientName(appt.cust);
                          setClientPhone(appt.phone);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold transition-all"
                      >
                        Re-book
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ================= UNIQUE & ANIMATED NEW BOOKING MODAL =================== */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 sm:p-7 rounded-3xl border max-w-xl w-full space-y-5 shadow-2xl transition-all animate-scaleUp max-h-[92vh] overflow-y-auto ${
              isDarkMode
                ? 'bg-[#1A2746] border-[#2A3858] text-white'
                : 'bg-white border-slate-200 text-[#1F2937]'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b pb-4 ${isDarkMode ? 'border-[#2A3858]' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] text-[#0B1F44] flex items-center justify-center font-black shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-base font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    New Salon Appointment
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                    Schedule client services with live estimate & slot booking
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors text-xs font-bold cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-[#A7B0C3] hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick 1-Click Select Recent Clients */}
            <div className="space-y-1.5">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Select Recent Client (1-Click)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {recentClients.slice(0, 6).map((rc) => (
                  <button
                    key={rc.phone}
                    type="button"
                    onClick={() => handleSelectRecentClient(rc)}
                    className={`px-2.5 py-1.5 rounded-xl border text-left shrink-0 transition-all group cursor-pointer ${
                      isDarkMode
                        ? 'border-[#2A3858] bg-[#121B33] hover:border-[#D4AF37]'
                        : 'border-slate-200 bg-slate-50 hover:border-[#D4AF37] hover:bg-amber-50/50'
                    }`}
                  >
                    <span className={`text-xs font-bold block group-hover:text-[#D4AF37] transition-colors ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {rc.name}
                    </span>
                    <span className={`text-[10px] ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                      +91 {rc.phone.slice(-4)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Row 1: Client Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-[#F8FAFC] placeholder:text-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    } focus:border-[#D4AF37]`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Mobile Number (WhatsApp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D4AF37]">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))}
                      className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all font-mono ${
                        isDarkMode
                          ? 'bg-[#121B33] border-[#2A3858] text-[#F8FAFC] placeholder:text-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      } focus:border-[#D4AF37]`}
                    />
                  </div>
                </div>
              </div>

              {/* Service Selection with Multi-Quantity Support (+/-) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Services (Multi-Select & Multipliers) *
                  </label>
                  <span className="text-[11px] text-[#D4AF37] font-bold">
                    {selectedServices.length} selected
                  </span>
                </div>

                {/* Categories filter */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCat(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedCat === cat
                          ? 'bg-[#D4AF37] text-[#0B1F44] font-black shadow-sm'
                          : isDarkMode
                          ? 'bg-[#121B33] border border-[#2A3858] text-[#A7B0C3] hover:text-white'
                          : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Available Services List */}
                <div className={`max-h-40 overflow-y-auto space-y-1.5 pr-1 border rounded-xl p-2 ${
                  isDarkMode ? 'border-[#2A3858] bg-[#121B33]' : 'border-slate-200 bg-slate-50'
                }`}>
                  {services
                    .filter((s) => s.active && (selectedCat === 'All' || s.cat === selectedCat))
                    .map((service) => {
                      const selected = selectedServices.find((s) => s.id === service.id);
                      return (
                        <div
                          key={service.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors border ${
                            isDarkMode
                              ? 'bg-[#1A2746] border-[#2A3858] hover:border-[#D4AF37]/40'
                              : 'bg-white border-slate-200 hover:border-[#D4AF37] shadow-2xs'
                          }`}
                        >
                          <div>
                            <strong className={`block font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{service.name}</strong>
                            <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                              ₹{service.price} · {service.dur} mins
                            </span>
                          </div>

                          {selected ? (
                            <div className={`flex items-center gap-1.5 border rounded-lg p-0.5 ${isDarkMode ? 'bg-[#121B33] border-[#D4AF37]/40' : 'bg-[#FEF3C7] border-[#D4AF37]'}`}>
                              <button
                                type="button"
                                onClick={() => handleDecrementService(service.id)}
                                className={`w-6 h-6 rounded font-bold flex items-center justify-center text-xs cursor-pointer ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800'}`}
                              >
                                -
                              </button>
                              <span className={`w-5 text-center font-extrabold text-xs ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#5B2500]'}`}>
                                {selected.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddOrIncrementService(service)}
                                className="w-6 h-6 rounded bg-[#D4AF37] hover:bg-amber-300 text-[#0B1F44] font-black flex items-center justify-center text-xs cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddOrIncrementService(service)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                                isDarkMode
                                  ? 'bg-[#121B33] hover:bg-[#D4AF37] hover:text-[#0B1F44] text-slate-300 border border-[#2A3858]'
                                  : 'bg-white hover:bg-[#D4AF37] hover:text-[#0B1F44] text-slate-800 border border-slate-300 shadow-2xs'
                              }`}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Selected Services Summary Pill Bar */}
              {selectedServices.length > 0 && (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${isDarkMode ? 'bg-[#D4AF37]/10 border-[#D4AF37]/25' : 'bg-[#FFFDF5] border-[#D4AF37]'}`}>
                  <div>
                    <span className={`text-[10px] block uppercase font-black ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>Estimated Summary:</span>
                    <strong className={`font-black ${isDarkMode ? 'text-amber-300' : 'text-[#8C6239]'}`}>
                      {selectedServices.map(s => `${s.name} (x${s.qty})`).join(', ')}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] block font-black ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>Total:</span>
                    <strong className={`text-base font-black font-mono ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#8C6239]'}`}>
                      ₹{estimatedAmount}
                    </strong>
                  </div>
                </div>
              )}

              {/* Row 2: Date & Stylist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Booking Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-[#F8FAFC]'
                        : 'bg-white border-slate-300 text-slate-900'
                    } focus:border-[#D4AF37]`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Assign Stylist
                  </label>
                  <select
                    value={bookingStaff}
                    onChange={(e) => setBookingStaff(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border outline-none cursor-pointer ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-[#F8FAFC]'
                        : 'bg-white border-slate-300 text-slate-900'
                    } focus:border-[#D4AF37]`}
                  >
                    {staff.map(st => (
                      <option key={st.id} value={st.name} className={isDarkMode ? 'bg-[#121B33] text-white' : 'bg-white text-slate-900'}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Time Slot Selector (Interactive Chips + Select) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Select Time Slot ({timeSlots.length} slots available)
                  </label>
                  <span className={`text-[11px] font-bold font-mono ${isDarkMode ? 'text-[#D4AF37]' : 'text-amber-800'}`}>
                    Selected: {bookingSlot}
                  </span>
                </div>
                <div className={`flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 rounded-xl border ${
                  isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-slate-50 border-slate-200'
                }`}>
                  {timeSlots.map((slot) => {
                    const isSelected = bookingSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookingSlot(slot)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/30 ring-2 ring-[#D4AF37]/60 font-black scale-102'
                            : isDarkMode
                            ? 'bg-[#1A2746] hover:bg-[#22355e] text-slate-300 hover:text-white border border-[#2A3858]'
                            : 'bg-white hover:bg-slate-100 text-slate-800 hover:text-black border border-slate-300 shadow-2xs'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                  Client Preference / Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Skin fade cut, sensitive scalp, likes warm black tea..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-[#F8FAFC] placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  } focus:border-[#D4AF37]`}
                />
              </div>

              {/* Modal Action Buttons */}
              <div className={`flex gap-2.5 pt-3 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'border-[#2A3858] text-slate-300 hover:text-white hover:bg-white/5'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  Confirm Booking (₹{estimatedAmount})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT APPOINTMENT (TIME & STYLE ONLY) ================= */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 sm:p-7 rounded-3xl border max-w-md w-full space-y-5 shadow-2xl transition-all animate-scaleUp ${
              isDarkMode
                ? 'bg-[#1A2746] border-[#2A3858] text-white'
                : 'bg-white border-slate-200 text-[#1F2937]'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-3 ${isDarkMode ? 'border-[#2A3858]' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-black">
                  <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Edit Appointment
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                    Update time slot & styling service for {editingAppt.cust}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingAppt(null)}
                className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Read-Only Client Summary */}
            <div className={`p-3 rounded-2xl border text-xs grid grid-cols-2 gap-2 ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Client</span>
                <strong className={`font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{editingAppt.cust}</strong>
                <span className="block text-[11px] text-slate-400">+91 {editingAppt.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Stylist</span>
                <strong className={`font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{editingAppt.staff}</strong>
                <span className="block text-[11px] text-slate-400">{editingAppt.date}</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editStartsAt.trim()) {
                  showToast('Please select an appointment time.', 'error');
                  return;
                }
                if (!editService.trim()) {
                  showToast('Please specify the styling service.', 'error');
                  return;
                }
                updateAppointment(editingAppt.id, {
                  startsAt: editStartsAt.trim(),
                  service: editService.trim(),
                });
                setEditingAppt(null);
              }}
              className="space-y-4"
            >
              {/* Field 1: Time Slot (Editable) */}
              <div>
                <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                  Appointment Time (Editable)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={editStartsAt}
                  onChange={(e) => setEditStartsAt(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                    isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-[#F8FAFC]'
                      : 'bg-white border-slate-300 text-slate-900'
                  } focus:border-[#D4AF37]`}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['09:30 AM', '10:30 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditStartsAt(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                        editStartsAt === t
                          ? 'bg-[#D4AF37] text-[#0B1F44] border-[#D4AF37]'
                          : isDarkMode
                          ? 'bg-[#121B33] border-[#2A3858] text-slate-300 hover:text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Style / Service (Editable) */}
              <div>
                <label className={`block text-[11px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                  Styling Service (Editable)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Haircut & Beard Trim"
                  value={editService}
                  onChange={(e) => setEditService(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border outline-none mb-2 ${
                    isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-[#F8FAFC]'
                      : 'bg-white border-slate-300 text-slate-900'
                  } focus:border-[#D4AF37]`}
                />
                {services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {services.slice(0, 8).map((srv) => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setEditService(srv.name)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          editService === srv.name
                            ? 'bg-[#D4AF37] text-[#0B1F44] border-[#D4AF37]'
                            : isDarkMode
                            ? 'bg-[#121B33] border-[#2A3858] text-slate-300 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {srv.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={`flex gap-2.5 pt-3 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setEditingAppt(null)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'border-[#2A3858] text-slate-300 hover:text-white hover:bg-white/5'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  Save Time & Style
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
