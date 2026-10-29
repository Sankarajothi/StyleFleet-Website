'use client';

import React, { useState, useMemo } from 'react';
import { useSalon, Bill, StaffMember, Customer, Expense } from '@/components/SalonContext';
import { AnimatedCounter } from '@/components/animated-counter';
import { matchStaffName } from '@/lib/salon-helpers';

type PeriodFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
type LedgerTab = 'expenses' | 'bills' | 'pending';

export function DeepAnalyticsView() {
  const {
    bills,
    expenses,
    staff,
    services,
    customers,
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

  // Interactive chart hover states
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: string; slot: string; rev: number; count: number } | null>(null);

  // Helper date utilities using local calendar
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
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

  const isBillYesterday = (b: Bill): boolean => {
    if (b.isYesterday) return true;
    if (b.createdAt && b.createdAt.startsWith(yesterdayStr)) return true;
    if (b.dateStr && b.dateStr.startsWith(yesterdayStr)) return true;
    if (b.dateStr) {
      const d = new Date(b.dateStr);
      if (!isNaN(d.getTime())) {
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dStr === yesterdayStr) return true;
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

  const isExpenseYesterday = (e: Expense): boolean => {
    if (!e.date) return false;
    return e.date.startsWith(yesterdayStr);
  };

  // Distinct list of expense categories present in data
  const distinctExpenseCategories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      const cat = (e.cat || 'Other').trim();
      if (cat) set.add(cat);
    });
    if (set.size === 0) {
      ['Products & stock', 'Maintenance', 'Staff salaries', 'Electricity & utility', 'Rent', 'Tea & Snacks', 'Other'].forEach(c => set.add(c));
    }
    return Array.from(set).sort();
  }, [expenses]);

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
        const matchesSelected = matchStaffName(b.staff, selectedStylist) ||
          (staff.length === 1 && staff[0].name.toLowerCase() === selectedStylist.toLowerCase());
        if (!matchesSelected) return false;
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

      // Stylist Slicer filter
      if (selectedStylist !== 'all') {
        if (!e.staff || e.staff.trim().toLowerCase() !== selectedStylist.trim().toLowerCase()) {
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

  // Baseline comparison (Yesterday / Prior Period)
  const baselineStats = useMemo(() => {
    const yesterdayBills = bills.filter((b) => !b.isDeleted && isBillYesterday(b));
    const yesterdayExpenses = expenses.filter((e) => isExpenseYesterday(e));

    const yRev = yesterdayBills.reduce((acc, b) => acc + (b.paidAmount || b.total || 0), 0);
    const yExp = yesterdayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const yNet = Math.max(0, yRev - yExp);

    const revGrowthPct = yRev > 0 ? Math.round(((grossSales - yRev) / yRev) * 100) : 0;
    const profitGrowthPct = yNet > 0 ? Math.round(((netProfit - yNet) / yNet) * 100) : 0;

    return {
      yRev,
      yExp,
      yNet,
      revGrowthPct,
      profitGrowthPct,
    };
  }, [bills, expenses, grossSales, netProfit, yesterdayStr]);

  // ================= 4. BEST PEAK INTELLIGENCE (BEST DAY, BEST WEEK, BEST PEAK HOUR, PEAK DAY OF WEEK) =================
  // 4a. BEST DAY (Highest revenue day in salon database)
  const dailyAggregates = useMemo(() => {
    const map: Record<string, { dateKey: string; displayDate: string; rev: number; count: number }> = {};

    bills.forEach((b) => {
      if (b.isDeleted) return;
      const rev = b.paidAmount || b.total || 0;
      let dateKey = todayStr;
      let display = 'Today';

      if (!b.isToday) {
        if (b.createdAt) {
          dateKey = b.createdAt.slice(0, 10);
          const d = new Date(b.createdAt);
          if (!isNaN(d.getTime())) {
            display = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          }
        } else if (b.dateStr) {
          dateKey = b.dateStr.slice(0, 10);
          display = b.dateStr;
        }
      }

      if (!map[dateKey]) {
        map[dateKey] = { dateKey, displayDate: display, rev: 0, count: 0 };
      }
      map[dateKey].rev += rev;
      map[dateKey].count += 1;
    });

    return Object.values(map);
  }, [bills, todayStr]);

  const bestDay = useMemo(() => {
    if (dailyAggregates.length === 0) return null;
    return [...dailyAggregates].sort((a, b) => b.rev - a.rev)[0];
  }, [dailyAggregates]);

  // 4b. BEST WEEK (Highest revenue calendar week)
  const weeklyAggregates = useMemo(() => {
    const map: Record<string, { weekKey: string; label: string; rev: number; count: number }> = {};

    bills.forEach((b) => {
      if (b.isDeleted) return;
      const rev = b.paidAmount || b.total || 0;
      const t = getBillTimestamp(b) || now.getTime();
      const d = new Date(t);

      const oneJan = new Date(d.getFullYear(), 0, 1);
      const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
      const weekKey = `${d.getFullYear()}-W${weekNum}`;
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const label = `Week ${weekNum} (${monthShort})`;

      if (!map[weekKey]) {
        map[weekKey] = { weekKey, label, rev: 0, count: 0 };
      }
      map[weekKey].rev += rev;
      map[weekKey].count += 1;
    });

    return Object.values(map);
  }, [bills, now]);

  const bestWeek = useMemo(() => {
    if (weeklyAggregates.length === 0) return null;
    return [...weeklyAggregates].sort((a, b) => b.rev - a.rev)[0];
  }, [weeklyAggregates]);

  // 4c. BEST PEAK HOUR (Highest rush slot across all bills)
  const hourlySlotAggregates = useMemo(() => {
    const slots = [
      { label: '9:00 AM – 11:00 AM', startH: 9, endH: 11 },
      { label: '11:00 AM – 1:00 PM', startH: 11, endH: 13 },
      { label: '1:00 PM – 3:00 PM', startH: 13, endH: 15 },
      { label: '3:00 PM – 5:00 PM', startH: 15, endH: 17 },
      { label: '5:00 PM – 7:00 PM', startH: 17, endH: 19 },
      { label: '7:00 PM – 9:00 PM', startH: 19, endH: 21 },
      { label: '9:00 PM+', startH: 21, endH: 24 },
    ];

    return slots.map((s) => {
      let rev = 0;
      let count = 0;
      bills.forEach((b) => {
        if (b.isDeleted) return;
        const h = getBillHour(b);
        if (h >= s.startH && h < s.endH) {
          rev += b.paidAmount || b.total || 0;
          count += 1;
        }
      });
      return { ...s, rev, count };
    });
  }, [bills]);

  const bestPeakHour = useMemo(() => {
    if (hourlySlotAggregates.length === 0) return null;
    return [...hourlySlotAggregates].sort((a, b) => b.rev - a.rev)[0];
  }, [hourlySlotAggregates]);

  // 4d. WHICH DAY IN THE WEEK HAD MORE PEAK
  const dayOfWeekAnalytics = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const map: Record<string, { day: string; rev: number; count: number; isWeekend: boolean }> = {};
    days.forEach((d, idx) => {
      map[d] = { day: d, rev: 0, count: 0, isWeekend: idx === 0 || idx === 6 };
    });

    bills.forEach((b) => {
      if (b.isDeleted) return;
      const rev = b.paidAmount || b.total || 0;
      let dObj = new Date();
      if (b.createdAt) {
        const d = new Date(b.createdAt);
        if (!isNaN(d.getTime())) dObj = d;
      } else if (b.dateStr) {
        const d = new Date(b.dateStr);
        if (!isNaN(d.getTime())) dObj = d;
      }
      const dayName = days[dObj.getDay()];
      map[dayName].rev += rev;
      map[dayName].count += 1;
    });

    const list = Object.values(map);
    const weekdayList = list.filter((d) => !d.isWeekend);
    const avgWeekdayRev = weekdayList.reduce((acc, d) => acc + d.rev, 0) / Math.max(1, weekdayList.length);

    const sortedByRev = [...list].sort((a, b) => b.rev - a.rev);
    const peakDay = sortedByRev[0];
    const peakOverWeekdayPct = avgWeekdayRev > 0
      ? Math.round(((peakDay.rev - avgWeekdayRev) / avgWeekdayRev) * 100)
      : 0;

    return {
      list,
      peakDay,
      peakOverWeekdayPct,
      avgWeekdayRev,
    };
  }, [bills]);

  // ================= 5. STYLIST PERFORMANCE REPORT =================
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
    const targetStaff = selectedStylist !== 'all'
      ? staff.filter((st) => st.name.toLowerCase() === selectedStylist.toLowerCase())
      : staff;

    const singleRegisteredStaff = staff.length === 1 ? staff[0].name.trim() : null;

    return targetStaff.map((st) => {
      const stylistBills = filteredBills.filter((b) => {
        if (!b.staff) return singleRegisteredStaff === st.name;
        if (singleRegisteredStaff && singleRegisteredStaff.toLowerCase() === st.name.toLowerCase()) {
          // If only 1 registered stylist in shop, any salon bill belongs to this stylist
          return true;
        }
        return matchStaffName(b.staff, st.name);
      });

      const revenue = stylistBills.reduce((acc, b) => acc + (b.paidAmount || b.total || 0), 0);
      const servicesBilled = stylistBills.reduce((acc, b) => acc + (b.items?.length || 1), 0);
      const commRate = st.commissionRate || 15;
      const commissionEarned = Math.round((revenue * commRate) / 100);
      const netToSalon = Math.max(0, revenue - commissionEarned);

      const multiItemBills = stylistBills.filter((b) => (b.items?.length || 0) >= 2).length;
      const upsellRate = stylistBills.length > 0 ? Math.round((multiItemBills / stylistBills.length) * 100) : 0;

      const repeatBills = stylistBills.filter((b) => {
        const key = b.phone || b.cust.toLowerCase();
        return key && repeatClientIdentifiers.has(key);
      }).length;
      const repeatClientRate = stylistBills.length > 0 ? Math.round((repeatBills / stylistBills.length) * 100) : 0;

      const storeShare = grossSales > 0 ? Math.round((revenue / grossSales) * 100) : 0;
      const avgBill = stylistBills.length > 0 ? Math.round(revenue / stylistBills.length) : 0;

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

  // ================= 6. EXPENSE CATEGORIES INTELLIGENCE =================
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

    const sortedByFrequency = [...list].sort((a, b) => b.count - a.count);
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

  // ================= 7. PENDING COMPLETE DETAILED REPORT =================
  // Debtor clients with positive due balances
  const debtorClients = useMemo(() => {
    return customers
      .filter((c) => (c.due || 0) > 0)
      .sort((a, b) => (b.due || 0) - (a.due || 0));
  }, [customers]);

  const totalOutstandingDues = useMemo(() => {
    return debtorClients.reduce((sum, c) => sum + (c.due || 0), 0);
  }, [debtorClients]);

  const avgPendingPerDebtor = debtorClients.length > 0
    ? Math.round(totalOutstandingDues / debtorClients.length)
    : 0;

  // Unpaid or partially paid bills in database
  const pendingBillsList = useMemo(() => {
    return bills
      .filter((b) => !b.isDeleted && ((b.dueAmount && b.dueAmount > 0) || b.status === 'partially_paid' || b.status === 'pending'))
      .sort((a, b) => (b.dueAmount || 0) - (a.dueAmount || 0));
  }, [bills]);

  // Send WhatsApp Payment Reminder to Client
  const handleSendReminderWhatsApp = (clientName: string, phone: string, dueAmount: number) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const sName = shopProfile.shopName || 'StyleFleet Salon';
    const message = `Hello ${clientName}! ✨ Greetings from ${sName}.\n\nThis is a gentle reminder regarding your outstanding salon khata balance of ₹${dueAmount.toLocaleString('en-IN')}.\n\nYou can clear this conveniently via UPI or cash on your next visit. We look forward to serving you again soon! 💇‍♀️💅`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/91${cleanPhone}?text=${encoded}`, '_blank');
    showToast(`WhatsApp reminder prepared for ${clientName}`);
  };

  // ================= 8. POWER BI DUAL CASHFLOW TIMELINE =================
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

  // ================= 9. PEAK HOURS HEATMAP =================
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

  // ================= 10. INTERACTIVE DRILL-DOWN LEDGER SEARCH =================
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

  const searchedDebtors = useMemo(() => {
    if (!ledgerSearch.trim()) return debtorClients;
    const q = ledgerSearch.toLowerCase();
    return debtorClients.filter((c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      String(c.due).includes(q)
    );
  }, [debtorClients, ledgerSearch]);

  const isAnyFilterActive = period !== 'today' || selectedStylist !== 'all' || selectedExpenseCat !== 'all' || selectedPaymentMode !== 'all';

  const handleResetFilters = () => {
    setPeriod('today');
    setSelectedStylist('all');
    setSelectedExpenseCat('all');
    setSelectedPaymentMode('all');
    setLedgerSearch('');
    showToast('All intelligence filters reset to Today');
  };

  // Export Executive Summary to CSV (Excel with UTF-8 BOM)
  const handleExportCSV = () => {
    let csv = `\uFEFFSTYLEFLEET SALON INTELLIGENCE & BUSINESS EXECUTIVE REPORT\n`;
    csv += `Salon:,"${shopProfile.shopName || 'StyleFleet Salon'}"\n`;
    csv += `Period:,"${period.toUpperCase()}"\n`;
    csv += `Generated:,"${new Date().toLocaleString('en-IN')}"\n\n`;

    csv += `1. EXECUTIVE P&L & PEAK MILESTONES\n`;
    csv += `Metric,Value,Period Context\n`;
    csv += `Gross Sales Revenue (INR),${grossSales},${period.toUpperCase()}\n`;
    csv += `Salon Operating Expenses (INR),${totalExpensesAmt},${period.toUpperCase()}\n`;
    csv += `Net Salon Profit (INR),${netProfit},${period.toUpperCase()}\n`;
    csv += `Profit Margin %,${profitMarginPct}%,${period.toUpperCase()}\n`;
    csv += `Best Peak Day in History,"${bestDay ? `${bestDay.displayDate} (INR ${bestDay.rev})` : 'N/A'}",${period.toUpperCase()}\n`;
    csv += `Best Week in History,"${bestWeek ? `${bestWeek.label} (INR ${bestWeek.rev})` : 'N/A'}",${period.toUpperCase()}\n`;
    csv += `Best Peak Hour Slot,"${bestPeakHour ? `${bestPeakHour.label} (INR ${bestPeakHour.rev})` : 'N/A'}",${period.toUpperCase()}\n`;
    csv += `Peak Day of Week,"${dayOfWeekAnalytics.peakDay.day} (INR ${dayOfWeekAnalytics.peakDay.rev})",${period.toUpperCase()}\n`;
    csv += `Mostly Used Expense Category,"${expenseCategoryAnalytics.mostFrequentCat ? `${expenseCategoryAnalytics.mostFrequentCat.cat} (${expenseCategoryAnalytics.mostFrequentCat.count} entries)` : 'N/A'}",${period.toUpperCase()}\n`;
    csv += `Highest Cost Center Category,"${expenseCategoryAnalytics.highestSpendCat ? `${expenseCategoryAnalytics.highestSpendCat.cat} (INR ${expenseCategoryAnalytics.highestSpendCat.totalAmount})` : 'N/A'}",${period.toUpperCase()}\n`;
    csv += `Total Outstanding Customer Khata (INR),${totalOutstandingDues},${period.toUpperCase()}\n`;
    csv += `Clients with Pending Balances,${debtorClients.length},${period.toUpperCase()}\n\n`;

    csv += `2. STYLIST PERFORMANCE LEADERBOARD\n`;
    csv += `Rank,Stylist Name,Role,Station,Revenue (INR),Bills Count,Avg Ticket (INR),Upsell %,Repeat %,Net to Salon (INR)\n`;
    staffPerformanceList.forEach((st, idx) => {
      csv += `${idx + 1},"${st.name}","${st.role}","${st.chair}",${st.revenue},${st.billsCount},${st.avgBill},${st.upsellRate}%,${st.repeatClientRate}%,${st.netToSalon}\n`;
    });
    csv += `\n`;

    csv += `3. EXPENSE CATEGORIES BREAKDOWN\n`;
    csv += `Category,Total Spent (INR),Frequency Count,Spend Share %,Avg Per Entry (INR),Highest Single (INR)\n`;
    expenseCategoryAnalytics.categories.forEach((c) => {
      csv += `"${c.cat}",${c.totalAmount},${c.count},${c.pctSpend}%,${c.avgPerEntry},${c.highestSingle}\n`;
    });
    csv += `\n`;

    csv += `4. OUTSTANDING CUSTOMER KHATA BALANCES\n`;
    csv += `Client Name,Phone,Visits,Lifetime Spend (INR),Pending Due (INR),Last Visit\n`;
    debtorClients.forEach((c) => {
      csv += `"${c.name}","+91 ${c.phone}",${c.visits || 1},${c.spend || 0},${c.due || 0},"${c.lastVisit || todayStr}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salon_intelligence_${period}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Salon Intelligence executive Excel (.csv) downloaded!');
  };

  // Generate Executive Intelligence PDF Report
  const handleGeneratePdf = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      showToast('Popup blocker prevented PDF generation. Please allow popups.', 'error');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>StyleFleet Salon Intelligence - ${period.toUpperCase()}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; padding: 32px; margin: 0; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 800; color: #0f172a; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; }
          .card-title { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; }
          .card-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 6px; }
          .section-title { font-size: 16px; font-weight: 700; margin: 24px 0 12px; color: #0f172a; border-left: 4px solid #D4AF37; padding-left: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
          th { text-align: left; padding: 10px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-weight: 700; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .text-right { text-align: right; }
          .gold { color: #8C6239; font-weight: 800; }
          .rose { color: #e11d48; font-weight: 700; }
          .emerald { color: #059669; font-weight: 800; }
          .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${shopProfile.shopName || 'StyleFleet Salon'}</div>
            <div class="subtitle">Salon Intelligence & Executive Audit Report · ${period.toUpperCase()}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: bold;">Date: ${new Date().toLocaleDateString('en-IN')}</div>
            <div style="font-size: 11px; color: #64748b;">Phone: +91 ${shopProfile.phone || '9876543210'}</div>
          </div>
        </div>

        <div class="kpis">
          <div class="card">
            <div class="card-title">Gross Billed Sales</div>
            <div class="card-val gold">₹${grossSales.toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-title">Operating Expenses</div>
            <div class="card-val rose">₹${totalExpensesAmt.toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-title">Net Salon Profit</div>
            <div class="card-val emerald">₹${netProfit.toLocaleString('en-IN')} (${profitMarginPct}%)</div>
          </div>
          <div class="card">
            <div class="card-title">Pending Khata Dues</div>
            <div class="card-val">₹${totalOutstandingDues.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="section-title">Peak Milestones & Outflow Highlights</div>
        <table>
          <tbody>
            <tr><td><strong>🌟 Best Peak Day</strong></td><td>${bestDay ? `${bestDay.displayDate} (₹${bestDay.rev.toLocaleString('en-IN')}, ${bestDay.count} clients)` : 'N/A'}</td></tr>
            <tr><td><strong>📅 Best Week</strong></td><td>${bestWeek ? `${bestWeek.label} (₹${bestWeek.rev.toLocaleString('en-IN')})` : 'N/A'}</td></tr>
            <tr><td><strong>⚡ Best Peak Hour</strong></td><td>${bestPeakHour ? `${bestPeakHour.label} (₹${bestPeakHour.rev.toLocaleString('en-IN')}, ${bestPeakHour.count} invoices)` : 'N/A'}</td></tr>
            <tr><td><strong>🚀 Peak Day of Week</strong></td><td>${dayOfWeekAnalytics.peakDay.day} (₹${dayOfWeekAnalytics.peakDay.rev.toLocaleString('en-IN')} turnover)</td></tr>
            <tr><td><strong>📊 Mostly Used Expense Category</strong></td><td>${expenseCategoryAnalytics.mostFrequentCat ? `${expenseCategoryAnalytics.mostFrequentCat.cat} (${expenseCategoryAnalytics.mostFrequentCat.count} entries, ₹${expenseCategoryAnalytics.mostFrequentCat.totalAmount.toLocaleString('en-IN')})` : 'N/A'}</td></tr>
            <tr><td><strong>💰 Highest Spend Category</strong></td><td>${expenseCategoryAnalytics.highestSpendCat ? `${expenseCategoryAnalytics.highestSpendCat.cat} (₹${expenseCategoryAnalytics.highestSpendCat.totalAmount.toLocaleString('en-IN')})` : 'N/A'}</td></tr>
          </tbody>
        </table>

        <div class="section-title">Stylist Performance Leaderboard</div>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Stylist Name</th>
              <th>Role</th>
              <th class="text-right">Bills</th>
              <th class="text-right">Gross Revenue (₹)</th>
              <th class="text-right">Upsell %</th>
              <th class="text-right">Repeat %</th>
              <th class="text-right">Net to Salon (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${staffPerformanceList.map((st, idx) => `
              <tr>
                <td>#${idx + 1}</td>
                <td><strong>${st.name}</strong></td>
                <td>${st.role}</td>
                <td class="text-right">${st.billsCount}</td>
                <td class="text-right gold">₹${st.revenue.toLocaleString('en-IN')}</td>
                <td class="text-right">${st.upsellRate}%</td>
                <td class="text-right">${st.repeatClientRate}%</td>
                <td class="text-right emerald">₹${st.netToSalon.toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Outstanding Debtor Clients (${debtorClients.length} accounts)</div>
        <table>
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Phone</th>
              <th>Visits / Spend</th>
              <th>Last Visit</th>
              <th class="text-right">Pending Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${debtorClients.slice(0, 15).map(c => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>+91 ${c.phone}</td>
                <td>${c.visits || 1} visits · ₹${(c.spend || 0).toLocaleString('en-IN')} spend</td>
                <td>${c.lastVisit || todayStr}</td>
                <td class="text-right" style="color: #d97706; font-weight: bold;">₹${(c.due || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by StyleFleet Web Salon Management Platform · Confidential Executive Audit
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 400);
    showToast('Salon Intelligence PDF report generated!');
  };

  return (
    <section className="space-y-7 animate-fadeIn pb-24">
      {/* ================= 1. HEADER & POWER BI TITLE ================= */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm ${
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
              Peak performance, profit comparison, stylist leaderboard, expense outflow & complete pending receivables
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
              <span>Reset Slicers</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGeneratePdf}
            className="px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors bg-rose-600/15 border-rose-500/40 text-rose-400 hover:bg-rose-600/25 active:scale-95 shadow-sm"
            title="Generate printable executive intelligence PDF"
          >
            <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
            </svg>
            <span className="hidden sm:inline">Generate PDF Report</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors active:scale-95 shadow-sm ${
              isDarkMode
                ? 'bg-[#121B33] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                : 'bg-white border-emerald-500/40 text-emerald-600 hover:bg-emerald-50'
            }`}
            title="Download complete intelligence Excel (.csv) spreadsheet"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Download Excel</span>
            <span className="sm:hidden">Excel</span>
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
            Click any stylist, category, or card to filter
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
              Active Slicers:
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

      {/* ================= 3. TOP OF SALON INTELLIGENCE: PROFIT COMPARISON & PEAK PERFORMANCE HIGHLIGHTS ================= */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <h3 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Peak Intelligence & Profit Comparison
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#D4AF37] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
            Real Database Milestones
          </span>
        </div>

        {/* 3A. PROFIT COMPARISON CARD (EXECUTIVE P&L) */}
        <div
          className={`p-6 rounded-3xl border transition-all ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Salon Profit Comparison · Revenue vs Expense Margin
              </span>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Net cashflow efficiency comparing gross revenue against operational expenses for {period.toUpperCase()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                profitMarginPct >= 50
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              }`}>
                {profitMarginPct}% Net Margin ({profitMarginPct >= 50 ? 'High Profitability' : 'Moderate Profitability'})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {/* 1. Gross Revenue */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B1528] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Gross Billed Revenue</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                  {billCount} invoices
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-black text-[#D4AF37]">₹</span>
                <strong className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <AnimatedCounter value={grossSales} />
                </strong>
              </div>
              <div className="mt-2 text-[10px] flex items-center justify-between text-slate-400 border-t border-white/5 pt-1.5">
                <span>Avg Ticket: ₹{avgTicket.toLocaleString('en-IN')}</span>
                {period === 'today' && (
                  <span className={baselineStats.revGrowthPct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {baselineStats.revGrowthPct >= 0 ? `+${baselineStats.revGrowthPct}%` : `${baselineStats.revGrowthPct}%`} vs yesterday
                  </span>
                )}
              </div>
            </div>

            {/* 2. Total Outflow Expenses */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B1528] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Operating Expenses Outflow</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                  {filteredExpenses.length} entries
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-black text-rose-400">₹</span>
                <strong className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <AnimatedCounter value={totalExpensesAmt} />
                </strong>
              </div>
              <div className="mt-2 text-[10px] flex items-center justify-between text-slate-400 border-t border-white/5 pt-1.5">
                <span>Outflow Share: {grossSales > 0 ? Math.round((totalExpensesAmt / grossSales) * 100) : 0}%</span>
                <span className="text-rose-400 font-medium truncate max-w-[120px]">
                  Top: {expenseCategoryAnalytics.mostFrequentCat?.cat || 'General'}
                </span>
              </div>
            </div>

            {/* 3. Net Salon Profit */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B1528] border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-300'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold">Net Operating Profit</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  Take-Home
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-black text-emerald-400">₹</span>
                <strong className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <AnimatedCounter value={netProfit} />
                </strong>
              </div>
              <div className="mt-2 text-[10px] flex items-center justify-between text-slate-400 border-t border-white/5 pt-1.5">
                <span className="text-emerald-400 font-bold">{profitMarginPct}% profit retained</span>
                {period === 'today' && (
                  <span className={baselineStats.profitGrowthPct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {baselineStats.profitGrowthPct >= 0 ? `+${baselineStats.profitGrowthPct}%` : `${baselineStats.profitGrowthPct}%`} profit
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3B. THE 4 BEST PEAK INTELLIGENCE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: BEST DAY */}
          <div
            className={`p-5 rounded-3xl border transition-all ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858] hover:border-[#D4AF37]/50' : 'bg-white border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                The Best Day
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37]">
                Record High
              </span>
            </div>
            <div className="mt-3">
              <strong className={`text-lg font-black block truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {bestDay?.displayDate || 'Today'}
              </strong>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-sm font-black text-[#D4AF37]">₹</span>
                <span className="text-2xl font-black text-[#D4AF37]">
                  {(bestDay?.rev || grossSales).toLocaleString('en-IN')}
                </span>
              </div>
              <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {bestDay?.count || billCount} clients served on peak day
              </span>
            </div>
          </div>

          {/* Card 2: THE BEST WEEK */}
          <div
            className={`p-5 rounded-3xl border transition-all ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858] hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                The Best Week
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                Peak Turnover
              </span>
            </div>
            <div className="mt-3">
              <strong className={`text-lg font-black block truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {bestWeek?.label || 'Current Week'}
              </strong>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-sm font-black text-emerald-400">₹</span>
                <span className="text-2xl font-black text-emerald-400">
                  {(bestWeek?.rev || grossSales).toLocaleString('en-IN')}
                </span>
              </div>
              <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {bestWeek?.count || billCount} customer invoices billed in 7 days
              </span>
            </div>
          </div>

          {/* Card 3: THE BEST PEAK HOUR */}
          <div
            className={`p-5 rounded-3xl border transition-all ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858] hover:border-sky-500/50' : 'bg-white border-slate-200 hover:border-sky-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                The Best Peak Hour
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400">
                Rush Window
              </span>
            </div>
            <div className="mt-3">
              <strong className={`text-lg font-black block truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {bestPeakHour?.label || '5:00 PM – 7:00 PM'}
              </strong>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-sm font-black text-sky-400">₹</span>
                <span className="text-2xl font-black text-sky-400">
                  {(bestPeakHour?.rev || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {bestPeakHour?.count || 0} clients served during peak hour rush
              </span>
            </div>
          </div>

          {/* Card 4: WHICH DAY IN THE WEEK HAD MORE PEAK */}
          <div
            className={`p-5 rounded-3xl border transition-all ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858] hover:border-amber-400/50' : 'bg-white border-slate-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                Peak Day of Week
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                Weekly King
              </span>
            </div>
            <div className="mt-3">
              <strong className={`text-lg font-black block truncate ${isDarkMode ? 'text-amber-400' : 'text-amber-900'}`}>
                {dayOfWeekAnalytics.peakDay.day} Peak Rush
              </strong>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-sm font-black text-amber-400">₹</span>
                <span className="text-2xl font-black text-amber-400">
                  {dayOfWeekAnalytics.peakDay.rev.toLocaleString('en-IN')}
                </span>
              </div>
              <span className={`text-[11px] block mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {dayOfWeekAnalytics.peakOverWeekdayPct > 0 ? `+${dayOfWeekAnalytics.peakOverWeekdayPct}%` : 'Higher than'} weekday baseline ({dayOfWeekAnalytics.peakDay.count} clients)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. STYLIST PERFORMANCE REPORT (ON TOP AS REQUESTED) ================= */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Stylist Performance Report & ROI Leaderboard
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                Revenue, Upsell & Retention
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Ranked by revenue contribution with commission breakdown, upsell conversion rate & repeat client retention
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
                      ? 'bg-[#0B1528] border-[#D4AF37] ring-2 ring-[#D4AF37]/20 shadow-md'
                      : 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-md'
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
                      {st.billsCount} bills ({st.storeShare}% store share)
                    </span>
                  </div>
                </div>

                {/* Horizontal Revenue Bar */}
                <div className="w-full bg-slate-700/30 h-2 rounded-full overflow-hidden mb-3">
                  <div style={{ width: `${barWidth}%` }} className="h-full bg-[#D4AF37] rounded-full" />
                </div>

                {/* Metric Sub-Grid */}
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

      {/* ================= 5. CASHFLOW DYNAMICS & 7-DAY PEAK RUSH HEATMAP ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dynamic Cashflow Chart */}
        <div
          className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Cashflow Dynamics · Sales vs Outflow
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Shift velocity for {period.toUpperCase()} across operating hours
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-[#D4AF37] flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" /> Revenue
              </span>
              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Outflow
              </span>
            </div>
          </div>

          <div className="relative pt-2">
            <svg viewBox="0 0 640 180" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {revAreaPath && <path d={revAreaPath} fill="url(#goldGradient)" />}

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
                const isHovered = hoveredPointIdx === idx;

                return (
                  <g key={d.label}>
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

            {hoveredPointIdx !== null && runningTimelineData[hoveredPointIdx] && (
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs mt-3 animate-fadeIn ${
                  isDarkMode ? 'bg-[#0B1528] border-[#D4AF37]/40 text-white' : 'bg-amber-50 border-amber-300 text-slate-900'
                }`}
              >
                <div>
                  Shift: <strong className="text-[#D4AF37]">{runningTimelineData[hoveredPointIdx].label}</strong>
                </div>
                <div className="flex items-center gap-3">
                  <span>Rev: <strong className="text-[#D4AF37]">₹{runningTimelineData[hoveredPointIdx].runningRev.toLocaleString('en-IN')}</strong></span>
                  <span>Exp: <strong className="text-rose-400">₹{runningTimelineData[hoveredPointIdx].runningExp.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Peak Rush Heatmap */}
        <div
          className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
            isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                7-Day Peak Rush Density
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Rushes vs slowest lulls across shifts
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span className="text-slate-400">Low</span>
              <span className="w-2.5 h-2.5 rounded bg-amber-500/30" />
              <span className="w-2.5 h-2.5 rounded bg-[#D4AF37]" />
              <span className="text-[#D4AF37]">Peak</span>
            </div>
          </div>

          <div className="overflow-x-auto [scrollbar-width:none]">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr>
                  <th className={`p-1.5 text-left text-[11px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Day</th>
                  {heatmapSlots.map((s) => (
                    <th key={s} className={`p-1.5 text-[9px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.split(' ')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapDays.map((d) => (
                  <tr key={d} className="border-t border-white/5">
                    <td className={`p-1 text-left font-bold text-[11px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{d}</td>
                    {heatmapSlots.map((s) => {
                      const cell = heatmapMatrix[d]?.[s] || { rev: 0, count: 0 };
                      const intensity = maxHeatmapRev > 0 ? cell.rev / maxHeatmapRev : 0;
                      let bgClass = isDarkMode ? 'bg-[#0B1528] text-slate-500' : 'bg-slate-100 text-slate-400';
                      if (intensity > 0.7) bgClass = 'bg-[#D4AF37] text-[#0B1F44] font-black';
                      else if (intensity > 0.3) bgClass = 'bg-amber-500/40 text-white font-bold';
                      else if (cell.count > 0) bgClass = isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700';

                      return (
                        <td key={s} className="p-0.5">
                          <div
                            onMouseEnter={() => setHoveredCell({ day: d, slot: s, rev: cell.rev, count: cell.count })}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`w-full py-1.5 rounded-lg text-[9px] transition-colors cursor-pointer ${bgClass}`}
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
            <div className={`p-2.5 rounded-xl border text-xs animate-fadeIn flex items-center justify-between ${
              isDarkMode ? 'bg-[#0E1528] border-[#D4AF37]/40 text-white' : 'bg-amber-50 border-amber-300 text-slate-900'
            }`}>
              <span>{hoveredCell.day} · {hoveredCell.slot}</span>
              <strong className="text-[#D4AF37]">₹{hoveredCell.rev.toLocaleString('en-IN')} ({hoveredCell.count} invoices)</strong>
            </div>
          )}
        </div>
      </div>

      {/* ================= 6. GO DOWN TO THE EXPENSE REPORT (AS USER REQUESTED) ================= */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Salon Expense Report & Outflow Intelligence
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                Frequency vs Spend
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Detailed breakdown of which category expenses are mostly used in the salon and where cash goes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-400">
              Total Expenses: ₹{totalExpensesAmt.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Top 2 Outflow Cards: Most Frequent vs Highest Spend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Most Frequently Used Category */}
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
                Mostly Used Category (Highest Frequency)
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
                  Avg: ₹{(expenseCategoryAnalytics.mostFrequentCat?.avgPerEntry || 0).toLocaleString('en-IN')} / entry
                </span>
                <span className="text-[10px] font-bold text-amber-400">
                  {expenseCategoryAnalytics.mostFrequentCat?.pctFreq || 0}% frequency share
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Highest Total Cost Center */}
          <div
            onClick={() => {
              if (expenseCategoryAnalytics.highestSpendCat) {
                setSelectedExpenseCat(
                  selectedExpenseCat === expenseCategoryAnalytics.highestSpendCat.cat
                    ? 'all'
                    : expenseCategoryAnalytics.highestSpendCat.cat
                );
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
                Highest Spend Category (Cost Center)
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
          {expenseCategoryAnalytics.categories.map((c, idx) => {
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

                <div className="w-full bg-slate-700/30 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(5, c.pctSpend)}%` }}
                    className="h-full bg-rose-400 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] mt-2 pt-1 border-t border-white/5 flex-wrap gap-1">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                    Average per entry: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>₹{c.avgPerEntry.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                    Single largest receipt: <strong className="text-rose-400">₹{c.highestSingle.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="text-sky-400 font-bold">
                    {isSelected ? '✓ Filter active' : 'Click to filter ledger ↓'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 7. THE PENDING COMPLETE DETAILED REPORT (AS USER REQUESTED) ================= */}
      <div
        className={`p-6 rounded-3xl border space-y-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                The Pending Complete Detailed Report · Khata & Receivables
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                100% Real Debtor Ledger
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Full client-by-client pending khata dues with 1-click WhatsApp payment reminders and invoice tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-400 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30">
              Total Outstanding: ₹{totalOutstandingDues.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* 3 Summary KPIs for Receivables */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B1528] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Total Pending Dues
            </span>
            <strong className="text-2xl font-black text-amber-400 block mt-1">
              ₹{totalOutstandingDues.toLocaleString('en-IN')}
            </strong>
            <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Total uncollected revenue in khata
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B1528] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Clients with Balances
            </span>
            <strong className={`text-2xl font-black block mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {debtorClients.length} clients
            </strong>
            <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Debtor profiles currently tracked
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B1528] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Avg Overdue per Client
            </span>
            <strong className="text-2xl font-black text-sky-400 block mt-1">
              ₹{avgPendingPerDebtor.toLocaleString('en-IN')}
            </strong>
            <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Average outstanding per debtor
            </span>
          </div>
        </div>

        {/* Debtor Clients Table */}
        <div className="overflow-x-auto [scrollbar-width:none]">
          {debtorClients.length === 0 ? (
            <div className={`p-8 text-center text-xs rounded-2xl border ${isDarkMode ? 'bg-[#0B1528] border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              ✨ Outstanding balance is clear! No clients currently have pending dues.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <th className="py-2.5 px-3 font-bold">Client Name</th>
                  <th className="py-2.5 px-3 font-bold">Phone Number</th>
                  <th className="py-2.5 px-3 font-bold">Visits / Lifetime</th>
                  <th className="py-2.5 px-3 font-bold">Last Visit</th>
                  <th className="py-2.5 px-3 font-bold text-right">Pending Due (₹)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {debtorClients.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3">
                      <strong className={`block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {c.name}
                      </strong>
                      {c.vip && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                          VIP
                        </span>
                      )}
                    </td>
                    <td className={`py-2.5 px-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      +91 {c.phone}
                    </td>
                    <td className={`py-2.5 px-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {c.visits || 1} visits · ₹{(c.spend || 0).toLocaleString('en-IN')} spend
                    </td>
                    <td className={`py-2.5 px-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {c.lastVisit || todayStr}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-amber-400 text-sm whitespace-nowrap">
                      ₹{(c.due || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSendReminderWhatsApp(c.name, c.phone, c.due || 0)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold cursor-pointer transition-transform active:scale-95 inline-flex items-center gap-1.5"
                        title="Send WhatsApp payment reminder"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.419-.101.824z" />
                        </svg>
                        <span>WhatsApp Reminder</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= 8. INTERACTIVE REAL-DATA LEDGER EXPLORER ================= */}
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
                Drill-Down
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Drill down into verified database records matching the active slicers above
            </p>
          </div>

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

        {/* Tab switch */}
        <div className="flex items-center gap-2 flex-wrap">
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

          <button
            type="button"
            onClick={() => setLedgerTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors flex items-center gap-1.5 ${
              ledgerTab === 'pending'
                ? 'bg-amber-500 text-[#0B1F44] shadow-sm'
                : isDarkMode
                ? 'bg-[#0B1528] text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending Receivables ({debtorClients.length})</span>
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

        {/* TABLE 3: PENDING RECEIVABLES DRILLDOWN */}
        {ledgerTab === 'pending' && (
          <div className="overflow-x-auto [scrollbar-width:none]">
            {searchedDebtors.length === 0 ? (
              <div className={`p-8 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                No pending receivables found matching your search.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-2.5 px-3 font-bold">Client Name</th>
                    <th className="py-2.5 px-3 font-bold">Phone</th>
                    <th className="py-2.5 px-3 font-bold">Total Visits</th>
                    <th className="py-2.5 px-3 font-bold">Last Visit</th>
                    <th className="py-2.5 px-3 font-bold text-right">Pending Khata Due (₹)</th>
                    <th className="py-2.5 px-3 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {searchedDebtors.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className={`py-2.5 px-3 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {c.name}
                      </td>
                      <td className={`py-2.5 px-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        +91 {c.phone}
                      </td>
                      <td className={`py-2.5 px-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {c.visits || 1}
                      </td>
                      <td className={`py-2.5 px-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {c.lastVisit || todayStr}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-amber-400 whitespace-nowrap">
                        ₹{(c.due || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSendReminderWhatsApp(c.name, c.phone, c.due || 0)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold cursor-pointer transition-transform active:scale-95 inline-flex items-center gap-1"
                        >
                          Send WhatsApp
                        </button>
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
