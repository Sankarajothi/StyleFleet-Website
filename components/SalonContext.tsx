'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getShopPrefixFromShopName, formatInvoiceNumber } from '@/lib/salon-helpers';
import {
  fetchSalonDataFromDb,
  saveCustomerToDb,
  updateCustomerInDb,
  deleteCustomerInDb,
  saveAppointmentToDb,
  updateAppointmentStatusInDb,
  saveBillToDb,
  deleteBillInDb,
  updateBillInDb,
  restoreBillInDb,
  saveExpenseToDb,
  updateExpenseInDb,
  deleteExpenseInDb,
  saveStaffMemberToDb,
  updateStaffMemberInDb,
  updateShopProfileInDb,
  generateUuid,
  verifyAccountActiveInDb,
} from '@/lib/supabase-service';

export interface ShopProfile {
  id?: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  pinCode: string;
  gstin: string;
  upiId: string;
  bookingHours: string;
  invoicePrefix: string;
  invoicePrefixFormat?: 'standard' | 'monthly' | 'yearly';
  logoImg: string;
  applyGst?: boolean;
  gstRate?: number;
  instagram?: string;
  facebook?: string;
  googleMaps?: string;
  latitude?: number;
  longitude?: number;
  gpsAddress?: string;
  createdAt?: string;
  subscription?: {
    plan?: string;
    status?: 'active' | 'expired' | 'trial';
    validUntil?: string;
  };
}

export interface ServiceItem {
  id: string;
  cat: string;
  name: string;
  price: number;
  dur: number;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  vip: boolean;
  visits: number;
  spend: number;
  due: number;
  notes?: string;
  lastVisit?: string;
  status?: 'active' | 'inactive';
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  rev: number;
  count: number;
  rating: string;
  chair: string;
  status?: 'active' | 'inactive';
  invited?: boolean;
  permissions?: string[];
  commissionRate?: number;
}

export interface Appointment {
  id: string;
  cust: string;
  phone: string;
  service: string;
  staff: string;
  startsAt: string;
  date: string;
  amount: number;
  status: 'In chair' | 'Confirmed' | 'Done' | 'Cancelled';
}

export interface BillItem {
  name: string;
  price: number;
  qty: number;
  staff?: string;
}

export interface Bill {
  id: string;
  cust: string;
  phone: string;
  dateStr: string;
  items: BillItem[];
  staff: string;
  total: number;
  paidAmount: number;
  dueAmount: number;
  mode: 'UPI' | 'Cash' | 'Card' | 'Partial Pay' | 'Fully Pending';
  status: 'paid' | 'partially_paid' | 'pending';
  isDeleted: boolean;
  isToday: boolean;
  isYesterday?: boolean;
  createdAt?: string;
  isEdited?: boolean;
  editedAt?: string;
  notes?: string;
  discount?: number;
  tax?: number;
  tip?: number;
  deletedAt?: string;
  reminderStatus?: 'Not Sent' | 'Sent' | 'Pending';
  confirmationStatus?: 'Pending' | 'Confirmed';
}

export interface Expense {
  id: string;
  cat: string;
  amount: number;
  note: string;
  pm: string;
  staff?: string | null;
  inProfit: boolean;
  date: string;
}

interface SalonContextType {
  role: 'owner' | 'stylist';
  setRole: (role: 'owner' | 'stylist') => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  language: 'en' | 'hi' | 'ta';
  setLanguage: (lang: 'en' | 'hi' | 'ta') => void;
  
  shopProfile: ShopProfile;
  updateShopProfile: (profile: Partial<ShopProfile>) => void;

  categories: string[];
  addCategory: (cat: string) => void;

  services: ServiceItem[];
  addService: (service: Omit<ServiceItem, 'id' | 'active'>) => void;
  updateService: (id: string, updated: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;

  customers: Customer[];
  addCustomer: (cust: { name: string; phone: string; vip?: boolean; due?: number; notes?: string; lastVisit?: string; status?: 'active' | 'inactive' }) => Customer;
  toggleCustomerVip: (id: string) => void;
  updateCustomer: (id: string, updated: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  markCustomerInactive: (id: string) => void;
  reactivateCustomer: (id: string) => void;
  importCustomers: (custs: Array<{ name: string; phone: string; vip?: boolean; due?: number; notes?: string; lastVisit?: string }>) => void;

  staff: StaffMember[];
  addStaff: (member: { name: string; phone: string; role?: string }) => void;
  updateStaff: (id: string, updated: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  toggleStaffStatus: (id: string) => void;
  inviteStaffViaWhatsApp: (id: string) => void;

  appointments: Appointment[];
  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  markArrivedAndBill: (appt: Appointment) => void;

  bills: Bill[];
  createBill: (bill: Omit<Bill, 'id' | 'dateStr' | 'isDeleted' | 'isToday'>, customDateStr?: string, customIsToday?: boolean) => Bill;
  editBill: (id: string, updated: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  restoreBill: (id: string) => void;

  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'> & { id?: string; date?: string }) => void;
  updateExpense: (id: string, updated: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Active Billing Cart
  billCartItems: BillItem[];
  billCustName: string;
  setBillCustName: (name: string) => void;
  billCustPhone: string;
  setBillCustPhone: (phone: string) => void;
  billStaffSelect: string;
  setBillStaffSelect: (staff: string) => void;
  billDiscount: number;
  setBillDiscount: (discount: number) => void;
  billPaymentMode: Bill['mode'];
  setBillPaymentMode: (mode: Bill['mode']) => void;
  partialPaidAmount: number;
  setPartialPaidAmount: (amt: number) => void;
  addCartItem: (service: { name: string; price: number; staff?: string }) => void;
  removeCartItem: (index: number) => void;
  updateCartItemQty: (index: number, qty: number) => void;
  clearCart: () => void;

  // Active Invoice View modal
  activeInvoice: Bill | null;
  setActiveInvoice: (bill: Bill | null) => void;

  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  isHydrated: boolean;
  isLoadingSalonData: boolean;
  currentShopId: string | null;
  setCurrentShopId: (id: string | null) => void;
  loggedInStaffName: string | null;
  setLoggedInStaffName: (name: string | null) => void;
  hasPermission: (permissionId: string) => boolean;
  currentStylistPermissions: string[];
}

const DEFAULT_SHOP_PROFILE: ShopProfile = {
  shopName: '',
  ownerName: '',
  phone: '',
  address: '',
  city: '',
  pinCode: '',
  gstin: '',
  upiId: '',
  bookingHours: '09:00 AM – 08:30 PM',
  invoicePrefix: 'INV-',
  logoImg: '',
};

const DEFAULT_STAFF: StaffMember[] = [];

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const SalonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<'owner' | 'stylist'>('owner');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'ta'>('en');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingSalonData, setIsLoadingSalonData] = useState(true);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [loggedInStaffName, setLoggedInStaffName] = useState<string | null>(null);

  const [shopProfile, setShopProfile] = useState<ShopProfile>(DEFAULT_SHOP_PROFILE);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3600);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.body.classList.remove('light');
        document.body.classList.add('dark');
        if (isHydrated) localStorage.setItem('stylefleet_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        if (isHydrated) localStorage.setItem('stylefleet_theme', 'light');
      }
    } catch {
      // Ignore if DOM unavailable
    }
  }, [isDarkMode, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('stylefleet_shop_profile', JSON.stringify(shopProfile));
    } catch {}
  }, [shopProfile, isHydrated]);

  const updateShopProfile = (updated: Partial<ShopProfile>) => {
    setShopProfile((prev) => {
      const merged = { ...prev, ...updated };
      try {
        localStorage.setItem('stylefleet_shop_profile', JSON.stringify(merged));
      } catch {}
      return merged;
    });
    if (currentShopId) {
      updateShopProfileInDb(currentShopId, updated);
    }
    showToast('Shop profile updated successfully');
  };

  const [categories, setCategories] = useState<string[]>([
    'Hair',
    'Beard',
    'Colour',
    'Care',
    'Packages',
  ]);

  const addCategory = (cat: string) => {
    if (!cat || categories.includes(cat)) return;
    setCategories((prev) => [...prev, cat]);
    showToast(`Category "${cat}" added!`);
  };

  const [services, setServices] = useState<ServiceItem[]>([
    { id: 's1', cat: 'Hair', name: 'Classic Haircut', price: 350, dur: 30, active: true },
    { id: 's2', cat: 'Hair', name: 'Fade / Creative Haircut', price: 450, dur: 40, active: true },
    { id: 's3', cat: 'Hair', name: 'Keratin Hair Spa', price: 1800, dur: 60, active: true },
    { id: 's4', cat: 'Hair', name: 'Head Massage (20m)', price: 300, dur: 20, active: true },
    { id: 's5', cat: 'Beard', name: 'Beard Trim & Shape', price: 200, dur: 20, active: true },
    { id: 's6', cat: 'Beard', name: 'Beard Spa & Conditioning', price: 400, dur: 30, active: true },
    { id: 's7', cat: 'Beard', name: 'Royal Hot Towel Shave', price: 300, dur: 25, active: true },
    { id: 's8', cat: 'Colour', name: 'Hair Color Root Touch-up', price: 800, dur: 45, active: true },
    { id: 's9', cat: 'Colour', name: 'Global Hair Colouring', price: 2200, dur: 90, active: true },
    { id: 's10', cat: 'Care', name: 'D-Tan Facial Cleanse', price: 750, dur: 40, active: true },
    { id: 's11', cat: 'Care', name: 'Hydra Deep Facial', price: 2200, dur: 60, active: true },
    { id: 's12', cat: 'Care', name: 'Charcoal Detox Face Pack', price: 450, dur: 25, active: true },
    { id: 's13', cat: 'Packages', name: 'Full Grooming Combo', price: 1200, dur: 75, active: true },
  ]);

  const addService = (newService: Omit<ServiceItem, 'id' | 'active'>) => {
    const s: ServiceItem = {
      ...newService,
      id: `s-${Date.now()}`,
      active: true,
    };
    setServices((prev) => [s, ...prev]);
    showToast(`Service "${s.name}" added to price list.`);
  };

  const toggleServiceActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const updateService = (id: string, updated: Partial<ServiceItem>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
    showToast('Service updated successfully.');
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast('Service removed from menu.');
  };

  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('stylefleet_customers_db', JSON.stringify(customers));
    } catch {}
  }, [customers, isHydrated]);

  const addCustomer = ({
    name,
    phone,
    vip = false,
    due = 0,
    notes = '',
    lastVisit = 'Today',
    status = 'active',
  }: {
    name: string;
    phone: string;
    vip?: boolean;
    due?: number;
    notes?: string;
    lastVisit?: string;
    status?: 'active' | 'inactive';
  }) => {
    const newCust: Customer = {
      id: `c-${Date.now()}`,
      name,
      phone,
      vip,
      visits: 1,
      spend: 0,
      due: Number(due) || 0,
      notes: notes || '',
      lastVisit: lastVisit || 'Today',
      status: status || 'active',
    };
    setCustomers((prev) => [newCust, ...prev]);
    if (currentShopId) {
      saveCustomerToDb(currentShopId, newCust);
    }
    showToast(`Client "${name}" added to CRM!`);
    return newCust;
  };

  const toggleCustomerVip = (id: string) => {
    let toggledVip = false;
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newVip = !c.vip;
          toggledVip = newVip;
          showToast(newVip ? `⭐ ${c.name} marked as VIP / MVP!` : `${c.name} removed from VIP`);
          return { ...c, vip: newVip };
        }
        return c;
      })
    );
    if (currentShopId) {
      updateCustomerInDb(currentShopId, id, { vip: toggledVip });
    }
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    if (currentShopId) {
      updateCustomerInDb(currentShopId, id, updated);
    }
    showToast('Client details updated');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (currentShopId) {
      deleteCustomerInDb(currentShopId, id);
    }
    showToast('Client permanently deleted from CRM');
  };

  const markCustomerInactive = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'inactive' } : c))
    );
    showToast('Client moved to Inactive records');
  };

  const reactivateCustomer = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'active' } : c))
    );
    showToast('Client reactivated to Active CRM!');
  };

  const importCustomers = (
    newClients: Array<{ name: string; phone: string; vip?: boolean; due?: number; notes?: string; lastVisit?: string }>
  ) => {
    const added: Customer[] = newClients.map((nc, idx) => ({
      id: `c-${Date.now()}-${idx}`,
      name: nc.name,
      phone: nc.phone,
      vip: !!nc.vip,
      visits: 1,
      spend: 0,
      due: Number(nc.due) || 0,
      notes: nc.notes || '',
      lastVisit: nc.lastVisit || 'Today',
      status: 'active' as const,
    }));
    setCustomers((prev) => [...added, ...prev]);
    showToast(`Successfully imported ${added.length} contacts!`);
  };

  const [staff, setStaff] = useState<StaffMember[]>(DEFAULT_STAFF);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('stylefleet_staff_team_db', JSON.stringify(staff));
    } catch {}
  }, [staff, isHydrated]);

  const addStaff = ({ name, phone, role: staffRole }: { name: string; phone: string; role?: string }) => {
    const newStaff: StaffMember = {
      id: `st-${Date.now()}`,
      name: name.trim(),
      role: staffRole?.trim() || 'Stylist',
      phone: phone.trim(),
      rev: 0,
      count: 0,
      rating: '5.0',
      chair: 'Available',
      status: 'active',
      invited: false,
      permissions: ['billing', 'appointments'],
    };
    setStaff((prev) => [...prev, newStaff]);
    if (currentShopId) {
      saveStaffMemberToDb(currentShopId, { name, phone, role: staffRole });
    }
    showToast(`Stylist "${name}" added to Team!`);
  };

  const updateStaff = (id: string, updated: Partial<StaffMember>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    if (currentShopId) {
      updateStaffMemberInDb(currentShopId, id, updated);
    }
    showToast('Stylist updated successfully.');
  };

  const currentStylistMember = useMemo(() => {
    if (role !== 'stylist') return null;
    return (
      staff.find(
        (s) =>
          loggedInStaffName &&
          s.name.trim().toLowerCase() === loggedInStaffName.trim().toLowerCase()
      ) || null
    );
  }, [role, staff, loggedInStaffName]);

  const currentStylistPermissions = useMemo(() => {
    if (role !== 'stylist') {
      return [
        'customers',
        'sales',
        'appointments',
        'reminders',
        'expenses',
        'reports',
        'team',
        'profile',
        'past_expenses',
        'full_reports',
        'share_bills',
      ];
    }
    if (currentStylistMember && currentStylistMember.permissions && currentStylistMember.permissions.length > 0) {
      return currentStylistMember.permissions;
    }
    return ['customers', 'sales', 'appointments', 'reminders'];
  }, [role, currentStylistMember]);

  const hasPermission = useCallback(
    (permissionId: string): boolean => {
      if (role !== 'stylist') return true;
      return currentStylistPermissions.includes(permissionId);
    },
    [role, currentStylistPermissions]
  );

  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    showToast('Stylist removed.');
  };

  const toggleStaffStatus = (id: string) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const next = s.status === 'inactive' ? 'active' : 'inactive';
          return { ...s, status: next };
        }
        return s;
      })
    );
    showToast('Stylist status updated.');
  };

  const inviteStaffViaWhatsApp = (id: string) => {
    const target = staff.find((s) => s.id === id);
    if (!target) return;
    const cleanPhone = target.phone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `Hello ${target.name}! You are invited to join ${shopProfile.shopName} on StyleFleet Salon OS. Access your schedule & express billing here: https://stylefleet.app/`
    );
    window.open(`https://wa.me/${phoneWithCode}?text=${msg}`, '_blank');
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, invited: true } : s))
    );
    showToast(`WhatsApp invitation dispatched to ${target.name}!`);
  };

  const getContextTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('stylefleet_appointments_db', JSON.stringify(appointments));
    } catch {}
  }, [appointments, isHydrated]);

  const addAppointment = (newAppt: Omit<Appointment, 'id'>) => {
    const apptId = generateUuid();
    const a: Appointment = {
      ...newAppt,
      id: apptId,
    };
    setAppointments((prev) => [a, ...prev]);
    if (currentShopId) {
      saveAppointmentToDb(currentShopId, a, apptId);
    }
    showToast(`Appointment booked for ${a.cust} at ${a.startsAt}!`);
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    if (currentShopId) {
      const audit = {
        role: role === 'stylist' ? ('stylist' as const) : ('owner' as const),
        name: role === 'stylist' && loggedInStaffName ? loggedInStaffName : (shopProfile.ownerName || 'Owner'),
      };
      updateAppointmentStatusInDb(currentShopId, id, status, audit);
    }
    showToast(`Appointment marked as ${status}.`);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    showToast('Appointment updated successfully!', 'success');
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    showToast('Appointment deleted.', 'success');
  };

  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('stylefleet_bills_db', JSON.stringify(bills));
    } catch {}
  }, [bills, isHydrated]);

  const createBill = (billData: Omit<Bill, 'id' | 'dateStr' | 'isDeleted' | 'isToday'>, customDateStr?: string, customIsToday?: boolean) => {
    const now = new Date();
    const defaultDateStr = `${now.getDate()} ${now.toLocaleString('en-US', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const dateStr = customDateStr || defaultDateStr;
    const isToday = customIsToday !== undefined ? customIsToday : true;
    const prefixToUse = shopProfile.invoicePrefix || getShopPrefixFromShopName(shopProfile.shopName);
    const billId = formatInvoiceNumber(
      prefixToUse,
      shopProfile.invoicePrefixFormat || 'standard',
      bills.length + 1,
      now
    );

    const newBill: Bill = {
      ...billData,
      id: billId,
      dateStr,
      isDeleted: false,
      isToday,
      isEdited: false,
    };

    setBills((prev) => [newBill, ...prev]);
    if (currentShopId) {
      saveBillToDb(currentShopId, { ...newBill, invoiceNumber: billId });
    }

    // Update customer spend / due if exists, or auto-add walk-in to customers if a valid name is provided
    setCustomers((prev) => {
      const exists = prev.find((c) => (billData.phone && c.phone === billData.phone) || (billData.cust && c.name.toLowerCase() === billData.cust.toLowerCase()));
      if (exists) {
        return prev.map((c) => {
          if (c.id === exists.id) {
            return {
              ...c,
              spend: (c.spend || 0) + billData.paidAmount,
              due: (c.due || 0) + billData.dueAmount,
              visits: (c.visits || 0) + 1,
              lastVisit: 'Today',
            };
          }
          return c;
        });
      } else if (billData.cust && billData.cust.trim() !== 'Walk-in Client' && billData.cust.trim() !== '') {
        const newC: Customer = {
          id: `c-${Date.now()}`,
          name: billData.cust.trim(),
          phone: billData.phone || '',
          vip: false,
          visits: 1,
          spend: billData.paidAmount,
          due: billData.dueAmount,
          lastVisit: 'Today',
          status: 'active',
        };
        return [newC, ...prev];
      }
      return prev;
    });

    showToast(`Bill #${billId} generated successfully!`);
    return newBill;
  };

  const editBill = (id: string, updated: Partial<Bill>) => {
    const now = new Date();
    const editedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated, isEdited: true, editedAt: editedTime } : b))
    );
    if (currentShopId) {
      updateBillInDb(currentShopId, id, updated);
    }
    showToast(`Bill #${id} updated successfully.`);
  };

  const deleteBill = (id: string) => {
    const nowIso = new Date().toISOString();
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isDeleted: true, deletedAt: nowIso } : b))
    );
    if (currentShopId) {
      deleteBillInDb(currentShopId, id);
    }
    showToast(`Bill #${id} moved to Recently Deleted (kept for 30 days).`);
  };

  const restoreBill = (id: string) => {
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isDeleted: false, deletedAt: undefined } : b))
    );
    if (currentShopId) {
      restoreBillInDb(currentShopId, id);
    }
    showToast(`Bill #${id} restored successfully.`);
  };

  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('stylefleet_expenses_db', JSON.stringify(expenses));
    } catch {}
  }, [expenses, isHydrated]);

  // Unified client-side hydration from localStorage (prevents SSR / client mismatch)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('stylefleet_theme');
      if (savedTheme === 'light') {
        setIsDarkMode(false);
      }
      const savedLang = localStorage.getItem('stylefleet_language');
      if (savedLang === 'hi' || savedLang === 'ta' || savedLang === 'en') {
        setLanguage(savedLang);
      }
      const storedProfile = localStorage.getItem('stylefleet_shop_profile');
      if (storedProfile) {
        setShopProfile(JSON.parse(storedProfile));
      }
      const storedCust = localStorage.getItem('stylefleet_customers_db');
      if (storedCust) {
        setCustomers(JSON.parse(storedCust));
      }
      const storedStaff = localStorage.getItem('stylefleet_staff_team_db');
      if (storedStaff) {
        setStaff(JSON.parse(storedStaff));
      }
      const storedAppts = localStorage.getItem('stylefleet_appointments_db');
      if (storedAppts) {
        setAppointments(JSON.parse(storedAppts));
      }
      const storedBills = localStorage.getItem('stylefleet_bills_db');
      if (storedBills) {
        setBills(JSON.parse(storedBills));
      }
      const storedExpenses = localStorage.getItem('stylefleet_expenses_db');
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      }

      // Helper to immediately log out a user whose account or salon was deleted
      const forceLogoutUser = (reason: string = 'Your account was deleted from the database. You have been logged out.') => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {}
        alert(reason);
        window.location.href = '/';
      };

      // Check if active salon has a registered shop_id in cloud Supabase
      const savedShopId = localStorage.getItem('stylefleet_shop_id');
      const authSessionStr = localStorage.getItem('stylefleet_auth_session');
      let activeSession: any = null;
      if (authSessionStr) {
        try {
          activeSession = JSON.parse(authSessionStr);
          if (activeSession.role) setRole(activeSession.role);
          if (activeSession.staffName) setLoggedInStaffName(activeSession.staffName);
        } catch {}
      }

      if (savedShopId) {
        setCurrentShopId(savedShopId);
        setIsLoadingSalonData(true);
        fetchSalonDataFromDb(savedShopId)
          .then((dbData) => {
            if (!dbData) {
              // The shop was permanently deleted from Supabase!
              console.warn('[SalonContext] Shop not found in Supabase. Logging out immediately.');
              forceLogoutUser('This salon account was permanently deleted from Supabase. You have been logged out.');
              return;
            }

            // If user is a stylist, verify they are still in the staff list
            if (activeSession && activeSession.role === 'stylist') {
              const stylistExists = (dbData.staff || []).some((s) => {
                if (activeSession.staffId && s.id === activeSession.staffId) return true;
                if (activeSession.phone && s.phone) {
                  const cleanS = activeSession.phone.replace(/\D/g, '').slice(-10);
                  const cleanP = s.phone.replace(/\D/g, '').slice(-10);
                  if (cleanS === cleanP) return true;
                }
                if (activeSession.staffName && s.name && s.name.trim().toLowerCase() === activeSession.staffName.trim().toLowerCase()) {
                  return true;
                }
                return false;
              });

              if (!stylistExists) {
                console.warn('[SalonContext] Stylist removed from salon staff in Supabase. Logging out immediately.');
                forceLogoutUser('Your stylist account was removed from this salon. You have been logged out.');
                return;
              }
            }

            setShopProfile(dbData.shop);
            setCategories(dbData.categories);
            setServices(dbData.services);
            setStaff(dbData.staff);
            setCustomers(dbData.customers);
            setAppointments(dbData.appointments);
            setBills(dbData.bills);
            setExpenses(dbData.expenses);
          })
          .catch((err) => {
            console.warn('[SalonContext] Could not load cloud state:', err);
          })
          .finally(() => {
            setIsLoadingSalonData(false);
          });
      } else {
        setIsLoadingSalonData(false);
      }
    } catch (e) {
      console.error('Error hydrating salon state from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Continuous verification: Immediately log out user if their account or salon was deleted from Supabase
  useEffect(() => {
    if (!currentShopId) return;

    const checkActiveSessionInDb = async () => {
      try {
        const authSessionStr = localStorage.getItem('stylefleet_auth_session');
        if (!authSessionStr) return;
        const session = JSON.parse(authSessionStr);

        const result = await verifyAccountActiveInDb(
          currentShopId,
          session.role,
          session.staffId,
          session.phone
        );

        if (!result.active) {
          console.warn('[SalonContext] Account no longer active in Supabase:', result.reason);
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch {}
          alert(result.reason || 'Your account was deleted from Supabase. You have been logged out.');
          window.location.href = '/';
        }
      } catch (err) {
        console.warn('[SalonContext] Session check skipped due to error:', err);
      }
    };

    // Run check periodically (every 15 seconds)
    const intervalId = setInterval(checkActiveSessionInDb, 15000);

    // Run check when window gains focus or tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkActiveSessionInDb();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [currentShopId]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('stylefleet_language', language);
    } catch {}
  }, [language, isHydrated]);

  const addExpense = (newExp: Omit<Expense, 'id' | 'date'> & { id?: string; date?: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const exp: Expense = {
      id: newExp.id || `exp-${Date.now()}`,
      cat: newExp.cat,
      amount: newExp.amount,
      note: newExp.note,
      pm: newExp.pm,
      staff: newExp.staff,
      inProfit: newExp.inProfit !== undefined ? newExp.inProfit : true,
      date: newExp.date || today,
    };
    setExpenses((prev) => [exp, ...prev]);
    if (currentShopId) {
      saveExpenseToDb(currentShopId, exp);
    }
    showToast(`Expense of ₹${exp.amount} recorded.`);
  };

  const updateExpense = (id: string, updated: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );
    if (currentShopId) {
      updateExpenseInDb(currentShopId, id, updated);
    }
    showToast('Expense updated successfully.');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (currentShopId) {
      deleteExpenseInDb(currentShopId, id);
    }
    showToast('Expense entry deleted.');
  };

  // ================= BILL CART CONTROLLER =================
  const [billCartItems, setBillCartItems] = useState<BillItem[]>([]);
  const [billCustName, setBillCustName] = useState('');
  const [billCustPhone, setBillCustPhone] = useState('');
  const [billStaffSelect, setBillStaffSelect] = useState('Karthik');
  const [billDiscount, setBillDiscount] = useState(0);
  const [billPaymentMode, setBillPaymentMode] = useState<Bill['mode']>('UPI');
  const [partialPaidAmount, setPartialPaidAmount] = useState(0);

  const addCartItem = ({ name, price, staff: itemStaff }: { name: string; price: number; staff?: string }) => {
    setBillCartItems((prev) => {
      const existing = prev.find((i) => i.name === name);
      if (existing) {
        return prev.map((i) => (i.name === name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { name, price, qty: 1, staff: itemStaff || billStaffSelect }];
    });
    showToast(`Added "${name}" to bill`);
  };

  const removeCartItem = (index: number) => {
    setBillCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCartItemQty = (index: number, qty: number) => {
    if (qty <= 0) {
      removeCartItem(index);
      return;
    }
    setBillCartItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, qty } : item))
    );
  };

  const clearCart = () => {
    setBillCartItems([]);
    setBillCustName('');
    setBillCustPhone('');
    setBillDiscount(0);
    setBillPaymentMode('UPI');
    setPartialPaidAmount(0);
  };

  // Mark arrived and auto-fill in billing
  const markArrivedAndBill = (appt: Appointment) => {
    updateAppointmentStatus(appt.id, 'Done');
    setBillCustName(appt.cust);
    setBillCustPhone(appt.phone);
    setBillStaffSelect(appt.staff || 'Karthik');
    setBillCartItems([{ name: appt.service, price: appt.amount, qty: 1, staff: appt.staff }]);
    setCurrentScreen('billing');
    showToast(`Prefilled bill for ${appt.cust}!`);
  };

  const [activeInvoice, setActiveInvoice] = useState<Bill | null>(null);

  return (
    <SalonContext.Provider
      value={{
        role,
        setRole,
        currentScreen,
        setCurrentScreen,
        isDarkMode,
        toggleTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen,
        language,
        setLanguage,
        shopProfile,
        updateShopProfile,
        categories,
        addCategory,
        services,
        addService,
        updateService,
        deleteService,
        toggleServiceActive,
        customers,
        addCustomer,
        toggleCustomerVip,
        updateCustomer,
        deleteCustomer,
        markCustomerInactive,
        reactivateCustomer,
        importCustomers,
        staff,
        addStaff,
        updateStaff,
        deleteStaff,
        toggleStaffStatus,
        inviteStaffViaWhatsApp,
        appointments,
        addAppointment,
        updateAppointmentStatus,
        updateAppointment,
        deleteAppointment,
        markArrivedAndBill,
        bills,
        createBill,
        editBill,
        deleteBill,
        restoreBill,
        expenses,
        addExpense,
        updateExpense,
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
        toast,
        showToast,
        isHydrated,
        isLoadingSalonData,
        currentShopId,
        setCurrentShopId,
        loggedInStaffName,
        setLoggedInStaffName,
        hasPermission,
        currentStylistPermissions,
      }}
    >
      <div suppressHydrationWarning className={isDarkMode ? 'dark' : ''}>
        {children}
        {toast && (
          <div
            className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#11284A] border shadow-2xl text-sm font-semibold flex items-center gap-3 text-white"
            style={{ borderColor: toast.type === 'error' ? '#EF4444' : '#D4AF37' }}
          >
            {toast.type === 'error' ? (
              <svg className="w-4 h-4 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[#D4AF37] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return context;
};
