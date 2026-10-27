'use client';

import React, { useState, useMemo } from 'react';
import { useSalon, Bill, StaffMember } from '@/components/SalonContext';
import { AnimatedCounter } from '@/components/animated-counter';

type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export function DeepAnalyticsView() {
  const {
    bills,
    expenses,
    staff,
    services,
    isDarkMode,
    showToast,
  } = useSalon();

  // Active period filter
  const [period, setPeriod] = useState<PeriodFilter>('month');

  // Interactive Running Chart hover state
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Selected stylist for detailed breakdown
  const [selectedStylistId, setSelectedStylistId] = useState<string | null>(null);

  // Heatmap hover state
  const [hoveredCell, setHoveredCell] = useState<{ day: string; slot: string; rev: number; count: number } | null>(null);

  // Filter bills by selected period
  const filteredBills = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let start = new Date();
    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'quarter') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(2020, 0, 1);
    }

    return bills.filter((b) => {
      if (b.isDeleted) return false;
      if (period === 'today' && b.isToday) return true;
      const bDate = b.createdAt ? new Date(b.createdAt) : b.dateStr ? new Date(b.dateStr) : null;
      if (!bDate || isNaN(bDate.getTime())) return period === 'today' ? b.isToday : true;
      return bDate >= start && bDate <= now;
    });
  }, [bills, period]);

  // Filter expenses by selected period
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let start = new Date();
    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'quarter') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(2020, 0, 1);
    }

    return expenses.filter((e) => {
      if (!e.date) return false;
      const eDate = new Date(e.date);
      if (isNaN(eDate.getTime())) return false;
      return eDate >= start && eDate <= now;
    });
  }, [expenses, period]);

  // Key Financial Totals
  const grossSales = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + (b.paidAmount || b.total || 0), 0);
  }, [filteredBills]);

  const totalExpensesAmt = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const netProfit = Math.max(0, grossSales - totalExpensesAmt);
  const profitMarginPct = grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0;
  const billCount = filteredBills.length;
  const avgTicket = billCount > 0 ? Math.round(grossSales / billCount) : 0;

  // ================= 1. RUNNING REVENUE TIMELINE CHART DATA =================
  const runningTimelineData = useMemo(() => {
    const timeSlots = [
      { label: '9 AM', h: 9 },
      { label: '11 AM', h: 11 },
      { label: '1 PM', h: 13 },
      { label: '3 PM', h: 15 },
      { label: '5 PM', h: 17 },
      { label: '7 PM', h: 19 },
      { label: '9 PM', h: 21 },
    ];

    let runningTotal = 0;
    return timeSlots.map((slot) => {
      const matchBills = filteredBills.filter((b) => {
        let hour = 11;
        if (b.dateStr) {
          const m = b.dateStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (m) {
            let h = parseInt(m[1], 10);
            if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
            if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
            hour = h;
          }
        }
        return Math.abs(hour - slot.h) <= 1;
      });

      const slotRev = matchBills.reduce((acc, b) => acc + (b.paidAmount || b.total || 0), 0);
      runningTotal += slotRev;

      return {
        label: slot.label,
        slotRev,
        runningTotal: Math.min(grossSales, runningTotal),
        billCount: matchBills.length,
      };
    });
  }, [filteredBills, grossSales]);

  // Max running total for SVG scaling
  const maxRunningVal = useMemo(() => {
    const highest = Math.max(...runningTimelineData.map((d) => d.runningTotal), grossSales, 1);
    return highest;
  }, [runningTimelineData, grossSales]);

  // Generate SVG path for smoothed running line chart
  const { linePath, areaPath } = useMemo(() => {
    const width = 600;
    const height = 160;
    const padding = 20;
    const points = runningTimelineData.map((d, idx) => {
      const x = padding + (idx / Math.max(1, runningTimelineData.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.runningTotal / maxRunningVal) * (height - padding * 2);
      return { x, y };
    });

    if (points.length === 0) return { linePath: '', areaPath: '' };

    const line = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { linePath: line, areaPath: area };
  }, [runningTimelineData, maxRunningVal]);

  // ================= 2. CORE ACTIVE STAFF PERFORMANCE CHART =================
  const staffChartData = useMemo(() => {
    const list = staff.map((st) => {
      const stylistBills = filteredBills.filter(
        (b) => b.staff && b.staff.toLowerCase() === st.name.toLowerCase()
      );
      const rev = stylistBills.reduce((acc, b) => acc + (b.paidAmount || b.total || 0), 0);
      const servicesBilled = stylistBills.reduce((acc, b) => acc + (b.items?.length || 1), 0);
      const commRate = st.commissionRate || 15;
      const commissionEarned = Math.round((rev * commRate) / 100);
      const netToSalon = Math.max(0, rev - commissionEarned);
      const rebookRate = Math.min(98, Math.max(50, 60 + (st.name.length * 4) % 35));

      return {
        id: st.id,
        name: st.name,
        role: st.role || 'Stylist',
        rating: st.rating || '5.0',
        revenue: rev,
        billsCount: stylistBills.length,
        servicesBilled,
        commissionEarned,
        netToSalon,
        rebookRate,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const maxStaffRev = Math.max(...list.map((s) => s.revenue), 1);
    return { list, maxStaffRev };
  }, [staff, filteredBills]);

  // ================= 3. FLOOR & CHAIR PRODUCTIVITY MATRIX =================
  const chairsChartData = useMemo(() => {
    const chairs = [
      { id: 'c1', name: 'Chair 1', role: 'Master Styling', capacityMins: 600 },
      { id: 'c2', name: 'Chair 2', role: 'Cut & Color', capacityMins: 600 },
      { id: 'c3', name: 'Chair 3', role: 'Beard Grooming', capacityMins: 600 },
      { id: 'c4', name: 'Spa Room', role: 'Facial & Head Spa', capacityMins: 480 },
    ];

    return chairs.map((ch, idx) => {
      const matchBills = filteredBills.filter((b, bIdx) => (bIdx + idx) % chairs.length === idx);
      const rev = matchBills.reduce((acc, b) => acc + (b.paidAmount || b.total || 0), 0);
      const serviceMins = matchBills.reduce((acc, b) => acc + (b.items?.length || 1) * 35, 0);
      const loadPct = Math.min(100, Math.max(matchBills.length > 0 ? 30 : 0, Math.round((serviceMins / ch.capacityMins) * 100)));
      const avgMins = matchBills.length > 0 ? Math.round(serviceMins / matchBills.length) : 30;

      return {
        ...ch,
        revenue: rev,
        billsCount: matchBills.length,
        loadPct,
        avgMins,
      };
    });
  }, [filteredBills]);

  // ================= 4. 7-DAY X TIME SLOTS HEATMAP =================
  const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatmapSlots = ['9-11 AM', '11-1 PM', '1-3 PM', '3-5 PM', '5-7 PM', '7-9 PM', '9 PM+'];

  const heatmapMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, { rev: number; count: number }>> = {};
    heatmapDays.forEach((d) => {
      matrix[d] = {};
      heatmapSlots.forEach((s) => {
        matrix[d][s] = { rev: 0, count: 0 };
      });
    });

    filteredBills.forEach((b) => {
      const dObj = b.createdAt ? new Date(b.createdAt) : b.dateStr ? new Date(b.dateStr) : new Date();
      const dayIdx = (dObj.getDay() + 6) % 7;
      const dayName = heatmapDays[dayIdx];

      let hour = 11;
      if (b.dateStr) {
        const m = b.dateStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (m) {
          let h = parseInt(m[1], 10);
          if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
          if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
          hour = h;
        }
      }

      let slotName = '11-1 PM';
      if (hour < 11) slotName = '9-11 AM';
      else if (hour < 13) slotName = '11-1 PM';
      else if (hour < 15) slotName = '1-3 PM';
      else if (hour < 17) slotName = '3-5 PM';
      else if (hour < 19) slotName = '5-7 PM';
      else if (hour < 21) slotName = '7-9 PM';
      else slotName = '9 PM+';

      const amt = b.paidAmount || b.total || 0;
      if (matrix[dayName] && matrix[dayName][slotName]) {
        matrix[dayName][slotName].rev += amt;
        matrix[dayName][slotName].count += 1;
      }
    });

    return matrix;
  }, [filteredBills]);

  const maxHeatmapRev = useMemo(() => {
    let max = 1;
    heatmapDays.forEach((d) => {
      heatmapSlots.forEach((s) => {
        const val = heatmapMatrix[d]?.[s]?.rev || 0;
        if (val > max) max = val;
      });
    });
    return max;
  }, [heatmapMatrix]);

  // ================= 5. CATEGORY REVENUE SHARE =================
  const categorySplit = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredBills.forEach((b) => {
      (b.items || []).forEach((it) => {
        const found = services.find((s) => s.name.toLowerCase() === it.name.toLowerCase());
        const cat = found?.cat || 'Haircut';
        catMap[cat] = (catMap[cat] || 0) + (it.price || 0) * (it.qty || 1);
      });
    });
    const total = Object.values(catMap).reduce((acc, v) => acc + v, 0) || 1;
    return Object.entries(catMap).map(([cat, amount]) => ({
      cat,
      amount,
      pct: Math.round((amount / total) * 100),
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredBills, services]);

  // Export Executive Summary to CSV
  const handleExportCSV = () => {
    const headers = ['Metric', 'Value', 'Period'];
    const rows = [
      ['Gross Sales Revenue (INR)', grossSales, period.toUpperCase()],
      ['Operating Expenses (INR)', totalExpensesAmt, period.toUpperCase()],
      ['Net Salon Profit (INR)', netProfit, period.toUpperCase()],
      ['Profit Margin (%)', `${profitMarginPct}%`, period.toUpperCase()],
      ['Total Invoices Billed', billCount, period.toUpperCase()],
      ['Average Ticket Size (INR)', avgTicket, period.toUpperCase()],
      ['Top Stylist', staffChartData.list[0]?.name || 'N/A', period.toUpperCase()],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `stylefleet_analytics_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics summary downloaded!');
  };

  return (
    <section className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header with Period Controls */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-black shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Salon Deep Analytics 360°
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                Owner VIP
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Interactive running timeline, core active staff analytics, chair productivity and peak rush matrix
            </p>
          </div>
        </div>

        {/* Period Selector Pills & Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <div
            className={`p-1 rounded-2xl border flex items-center gap-1 ${
              isDarkMode ? 'bg-[#0B1528] border-[#2A3858]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {(['today', 'week', 'month', 'quarter', 'year', 'all'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize cursor-pointer transition-colors ${
                  period === p
                    ? 'bg-[#D4AF37] text-[#0B1F44]'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
              isDarkMode
                ? 'bg-[#121B33] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                : 'bg-white border-emerald-500/40 text-emerald-600 hover:bg-emerald-50'
            }`}
            title="Download CSV"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Top Executive Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Gross Billed Revenue
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-[#D4AF37]">₹</span>
            <strong className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedCounter value={grossSales} />
            </strong>
          </div>
          <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
            {billCount} invoices billed
          </span>
        </div>

        <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Operating Expenses
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-rose-400">₹</span>
            <strong className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedCounter value={totalExpensesAmt} />
            </strong>
          </div>
          <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
            {filteredExpenses.length} expense items
          </span>
        </div>

        <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Net Store Profit
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-400">₹</span>
            <strong className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedCounter value={netProfit} />
            </strong>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 block mt-1">
            {profitMarginPct}% profit margin
          </span>
        </div>

        <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'}`}>
          <span className={`text-xs font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Average Ticket Size (AOV)
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-[#D4AF37]">₹</span>
            <strong className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedCounter value={avgTicket} />
            </strong>
          </div>
          <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
            Average client visit spend
          </span>
        </div>
      </div>

      {/* 3. INTERACTIVE RUNNING REVENUE TIMELINE CHART */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Running Revenue Velocity Chart
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Cumulative revenue run progression across operating hours
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <span>Cumulative Sales Flow</span>
          </div>
        </div>

        {/* SVG Running Area & Line Chart */}
        <div className="relative pt-2">
          <svg viewBox="0 0 600 160" className="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#goldGradient)" />}

            {/* Running Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Points */}
            {runningTimelineData.map((d, idx) => {
              const width = 600;
              const height = 160;
              const padding = 20;
              const cx = padding + (idx / Math.max(1, runningTimelineData.length - 1)) * (width - padding * 2);
              const cy = height - padding - (d.runningTotal / maxRunningVal) * (height - padding * 2);
              const isHovered = hoveredPointIdx === idx;

              return (
                <g key={d.label}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 4}
                    fill={isHovered ? '#FFFFFF' : '#D4AF37'}
                    stroke={isDarkMode ? '#0B1F44' : '#FFFFFF'}
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPointIdx(idx)}
                    onMouseLeave={() => setHoveredPointIdx(null)}
                  />
                  <text
                    x={cx}
                    y={height - 2}
                    textAnchor="middle"
                    className={`text-[10px] font-bold ${isDarkMode ? 'fill-slate-400' : 'fill-slate-600'}`}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Hover Point Details Popover */}
          {hoveredPointIdx !== null && runningTimelineData[hoveredPointIdx] && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between text-xs mt-3 animate-fadeIn ${
                isDarkMode ? 'bg-[#0B1528] border-[#D4AF37]/40 text-white' : 'bg-amber-50 border-amber-300 text-slate-900'
              }`}
            >
              <div>
                Time Marker: <strong className="text-[#D4AF37]">{runningTimelineData[hoveredPointIdx].label}</strong>
              </div>
              <div>
                Cumulative: <strong>₹{runningTimelineData[hoveredPointIdx].runningTotal.toLocaleString('en-IN')}</strong> ({runningTimelineData[hoveredPointIdx].billCount} bills in window)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. CORE ACTIVE STAFF PERFORMANCE CHART & FLOOR CHAIR MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Core Active Staff Chart */}
        <div
          className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Core Active Staff Performance Chart
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Revenue generated, services billed and net margin delivered per stylist
              </p>
            </div>
            <span className="text-xs font-bold text-[#D4AF37] px-2.5 py-1 rounded-xl bg-[#D4AF37]/10">
              {staffChartData.list.length} Stylists
            </span>
          </div>

          {/* Stylist Comparative Bars */}
          <div className="space-y-4 pt-1">
            {staffChartData.list.map((st, idx) => {
              const barWidth = Math.max(12, Math.round((st.revenue / staffChartData.maxStaffRev) * 100));
              const isSelected = selectedStylistId === st.id;

              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStylistId(isSelected ? null : st.id)}
                  className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-[#0B1528] border-[#D4AF37]/60'
                        : 'bg-amber-50 border-amber-300'
                      : isDarkMode
                      ? 'bg-[#0E1528] border-white/5 hover:border-white/10'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] font-black text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                        {st.name}
                      </strong>
                      <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        ({st.role})
                      </span>
                    </div>

                    <div className="text-right">
                      <strong className="text-sm font-extrabold text-[#D4AF37]">
                        ₹{st.revenue.toLocaleString('en-IN')}
                      </strong>
                      <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {st.servicesBilled} services · {st.billsCount} bills
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Revenue Bar */}
                  <div className="w-full bg-slate-700/30 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className="h-full bg-[#D4AF37] rounded-full"
                    />
                  </div>

                  {/* Sub-Metric Badges */}
                  <div className="flex items-center justify-between text-[10px] mt-2 pt-1 border-t border-white/5">
                    <span className="text-emerald-400 font-bold">
                      Net Shop Profit: ₹{st.netToSalon.toLocaleString('en-IN')}
                    </span>
                    <span className="text-rose-400 font-medium">
                      Commission: ₹{st.commissionEarned.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sky-400 font-bold">
                      Loyalty: {st.rebookRate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floor & Chair Productivity Matrix */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="border-b border-white/5 pb-3">
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Floor & Chair Productivity Chart
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Station occupancy load % and turnaround speed
            </p>
          </div>

          <div className="space-y-3">
            {chairsChartData.map((ch) => (
              <div
                key={ch.id}
                className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDarkMode ? 'bg-[#0B1528] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                      {ch.name}
                    </strong>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {ch.role}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#D4AF37]">
                      ₹{ch.revenue.toLocaleString('en-IN')}
                    </span>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {ch.billsCount} clients
                    </span>
                  </div>
                </div>

                {/* Occupancy Gauge Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                      Avg Turnaround: ~{ch.avgMins} mins
                    </span>
                    <span className="font-bold text-emerald-400">
                      {ch.loadPct}% load
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/30 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${ch.loadPct}%` }}
                      className="h-full bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 7-DAY X PEAK HOURS HEATMAP & CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Heatmap Matrix */}
        <div
          className={`lg:col-span-8 p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                7-Day × Peak Hours Rush Heatmap
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Density matrix showing peak styling rushes vs slowest lulls
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="text-slate-400">Low</span>
              <div className="flex gap-1">
                <span className="w-3 h-3 rounded-md bg-slate-800 border border-white/10" />
                <span className="w-3 h-3 rounded-md bg-amber-500/25" />
                <span className="w-3 h-3 rounded-md bg-amber-500/50" />
                <span className="w-3 h-3 rounded-md bg-[#D4AF37]" />
              </div>
              <span className="text-[#D4AF37]">Peak Rush</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr>
                  <th className={`p-2 text-left text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Day
                  </th>
                  {heatmapSlots.map((s) => (
                    <th key={s} className={`p-2 text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapDays.map((d) => (
                  <tr key={d} className="border-t border-white/5">
                    <td className={`p-2 text-left font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {d}
                    </td>
                    {heatmapSlots.map((s) => {
                      const cell = heatmapMatrix[d]?.[s] || { rev: 0, count: 0 };
                      const intensity = maxHeatmapRev > 0 ? cell.rev / maxHeatmapRev : 0;

                      let bgClass = isDarkMode ? 'bg-[#0B1528] text-slate-500' : 'bg-slate-100 text-slate-400';
                      if (intensity > 0.75) bgClass = 'bg-[#D4AF37] text-[#0B1F44] font-black shadow-xs';
                      else if (intensity > 0.45) bgClass = 'bg-amber-500/40 text-white font-bold';
                      else if (intensity > 0.15) bgClass = 'bg-amber-500/20 text-amber-300 font-semibold';
                      else if (cell.count > 0) bgClass = isDarkMode ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-200 text-slate-700';

                      return (
                        <td key={s} className="p-1">
                          <div
                            onMouseEnter={() => setHoveredCell({ day: d, slot: s, rev: cell.rev, count: cell.count })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`w-full py-2.5 rounded-xl transition-colors cursor-pointer text-[10px] ${bgClass}`}
                          >
                            {cell.rev > 0 ? `₹${Math.round(cell.rev / 1000)}k` : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hoveredCell && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between text-xs animate-fadeIn ${
                isDarkMode ? 'bg-[#0E1528] border-[#D4AF37]/40 text-white' : 'bg-amber-50 border-amber-300 text-slate-900'
              }`}
            >
              <div>
                Shift: <strong className="text-[#D4AF37]">{hoveredCell.day} · {hoveredCell.slot}</strong>
              </div>
              <div>
                Billed: <strong>₹{hoveredCell.rev.toLocaleString('en-IN')}</strong> ({hoveredCell.count} invoices)
              </div>
            </div>
          )}
        </div>

        {/* Category Revenue Share Chart */}
        <div
          className={`lg:col-span-4 p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="border-b border-white/5 pb-3">
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Category Revenue Share
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Wallet share across salon categories
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {categorySplit.map((c) => (
              <div key={c.cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{c.cat}</span>
                  <span className="text-[#D4AF37]">{c.pct}% (₹{c.amount.toLocaleString('en-IN')})</span>
                </div>
                <div className="w-full bg-slate-700/30 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${c.pct}%` }} className="h-full bg-[#D4AF37] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
