'use client';

import React, { useState, useMemo } from 'react';
import { useSalon, Bill, StaffMember, Customer, Expense } from '@/components/SalonContext';
import { AnimatedCounter } from '@/components/animated-counter';

type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
type LedgerTab = 'expenses' | 'bills';

export function DeepAnalyticsView() {
  const {
    bills,
    expenses,
    staff,
    services,
    customers,
    appointments,
    shopProfile,
    isDarkMode,
    showToast,
  } = useSalon();

  // ================= POWER BI SLICERS / FILTERS =================
  const [period, setPeriod] = useState<PeriodFilter>('today');
  const [selectedStylist, setSelectedStylist] = useState<string>('all');
  const [selectedExpenseCat, setSelectedExpenseCat] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [ledgerTab, setLedgerTab] = useState<LedgerTab>('expenses');

  // Chart hover states
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: string; slot: string; rev: number; count: number } | null>(null);

  // Helper date utilities using local calendar
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Check if a date string or timestamp matches today
  const isBillToday = (b: Bill): boolean => {
    if (b.isToday) return true;
    if (b.createdAt && b.createdAt.startsWith(todayStr)) return true;
    if (b.dateStr && b.dateStr.startsWith(todayStr)) return true;
    if (b.dateStr) {
      const d = new Date(b.dateStr);
      if (!isNaN(d.getTime())) {
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dStr === todayStr) return true;
      }
    }
    return false;
  };

  const getBillTimestamp = (b: Bill): number => {
    if (b.isToday) return now.getTime();
    if (b.createdAt) {
      const t = new Date(b.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (b.dateStr) {
      const t = new Date(b.dateStr).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  const getBillHour = (b: Bill): number => {
    if (b.createdAt) {
      const d = new Date(b.createdAt);
      if (!isNaN(d.getTime())) return d.getHours();
    }
    if (b.dateStr) {
      const m12 = b.dateStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (m12) {
        let h = parseInt(m12[1], 10);
        const isPm = m12[3].toUpperCase() === 'PM';
        if (isPm && h < 12) h += 12;
        if (!isPm && h === 12) h = 0;
        return h;
      }
      const m24 = b.dateStr.match(/(\d{1,2}):(\d{2})/);
      if (m24) {
        const h = parseInt(m24[1], 10);
        if (h >= 0 && h <= 23) return h;
      }
      const d = new Date(b.dateStr);
      if (!isNaN(d.getTime())) return d.getHours();
    }
    return 14;
  };

  const isExpenseToday = (e: Expense): boolean => {
    if (!e.date) return false;
    return e.date.startsWith(todayStr);
  };

  // Distinct list of expense categories present in data
  const distinctExpenseCategories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const cat = (e.cat || 'Other').trim();
      if (cat) set.add(cat);
    });
    // Add default fallbacks if none exist
    if (set.size === 0) {
      ['Products & stock', 'Maintenance', 'Staff salaries', 'Electricity & utility', 'Rent', 'Tea & Snacks', 'Other'].forEach(c => set.add(c));
    }
    return Array.from(set).sort();
  }, [expenses]);

  // Distinct active staff names
  const distinctStaffNames = useMemo(() => {
    return staff.map((s) => s.name).filter(Boolean);
  }, [staff]);

  // ================= 1. FILTER BILLS (REAL DATA + SLICERS) =================
  const filteredBills = useMemo(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let start = new Date(todayStart);

    if (period === 'today') {
      // Keep today
    } else if (period === 'week') {
      start.setDate(start.getDate() - 6);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'quarter') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
      start = new Date(2020, 0, 1, 0, 0, 0, 0);
    }

    return bills.filter((b) => {
      if (b.isDeleted) return false;

      // Period check
      if (period === 'today') {
        if (!isBillToday(b)) return false;
      } else {
        if (!b.isToday) {
          const t = getBillTimestamp(b);
          if (!t || t < start.getTime() || t > todayEnd.getTime()) return false;
        }
      }

      // Stylist Slicer filter
      if (selectedStylist !== 'all') {
        const staffName = (b.staff || '').trim().toLowerCase();
        if (staffName !== selectedStylist.trim().toLowerCase()) return false;
      }

      // Payment Mode Slicer filter
      if (selectedPaymentMode !== 'all') {
        if (b.mode !== selectedPaymentMode) return false;
      }

      return true;
    });
  }, [bills, period, selectedStylist, selectedPaymentMode, todayStr, now]);

  // ================= 2. FILTER EXPENSES (REAL DATA + SLICERS) =================
  const filteredExpenses = useMemo(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let start = new Date(todayStart);

    if (period === 'today') {
      // today
    } else if (period === 'week') {
      start.setDate(start.getDate() - 6);
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'quarter') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
      start = new Date(2020, 0, 1, 0, 0, 0, 0);
    }

    return expenses.filter((e) => {
      // Period check
      if (period === 'today') {
        if (!isExpenseToday(e)) return false;
      } else {
        if (!e.date) return false;
        const t = new Date(e.date).getTime();
        if (isNaN(t) || t < start.getTime() || t > todayEnd.getTime()) return false;
      }

      // Expense Category Slicer filter
      if (selectedExpenseCat !== 'all') {
        const cat = (e.cat || 'Other').trim().toLowerCase();
        if (cat !== selectedExpenseCat.trim().toLowerCase()) return false;
      }

      // Stylist Slicer filter (if expense is linked to a staff)
      if (selectedStylist !== 'all') {
        if (!e.staff || e.staff.trim().toLowerCase() !== selectedStylist.trim().toLowerCase()) {
          // If filtering by stylist, only include expenses attributed to this stylist or salon general if requested
          return false;
        }
      }

      // Payment Mode Slicer filter
      if (selectedPaymentMode !== 'all') {
        if (e.pm && e.pm.toLowerCase() !== selectedPaymentMode.toLowerCase()) return false;
      }

      return true;
    });
  }, [expenses, period, selectedExpenseCat, selectedStylist, selectedPaymentMode, todayStr, now]);

  // ================= 3. REAL FINANCIAL TOTALS (P&L) =================
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

  // Real payment channels
  const paymentModes = useMemo(() => {
    let upi = 0;
    let cash = 0;
    let card = 0;
    let due = 0;

    filteredBills.forEach((b) => {
      const paid = b.paidAmount || 0;
      if (b.mode === 'Cash') cash += paid;
      else if (b.mode === 'Card') card += paid;
      else upi += paid;
      due += b.dueAmount || 0;
    });

    const totalPaid = upi + cash + card || 1;
    return {
      upi,
      cash,
      card,
      due,
      upiPct: Math.round((upi / totalPaid) * 100),
      cashPct: Math.round((cash / totalPaid) * 100),
      cardPct: Math.round((card / totalPaid) * 100),
    };
  }, [filteredBills]);

  // ================= 4. EXPENSE CATEGORY DEEP INTELLIGENCE =================
  // Computes which category expenses are mostly used (by frequency of use AND total amount spent)
  const expenseCategoryAnalytics = useMemo(() => {
    const catMap: Record<string, { totalAmount: number; count: number; items: Expense[]; highestSingle: number }> = {};

    filteredExpenses.forEach((e) => {
      const cat = (e.cat || 'Other').trim() || 'Other';
      if (!catMap[cat]) {
        catMap[cat] = { totalAmount: 0, count: 0, items: [], highestSingle: 0 };
      }
      const amt = Number(e.amount) || 0;
      catMap[cat].totalAmount += amt;
      catMap[cat].count += 1;
      catMap[cat].items.push(e);
      if (amt > catMap[cat].highestSingle) {
        catMap[cat].highestSingle = amt;
      }
    });

    const totalSpent = Object.values(catMap).reduce((acc, v) => acc + v.totalAmount, 0) || 1;
    const totalTransactions = Object.values(catMap).reduce((acc, v) => acc + v.count, 0) || 1;

    const list = Object.entries(catMap).map(([cat, val]) => {
      const pctSpend = Math.round((val.totalAmount / totalSpent) * 100);
      const pctFreq = Math.round((val.count / totalTransactions) * 100);
      const avgPerEntry = val.count > 0 ? Math.round(val.totalAmount / val.count) : 0;

      return {
        cat,
        totalAmount: val.totalAmount,
        count: val.count,
        pctSpend,
        pctFreq,
        highestSingle: val.highestSingle,
        avgPerEntry,
      };
    });

    // Sort by count descending (mostly used frequency)
    const sortedByFrequency = [...list].sort((a, b) => b.count - a.count);
    // Sort by spend descending
    const sortedBySpend = [...list].sort((a, b) => b.totalAmount - a.totalAmount);

    const mostFrequentCat = sortedByFrequency[0] || null;
    const highestSpendCat = sortedBySpend[0] || null;

    return {
      categories: sortedBySpend,
      mostFrequentCat,
      highestSpendCat,
      totalSpent,
      totalCount: filteredExpenses.length,
    };
  }, [filteredExpenses]);

  // ================= 5. STYLIST PERFORMANCE DEEP ANALYTICS =================
  const repeatClientIdentifiers = useMemo(() => {
    const counts: Record<string, number> = {};
    bills.forEach((b) => {
      if (b.isDeleted) return;
      const key = b.phone || b.cust.toLowerCase();
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((k) => counts[k] >= 2));
  }, [bills]);

  const staffPerformanceList = useMemo(() => {
    // If a specific stylist is filtered, show that stylist first or only
    const targetStaff = selectedStylist !== 'all'
      ? staff.filter((st) => st.name.toLowerCase() === selectedStylist.toLowerCase())
      : staff;

    return targetStaff.map((st) => {
      const stylistBills = filteredBills.filter(
        (b) => b.staff && b.staff.toLowerCase() === st.name.toLowerCase()
      );

      const revenue = stylistBills.reduce((acc, b) => acc + (b.paidAmount || b.total || 0), 0);
      const servicesBilled = stylistBills.reduce((acc, b) => acc + (b.items?.length || 1), 0);
      const commRate = st.commissionRate || 15;
      const commissionEarned = Math.round((revenue * commRate) / 100);
      const netToSalon = Math.max(0, revenue - commissionEarned);

      // Real upsell rate: bills with 2 or more line items
      const multiItemBills = stylistBills.filter((b) => (b.items?.length || 0) >= 2).length;
      const upsellRate = stylistBills.length > 0 ? Math.round((multiItemBills / stylistBills.length) * 100) : 0;

      // Real repeat client rate
      const repeatBills = stylistBills.filter((b) => {
        const key = b.phone || b.cust.toLowerCase();
        return key && repeatClientIdentifiers.has(key);
      }).length;
      const repeatClientRate = stylistBills.length > 0 ? Math.round((repeatBills / stylistBills.length) * 100) : 0;

      const storeShare = grossSales > 0 ? Math.round((revenue / grossSales) * 100) : 0;
      const avgBill = stylistBills.length > 0 ? Math.round(revenue / stylistBills.length) : 0;

      // Top service performed by this stylist
      const serviceCounts: Record<string, number> = {};
      stylistBills.forEach((b) => {
        (b.items || []).forEach((it) => {
          serviceCounts[it.name] = (serviceCounts[it.name] || 0) + (it.qty || 1);
        });
      });
      const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Haircut';

      return {
        id: st.id,
        name: st.name,
        role: st.role || 'Stylist',
        rating: st.rating || '5.0',
        chair: st.chair || 'Main Floor',
        revenue,
        billsCount: stylistBills.length,
        servicesBilled,
        storeShare,
        commissionEarned,
        netToSalon,
        upsellRate,
        repeatClientRate,
        avgBill,
        topService,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [staff, filteredBills, grossSales, repeatClientIdentifiers, selectedStylist]);

  const maxStaffRevenue = useMemo(() => {
    return Math.max(...staffPerformanceList.map((s) => s.revenue), 1);
  }, [staffPerformanceList]);

  // ================= 6. POWER BI DUAL-METRIC TIMELINE (REVENUE VS EXPENSE) =================
  const runningTimelineData = useMemo(() => {
    const timeSlots = [
      { label: '9-11 AM', startH: 0, endH: 11 },
      { label: '11-1 PM', startH: 11, endH: 13 },
      { label: '1-3 PM', startH: 13, endH: 15 },
      { label: '3-5 PM', startH: 15, endH: 17 },
      { label: '5-7 PM', startH: 17, endH: 19 },
      { label: '7-9 PM', startH: 19, endH: 21 },
      { label: '9 PM+', startH: 21, endH: 24 },
    ];

    let runningRev = 0;
    let runningExp = 0;

    return timeSlots.map((slot) => {
      const slotBills = filteredBills.filter((b) => {
        const h = getBillHour(b);
        return h >= slot.startH && h < slot.endH;
      });

      const slotExpenses = filteredExpenses.filter((e) => {
        if (!e.date) return false;
        const d = new Date(e.date);
        if (isNaN(d.getTime())) return false;
        const h = d.getHours();
        return h >= slot.startH && h < slot.endH;
      });

      const rev = slotBills.reduce((acc, b) => acc + (b.paidAmount || b.total || 0), 0);
      const exp = slotExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

      runningRev += rev;
      runningExp += exp;

      return {
        label: slot.label,
        slotRev: rev,
        slotExp: exp,
        runningRev,
        runningExp,
        billCount: slotBills.length,
        expCount: slotExpenses.length,
      };
    });
  }, [filteredBills, filteredExpenses]);

  const maxRunningVal = useMemo(() => {
    const maxRev = Math.max(...runningTimelineData.map((d) => d.runningRev), grossSales, 1);
    const maxExp = Math.max(...runningTimelineData.map((d) => d.runningExp), totalExpensesAmt, 1);
    return Math.max(maxRev, maxExp);
  }, [runningTimelineData, grossSales, totalExpensesAmt]);

  // Smooth SVG Path for Running Revenue & Expense Lines
  const { revLinePath, revAreaPath, expLinePath } = useMemo(() => {
    const width = 640;
    const height = 180;
    const padding = 28;

    const revPoints = runningTimelineData.map((d, idx) => {
      const x = padding + (idx / Math.max(1, runningTimelineData.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.runningRev / maxRunningVal) * (height - padding * 2);
      return { x, y };
    });

    const expPoints = runningTimelineData.map((d, idx) => {
      const x = padding + (idx / Math.max(1, runningTimelineData.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.runningExp / maxRunningVal) * (height - padding * 2);
      return { x, y };
    });

    if (revPoints.length === 0) return { revLinePath: '', revAreaPath: '', expLinePath: '' };

    const revLine = revPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const revArea = `${revLine} L ${revPoints[revPoints.length - 1].x} ${height - padding} L ${revPoints[0].x} ${height - padding} Z`;
    const expLine = expPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return { revLinePath: revLine, revAreaPath: revArea, expLinePath: expLine };
  }, [runningTimelineData, maxRunningVal]);

  // ================= 7. FLOOR & CHAIR PRODUCTIVITY =================
  const floorStationsData = useMemo(() => {
    const stationNames = ['Chair 1', 'Chair 2', 'Chair 3', 'Spa Room'];

    return stationNames.map((stationName, idx) => {
      const assignedStaff = staff.filter(
        (s) => s.chair && s.chair.toLowerCase() === stationName.toLowerCase()
      );
      const staffNames = assignedStaff.map((s) => s.name.toLowerCase());

      const stationBills = filteredBills.filter((b) => {
        if (!b.staff) return false;
        if (staffNames.length > 0) {
          return staffNames.includes(b.staff.toLowerCase());
        }
        return (b.cust.length + idx) % stationNames.length === idx;
      });

      const stationRevenue = stationBills.reduce((acc, b) => acc + (b.paidAmount || b.total || 0), 0);
      const servicesCount = stationBills.reduce((acc, b) => acc + (b.items?.length || 1), 0);

      let totalMins = 0;
      stationBills.forEach((b) => {
        (b.items || []).forEach((it) => {
          const matchedService = services.find((s) => s.name.toLowerCase() === it.name.toLowerCase());
          totalMins += (matchedService?.dur || 30) * (it.qty || 1);
        });
      });

      const avgTurnaround = stationBills.length > 0 ? Math.round(totalMins / stationBills.length) : 35;
      const openCapacityMins = 600;
      const occupancyLoadPct = Math.min(100, Math.round((totalMins / openCapacityMins) * 100));

      return {
        id: `station-${idx}`,
        name: stationName,
        assignedStaffName: assignedStaff[0]?.name || (staff[idx]?.name ?? 'Floor Stylist'),
        revenue: stationRevenue,
        billsCount: stationBills.length,
        servicesCount,
        avgTurnaround: Math.max(15, avgTurnaround),
        occupancyLoadPct: stationBills.length > 0 ? Math.max(20, occupancyLoadPct) : 0,
      };
    });
  }, [staff, filteredBills, services]);

  // ================= 8. PEAK HOURS HEATMAP =================
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
      let dObj = new Date();
      if (b.createdAt) {
        const d = new Date(b.createdAt);
        if (!isNaN(d.getTime())) dObj = d;
      } else if (b.dateStr) {
        const d = new Date(b.dateStr);
        if (!isNaN(d.getTime())) dObj = d;
      }

      const dayIdx = (dObj.getDay() + 6) % 7;
      const dayName = heatmapDays[dayIdx];
      const hour = getBillHour(b);

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

  // ================= 9. INTERACTIVE LEDGER EXPLORER SEARCH =================
  const searchedExpenses = useMemo(() => {
    if (!ledgerSearch.trim()) return filteredExpenses;
    const q = ledgerSearch.toLowerCase();
    return filteredExpenses.filter((e) =>
      (e.cat && e.cat.toLowerCase().includes(q)) ||
      (e.note && e.note.toLowerCase().includes(q)) ||
      (e.pm && e.pm.toLowerCase().includes(q)) ||
      (e.staff && e.staff.toLowerCase().includes(q)) ||
      String(e.amount).includes(q)
    );
  }, [filteredExpenses, ledgerSearch]);

  const searchedBills = useMemo(() => {
    if (!ledgerSearch.trim()) return filteredBills;
    const q = ledgerSearch.toLowerCase();
    return filteredBills.filter((b) =>
      (b.cust && b.cust.toLowerCase().includes(q)) ||
      (b.staff && b.staff.toLowerCase().includes(q)) ||
      (b.phone && b.phone.includes(q)) ||
      (b.mode && b.mode.toLowerCase().includes(q)) ||
      String(b.total).includes(q) ||
      (b.items && b.items.some(i => i.name.toLowerCase().includes(q)))
    );
  }, [filteredBills, ledgerSearch]);

  // Total outstanding khata dues
  const totalOutstandingDues = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.due || 0), 0);
  }, [customers]);

  // Check if any slicer is actively filtering beyond defaults
  const isAnyFilterActive = period !== 'today' || selectedStylist !== 'all' || selectedExpenseCat !== 'all' || selectedPaymentMode !== 'all';

  const handleResetFilters = () => {
    setPeriod('today');
    setSelectedStylist('all');
    setSelectedExpenseCat('all');
    setSelectedPaymentMode('all');
    setLedgerSearch('');
    showToast('All intelligence filters reset to Today');
  };

  // Export Executive Summary to CSV
  const handleExportCSV = () => {
    const headers = ['Metric', 'Value', 'Active Period', 'Active Stylist Filter', 'Active Expense Cat Filter'];
    const rows = [
      ['Gross Sales Revenue (INR)', grossSales, period.toUpperCase(), selectedStylist, selectedExpenseCat],
      ['Salon Operating Expenses (INR)', totalExpensesAmt, period.toUpperCase(), selectedStylist, selectedExpenseCat],
      ['Net Salon Profit (INR)', netProfit, period.toUpperCase(), selectedStylist, selectedExpenseCat],
      ['Profit Margin (%)', `${profitMarginPct}%`, period.toUpperCase(), selectedStylist, selectedExpenseCat],
      ['Total Invoices Billed', billCount, period.toUpperCase(), selectedStylist, selectedExpenseCat],
      ['Average Ticket Size (INR)', avgTicket, period.toUpperCase(), selectedStylist, selectedExpenseCat],
      ['Mostly Used Expense Category (Frequency)', expenseCategoryAnalytics.mostFrequentCat ? `${expenseCategoryAnalytics.mostFrequentCat.cat} (${expenseCategoryAnalytics.mostFrequentCat.count} times)` : 'N/A', period.toUpperCase(), selectedStylist, selectedExpenseCat],
      ['Highest Spend Expense Category', expenseCategoryAnalytics.highestSpendCat ? `${expenseCategoryAnalytics.highestSpendCat.cat} (INR ${expenseCategoryAnalytics.highestSpendCat.totalAmount})` : 'N/A', period.toUpperCase(), selectedStylist, selectedExpenseCat],
      ['UPI Collection (INR)', paymentModes.upi, period.toUpperCase(), selectedStylist, selectedPaymentMode],
      ['Cash Collection (INR)', paymentModes.cash, period.toUpperCase(), selectedStylist, selectedPaymentMode],
      ['Outstanding Client Dues (INR)', totalOutstandingDues, period.toUpperCase(), selectedStylist, selectedPaymentMode],
      ['Top Stylist by Revenue', staffPerformanceList[0]?.name || 'N/A', period.toUpperCase(), selectedStylist, selectedPaymentMode],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `salon_intelligence_${period}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Salon Intelligence executive CSV downloaded!');
  };

  return (
    <section className="space-y-6 animate-fadeIn pb-20">
      {/* ================= 1. HEADER & POWER BI TITLE ================= */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-black shrink-0 shadow-inner">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Salon Intelligence
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                Interactive Power BI View
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Deep analytics: stylist ROI, mostly used expense categories, cashflow velocity & real-time drilldowns
            </p>
          </div>
        </div>

        {/* Top Actions: Reset & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black cursor-pointer transition-colors flex items-center gap-1.5 ${
                isDarkMode
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset All Slicers</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer transition-colors ${
              isDarkMode
                ? 'bg-[#121B33] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                : 'bg-white border-emerald-500/40 text-emerald-600 hover:bg-emerald-50'
            }`}
            title="Download CSV Executive Summary"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
            </svg>
            <span className="hidden sm:inline">Export Intelligence CSV</span>
          </button>
        </div>
      </div>

      {/* ================= 2. POWER BI SLICER CONTROL RIBBON ================= */}
      <div
        className={`p-4 rounded-3xl border space-y-3 ${
          isDarkMode ? 'bg-[#0E1528] border-[#2A3858]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className={`text-xs font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              Interactive Slicers & Cross-Filters
            </span>
          </div>
          <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Click any card below to cross-filter instantly
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Slicer 1: Period Slicer */}
          <div className="space-y-1">
            <label className={`text-[11px] font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Time Period Slicer
            </label>
            <div
              className={`p-1 rounded-xl border flex items-center gap-1 overflow-x-auto [scrollbar-width:none] ${
                isDarkMode ? 'bg-[#0B1528] border-[#2A3858]' : 'bg-white border-slate-200'
              }`}
            >
              {(['today', 'week', 'month', 'quarter', 'year', 'all'] as PeriodFilter[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black capitalize cursor-pointer transition-colors whitespace-nowrap ${
                    period === p
                      ? 'bg-[#D4AF37] text-[#0B1F44]'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p === 'all' ? 'All' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Slicer 2: Stylist Slicer */}
          <div className="space-y-1">
            <label className={`text-[11px] font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Stylist Slicer
            </label>
            <select
              value={selectedStylist}
              onChange={(e) => setSelectedStylist(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold outline-none cursor-pointer transition-colors ${
                selectedStylist !== 'all'
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : isDarkMode
                  ? 'bg-[#0B1528] border-[#2A3858] text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Stylists ({distinctStaffNames.length})</option>
              {distinctStaffNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Slicer 3: Expense Category Slicer */}
          <div className="space-y-1">
            <label className={`text-[11px] font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Expense Category Slicer
            </label>
            <select
              value={selectedExpenseCat}
              onChange={(e) => setSelectedExpenseCat(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold outline-none cursor-pointer transition-colors ${
                selectedExpenseCat !== 'all'
                  ? 'border-rose-400 text-rose-400'
                  : isDarkMode
                  ? 'bg-[#0B1528] border-[#2A3858] text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Expense Categories ({distinctExpenseCategories.length})</option>
              {distinctExpenseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Slicer 4: Payment Channel Slicer */}
          <div className="space-y-1">
            <label className={`text-[11px] font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Payment Channel
            </label>
            <select
              value={selectedPaymentMode}
              onChange={(e) => setSelectedPaymentMode(e.target.value)}
              className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold outline-none cursor-pointer transition-colors ${
                selectedPaymentMode !== 'all'
                  ? 'border-sky-400 text-sky-400'
                  : isDarkMode
                  ? 'bg-[#0B1528] border-[#2A3858] text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Payment Channels</option>
              <option value="UPI">UPI Only</option>
              <option value="Cash">Cash Only</option>
              <option value="Card">Card Only</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary Chips */}
        {isAnyFilterActive && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
            <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Active Filters:
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D4AF37]/15 text-[#D4AF37]">
              Period: {period.toUpperCase()}
            </span>
            {selectedStylist !== 'all' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 flex items-center gap-1">
                Stylist: {selectedStylist}
                <button type="button" onClick={() => setSelectedStylist('all')} className="hover:text-white cursor-pointer">×</button>
              </span>
            )}
            {selectedExpenseCat !== 'all' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 flex items-center gap-1">
                Expense Cat: {selectedExpenseCat}
                <button type="button" onClick={() => setSelectedExpenseCat('all')} className="hover:text-white cursor-pointer">×</button>
              </span>
            )}
            {selectedPaymentMode !== 'all' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                Mode: {selectedPaymentMode}
                <button type="button" onClick={() => setSelectedPaymentMode('all')} className="hover:text-white cursor-pointer">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ================= 3. EXECUTIVE POWER BI SCORECARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gross Revenue */}
        <div
          onClick={() => setLedgerTab('bills')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858] hover:border-[#D4AF37]/50' : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Gross Billed Revenue
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
              {billCount} bills
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-[#D4AF37]">₹</span>
            <strong className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedCounter value={grossSales} />
            </strong>
          </div>
          <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
            Avg ticket: ₹{avgTicket.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Operating Expenses */}
        <div
          onClick={() => setLedgerTab('expenses')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858] hover:border-rose-400/50' : 'bg-white border-slate-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Operating Expenses
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
              {filteredExpenses.length} entries
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-rose-400">₹</span>
            <strong className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedCounter value={totalExpensesAmt} />
            </strong>
          </div>
          <span className={`text-[11px] block mt-1 truncate ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
            {expenseCategoryAnalytics.categories.length} categories active
          </span>
        </div>

        {/* Net Profit */}
        <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Net Salon Profit
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
              {profitMarginPct}% Margin
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-400">₹</span>
            <strong className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedCounter value={netProfit} />
            </strong>
          </div>
          <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
            Sales minus recorded expenses
          </span>
        </div>

        {/* Mostly Used Category (Frequency) */}
        <div
          onClick={() => {
            if (expenseCategoryAnalytics.mostFrequentCat) {
              setSelectedExpenseCat(
                selectedExpenseCat === expenseCategoryAnalytics.mostFrequentCat.cat
                  ? 'all'
                  : expenseCategoryAnalytics.mostFrequentCat.cat
              );
            }
          }}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858] hover:border-amber-400/50' : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Mostly Used Category
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
              Top Outflow
            </span>
          </div>
          <div className="mt-2">
            <strong className={`text-lg sm:text-xl font-black block truncate ${isDarkMode ? 'text-amber-400' : 'text-amber-800'}`}>
              {expenseCategoryAnalytics.mostFrequentCat?.cat || 'None'}
            </strong>
          </div>
          <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
            {expenseCategoryAnalytics.mostFrequentCat
              ? `${expenseCategoryAnalytics.mostFrequentCat.count} entries (${expenseCategoryAnalytics.mostFrequentCat.pctFreq}% of all entries)`
              : 'No expenses recorded'}
          </span>
        </div>

        {/* Outstanding Dues */}
        <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Khata Dues
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
              {paymentModes.due > 0 ? 'Active' : 'Clear'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-400">₹</span>
            <strong className={`text-2xl sm:text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedCounter value={totalOutstandingDues} />
            </strong>
          </div>
          <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
            Total recoverable customer balance
          </span>
        </div>
      </div>

      {/* ================= 4. EXPENSE CATEGORY DEEP INTELLIGENCE (WHICH CATEGORY EXPENSES MOSTLY USED) ================= */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Expense Categories Intelligence · Outflow Analytics
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                Frequency vs Spend
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Identifies which category expenses are mostly used in the salon and where money is going
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-400">
              Total Outflow: ₹{totalExpensesAmt.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Top 2 Callout Cards: Most Frequent vs Highest Spend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Most Frequently Used */}
          <div
            onClick={() => {
              if (expenseCategoryAnalytics.mostFrequentCat) {
                setSelectedExpenseCat(expenseCategoryAnalytics.mostFrequentCat.cat);
              }
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedExpenseCat === expenseCategoryAnalytics.mostFrequentCat?.cat
                ? 'border-amber-400 ring-2 ring-amber-400/20'
                : isDarkMode
                ? 'bg-[#0B1528] border-white/5 hover:border-amber-400/40'
                : 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                #1 Mostly Used Category (By Frequency)
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                {expenseCategoryAnalytics.mostFrequentCat?.count || 0} times logged
              </span>
            </div>
            <div className="mt-2.5">
              <strong className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {expenseCategoryAnalytics.mostFrequentCat?.cat || 'No expenses logged'}
              </strong>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span className="text-amber-400 font-bold">
                  ₹{(expenseCategoryAnalytics.mostFrequentCat?.totalAmount || 0).toLocaleString('en-IN')} total
                </span>
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Avg: ₹{(expenseCategoryAnalytics.mostFrequentCat?.avgPerEntry || 0).toLocaleString('en-IN')} per entry
                </span>
                <span className="text-[10px] font-bold text-amber-400">
                  {expenseCategoryAnalytics.mostFrequentCat?.pctFreq || 0}% of all transactions
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Highest Total Cost Center */}
          <div
            onClick={() => {
              if (expenseCategoryAnalytics.highestSpendCat) {
                setSelectedExpenseCat(expenseCategoryAnalytics.highestSpendCat.cat);
              }
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedExpenseCat === expenseCategoryAnalytics.highestSpendCat?.cat
                ? 'border-rose-400 ring-2 ring-rose-400/20'
                : isDarkMode
                ? 'bg-[#0B1528] border-white/5 hover:border-rose-400/40'
                : 'bg-rose-50/60 border-rose-200 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                #1 Highest Spend Category (Cost Center)
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                {expenseCategoryAnalytics.highestSpendCat?.pctSpend || 0}% of total expenses
              </span>
            </div>
            <div className="mt-2.5">
              <strong className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {expenseCategoryAnalytics.highestSpendCat?.cat || 'No expenses logged'}
              </strong>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span className="text-rose-400 font-bold">
                  ₹{(expenseCategoryAnalytics.highestSpendCat?.totalAmount || 0).toLocaleString('en-IN')} total
                </span>
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Largest single bill: ₹{(expenseCategoryAnalytics.highestSpendCat?.highestSingle || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Category Outflow List / Matrix */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>Category & Usage Frequency</span>
            <span>Spend Share & Amount (₹)</span>
          </div>

          {expenseCategoryAnalytics.categories.length === 0 ? (
            <div className={`p-6 rounded-2xl text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              No expense records found for this period. Add expenses to populate real category analytics.
            </div>
          ) : (
            expenseCategoryAnalytics.categories.map((c, idx) => {
              const isSelected = selectedExpenseCat.toLowerCase() === c.cat.toLowerCase();
              const isMostFreq = expenseCategoryAnalytics.mostFrequentCat?.cat === c.cat;
              const isHighest = expenseCategoryAnalytics.highestSpendCat?.cat === c.cat;

              return (
                <div
                  key={c.cat}
                  onClick={() => setSelectedExpenseCat(isSelected ? 'all' : c.cat)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-[#0B1528] border-rose-400/80 ring-2 ring-rose-400/20'
                        : 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20'
                      : isDarkMode
                      ? 'bg-[#0E1528] border-white/5 hover:border-white/10'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 font-black text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                        {c.cat}
                      </strong>
                      {isMostFreq && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          MOST FREQUENT
                        </span>
                      )}
                      {isHighest && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          HIGHEST SPEND
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <strong className="text-sm font-extrabold text-rose-400">
                        ₹{c.totalAmount.toLocaleString('en-IN')}
                      </strong>
                      <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {c.count} entries ({c.pctSpend}% of budget)
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar: Spend Share vs Frequency Share */}
                  <div className="w-full bg-slate-700/30 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(5, c.pctSpend)}%` }}
                      className="h-full bg-rose-400 rounded-full"
                    />
                  </div>

                  {/* Sub-Metrics */}
                  <div className="flex items-center justify-between text-[10px] mt-2 pt-1 border-t border-white/5 flex-wrap gap-1">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                      Average per entry: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>₹{c.avgPerEntry.toLocaleString('en-IN')}</strong>
                    </span>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                      Single largest receipt: <strong className="text-rose-400">₹{c.highestSingle.toLocaleString('en-IN')}</strong>
                    </span>
                    <span className="text-sky-400 font-bold">
                      Click to isolate this category in ledger ↓
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= 5. STYLIST PERFORMANCE DEEP ANALYTICS MATRIX ================= */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Stylist Performance & Profitability Matrix
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                Revenue, Upsell & Retention
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Ranked by billed revenue with commission calculation, upsell conversion rate & repeat client retention
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D4AF37] px-2.5 py-1 rounded-xl bg-[#D4AF37]/10">
              {staffPerformanceList.length} Active Stylists
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffPerformanceList.map((st, idx) => {
            const isSelected = selectedStylist.toLowerCase() === st.name.toLowerCase();
            const barWidth = maxStaffRevenue > 0
              ? Math.max(12, Math.round((st.revenue / maxStaffRevenue) * 100))
              : 12;

            return (
              <div
                key={st.id}
                onClick={() => setSelectedStylist(isSelected ? 'all' : st.name)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-[#0B1528] border-[#D4AF37] ring-2 ring-[#D4AF37]/20'
                      : 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                    : isDarkMode
                    ? 'bg-[#0E1528] border-white/5 hover:border-white/10'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] font-black text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <strong className={`block truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {st.name}
                      </strong>
                      <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {st.role} · {st.chair}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <strong className="text-sm font-black text-[#D4AF37]">
                      ₹{st.revenue.toLocaleString('en-IN')}
                    </strong>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {st.billsCount} bills ({st.storeShare}% share)
                    </span>
                  </div>
                </div>

                {/* Horizontal Revenue Bar */}
                <div className="w-full bg-slate-700/30 h-2 rounded-full overflow-hidden mb-3">
                  <div style={{ width: `${barWidth}%` }} className="h-full bg-[#D4AF37] rounded-full" />
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-white/5">
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-[#0B1528]' : 'bg-white border border-slate-200'}`}>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Avg Bill Size</span>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>₹{st.avgBill.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-[#0B1528]' : 'bg-white border border-slate-200'}`}>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Net to Salon</span>
                    <strong className="text-emerald-400">₹{st.netToSalon.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-[#0B1528]' : 'bg-white border border-slate-200'}`}>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Upsell Rate (2+ svcs)</span>
                    <strong className="text-sky-400">{st.upsellRate}%</strong>
                  </div>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-[#0B1528]' : 'bg-white border border-slate-200'}`}>
                    <span className={`block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Repeat Retention</span>
                    <strong className="text-amber-400">{st.repeatClientRate}%</strong>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                    Top Service: <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{st.topService}</strong>
                  </span>
                  <span className="text-[#D4AF37] font-bold">
                    {isSelected ? '✓ Filtered' : 'Click to filter'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 6. POWER BI DUAL CASHFLOW TIMELINE (REVENUE VS EXPENSES) ================= */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Cashflow Dynamics · Revenue vs Expense Outflow
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Dynamic shift comparison for {period.toUpperCase()} across operating hours
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-[#D4AF37]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <span>Revenue (₹{grossSales.toLocaleString('en-IN')})</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Expense Outflow (₹{totalExpensesAmt.toLocaleString('en-IN')})</span>
            </div>
          </div>
        </div>

        {/* Dual SVG Area / Line Chart */}
        <div className="relative pt-2">
          <svg viewBox="0 0 640 180" className="w-full h-48 overflow-visible">
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {revAreaPath && <path d={revAreaPath} fill="url(#goldGradient)" />}

            {/* Revenue Line */}
            {revLinePath && (
              <path
                d={revLinePath}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Expense Outflow Line */}
            {expLinePath && (
              <path
                d={expLinePath}
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {runningTimelineData.map((d, idx) => {
              const width = 640;
              const height = 180;
              const padding = 28;
              const cx = padding + (idx / Math.max(1, runningTimelineData.length - 1)) * (width - padding * 2);
              const cyRev = height - padding - (d.runningRev / maxRunningVal) * (height - padding * 2);
              const cyExp = height - padding - (d.runningExp / maxRunningVal) * (height - padding * 2);
              const isHovered = hoveredPointIdx === idx;

              return (
                <g key={d.label}>
                  {/* Revenue Point */}
                  <circle
                    cx={cx}
                    cy={cyRev}
                    r={isHovered ? 6 : 4}
                    fill={isHovered ? '#FFFFFF' : '#D4AF37'}
                    stroke={isDarkMode ? '#0B1F44' : '#FFFFFF'}
                    strokeWidth="2"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIdx(idx)}
                    onMouseLeave={() => setHoveredPointIdx(null)}
                  />

                  {/* Expense Point */}
                  <circle
                    cx={cx}
                    cy={cyExp}
                    r={isHovered ? 5 : 3}
                    fill="#F43F5E"
                    stroke={isDarkMode ? '#0B1F44' : '#FFFFFF'}
                    strokeWidth="1.5"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIdx(idx)}
                    onMouseLeave={() => setHoveredPointIdx(null)}
                  />

                  <text
                    x={cx}
                    y={height - 4}
                    textAnchor="middle"
                    className={`text-[10px] font-bold ${isDarkMode ? 'fill-slate-400' : 'fill-slate-600'}`}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredPointIdx !== null && runningTimelineData[hoveredPointIdx] && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between text-xs mt-3 animate-fadeIn ${
                isDarkMode ? 'bg-[#0B1528] border-[#D4AF37]/40 text-white' : 'bg-amber-50 border-amber-300 text-slate-900'
              }`}
            >
              <div>
                Shift: <strong className="text-[#D4AF37]">{runningTimelineData[hoveredPointIdx].label}</strong>
              </div>
              <div className="flex items-center gap-4">
                <span>
                  Cumul. Revenue: <strong className="text-[#D4AF37]">₹{runningTimelineData[hoveredPointIdx].runningRev.toLocaleString('en-IN')}</strong> ({runningTimelineData[hoveredPointIdx].billCount} bills)
                </span>
                <span>
                  Cumul. Expenses: <strong className="text-rose-400">₹{runningTimelineData[hoveredPointIdx].runningExp.toLocaleString('en-IN')}</strong> ({runningTimelineData[hoveredPointIdx].expCount} entries)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= 7. HEATMAP & FLOOR STATIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Heatmap Matrix */}
        <div
          className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                7-Day × Peak Hours Rush Heatmap
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Customer rush density matrix across operating hours
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

          <div className="overflow-x-auto [scrollbar-width:none]">
            <table className="w-full min-w-[480px] text-center border-collapse text-xs">
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
                      if (intensity > 0.75) bgClass = 'bg-[#D4AF37] text-[#0B1F44] font-black';
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

        {/* Floor & Chair Productivity */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="border-b border-white/5 pb-3">
            <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Floor & Chair Productivity
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Station capacity utilization and turnaround speed
            </p>
          </div>

          <div className="space-y-3">
            {floorStationsData.map((station) => (
              <div
                key={station.id}
                className={`p-3 rounded-2xl border space-y-1.5 ${
                  isDarkMode ? 'bg-[#0B1528] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                      {station.name}
                    </strong>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Stylist: {station.assignedStaffName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#D4AF37]">
                      ₹{station.revenue.toLocaleString('en-IN')}
                    </span>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {station.billsCount} clients ({station.servicesCount} services)
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                      Avg Turnaround: ~{station.avgTurnaround} mins
                    </span>
                    <span className="font-bold text-emerald-400">
                      {station.occupancyLoadPct}% load
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/30 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${station.occupancyLoadPct}%` }}
                      className="h-full bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 8. POWER BI INTERACTIVE DRILL-DOWN LEDGER (TABLE EXPLORER) ================= */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Interactive Data Ledger Explorer
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37]">
                Real Records
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Drill down into real transaction records matching the active slicers above
            </p>
          </div>

          {/* Search bar inside ledger */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-48 sm:w-60 ${
                isDarkMode ? 'bg-[#0B1528] border-[#2A3858] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search ledger..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs"
              />
              {ledgerSearch && (
                <button type="button" onClick={() => setLedgerSearch('')} className="text-slate-400 hover:text-white">
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab switch: Filtered Expenses vs Filtered Invoices */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLedgerTab('expenses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors flex items-center gap-1.5 ${
              ledgerTab === 'expenses'
                ? 'bg-rose-500 text-white shadow-sm'
                : isDarkMode
                ? 'bg-[#0B1528] text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Expenses Ledger ({searchedExpenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setLedgerTab('bills')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors flex items-center gap-1.5 ${
              ledgerTab === 'bills'
                ? 'bg-[#D4AF37] text-[#0B1F44] shadow-sm'
                : isDarkMode
                ? 'bg-[#0B1528] text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Revenue Invoices ({searchedBills.length})</span>
          </button>
        </div>

        {/* TABLE 1: EXPENSES DRILLDOWN */}
        {ledgerTab === 'expenses' && (
          <div className="overflow-x-auto [scrollbar-width:none]">
            {searchedExpenses.length === 0 ? (
              <div className={`p-8 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                No expense transactions match the current slicers or search query.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-2.5 px-3 font-bold">Date</th>
                    <th className="py-2.5 px-3 font-bold">Category</th>
                    <th className="py-2.5 px-3 font-bold">Description / Note</th>
                    <th className="py-2.5 px-3 font-bold">Payment Mode</th>
                    <th className="py-2.5 px-3 font-bold">Logged Staff</th>
                    <th className="py-2.5 px-3 font-bold text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {searchedExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className={`hover:bg-white/5 transition-colors ${
                        selectedExpenseCat.toLowerCase() === (exp.cat || '').toLowerCase()
                          ? isDarkMode ? 'bg-[#0B1528]' : 'bg-rose-50/50'
                          : ''
                      }`}
                    >
                      <td className={`py-2.5 px-3 whitespace-nowrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {exp.date ? exp.date.slice(0, 10) : todayStr}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap">
                          {exp.cat || 'Other'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {exp.note || 'General expense'}
                      </td>
                      <td className={`py-2.5 px-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {exp.pm || 'Cash'}
                      </td>
                      <td className={`py-2.5 px-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {exp.staff || 'Salon General'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-400 whitespace-nowrap">
                        ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TABLE 2: BILLS DRILLDOWN */}
        {ledgerTab === 'bills' && (
          <div className="overflow-x-auto [scrollbar-width:none]">
            {searchedBills.length === 0 ? (
              <div className={`p-8 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                No billing invoices match the current slicers or search query.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-2.5 px-3 font-bold">Date & Time</th>
                    <th className="py-2.5 px-3 font-bold">Client Name</th>
                    <th className="py-2.5 px-3 font-bold">Stylist</th>
                    <th className="py-2.5 px-3 font-bold">Services Performed</th>
                    <th className="py-2.5 px-3 font-bold">Mode</th>
                    <th className="py-2.5 px-3 font-bold text-right">Total (₹)</th>
                    <th className="py-2.5 px-3 font-bold text-right">Paid (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {searchedBills.map((b) => (
                    <tr
                      key={b.id}
                      className={`hover:bg-white/5 transition-colors ${
                        selectedStylist.toLowerCase() === (b.staff || '').toLowerCase()
                          ? isDarkMode ? 'bg-[#0B1528]' : 'bg-amber-50/50'
                          : ''
                      }`}
                    >
                      <td className={`py-2.5 px-3 whitespace-nowrap ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {b.dateStr || todayStr}
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {b.cust}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 whitespace-nowrap">
                          {b.staff || 'Stylist'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 max-w-[200px] truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {(b.items || []).map((i) => i.name).join(', ') || 'Service'}
                      </td>
                      <td className={`py-2.5 px-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {b.mode}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-400 whitespace-nowrap">
                        ₹{(b.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-[#D4AF37] whitespace-nowrap">
                        ₹{(b.paidAmount || b.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
