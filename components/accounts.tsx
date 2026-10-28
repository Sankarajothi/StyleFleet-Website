'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSalon, Expense } from '@/components/SalonContext';
import { AnimatedCounter } from '@/components/animated-counter';

interface AccountsViewProps {
  onOpenAddExpense?: () => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

export const AccountsView: React.FC<AccountsViewProps> = () => {
  const { isDarkMode, expenses, addExpense, updateExpense, deleteExpense, bills, staff, showToast, role, hasPermission, shopProfile } = useSalon();
  const canViewPastExpenses = role === 'owner' || hasPermission('past_expenses');

  // Time filter state
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('today');
  
  // Registration Date from shopProfile or earliest transaction
  const regDateStr = useMemo(() => {
    if (shopProfile?.createdAt) {
      const d = new Date(shopProfile.createdAt);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  }, [shopProfile?.createdAt]);

  // Custom date range state
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customStart, setCustomStart] = useState<string>(todayIso);
  const [customEnd, setCustomEnd] = useState<string>(todayIso);

  // Swipeable banner container ref
  const bannerScrollRef = useRef<HTMLDivElement>(null);

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Form Fields
  const [cat, setCat] = useState('Products & stock');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [pm, setPm] = useState('UPI');
  const [linkedStaff, setLinkedStaff] = useState<string>('');
  const [inProfit, setInProfit] = useState(true);
  const [expenseDate, setExpenseDate] = useState(todayIso);

  // Vertical 3-dots action menu open tracker (expense id)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close 3-dots menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.expense-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter calculation helpers
  const filterDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (!canViewPastExpenses || selectedPeriod === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }

    if (selectedPeriod === 'week') {
      const start = new Date();
      start.setDate(start.getDate() - 6); // 7 days total
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }

    if (selectedPeriod === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }

    if (selectedPeriod === 'year') {
      const start = new Date(today.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }

    // Custom
    const start = customStart ? new Date(customStart) : new Date(todayIso);
    start.setHours(0, 0, 0, 0);
    const end = customEnd ? new Date(customEnd) : new Date(todayIso);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [selectedPeriod, customStart, customEnd, todayIso]);

  // Parse a bill's date to timestamp
  const isBillInFilter = (billDateStr: string, isTodayFlag?: boolean) => {
    if (selectedPeriod === 'today' && isTodayFlag) return true;
    if (!billDateStr) return false;
    const billDate = new Date(billDateStr);
    if (isNaN(billDate.getTime())) return isTodayFlag && selectedPeriod === 'today';
    return billDate >= filterDateRange.start && billDate <= filterDateRange.end;
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (!exp.date) return selectedPeriod === 'today';
      const d = new Date(exp.date);
      if (isNaN(d.getTime())) return selectedPeriod === 'today';
      // Set to midday to avoid timezone edge issues
      d.setHours(12, 0, 0, 0);
      return d >= filterDateRange.start && d <= filterDateRange.end;
    });
  }, [expenses, filterDateRange, selectedPeriod]);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => !b.isDeleted && isBillInFilter(b.dateStr, b.isToday));
  }, [bills, filterDateRange, selectedPeriod]);

  // Dynamic KPI Metrics (Mobile-parity with StyleFleet Android)
  const totalInflow = filteredBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
  const grossSales = filteredBills.reduce((acc, b) => acc + (b.total || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, b) => acc + (b.amount || 0), 0);
  
  // Only deduct expenses where countInProfit !== false
  const operatingExpenses = filteredExpenses
    .filter((e) => e.inProfit !== false)
    .reduce((acc, b) => acc + (b.amount || 0), 0);
  
  const nonOperatingExpenses = totalExpenses - operatingExpenses;
  const netProfit = totalInflow - operatingExpenses;
  const marginPct = totalInflow > 0 ? Math.round((netProfit / totalInflow) * 100) : 0;
  const totalPendingDues = filteredBills.reduce((acc, b) => acc + (b.dueAmount || 0), 0);

  // Export Financial Ledger as CSV
  const handleExportCSV = () => {
    const csvRows: string[] = [];
    csvRows.push('STYLEFLEET SALON OS - ACCOUNTS & FINANCIAL LEDGER');
    csvRows.push(`Period: ${selectedPeriod.toUpperCase()}, Generated At: ${new Date().toLocaleString()}`);
    csvRows.push('');
    csvRows.push('PROFIT & LOSS SUMMARY');
    csvRows.push(`Gross Sales (INR),${grossSales}`);
    csvRows.push(`Total Inflow / Collected (INR),${totalInflow}`);
    csvRows.push(`Total Operating Expenses (INR),${operatingExpenses}`);
    csvRows.push(`Non-Operating Drawings (INR),${nonOperatingExpenses}`);
    csvRows.push(`Net Profit (INR),${netProfit}`);
    csvRows.push(`Net Profit Margin (%),${marginPct}%`);
    csvRows.push(`Pending Customer Dues (INR),${totalPendingDues}`);
    csvRows.push('');
    csvRows.push('EXPENSES BREAKDOWN');
    csvRows.push('Date,Category,Note,Payment Method,Amount (INR),Count In Profit,Linked Stylist');
    filteredExpenses.forEach((exp) => {
      csvRows.push(
        `"${exp.date || todayIso}","${exp.cat}","${(exp.note || '').replace(/"/g, '""')}","${exp.pm}",${exp.amount},"${exp.inProfit !== false ? 'Yes' : 'No (Drawing)'}","${exp.staff || 'Salon General'}"`
      );
    });
    csvRows.push('');
    csvRows.push('BILLING INFLOW LEDGER');
    csvRows.push('Invoice ID,Client,Phone,Payment Mode,Status,Total (INR),Paid (INR),Due (INR)');
    filteredBills.forEach((b) => {
      csvRows.push(
        `"${b.id}","${b.cust}","${b.phone}","${b.mode}","${b.status}",${b.total},${b.paidAmount},${b.dueAmount}`
      );
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stylefleet_accounts_${selectedPeriod}_${todayIso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Financial ledger (.csv) exported successfully!');
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingExpenseId(null);
    setCat('Products & stock');
    setAmount('');
    setNote('');
    setPm('UPI');
    setLinkedStaff('');
    setInProfit(true);
    setExpenseDate(todayIso);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (exp: Expense) => {
    setActiveMenuId(null);
    setEditingExpenseId(exp.id);
    setCat(exp.cat || 'Products & stock');
    setAmount(String(exp.amount || ''));
    setNote(exp.note || '');
    setPm(exp.pm || 'UPI');
    setLinkedStaff(exp.staff || '');
    setInProfit(exp.inProfit !== undefined ? exp.inProfit : true);
    setExpenseDate(exp.date || todayIso);
    setIsModalOpen(true);
  };

  // Submit Modal Form (Create or Update)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('Please enter a valid expense amount.', 'error');
      return;
    }

    if (editingExpenseId) {
      updateExpense(editingExpenseId, {
        cat,
        amount: numAmount,
        note: note.trim(),
        pm,
        staff: linkedStaff || null,
        inProfit,
        date: expenseDate || todayIso,
      });
      showToast(`Expense updated successfully.`);
    } else {
      addExpense({
        cat,
        amount: numAmount,
        note: note.trim(),
        pm,
        staff: linkedStaff || null,
        inProfit,
        date: expenseDate || todayIso,
      });
    }

    setIsModalOpen(false);
    setEditingExpenseId(null);
  };

  const periodOptions: { id: PeriodFilter; label: string; badge: string }[] = [
    { id: 'today', label: 'Today', badge: 'Day' },
    { id: 'week', label: 'Week', badge: '7 Days' },
    { id: 'month', label: 'Month', badge: '30 Days' },
    { id: 'year', label: 'Year', badge: '365 Days' },
    { id: 'custom', label: 'Custom Range', badge: 'Calendar' },
  ];

  const categoryOptions = [
    'Products & stock',
    'Maintenance',
    'Staff salaries',
    'Electricity & utility',
    'Rent',
    'Marketing & maintenance',
    'Other',
  ];

  return (
    <section className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-md ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-black shadow-inner shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
              Expenses & Dues Ledger
            </h2>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#475569]'}`}>
              Track salon payouts, stock replenishment, staff links, and live net profit calculation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {/* Export PDF Icon Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            className={`w-9 h-9 rounded-2xl border text-xs font-black active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs ${
              isDarkMode
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
            }`}
            title="Export PDF Ledger"
            aria-label="Export PDF Ledger"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Export Excel Icon Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className={`w-9 h-9 rounded-2xl border text-xs font-black active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs ${
              isDarkMode
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
            }`}
            title="Export Excel Ledger"
            aria-label="Export Excel Ledger"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black shadow-lg shadow-[#D4AF37]/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#0B1F44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Horizontal Swipeable Filter Banner */}
      <div
        className={`p-3 sm:p-4 rounded-3xl border transition-all ${
          isDarkMode ? 'bg-[#0F1C36] border-[#2A3858]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-1 mb-2.5">
          <span className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'text-[#D4AF37]' : 'text-[#B8863B]'}`}>
            Select Financial Period
          </span>
          <span className={`text-[10px] hidden sm:inline ${isDarkMode ? 'text-[#737D92]' : 'text-slate-400'}`}>
            Swipe or click to toggle period
          </span>
        </div>

        {/* Swipeable Pills Container */}
        <div
          ref={bannerScrollRef}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {periodOptions.map((tab) => {
            const isActive = selectedPeriod === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedPeriod(tab.id)}
                style={{ scrollSnapAlign: 'start' }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/30 scale-[1.02]'
                    : isDarkMode
                    ? 'bg-[#142347] text-[#A7B0C3] hover:text-white border border-[#2A3858] hover:border-[#D4AF37]/40'
                    : 'bg-slate-100 text-[#334155] hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                    isActive
                      ? 'bg-[#0B1F44]/20 text-[#0B1F44]'
                      : isDarkMode
                      ? 'bg-white/10 text-[#D4AF37]'
                      : 'bg-white text-slate-700 shadow-xs'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Picker (shown when custom is selected) */}
        {selectedPeriod === 'custom' && (
          <div
            className={`mt-3.5 p-4 rounded-2xl border flex flex-wrap items-center gap-4 animate-fadeIn ${
              isDarkMode ? 'bg-[#0B172E] border-[#2A3858]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <label className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                From:
              </label>
              <input
                type="date"
                min={regDateStr}
                max={todayIso}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                  isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                To:
              </label>
              <input
                type="date"
                min={customStart || regDateStr}
                max={todayIso}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                  isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>
            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
              Filtered date span: {customStart} → {customEnd}
            </span>
          </div>
        )}
      </div>

      {/* 3. Dynamic Period KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow & Gross Sales */}
        <div
          className={`p-5 rounded-[28px] rounded-tl-[12px] border shadow-sm transition-all duration-300 hover:border-emerald-500/60 ${
            isDarkMode ? 'bg-[#121B33] border-emerald-500/30' : 'bg-white border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Total Inflow
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <strong className="text-2xl text-emerald-400 mt-2 block font-black tabular-nums">
            <AnimatedCounter value={totalInflow} prefix="₹ " />
          </strong>
          <span className={`text-[11px] font-medium mt-1 block ${isDarkMode ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
            Gross billed: ₹{grossSales.toLocaleString('en-IN')} ({filteredBills.length} invoices)
          </span>
        </div>

        {/* Total Expenses */}
        <div
          className={`p-5 rounded-[28px] rounded-tr-[12px] border shadow-sm transition-all duration-300 hover:border-red-500/60 ${
            isDarkMode ? 'bg-[#121B33] border-red-500/30' : 'bg-white border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Total Expenses
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <strong className="text-2xl text-red-400 mt-2 block font-black tabular-nums">
            <AnimatedCounter value={totalExpenses} prefix="₹ " />
          </strong>
          <span className={`text-[11px] font-medium mt-1 block ${isDarkMode ? 'text-red-400/80' : 'text-red-700'}`}>
            {filteredExpenses.length} expense entries recorded
          </span>
        </div>

        {/* Estimated Net Profit & Margin % */}
        <div
          className={`p-5 rounded-[28px] rounded-bl-[12px] border shadow-sm transition-all duration-300 hover:border-[#D4AF37] ${
            isDarkMode
              ? 'bg-[#121B33] border-[#D4AF37]/50'
              : 'bg-[#FFFDF5] border-[#D4AF37]/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#D4AF37] font-bold uppercase tracking-wider">
              Net Profit (P&L)
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
              {marginPct}% Margin
            </span>
          </div>
          <strong className={`text-2xl mt-2 block font-black tabular-nums ${netProfit >= 0 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
            <AnimatedCounter value={netProfit} prefix="₹ " />
          </strong>
          <span className={`text-[11px] font-medium mt-1 block ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
            {nonOperatingExpenses > 0
              ? `₹${nonOperatingExpenses} drawings excluded from profit`
              : 'Gross inflow minus operating payouts'}
          </span>
        </div>

        {/* Pending Customer Dues */}
        <div
          className={`p-5 rounded-[28px] rounded-br-[12px] border shadow-sm transition-all duration-300 hover:border-amber-500/60 ${
            isDarkMode ? 'bg-[#121B33] border-amber-500/30' : 'bg-white border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Pending Dues
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
          <strong className="text-2xl text-amber-400 mt-2 block font-black tabular-nums">
            <AnimatedCounter value={totalPendingDues} prefix="₹ " />
          </strong>
          <span className={`text-[11px] font-medium mt-1 block ${isDarkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
            Receivables in this period
          </span>
        </div>
      </div>

      {/* 4. Recorded Expenses Ledger Table / Cards */}
      <div
        className={`p-6 rounded-3xl border space-y-4 shadow-lg transition-all ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div>
            <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider">
              Recorded Operational Expenses ({filteredExpenses.length})
            </h3>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
              Filtered by: {periodOptions.find((p) => p.id === selectedPeriod)?.label}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className={`text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer`}
          >
            + Add New Entry
          </button>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              No expenses recorded for this period
            </p>
            <p className={`text-xs max-w-sm mx-auto ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
              Click &quot;Add Expense&quot; above to log stock replenishment, salon rent, staff salaries, electricity, or maintenance.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0B1F44] text-xs font-bold hover:brightness-105 transition-all cursor-pointer"
            >
              + Record Expense Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isDarkMode
                    ? 'bg-[#0B1F44] border-white/5 hover:border-[#2A3858]'
                    : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left Side Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                      {exp.cat}
                    </span>
                    {exp.staff && (
                      <span className="text-[11px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-lg border border-sky-400/20 flex items-center gap-1">
                        <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{exp.staff}</span>
                      </span>
                    )}
                    {exp.inProfit === false && (
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-lg border border-sky-400/20">
                        Excluded from Profit
                      </span>
                    )}
                    <span className={`text-[11px] font-medium flex items-center gap-1 ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{exp.date || todayIso}</span>
                    </span>
                  </div>

                  {exp.note && (
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-slate-700'}`}>
                      {exp.note}
                    </p>
                  )}

                  <span className={`text-[11px] font-medium block ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                    Payment Mode: <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{exp.pm}</strong>
                  </span>
                </div>

                {/* Right Side: Amount and Vertical 3-Dots Action Menu */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="text-right">
                    <strong className="text-base sm:text-lg text-red-400 font-black block">
                      ₹ {exp.amount.toLocaleString()}
                    </strong>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                      {exp.inProfit === false ? 'Drawing / Non-profit' : 'Deducted from Profit'}
                    </span>
                  </div>

                  {/* Vertical 3-dots Menu Container */}
                  <div className="relative expense-menu-container">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === exp.id ? null : exp.id);
                      }}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'bg-[#121B33] border-[#2A3858] text-[#A7B0C3] hover:text-white hover:border-[#D4AF37]'
                          : 'bg-white border-slate-300 text-slate-700 hover:text-black hover:border-slate-400 shadow-xs'
                      }`}
                      title="More options"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>

                    {/* Popover Dropdown Menu */}
                    {activeMenuId === exp.id && (
                      <div
                        className={`absolute right-0 top-10 w-36 rounded-2xl border shadow-2xl py-1.5 z-30 animate-fadeIn ${
                          isDarkMode ? 'bg-[#0F1C36] border-[#2A3858] text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                            isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-900'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            deleteExpense(exp.id);
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer text-red-400 hover:bg-red-500/10`}
                        >
                          <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Add / Edit Expense Full Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-md w-full space-y-4 shadow-2xl relative ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            {/* Top Close Button */}
            <div className={`flex items-center justify-between pb-2 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                {editingExpenseId ? 'Edit Expense Entry' : 'Add New Operational Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-[#A7B0C3] hover:text-white'
                    : 'border-slate-300 bg-slate-100 text-slate-700 hover:text-black'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5">
              {/* Category Dropdown */}
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'} mb-1 uppercase tracking-wider`}>
                  Expense Category *
                </label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-bold outline-none cursor-pointer transition-colors ${
                    isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  } focus:border-[#D4AF37]`}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} className={isDarkMode ? 'bg-[#0B1E3B]' : 'bg-white'}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'} mb-1 uppercase tracking-wider`}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-black outline-none transition-colors ${
                      isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:border-[#D4AF37]`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'} mb-1 uppercase tracking-wider`}>
                    Date *
                  </label>
                  <input
                    type="date"
                    max={todayIso}
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-colors ${
                      isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    } focus:border-[#D4AF37]`}
                  />
                </div>
              </div>

              {/* Note / Client Preference Notes */}
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'} mb-1 uppercase tracking-wider`}>
                  Client Preference Notes / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. L'Oreal Serum stock purchase, Chair hydraulic repair"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-medium outline-none transition-colors ${
                    isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  } focus:border-[#D4AF37]`}
                />
              </div>

              {/* Payment Mode (UPI, Cash, Card) */}
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'} mb-1.5 uppercase tracking-wider`}>
                  Payment Mode *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Cash', 'Card'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPm(mode)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        pm === mode
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0B1F44] shadow-md font-black'
                          : isDarkMode
                          ? 'bg-[#121B33] border-[#2A3858] text-[#A7B0C3] hover:text-white'
                          : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Stylists in Team to Link Expenses */}
              <div>
                <label className={`block text-[11px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'} mb-1 uppercase tracking-wider`}>
                  Link to Stylist in Team (Optional)
                </label>
                <select
                  value={linkedStaff}
                  onChange={(e) => setLinkedStaff(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-semibold outline-none cursor-pointer transition-colors ${
                    isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  } focus:border-[#D4AF37]`}
                >
                  <option value="" className={isDarkMode ? 'bg-[#0B1E3B]' : 'bg-white'}>
                    -- None (General Salon Overhead) --
                  </option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.name} className={isDarkMode ? 'bg-[#0B1E3B]' : 'bg-white'}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Count in Profit Toggle Switch */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-[#0F1C36] border-[#2A3858]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Count in Profit Calculation
                  </span>
                  <span className={`text-[10px] block mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                    {inProfit
                      ? 'Deducts from Estimated Net Profit (Operating Expense)'
                      : 'Excluded from Net Profit (Personal Drawing / Non-operating)'}
                  </span>
                </div>

                {/* Animated Switch Button */}
                <button
                  type="button"
                  onClick={() => setInProfit(!inProfit)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    inProfit ? 'bg-[#D4AF37]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      inProfit ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className={`flex gap-3 pt-3 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode
                      ? 'border-white/10 text-[#A7B0C3] hover:text-white hover:bg-white/5'
                      : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black shadow-lg shadow-[#D4AF37]/25 active:scale-95 transition-all cursor-pointer"
                >
                  {editingExpenseId ? 'Save Changes' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};