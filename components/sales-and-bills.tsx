'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSalon, Bill } from '@/components/SalonContext';
import { AnimatedCounter } from '@/components/animated-counter';

interface SalesAndBillsProps {
  onViewInvoice: (bill: Bill) => void;
}

type MainTab = 'report' | 'summary' | 'invoices';
type PeriodFilter = 'today' | 'week' | 'month' | 'custom';

export function SalesAndBillsView({ onViewInvoice }: SalesAndBillsProps) {
  const {
    role,
    loggedInStaffName,
    bills,
    expenses,
    staff,
    services,
    deleteBill,
    editBill,
    shopProfile,
    setCurrentScreen,
    isDarkMode,
    showToast,
  } = useSalon();

  const isStylist = role === 'stylist';

  // Effective Bills: Stylists strictly see today's invoices for their chair; Owners see all salon invoices
  const effectiveBills = useMemo(() => {
    if (isStylist) {
      const nameLower = (loggedInStaffName || '').toLowerCase();
      return bills.filter(
        (b) =>
          !b.isDeleted &&
          b.isToday &&
          (!nameLower ||
            b.staff?.toLowerCase() === nameLower ||
            b.items?.some((i) => i.staff?.toLowerCase() === nameLower) ||
            b.notes?.toLowerCase().includes(nameLower))
      );
    }
    return bills.filter((b) => !b.isDeleted);
  }, [bills, isStylist, loggedInStaffName]);

  // Top Banner Mode: Report vs Summary (plus Invoices ledger). Stylists default to Invoices.
  const [mainTab, setMainTab] = useState<MainTab>(() => (isStylist ? 'invoices' : 'report'));

  // Report Period Filter: Today, Week, Month, Custom
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('today');
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customStart, setCustomStart] = useState<string>(todayIso);
  const [customEnd, setCustomEnd] = useState<string>(todayIso);

  // Summary State: Year, Month, Granular Dropdown
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(new Date().getMonth()); // 0-11
  const [showSummaryDrilldown, setShowSummaryDrilldown] = useState<boolean>(true);

  // Yesterday vs. Today Accordion Toggle State (Mobile-parity with SalesScreen.tsx)
  const [showYesterdayDropdown, setShowYesterdayDropdown] = useState<boolean>(false);

  // Yesterday Collections Breakdown (UPI, Cash, Card)
  const yesterdayMetrics = useMemo(() => {
    const yestBills = bills.filter((b) => !b.isDeleted && b.isYesterday);
    let upi = 0;
    let cash = 0;
    let card = 0;

    yestBills.forEach((b) => {
      const amt = b.paidAmount || b.total || 0;
      if (b.mode === 'Cash') cash += amt;
      else if (b.mode === 'Card') card += amt;
      else upi += amt;
    });

    const total = upi + cash + card;
    const count = yestBills.length;
    const upiPct = total > 0 ? Math.round((upi / total) * 100) : 0;
    const cashPct = total > 0 ? Math.round((cash / total) * 100) : 0;
    const cardPct = total > 0 ? Math.round((card / total) * 100) : 0;

    return { count, total, upi, cash, card, upiPct, cashPct, cardPct };
  }, [bills]);

  // Today Collections Breakdown (UPI, Cash, Card)
  const todayMetrics = useMemo(() => {
    const todayBills = bills.filter((b) => !b.isDeleted && b.isToday);
    let upi = 0;
    let cash = 0;
    let card = 0;

    todayBills.forEach((b) => {
      const amt = b.paidAmount || b.total || 0;
      if (b.mode === 'Cash') cash += amt;
      else if (b.mode === 'Card') card += amt;
      else upi += amt;
    });

    const total = upi + cash + card;
    const count = todayBills.length;
    return { count, total, upi, cash, card };
  }, [bills]);

  // Bill Editing Modal State
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editStaff, setEditStaff] = useState('');
  const [editMode, setEditMode] = useState<Bill['mode']>('UPI');
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editPaid, setEditPaid] = useState<number>(0);

  // ================= 1. REPORT FILTERING & CALCULATIONS =================
  const filterDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedPeriod === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }
    if (selectedPeriod === 'week') {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }
    if (selectedPeriod === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
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

  // Filter bills for the Report tab
  const filteredReportBills = useMemo(() => {
    return bills.filter((b) => {
      if (b.isDeleted) return false;
      if (selectedPeriod === 'today' && b.isToday) return true;
      if (!b.dateStr) return selectedPeriod === 'today';
      const bDate = new Date(b.dateStr);
      if (isNaN(bDate.getTime())) return selectedPeriod === 'today';
      return bDate >= filterDateRange.start && bDate <= filterDateRange.end;
    });
  }, [bills, selectedPeriod, filterDateRange]);

  // Filter expenses for the Report tab
  const filteredReportExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.date) return selectedPeriod === 'today';
      const eDate = new Date(e.date);
      if (isNaN(eDate.getTime())) return selectedPeriod === 'today';
      eDate.setHours(12, 0, 0, 0);
      return eDate >= filterDateRange.start && eDate <= filterDateRange.end;
    });
  }, [expenses, selectedPeriod, filterDateRange]);

  // Report Core KPIs
  const totalSalesCollected = useMemo(() => {
    return filteredReportBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
  }, [filteredReportBills]);

  const totalOutstandingDues = useMemo(() => {
    return filteredReportBills.reduce((acc, b) => acc + (b.dueAmount || 0), 0);
  }, [filteredReportBills]);

  const totalReportExpenses = useMemo(() => {
    return filteredReportExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredReportExpenses]);

  const operatingExpensesOnly = useMemo(() => {
    return filteredReportExpenses
      .filter((e) => e.inProfit !== false)
      .reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredReportExpenses]);

  const netProfit = totalSalesCollected - operatingExpensesOnly;

  // Payment Summary (UPI, Cash, Card, Total)
  const paymentSummary = useMemo(() => {
    let upi = 0;
    let cash = 0;
    let card = 0;
    filteredReportBills.forEach((b) => {
      const amt = b.paidAmount || 0;
      if (b.mode === 'UPI') upi += amt;
      else if (b.mode === 'Cash') cash += amt;
      else if (b.mode === 'Card') card += amt;
      else upi += amt; // default
    });
    return { upi, cash, card, total: upi + cash + card };
  }, [filteredReportBills]);

  // Day-wise Breakdown Table
  const dayWiseData = useMemo(() => {
    const map: Record<string, { date: string; billsCount: number; sales: number; expenses: number; profit: number }> = {};

    // Populate from bills
    filteredReportBills.forEach((b) => {
      const key = b.dateStr ? b.dateStr.split('T')[0] : todayIso;
      if (!map[key]) {
        map[key] = { date: key, billsCount: 0, sales: 0, expenses: 0, profit: 0 };
      }
      map[key].billsCount += 1;
      map[key].sales += b.paidAmount || 0;
    });

    // Populate from expenses
    filteredReportExpenses.forEach((e) => {
      const key = e.date || todayIso;
      if (!map[key]) {
        map[key] = { date: key, billsCount: 0, sales: 0, expenses: 0, profit: 0 };
      }
      map[key].expenses += e.amount || 0;
    });

    // Compute net profit for each day
    Object.values(map).forEach((item) => {
      item.profit = item.sales - item.expenses;
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredReportBills, filteredReportExpenses, todayIso]);

  // Stylist Performance Table
  const stylistPerformanceData = useMemo(() => {
    const map: Record<string, { name: string; billsCount: number; servicesCount: number; sales: number }> = {};

    // Initialize all existing stylists
    staff.forEach((s) => {
      map[s.name] = { name: s.name, billsCount: 0, servicesCount: 0, sales: 0 };
    });

    filteredReportBills.forEach((b) => {
      const stName = b.staff || 'General Salon';
      if (!map[stName]) {
        map[stName] = { name: stName, billsCount: 0, servicesCount: 0, sales: 0 };
      }
      map[stName].billsCount += 1;
      map[stName].servicesCount += b.items?.reduce((acc, it) => acc + (it.qty || 1), 0) || 1;
      map[stName].sales += b.paidAmount || 0;
    });

    const list = Object.values(map);
    const totalSales = totalSalesCollected || 1;
    return list.map((item) => ({
      ...item,
      share: Math.round((item.sales / totalSales) * 100),
    })).sort((a, b) => b.sales - a.sales);
  }, [staff, filteredReportBills, totalSalesCollected]);

  // Service Performance Table
  const servicePerformanceData = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};

    filteredReportBills.forEach((b) => {
      b.items?.forEach((it) => {
        if (!map[it.name]) {
          map[it.name] = { name: it.name, qty: 0, revenue: 0 };
        }
        map[it.name].qty += it.qty || 1;
        map[it.name].revenue += (it.price || 0) * (it.qty || 1);
      });
    });

    const totalRev = Object.values(map).reduce((acc, i) => acc + i.revenue, 0) || 1;
    return Object.values(map).map((i) => ({
      ...i,
      share: Math.round((i.revenue / totalRev) * 100),
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredReportBills]);

  // ================= 2. SUMMARY CALCULATIONS (YEAR & MONTH DRILL-DOWN) =================
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Annual Totals for selected year
  const annualBills = useMemo(() => {
    return bills.filter((b) => {
      if (b.isDeleted) return false;
      const d = new Date(b.dateStr);
      if (isNaN(d.getTime())) return b.isToday;
      return d.getFullYear() === selectedYear;
    });
  }, [bills, selectedYear]);

  const annualExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!e.date) return true;
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return true;
      return d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedYear]);

  const annualTotalRevenue = annualBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
  const annualTotalExpenses = annualExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const annualNetProfit = annualTotalRevenue - annualTotalExpenses;

  // Monthly breakdown for all 12 months of selected year
  const monthlySummaries = useMemo(() => {
    return monthNames.map((name, idx) => {
      const mBills = annualBills.filter((b) => {
        const d = new Date(b.dateStr);
        if (isNaN(d.getTime())) return idx === new Date().getMonth();
        return d.getMonth() === idx;
      });
      const mExpenses = annualExpenses.filter((e) => {
        const d = new Date(e.date);
        if (isNaN(d.getTime())) return idx === new Date().getMonth();
        return d.getMonth() === idx;
      });

      const sales = mBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
      const exp = mExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
      return {
        monthIndex: idx,
        name,
        sales,
        expenses: exp,
        profit: sales - exp,
        invoicesCount: mBills.length,
      };
    });
  }, [annualBills, annualExpenses]);

  // Selected Month's Date-wise Performance Breakdown
  const selectedMonthDateWise = useMemo(() => {
    const monthBills = annualBills.filter((b) => {
      const d = new Date(b.dateStr);
      if (isNaN(d.getTime())) return selectedMonthIndex === new Date().getMonth();
      return d.getMonth() === selectedMonthIndex;
    });

    const monthExp = annualExpenses.filter((e) => {
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return selectedMonthIndex === new Date().getMonth();
      return d.getMonth() === selectedMonthIndex;
    });

    const map: Record<string, { date: string; sales: number; expenses: number; profit: number }> = {};

    monthBills.forEach((b) => {
      const key = b.dateStr ? b.dateStr.split('T')[0] : todayIso;
      if (!map[key]) map[key] = { date: key, sales: 0, expenses: 0, profit: 0 };
      map[key].sales += b.paidAmount || 0;
    });

    monthExp.forEach((e) => {
      const key = e.date || todayIso;
      if (!map[key]) map[key] = { date: key, sales: 0, expenses: 0, profit: 0 };
      map[key].expenses += e.amount || 0;
    });

    Object.values(map).forEach((i) => {
      i.profit = i.sales - i.expenses;
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [annualBills, annualExpenses, selectedMonthIndex, todayIso]);

  // Granular Summary Drawer Metrics for the chosen month
  const selectedMonthDetailedStats = useMemo(() => {
    const monthBills = annualBills.filter((b) => {
      const d = new Date(b.dateStr);
      if (isNaN(d.getTime())) return selectedMonthIndex === new Date().getMonth();
      return d.getMonth() === selectedMonthIndex;
    });

    let upi = 0;
    let cash = 0;
    let card = 0;
    let totalDue = 0;
    let stylistSales = 0;
    let ownerSales = 0;
    let servicesCount = 0;

    monthBills.forEach((b) => {
      const paid = b.paidAmount || 0;
      totalDue += b.dueAmount || 0;
      servicesCount += b.items?.reduce((acc, it) => acc + (it.qty || 1), 0) || 1;

      if (b.mode === 'UPI') upi += paid;
      else if (b.mode === 'Cash') cash += paid;
      else if (b.mode === 'Card') card += paid;
      else upi += paid;

      // Stylist vs Owner sales attribution
      const st = staff.find((s) => s.name.toLowerCase() === (b.staff || '').toLowerCase());
      if (st && st.role.toLowerCase().includes('owner')) {
        ownerSales += paid;
      } else {
        stylistSales += paid;
      }
    });

    const totalCollected = upi + cash + card;
    const totalAttributed = stylistSales + ownerSales || 1;

    return {
      totalDue,
      servicesCount,
      upi,
      cash,
      card,
      totalCollected,
      stylistSales,
      ownerSales,
      stylistShare: Math.round((stylistSales / totalAttributed) * 100),
      ownerShare: Math.round((ownerSales / totalAttributed) * 100),
    };
  }, [annualBills, selectedMonthIndex, staff]);

  // ================= 3. EXPORTS: EXCEL & PDF =================
  const handleExportExcel = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (mainTab === 'summary') {
      headers = ['Month', 'Total Sales (INR)', 'Expenses (INR)', 'Net Profit (INR)', 'Invoices Count'];
      rows = monthlySummaries.map((m) => [m.name, m.sales, m.expenses, m.profit, m.invoicesCount]);
    } else {
      headers = ['Date', 'Invoices Count', 'Total Sales (INR)', 'Expenses (INR)', 'Net Profit (INR)'];
      rows = dayWiseData.map((d) => [d.date, d.billsCount, d.sales, d.expenses, d.profit]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `salon_${mainTab}_${todayIso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Excel (.csv) exported successfully!');
  };

  const handleGeneratePDF = () => {
    window.print();
  };

  // Edit Bill Handlers
  const handleOpenEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setEditCustName(bill.cust);
    setEditCustPhone(bill.phone);
    setEditStaff(bill.staff);
    setEditMode(bill.mode);
    setEditTotal(bill.total);
    setEditPaid(bill.paidAmount);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    const totalNum = Number(editTotal) || 0;
    const paidNum = Number(editPaid) || 0;
    const dueNum = Math.max(0, totalNum - paidNum);
    const status: Bill['status'] = dueNum === 0 ? 'paid' : paidNum > 0 ? 'partially_paid' : 'pending';

    editBill(editingBill.id, {
      cust: editCustName.trim() || 'Walk-in Client',
      phone: editCustPhone.trim(),
      staff: editStaff,
      mode: editMode,
      total: totalNum,
      paidAmount: paidNum,
      dueAmount: dueNum,
      status,
    });

    setEditingBill(null);
  };

  return (
    <section className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner with 2 Mode Switches: Report vs Summary */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-md ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-black shadow-inner shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                Salon Analytics & Financial Reports
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                Live Audit
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Detailed reports, annual summaries, payment collections, and performance breakdowns
            </p>
          </div>
        </div>

        {/* The Mode Banner: Report vs Summary (plus Invoices Ledger) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/20 border border-white/10 shrink-0 self-start sm:self-auto">
          {!isStylist && (
            <>
              <button
                type="button"
                onClick={() => setMainTab('report')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mainTab === 'report'
                    ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/25'
                    : isDarkMode
                    ? 'text-[#A7B0C3] hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Report
              </button>
              <button
                type="button"
                onClick={() => setMainTab('summary')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mainTab === 'summary'
                    ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/25'
                    : isDarkMode
                    ? 'text-[#A7B0C3] hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Summary
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMainTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              mainTab === 'invoices'
                ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/25'
                : isDarkMode
                ? 'text-[#A7B0C3] hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isStylist ? 'My Chair Receipts' : 'Invoices'} ({effectiveBills.length})
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MODE: REPORT VIEW                                          */}
      {/* ============================================================== */}
      {mainTab === 'report' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Below that: Today, Week, Month, Custom Filter Banner */}
          <div
            className={`p-3 sm:p-4 rounded-3xl border transition-all ${
              isDarkMode ? 'bg-[#0F1C36] border-[#2A3858]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Week' },
                  { id: 'month', label: 'Month' },
                  { id: 'custom', label: 'Custom' },
                ].map((p) => {
                  const active = selectedPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPeriod(p.id as PeriodFilter)}
                      className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/25'
                          : isDarkMode
                          ? 'bg-[#142347] text-[#A7B0C3] border border-[#2A3858] hover:text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200 hover:text-black'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Below that: Generate PDF & Export Excel Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleGeneratePDF}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" rx="1" />
                  </svg>
                  <span>Generate PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                  </svg>
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* Custom Date Range Picker */}
            {selectedPeriod === 'custom' && (
              <div
                className={`mt-3 p-3.5 rounded-2xl border flex flex-wrap items-center gap-3 animate-fadeIn ${
                  isDarkMode ? 'bg-[#0B172E] border-[#2A3858]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <label className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                    From:
                  </label>
                  <input
                    type="date"
                    max={todayIso}
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                      isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                    To:
                  </label>
                  <input
                    type="date"
                    max={todayIso}
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${
                      isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Core 4-Metric Container: Net Profit, Total Sales Collected, Outstanding from Customers, Expenses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Net Profit */}
            <div
              className={`p-5 rounded-[28px] rounded-tl-[12px] border shadow-sm transition-all duration-300 hover:border-[#D4AF37] ${
                isDarkMode
                  ? 'bg-[#121B33] border-[#D4AF37]/50'
                  : 'bg-[#FFFDF5] border-[#D4AF37]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
                  Net Profit
                </span>
                <svg className="w-4 h-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <strong className={`text-2xl mt-2 block font-black tabular-nums ${netProfit >= 0 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                <AnimatedCounter value={netProfit} prefix="₹ " />
              </strong>
              <span className={`text-[11px] font-medium mt-1 block ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                Sales minus operational expenses
              </span>
            </div>

            {/* 2. Total Sales Collected */}
            <div
              className={`p-5 rounded-[28px] rounded-tr-[12px] border shadow-sm transition-all duration-300 hover:border-emerald-500/60 ${
                isDarkMode ? 'bg-[#121B33] border-emerald-500/30' : 'bg-white border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Total Sales Collected
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <strong className="text-2xl text-emerald-400 mt-2 block font-black tabular-nums">
                <AnimatedCounter value={totalSalesCollected} prefix="₹ " />
              </strong>
              <span className={`text-[11px] font-medium mt-1 block ${isDarkMode ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                From {filteredReportBills.length} client invoices
              </span>
            </div>

            {/* 3. Outstanding from Customers */}
            <div
              className={`p-5 rounded-[28px] rounded-bl-[12px] border shadow-sm transition-all duration-300 hover:border-amber-500/60 ${
                isDarkMode ? 'bg-[#121B33] border-amber-500/30' : 'bg-white border-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Outstanding from Customers
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              </div>
              <strong className="text-2xl text-amber-400 mt-2 block font-black tabular-nums">
                <AnimatedCounter value={totalOutstandingDues} prefix="₹ " />
              </strong>
              <span className={`text-[11px] font-medium mt-1 block ${isDarkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
                Pending client balances
              </span>
            </div>

            {/* 4. Expenses */}
            <div
              className={`p-5 rounded-[28px] rounded-br-[12px] border shadow-sm transition-all duration-300 hover:border-red-500/60 ${
                isDarkMode ? 'bg-[#121B33] border-red-500/30' : 'bg-white border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Expenses
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <strong className="text-2xl text-red-400 mt-2 block font-black tabular-nums">
                <AnimatedCounter value={totalReportExpenses} prefix="₹ " />
              </strong>
              <span className={`text-[11px] font-medium mt-1 block ${isDarkMode ? 'text-red-400/80' : 'text-red-700'}`}>
                {filteredReportExpenses.length} expense payouts recorded
              </span>
            </div>
          </div>

          {/* ================= Yesterday vs. Today Accordion Toggle (Mobile-Parity) ================= */}
          {!isStylist && (
            <div
              className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                isDarkMode ? 'bg-[#0F1C36] border-[#2A3858]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowYesterdayDropdown((prev) => !prev)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0 font-black">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs sm:text-sm font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Yesterday vs. Today Collections
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                        UPI · Cash · Card
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                      Today: ₹{todayMetrics.total.toLocaleString('en-IN')} ({todayMetrics.count} bills) · Yesterday: ₹{yesterdayMetrics.total.toLocaleString('en-IN')} ({yesterdayMetrics.count} bills)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                    isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-[#D4AF37]'
                      : 'bg-slate-100 border-slate-300 text-[#0F172A]'
                  }`}
                  aria-label="Toggle yesterday breakdown"
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${showYesterdayDropdown ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Dropdown Breakdown Content */}
              {showYesterdayDropdown && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                      Yesterday Collected Breakdown
                    </span>
                    <span className={`text-xs font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      Total ₹{yesterdayMetrics.total.toLocaleString('en-IN')} · {yesterdayMetrics.count} bills
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* UPI Breakdown */}
                    <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-sky-400">UPI</span>
                        <span className={`font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{yesterdayMetrics.upi.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 mt-2 overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full transition-all duration-500" style={{ width: `${yesterdayMetrics.upiPct}%` }} />
                      </div>
                      <span className="text-[10px] text-[#A7B0C3] block mt-1.5">{yesterdayMetrics.upiPct}% of yesterday's intake</span>
                    </div>

                    {/* Cash Breakdown */}
                    <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400">Cash</span>
                        <span className={`font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{yesterdayMetrics.cash.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${yesterdayMetrics.cashPct}%` }} />
                      </div>
                      <span className="text-[10px] text-[#A7B0C3] block mt-1.5">{yesterdayMetrics.cashPct}% of yesterday's intake</span>
                    </div>

                    {/* Card Breakdown */}
                    <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400">Card</span>
                        <span className={`font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{yesterdayMetrics.card.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 mt-2 overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${yesterdayMetrics.cardPct}%` }} />
                      </div>
                      <span className="text-[10px] text-[#A7B0C3] block mt-1.5">{yesterdayMetrics.cardPct}% of yesterday's intake</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Summary Section (UPI, Cash, Card, Total Collected) */}
          <div
            className={`p-5 sm:p-6 rounded-[28px] border space-y-3.5 shadow-sm ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider">
                Payment Summary ({selectedPeriod})
              </h3>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Reconciliation Breakdown
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase text-sky-400 block">UPI Collected</span>
                <strong className="text-lg font-black text-sky-400 block mt-1 tabular-nums">
                  <AnimatedCounter value={paymentSummary.upi} prefix="₹ " />
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>QR & Instant Pay</span>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">Cash Collected</span>
                <strong className="text-lg font-black text-emerald-400 block mt-1 tabular-nums">
                  <AnimatedCounter value={paymentSummary.cash} prefix="₹ " />
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>Drawer Cash</span>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase text-sky-400 block">Card Collected</span>
                <strong className="text-lg font-black text-sky-400 block mt-1 tabular-nums">
                  <AnimatedCounter value={paymentSummary.card} prefix="₹ " />
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>POS Machine Swipes</span>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-[#D4AF37]/30' : 'bg-[#FFFDF5] border-[#D4AF37]/40'}`}>
                <span className="text-[10px] font-bold uppercase text-[#D4AF37] block">Total Collected</span>
                <strong className="text-lg font-black text-[#D4AF37] block mt-1 tabular-nums">
                  <AnimatedCounter value={paymentSummary.total} prefix="₹ " />
                </strong>
                <span className="text-[10px] text-[#D4AF37]/80 font-bold">100% Inflow Sum</span>
              </div>
            </div>
          </div>

          {/* Day-Wise Breakdown Table */}
          <div
            className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider">
                  Day-Wise Breakdown
                </h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Daily performance of bills, sales collections, operating expenses, and net profit
                </p>
              </div>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                {dayWiseData.length} Active Days
              </span>
            </div>

            {dayWiseData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No activity recorded for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-white/10 text-[#A7B0C3]' : 'border-slate-200 text-slate-500'}`}>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-center">Invoices</th>
                      <th className="py-2.5 px-3 text-right">Total Sales</th>
                      <th className="py-2.5 px-3 text-right">Expenses</th>
                      <th className="py-2.5 px-3 text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {dayWiseData.map((d) => (
                      <tr key={d.date} className="hover:bg-white/5">
                        <td className="py-3 px-3 font-bold text-[#D4AF37]">{d.date}</td>
                        <td className="py-3 px-3 text-center">{d.billsCount}</td>
                        <td className="py-3 px-3 text-right font-black text-emerald-400">₹ {d.sales.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-bold text-red-400">₹ {d.expenses.toLocaleString()}</td>
                        <td className={`py-3 px-3 text-right font-black ${d.profit >= 0 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                          ₹ {d.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Grid of Stylist Performance & Service Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stylist Performance */}
            <div
              className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
                isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider">
                  Stylist Performance
                </h3>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Sales Contribution
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-white/10 text-[#A7B0C3]' : 'border-slate-200 text-slate-500'}`}>
                      <th className="py-2 px-3">Stylist</th>
                      <th className="py-2 px-3 text-center">Invoices</th>
                      <th className="py-2 px-3 text-center">Services</th>
                      <th className="py-2 px-3 text-right">Sales</th>
                      <th className="py-2 px-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stylistPerformanceData.map((st) => (
                      <tr key={st.name} className="hover:bg-white/5">
                        <td className="py-2.5 px-3 font-bold">{st.name}</td>
                        <td className="py-2.5 px-3 text-center">{st.billsCount}</td>
                        <td className="py-2.5 px-3 text-center text-sky-400 font-bold">{st.servicesCount}</td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-400">₹ {st.sales.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#D4AF37]">{st.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Service Performance */}
            <div
              className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
                isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider">
                  Service Performance
                </h3>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Popular Treatments
                </span>
              </div>

              {servicePerformanceData.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No service items billed yet for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-white/10 text-[#A7B0C3]' : 'border-slate-200 text-slate-500'}`}>
                        <th className="py-2 px-3">Service Name</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                        <th className="py-2 px-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {servicePerformanceData.slice(0, 8).map((srv) => (
                        <tr key={srv.name} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold">{srv.name}</td>
                          <td className="py-2.5 px-3 text-center text-sky-400 font-bold">{srv.qty}</td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-400">₹ {srv.revenue.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#D4AF37]">{srv.share}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MODE: SUMMARY VIEW (YEAR -> MONTH -> DATE DRILL-DOWN)        */}
      {/* ============================================================== */}
      {mainTab === 'summary' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Step 1: Choose a Year Container */}
          <div
            className={`p-6 rounded-3xl border transition-all shadow-md ${
              isDarkMode
                ? 'bg-[#121B33] border-[#D4AF37]/40'
                : 'bg-[#FFFDF7] border-[#D4AF37]/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] block">
                  Step 1: Choose a Year
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className={`px-4 py-2 rounded-xl text-base font-black border cursor-pointer outline-none ${
                      isDarkMode ? 'bg-[#0B172E] border-[#D4AF37]/50 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {[2026, 2025, 2024].map((y) => (
                      <option key={y} value={y} className="bg-[#0B1E3B] text-white">
                        Year {y}
                      </option>
                    ))}
                  </select>
                  <span className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                    Annual Total Revenue & Financial Drill-Down
                  </span>
                </div>
              </div>

              {/* Action: Export Excel for Annual Summary */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>Export {selectedYear} Excel</span>
              </button>
            </div>

            {/* Annual KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className={`p-4 rounded-[24px] rounded-tl-[10px] border transition-all duration-300 hover:border-emerald-500/50 ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-white border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                  {selectedYear} Annual Revenue
                </span>
                <strong className="text-xl font-black text-emerald-400 block mt-1 tabular-nums">
                  <AnimatedCounter value={annualTotalRevenue} prefix="₹ " />
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                  From {annualBills.length} client bills
                </span>
              </div>

              <div className={`p-4 rounded-[24px] border transition-all duration-300 hover:border-red-500/50 ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-white border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                  {selectedYear} Annual Expenses
                </span>
                <strong className="text-xl font-black text-red-400 block mt-1 tabular-nums">
                  <AnimatedCounter value={annualTotalExpenses} prefix="₹ " />
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                  Recorded operating outlays
                </span>
              </div>

              <div className={`p-4 rounded-[24px] rounded-tr-[10px] border transition-all duration-300 hover:border-[#D4AF37] ${isDarkMode ? 'bg-[#0B172E] border-[#D4AF37]/30' : 'bg-[#FFFDF5] border-[#D4AF37]/40'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                  {selectedYear} Annual Net Profit
                </span>
                <strong className={`text-xl font-black block mt-1 tabular-nums ${annualNetProfit >= 0 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                  <AnimatedCounter value={annualNetProfit} prefix="₹ " />
                </strong>
                <span className="text-[10px] text-[#D4AF37]/80 font-bold">
                  Net annual balance
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Choose a Month (All 12 Months Displayed) */}
          <div
            className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] block">
                  Step 2: Choose a Month
                </span>
                <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  12 Months Performance in {selectedYear}
                </h3>
              </div>
              <span className={`text-xs font-semibold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Click any month to inspect date-wise performance
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {monthlySummaries.map((m) => {
                const isSelected = selectedMonthIndex === m.monthIndex;
                return (
                  <button
                    key={m.monthIndex}
                    type="button"
                    onClick={() => setSelectedMonthIndex(m.monthIndex)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] shadow-lg scale-[1.02]'
                        : isDarkMode
                        ? 'bg-[#0B172E] border-white/5 hover:border-white/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className={`text-xs font-extrabold block ${isSelected ? 'text-[#D4AF37]' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {m.name}
                      </strong>
                      {isSelected && <span className="text-xs text-[#D4AF37]">→</span>}
                    </div>
                    <span className="text-sm font-black text-emerald-400 block mt-1">
                      ₹ {m.sales.toLocaleString()}
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                      {m.invoicesCount} bills · ₹{m.profit} net
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Date-Wise Performance Breakdown for Selected Month & Granular Dropdown */}
          <div
            className={`p-6 rounded-3xl border space-y-5 shadow-lg ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] block">
                  Step 3: Date-Wise Performance & Drill-Down
                </span>
                <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {monthNames[selectedMonthIndex]} {selectedYear} Audit
                </h3>
              </div>

              {/* Toggle Dropdown Button for Detailed Breakdown */}
              <button
                type="button"
                onClick={() => setShowSummaryDrilldown(!showSummaryDrilldown)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>{showSummaryDrilldown ? 'Hide Detailed Breakdown' : 'Show Detailed Breakdown'}</span>
                <span>{showSummaryDrilldown ? '▲' : '▼'}</span>
              </button>
            </div>

            {/* Granular Breakdown Dropdown Container */}
            {showSummaryDrilldown && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-4 animate-fadeIn ${
                  isDarkMode ? 'bg-[#0B172E] border-[#2A3858]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs font-black text-[#D4AF37] block">
                  Granular Metrics: {monthNames[selectedMonthIndex]} {selectedYear}
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#121B33] border-white/5' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] font-bold uppercase text-amber-400 block">Outstanding Dues</span>
                    <strong className="text-base font-black text-amber-400 block mt-1">
                      ₹ {selectedMonthDetailedStats.totalDue.toLocaleString()}
                    </strong>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>Unpaid this month</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#121B33] border-white/5' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] font-bold uppercase text-sky-400 block">Services Delivered</span>
                    <strong className="text-base font-black text-sky-400 block mt-1">
                      {selectedMonthDetailedStats.servicesCount} Services
                    </strong>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>Treatments executed</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#121B33] border-white/5' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block">Payment Mode Split</span>
                    <span className="text-xs font-black block mt-1 text-emerald-400">
                      UPI: ₹{selectedMonthDetailedStats.upi} · Cash: ₹{selectedMonthDetailedStats.cash}
                    </span>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                      Card: ₹{selectedMonthDetailedStats.card}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-[#121B33] border-[#D4AF37]/30' : 'bg-[#FFFDF5] border-[#D4AF37]/40'}`}>
                    <span className="text-[10px] font-bold uppercase text-[#D4AF37] block">Sales Attribution</span>
                    <span className="text-xs font-black block mt-1 text-white">
                      Stylists: ₹{selectedMonthDetailedStats.stylistSales} ({selectedMonthDetailedStats.stylistShare}%)
                    </span>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-[#D4AF37]/80' : 'text-slate-600'}`}>
                      Owner: ₹{selectedMonthDetailedStats.ownerSales} ({selectedMonthDetailedStats.ownerShare}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Date-wise Performance Table for the Month */}
            <div className="space-y-3">
              <span className={`text-xs font-bold block ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Date-wise Performance ({selectedMonthDateWise.length} Active Days)
              </span>

              {selectedMonthDateWise.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No sales or expenses recorded for {monthNames[selectedMonthIndex]} {selectedYear}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-white/10 text-[#A7B0C3]' : 'border-slate-200 text-slate-500'}`}>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Sales</th>
                        <th className="py-2.5 px-3 text-right">Expenses</th>
                        <th className="py-2.5 px-3 text-right">Net Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedMonthDateWise.map((row) => (
                        <tr key={row.date} className="hover:bg-white/5">
                          <td className="py-3 px-3 font-bold text-[#D4AF37]">{row.date}</td>
                          <td className="py-3 px-3 text-right font-black text-emerald-400">₹ {row.sales.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-bold text-red-400">₹ {row.expenses.toLocaleString()}</td>
                          <td className={`py-3 px-3 text-right font-black ${row.profit >= 0 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                            ₹ {row.profit.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODE: INVOICES & BILLS LEDGER                               */}
      {/* ============================================================== */}
      {mainTab === 'invoices' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2">
            <h3 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {isStylist ? `My Chair Invoices (${effectiveBills.length})` : `All Salon Invoices (${effectiveBills.length})`}
            </h3>
            <button
              onClick={() => setCurrentScreen('billing')}
              className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black shadow-md cursor-pointer"
            >
              + Create Bill
            </button>
          </div>

          <div className="space-y-3">
            {effectiveBills.length === 0 ? (
              <div className={`p-8 rounded-2xl border text-center text-xs ${isDarkMode ? 'bg-[#0B1F44] border-white/5 text-[#A7B0C3]' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                {isStylist ? 'No invoices generated for your chair yet.' : 'No invoices generated yet.'}
              </div>
            ) : (
              effectiveBills.map((bill) => (
                <div
                  key={bill.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDarkMode ? 'bg-[#0B1F44] border-white/5 hover:border-[#D4AF37]/50' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {bill.cust}
                    </strong>
                    <span className="text-[10px] font-mono text-[#D4AF37] px-2 py-0.5 rounded-md bg-[#D4AF37]/10">
                      #{bill.id}
                    </span>
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-md">
                      {bill.mode}
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                    Stylist: {bill.staff} · Date: {bill.dateStr}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-start sm:self-auto">
                  <div className="text-right">
                    <strong className="text-base text-emerald-400 font-black block">₹ {bill.paidAmount}</strong>
                    {bill.dueAmount > 0 && (
                      <span className="text-[10px] text-red-400 font-bold block">Due: ₹{bill.dueAmount}</span>
                    )}
                  </div>

                  <button
                    onClick={() => onViewInvoice(bill)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
                  >
                    View
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(bill)}
                    className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteBill(bill.id)}
                    className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-xs cursor-pointer"
                    title="Delete bill"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {editingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-sm w-full space-y-4 shadow-2xl relative ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Edit Bill #{editingBill.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBill(null)}
                className="w-7 h-7 rounded-xl border border-white/10 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-white/5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Client Name</label>
                <input
                  type="text"
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Total (₹)</label>
                  <input
                    type="number"
                    value={editTotal}
                    onChange={(e) => setEditTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Paid (₹)</label>
                  <input
                    type="number"
                    value={editPaid}
                    onChange={(e) => setEditPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingBill(null)}
                  className="flex-1 py-2 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#D4AF37] text-[#0B1F44] text-xs font-black shadow-md"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}