import { supabase } from './supabase';
import { getShopPrefixFromShopName } from './salon-helpers';
import type { Customer, StaffMember, Appointment, Bill, Expense, ServiceItem, ShopProfile } from '@/components/SalonContext';

// Helper to generate UUIDs on browser/client
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface RegisterShopParams {
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  city: string;
  pinCode: string;
  gstin?: string;
  upiId?: string;
  logoImg?: string;
  latitude?: number;
  longitude?: number;
  gpsAddress?: string;
  stylists?: Array<{ name: string; phone: string }>;
}

export interface DatabaseSalonData {
  shop: ShopProfile & { id: string };
  categories: string[];
  services: ServiceItem[];
  staff: StaffMember[];
  customers: Customer[];
  appointments: Appointment[];
  bills: Bill[];
  expenses: Expense[];
}

/**
 * Establish or sign in to Supabase Auth session for a mobile number.
 * Mirrors the StyleFleet Android establishSupabaseSession contract.
 */
export async function establishSupabaseAuthSession(cleanPhone: string, fullName?: string): Promise<string | null> {
  const authEmail = `user_${cleanPhone}@stylefleet.salon`;
  const authPassword = `StyleFleet_${cleanPhone}_SecureAuth!`;

  try {
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (!signInErr && signInData?.user) {
      if (fullName) {
        await supabase.from('profiles').upsert({
          id: signInData.user.id,
          phone: cleanPhone,
          full_name: fullName,
        } as any);
      }
      return signInData.user.id;
    }

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: { data: { phone: cleanPhone, full_name: fullName } },
    });

    if (!signUpErr && signUpData?.user) {
      if (fullName) {
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          phone: cleanPhone,
          full_name: fullName,
        } as any);
      }
      return signUpData.user.id;
    }
  } catch (e) {
    console.warn('[Supabase Auth] establishment notice:', e);
  }
  return null;
}

/**
 * Register a completely new salon in the Supabase database.
 * Does not overwrite or touch any other salon's data.
 */
export async function registerNewSalonInDb(params: RegisterShopParams): Promise<{
  success: boolean;
  shopId?: string;
  error?: string;
}> {
  try {
    const cleanPhone = params.phone.replace(/\D/g, '').slice(-10);
    const newShopId = generateUuid();
    const prefix = getShopPrefixFromShopName(params.shopName) + '-';

    // 1. Establish owner identity in Supabase Auth & Profiles
    const ownerUserId = await establishSupabaseAuthSession(cleanPhone, params.ownerName.trim());

    // 2. Insert into shops table
    const shopInsertPayload: any = {
      id: newShopId,
      name: params.shopName.trim(),
      phone: cleanPhone,
      address: params.address.trim(),
      city: params.city.trim(),
      pin_code: params.pinCode.trim(),
      gstin: params.gstin?.trim() || null,
      upi_id: params.upiId?.trim() || '',
      logo_path: params.logoImg || '',
      invoice_prefix: prefix,
      invoice_numbering_mode: 'monthly',
      accent_color: '#D4AF37',
      gst_rate: 0,
      social_links: {
        owner_name: params.ownerName.trim(),
        upi_id: params.upiId?.trim() || '',
        booking_start_time: '09:00 AM',
        booking_end_time: '08:30 PM',
        latitude: params.latitude,
        longitude: params.longitude,
        gps_address: params.gpsAddress,
      },
    };

    if (ownerUserId) {
      shopInsertPayload.owner_profile_id = ownerUserId;
    }

    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .insert(shopInsertPayload)
      .select()
      .single();

    if (shopError) {
      console.error('[Supabase] Failed to register salon in shops table:', shopError);
      if (shopError.code === '23505' || shopError.message?.includes('idx_shops_unique_phone')) {
        return {
          success: false,
          error: 'This mobile number is already registered to an existing salon. Please log in directly with this number.',
        };
      }
      return { success: false, error: shopError.message };
    }

    const createdShopId = shopData.id;

    // 3. Link owner in shop_members table
    if (ownerUserId) {
      try {
        await supabase.from('shop_members').insert({
          shop_id: createdShopId,
          profile_id: ownerUserId,
          role: 'owner',
          is_active: true,
        } as any);
      } catch (memErr) {
        console.warn('[Supabase] shop_members insert notice:', memErr);
      }
    }

    // 4. Insert standard starter categories for this salon
    const standardCats = ['Hair', 'Beard', 'Colour', 'Care', 'Packages'];
    const categoryIdMap: Record<string, string> = {};

    for (let i = 0; i < standardCats.length; i++) {
      const catName = standardCats[i];
      const catId = generateUuid();
      const { error: catErr } = await supabase.from('service_categories').insert({
        id: catId,
        shop_id: createdShopId,
        name: catName,
        sort_order: i + 1,
        is_active: true,
      });
      if (!catErr) {
        categoryIdMap[catName] = catId;
      }
    }

    // 5. Insert starter services for this salon
    const starterServices = [
      { cat: 'Hair', name: 'Classic Haircut', price: 350, dur: 30 },
      { cat: 'Hair', name: 'Fade / Creative Haircut', price: 450, dur: 40 },
      { cat: 'Hair', name: 'Keratin Hair Spa', price: 1800, dur: 60 },
      { cat: 'Hair', name: 'Head Massage (20m)', price: 300, dur: 20 },
      { cat: 'Beard', name: 'Beard Trim & Shape', price: 200, dur: 20 },
      { cat: 'Beard', name: 'Royal Hot Towel Shave', price: 300, dur: 25 },
      { cat: 'Care', name: 'D-Tan Facial Cleanse', price: 750, dur: 40 },
      { cat: 'Packages', name: 'Full Grooming Combo', price: 1200, dur: 75 },
    ];

    for (const s of starterServices) {
      await supabase.from('services').insert({
        id: generateUuid(),
        shop_id: createdShopId,
        category_id: categoryIdMap[s.cat] || null,
        name: s.name,
        price_minor: Math.round(s.price * 100),
        duration_minutes: s.dur,
        is_active: true,
      });
    }

    // 6. Add imported stylists into staff table under this shop
    if (params.stylists && params.stylists.length > 0) {
      for (const st of params.stylists) {
        if (st.name && st.phone) {
          const staffCleanPhone = st.phone.replace(/\D/g, '').slice(-10);
          try {
            await supabase.from('staff').insert({
              id: generateUuid(),
              shop_id: createdShopId,
              name: st.name.trim(),
              phone: staffCleanPhone,
              role: 'Stylist',
              is_active: true,
              target_amount_minor: 500000,
              invitation_status: 'not_invited',
              rating: '5.0',
              permissions: {
                customers: true,
                sales: true,
                appointments: true,
                expenses: false,
                reports: false,
                team: false,
                reminders: true,
                profile: false,
                expensesHistory: false,
                shareBills: false,
              },
            });
          } catch (staffErr) {
            console.warn('[Supabase] Staff insert notice:', staffErr);
          }
        }
      }
    }

    return { success: true, shopId: createdShopId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Exception during salon registration:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Check if a phone number belongs to an existing shop (either owner or staff).
 * Supports role targeting ('stylist' vs 'owner') with wildcard & exact matching.
 */
export async function findSalonByPhone(
  phone: string,
  preferredRole?: 'owner' | 'stylist'
): Promise<{
  found: boolean;
  shopId?: string;
  role?: 'owner' | 'stylist';
  shopName?: string;
  staffName?: string;
  staffId?: string;
  ownerName?: string;
  error?: string;
}> {
  try {
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) return { found: false, error: 'Invalid 10-digit mobile number' };

    // Helper: search staff table for registered stylist
    const searchStylist = async () => {
      const { data: staffMembers, error: staffErr } = await supabase
        .from('staff')
        .select('id, shop_id, role, name, phone, is_active')
        .or(`phone.ilike.%${cleanPhone}%,phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`)
        .limit(1);

      if (!staffErr && staffMembers && staffMembers.length > 0) {
        const staff = staffMembers[0];
        if (staff.is_active === false) {
          return {
            found: false,
            role: 'stylist' as const,
            error: 'This stylist account is inactive. Please contact your salon owner.',
          };
        }

        const { data: shopRows } = await supabase
          .from('shops')
          .select('id, name')
          .eq('id', staff.shop_id)
          .limit(1);

        return {
          found: true,
          shopId: staff.shop_id,
          role: 'stylist' as const,
          staffName: staff.name,
          staffId: staff.id,
          shopName: shopRows && shopRows.length > 0 ? shopRows[0].name : 'Salon',
        };
      }
      return null;
    };

    // Helper: search owner records across shops, profiles, and shop_members
    const searchOwner = async () => {
      // 1. Direct query on shops table by phone
      const { data: shops, error: shopErr } = await supabase
        .from('shops')
        .select('id, name, phone, social_links')
        .or(`phone.ilike.%${cleanPhone}%,phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!shopErr && shops && shops.length > 0) {
        const sh = shops[0];
        const social = (sh.social_links as any) || {};
        return {
          found: true,
          shopId: sh.id,
          role: 'owner' as const,
          shopName: sh.name,
          ownerName: social.owner_name || 'Owner',
        };
      }

      // 2. Query profiles by phone, then find shop via owner_profile_id or shop_members
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, phone, full_name')
        .or(`phone.ilike.%${cleanPhone}%,phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`)
        .limit(1);

      if (!profErr && profiles && profiles.length > 0) {
        const profId = profiles[0].id;
        const profName = profiles[0].full_name || 'Owner';

        const { data: ownedShops } = await supabase
          .from('shops')
          .select('id, name, social_links')
          .eq('owner_profile_id', profId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (ownedShops && ownedShops.length > 0) {
          const sh = ownedShops[0];
          return {
            found: true,
            shopId: sh.id,
            role: 'owner' as const,
            shopName: sh.name,
            ownerName: profName,
          };
        }

        const { data: members } = await supabase
          .from('shop_members')
          .select('shop_id')
          .eq('profile_id', profId)
          .eq('role', 'owner')
          .eq('is_active', true)
          .limit(1);

        if (members && members.length > 0) {
          const { data: memberShop } = await supabase
            .from('shops')
            .select('id, name')
            .eq('id', members[0].shop_id)
            .limit(1);

          if (memberShop && memberShop.length > 0) {
            return {
              found: true,
              shopId: memberShop[0].id,
              role: 'owner' as const,
              shopName: memberShop[0].name,
              ownerName: profName,
            };
          }
        }
      }

      return null;
    };

    // If preferredRole is stylist, prioritize staff search
    if (preferredRole === 'stylist') {
      const stylistRes = await searchStylist();
      if (stylistRes) return stylistRes;
      return {
        found: false,
        role: 'stylist',
        error: 'This phone number is not registered as an active stylist. Please contact your salon owner.',
      };
    }

    // If preferredRole is owner or auto-detecting:
    const ownerRes = await searchOwner();
    if (ownerRes) return ownerRes;

    // Check if registered as stylist even though logging in via default/owner tab
    const stylistRes = await searchStylist();
    if (stylistRes) return stylistRes;

    return { found: false, role: 'owner' };
  } catch (err) {
    console.error('[Supabase] Error finding salon by phone:', err);
    return { found: false, error: 'Database connection error' };
  }
}

/**
 * Fetch all salon data strictly filtered by shop_id.
 * Guaranteed 0 access to any other salon's data.
 */
export async function fetchSalonDataFromDb(shopId: string): Promise<DatabaseSalonData | null> {
  try {
    if (!shopId) return null;

    // 1. Fetch shop profile
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (shopErr || !shop) {
      console.warn('[Supabase] Could not load shop for shop_id:', shopId);
      return null;
    }

    const social = shop.social_links || {};
    const shopProfile: ShopProfile & { id: string } = {
      id: shop.id,
      shopName: shop.name || 'My Salon',
      ownerName: social.owner_name || 'Owner',
      phone: shop.phone || '',
      address: shop.address || '',
      city: shop.city || '',
      pinCode: shop.pin_code || '',
      gstin: shop.gstin || '',
      upiId: shop.upi_id || social.upi_id || '',
      bookingHours: `${social.booking_start_time || '09:00 AM'} – ${social.booking_end_time || '08:30 PM'}`,
      invoicePrefix: shop.invoice_prefix || 'INV-',
      invoicePrefixFormat: shop.invoice_numbering_mode === 'yearly' ? 'yearly' : (shop.invoice_numbering_mode === 'standard' ? 'standard' : 'monthly'),
      logoImg: shop.logo_path || '',
      applyGst: !!shop.gstin,
      gstRate: shop.gst_rate || 18,
      latitude: social.latitude,
      longitude: social.longitude,
      gpsAddress: social.gps_address,
    };

    // 2. Fetch service categories
    const { data: catRows } = await supabase
      .from('service_categories')
      .select('name')
      .eq('shop_id', shopId)
      .order('sort_order', { ascending: true });

    const categories = catRows && catRows.length > 0
      ? catRows.map((c) => c.name)
      : ['Hair', 'Beard', 'Colour', 'Care', 'Packages'];

    // 3. Fetch services
    const { data: srvRows } = await supabase
      .from('services')
      .select('*, service_categories(name)')
      .eq('shop_id', shopId);

    const services: ServiceItem[] = (srvRows || []).map((s) => ({
      id: s.id,
      cat: s.service_categories?.name || 'Hair',
      name: s.name,
      price: Math.round((s.price_minor || 0) / 100),
      dur: s.duration_minutes || 30,
      active: s.is_active !== false,
    }));

    // 4. Fetch staff
    const { data: staffRows } = await supabase
      .from('staff')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true });

    const staff: StaffMember[] = (staffRows || []).map((st) => ({
      id: st.id,
      name: st.name,
      role: st.role || 'Stylist',
      phone: st.phone,
      rev: Math.round((st.target_amount_minor || 0) / 100),
      count: 0,
      rating: st.rating || '5.0',
      chair: 'Available',
      status: st.is_active ? 'active' : 'inactive',
      invited: st.invitation_status === 'accepted' || st.invitation_status === 'invited',
    }));

    // 5. Fetch appointments with related customers, staff and services
    const { data: apptRows } = await supabase
      .from('appointments')
      .select('*, customers(id, name, phone), staff(id, name), services(id, name, price_minor)')
      .eq('shop_id', shopId)
      .order('starts_at', { ascending: false });

    const appointments: Appointment[] = (apptRows || []).map((a: any) => {
      let custName = a.customers?.name || 'Client';
      let custPhone = a.customers?.phone || '';
      let serviceName = a.services?.name || 'Salon Service';
      let staffName = a.staff?.name || 'Any Stylist';
      let amount = Math.round((a.services?.price_minor || 0) / 100);

      if (a.notes) {
        try {
          const parsed = JSON.parse(a.notes);
          if (parsed.cust && custName === 'Client') custName = parsed.cust;
          if (parsed.phone && !custPhone) custPhone = parsed.phone;
          if (parsed.service && serviceName === 'Salon Service') serviceName = parsed.service;
          if (parsed.staff_name && staffName === 'Any Stylist') staffName = parsed.staff_name;
          if (parsed.amount && amount === 0) amount = parsed.amount;
        } catch {
          if (custName === 'Client') custName = a.notes;
        }
      }

      const dateObj = new Date(a.starts_at || Date.now());
      const dateStr = !isNaN(dateObj.getTime())
        ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
        : new Date().toISOString().split('T')[0];
      const timeStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '10:00 AM';

      return {
        id: a.id,
        cust: custName,
        phone: custPhone,
        service: serviceName,
        staff: staffName,
        startsAt: timeStr,
        date: dateStr,
        amount,
        status: (a.status as Appointment['status']) || 'Confirmed',
      };
    });

    // 6. Fetch bills, items, payments and relations
    const { data: billRows } = await supabase
      .from('bills')
      .select('*, customers(id, name, phone), staff(id, name), bill_items(*), payments(*)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    const bills: Bill[] = (billRows || []).map((b: any) => {
      let parsedStaff = b.staff?.name || 'Stylist';
      let parsedCust = b.customers?.name || 'Walk-in Client';
      let parsedPhone = b.customers?.phone || '';

      if (b.notes) {
        const parts = b.notes.split(';');
        for (const p of parts) {
          if (p.startsWith('staff_name:') && parsedStaff === 'Stylist') parsedStaff = p.replace('staff_name:', '');
          if (p.startsWith('cust:') && parsedCust === 'Walk-in Client') parsedCust = p.replace('cust:', '');
          if (p.startsWith('phone:') && !parsedPhone) parsedPhone = p.replace('phone:', '');
        }
      }

      const items = (b.bill_items || []).map((it: any) => ({
        name: it.service_name_snapshot || 'Service',
        price: Math.round((it.unit_price_minor || 0) / 100),
        qty: it.quantity || 1,
      }));

      const dateObj = new Date(b.created_at || b.issued_at || Date.now());
      const now = new Date();
      const isToday = !isNaN(dateObj.getTime()) && dateObj.toDateString() === now.toDateString();
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const isYesterday = !isNaN(dateObj.getTime()) && dateObj.toDateString() === yest.toDateString();

      const dateStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) + `, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Today';

      const payments = (b.payments as any[]) || [];
      const paymentMode = payments[0]?.method || (b.notes?.includes('Cash') ? 'Cash' : (b.notes?.includes('Card') ? 'Card' : 'UPI'));

      return {
        id: b.invoice_number || b.id,
        cust: parsedCust,
        phone: parsedPhone,
        dateStr,
        items: items.length > 0 ? items : [{ name: 'Salon Service', price: Math.round((b.total_minor || 0) / 100), qty: 1 }],
        staff: parsedStaff,
        total: Math.round((b.total_minor || 0) / 100),
        paidAmount: Math.round((b.paid_amount_minor ?? b.total_minor ?? 0) / 100),
        dueAmount: Math.round((b.due_amount_minor || 0) / 100),
        mode: paymentMode,
        status: (b.status as Bill['status']) || 'paid',
        isDeleted: b.status === 'deleted' || !!b.deleted_at,
        isToday,
        isYesterday,
        createdAt: b.created_at || b.issued_at,
      };
    });

    // 7. Fetch customers & compute visits, lifetime spend, and outstanding dues live from bills
    const { data: custRows } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    const statsByCustomer = new Map<string, { visits: number; spend: number; dues: number; lastVisit: string }>();
    for (const b of bills) {
      if (b.isDeleted) continue;
      const key = (b.phone && b.phone.length === 10) ? b.phone : b.cust.toLowerCase();
      if (!statsByCustomer.has(key)) {
        statsByCustomer.set(key, { visits: 0, spend: 0, dues: 0, lastVisit: 'Today' });
      }
      const st = statsByCustomer.get(key)!;
      st.visits += 1;
      st.spend += b.paidAmount || 0;
      st.dues += b.dueAmount || 0;
      st.lastVisit = b.dateStr ? b.dateStr.split(',')[0] : 'Today';
    }

    const customers: Customer[] = (custRows || []).map((c) => {
      const cleanPhone = (c.phone || '').replace(/\D/g, '').slice(-10);
      const key = cleanPhone.length === 10 ? cleanPhone : c.name.toLowerCase();
      const liveStats = statsByCustomer.get(key);
      const liveVisits = liveStats ? liveStats.visits : 1;
      const liveSpend = liveStats ? liveStats.spend : 0;
      const liveDue = liveStats ? liveStats.dues : Math.round((c.outstanding_due_minor || 0) / 100);
      const lastVisit = liveStats ? liveStats.lastVisit : 'Recent';

      return {
        id: c.id,
        name: c.name,
        phone: cleanPhone,
        vip: !!c.is_starred,
        visits: liveVisits,
        spend: liveSpend,
        due: liveDue,
        notes: c.notes || '',
        lastVisit,
        status: c.is_active ? 'active' : 'inactive',
      };
    });

    // 8. Fetch expenses
    const { data: expRows } = await supabase
      .from('expenses')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    const expenses: Expense[] = (expRows || []).map((e) => ({
      id: e.id,
      cat: 'Supplies',
      amount: Math.round((e.amount_minor || 0) / 100),
      note: e.note || '',
      pm: e.payment_method || 'UPI',
      staff: null,
      inProfit: e.include_in_profit !== false,
      date: e.expense_date || new Date().toISOString().split('T')[0],
    }));

    return {
      shop: shopProfile,
      categories,
      services,
      staff,
      customers,
      appointments,
      bills,
      expenses,
    };
  } catch (err) {
    console.error('[Supabase] Exception in fetchSalonDataFromDb:', err);
    return null;
  }
}

/**
 * Persist a customer strictly into the current salon's customers table.
 */
export async function saveCustomerToDb(shopId: string, customer: {
  name: string;
  phone: string;
  vip?: boolean;
  due?: number;
  notes?: string;
}): Promise<string | null> {
  try {
    const custId = generateUuid();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        id: custId,
        shop_id: shopId,
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        is_starred: !!customer.vip,
        outstanding_due_minor: Math.round((customer.due || 0) * 100),
        notes: customer.notes?.trim() || null,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[Supabase] Customer insert warning:', error.message);
      return null;
    }
    return data?.id || custId;
  } catch {
    return null;
  }
}

/**
 * Persist an appointment strictly into the current salon's appointments table.
 */
export async function saveAppointmentToDb(shopId: string, appt: Omit<Appointment, 'id'>): Promise<string | null> {
  try {
    const apptId = generateUuid();
    
    // Parse start time into ISO string safely
    let startsAtIso = new Date().toISOString();
    try {
      if (appt.date && appt.startsAt) {
        let hour = 10;
        let minute = 0;
        const timeMatch = appt.startsAt.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeMatch) {
          hour = parseInt(timeMatch[1], 10);
          minute = parseInt(timeMatch[2], 10);
          const ampm = timeMatch[3]?.toUpperCase();
          if (ampm === 'PM' && hour < 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
        }
        const d = new Date(appt.date);
        d.setHours(hour, minute, 0, 0);
        if (!isNaN(d.getTime())) {
          startsAtIso = d.toISOString();
        }
      }
    } catch {}

    // Resolve customer and staff foreign keys
    let customerId: string | null = null;
    let staffId: string | null = null;

    if (appt.phone) {
      const cleanPhone = appt.phone.replace(/\D/g, '').slice(-10);
      try {
        const { data: custRows } = await supabase
          .from('customers')
          .select('id')
          .eq('shop_id', shopId)
          .eq('phone', cleanPhone)
          .limit(1);
        if (custRows && custRows.length > 0) {
          customerId = custRows[0].id;
        }
      } catch {}
    }

    if (appt.staff) {
      try {
        const { data: stRows } = await supabase
          .from('staff')
          .select('id')
          .eq('shop_id', shopId)
          .ilike('name', appt.staff.trim())
          .limit(1);
        if (stRows && stRows.length > 0) {
          staffId = stRows[0].id;
        }
      } catch {}
    }

    const notesJson = JSON.stringify({
      cust: appt.cust,
      service: appt.service,
      staff_name: appt.staff,
      amount: appt.amount,
    });

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        id: apptId,
        shop_id: shopId,
        customer_id: customerId,
        staff_id: staffId,
        starts_at: startsAtIso,
        duration_minutes: 30,
        status: appt.status || 'Confirmed',
        notes: notesJson,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[Supabase] Appointment insert warning:', error.message);
      return null;
    }
    return data?.id || apptId;
  } catch {
    return null;
  }
}

/**
 * Update appointment status in Supabase.
 */
export async function updateAppointmentStatusInDb(shopId: string, apptId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', apptId)
      .eq('shop_id', shopId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Persist a bill and line items transactionally strictly into the current salon's tables.
 */
export async function saveBillToDb(
  shopId: string,
  bill: Omit<Bill, 'id' | 'dateStr' | 'isDeleted' | 'isToday'> & { invoiceNumber: string }
): Promise<string | null> {
  try {
    const billId = generateUuid();
    const totalMinor = Math.round(bill.total * 100);
    const paidMinor = Math.round(bill.paidAmount * 100);
    const dueMinor = Math.max(0, totalMinor - paidMinor);

    // Resolve customer foreign key (look up or auto-add walk-in client)
    let customerId: string | null = null;
    if (bill.phone) {
      const cleanPhone = bill.phone.replace(/\D/g, '').slice(-10);
      try {
        const { data: custRows } = await supabase
          .from('customers')
          .select('id')
          .eq('shop_id', shopId)
          .eq('phone', cleanPhone)
          .limit(1);
        if (custRows && custRows.length > 0) {
          customerId = custRows[0].id;
        } else if (bill.cust && bill.cust.trim() !== 'Walk-in Client' && bill.cust.trim() !== '') {
          const newCustId = generateUuid();
          await supabase.from('customers').insert({
            id: newCustId,
            shop_id: shopId,
            name: bill.cust.trim(),
            phone: cleanPhone,
            is_starred: false,
            is_active: true,
          });
          customerId = newCustId;
        }
      } catch {}
    }

    // Resolve staff foreign key
    let staffId: string | null = null;
    if (bill.staff) {
      try {
        const { data: stRows } = await supabase
          .from('staff')
          .select('id')
          .eq('shop_id', shopId)
          .ilike('name', bill.staff.trim())
          .limit(1);
        if (stRows && stRows.length > 0) {
          staffId = stRows[0].id;
        }
      } catch {}
    }

    const billStatus = dueMinor === 0 ? 'Paid' : (paidMinor > 0 ? 'Partial' : 'Pending');
    const paymentMethod = bill.mode || 'UPI';
    const notesStr = `staff_name:${bill.staff};cust:${bill.cust};phone:${bill.phone};mode:${paymentMethod}`;
    const nowIso = new Date().toISOString();

    const { error: billErr } = await supabase.from('bills').insert({
      id: billId,
      shop_id: shopId,
      customer_id: customerId,
      staff_id: staffId,
      invoice_number: bill.invoiceNumber,
      status: billStatus,
      subtotal_minor: totalMinor,
      discount_minor: Math.round((bill.discount || 0) * 100),
      tax_minor: 0,
      tip_minor: 0,
      total_minor: totalMinor,
      paid_amount_minor: paidMinor,
      due_amount_minor: dueMinor,
      payment_method: paymentMethod,
      notes: notesStr,
      issued_at: nowIso,
    });

    if (billErr) {
      console.warn('[Supabase] Bill insert warning:', billErr.message);
      return null;
    }

    // Insert bill items with snapshot
    if (bill.items && bill.items.length > 0) {
      for (const item of bill.items) {
        const unitPriceMinor = Math.round(item.price * 100);
        const qty = item.qty || 1;
        await supabase.from('bill_items').insert({
          id: generateUuid(),
          bill_id: billId,
          service_name_snapshot: item.name,
          quantity: qty,
          unit_price_minor: unitPriceMinor,
          discount_minor: 0,
          tax_minor: 0,
          line_total_minor: unitPriceMinor * qty,
          staff_id: staffId,
        });
      }
    }

    // Insert payment record into payments table
    try {
      await supabase.from('payments').insert({
        id: generateUuid(),
        shop_id: shopId,
        bill_id: billId,
        amount_minor: paidMinor > 0 ? paidMinor : totalMinor,
        method: paymentMethod,
        status: 'Completed',
        paid_at: nowIso,
      });
    } catch {
      // Payment table may have RLS
    }

    return billId;
  } catch {
    return null;
  }
}

/**
 * Persist a staff member strictly into the current salon's staff table.
 */
export async function saveStaffMemberToDb(
  shopId: string,
  member: { name: string; phone: string; role?: string }
): Promise<string | null> {
  try {
    const cleanPhone = (member.phone || '').replace(/\D/g, '').slice(-10);
    const staffId = generateUuid();
    const { data, error } = await supabase
      .from('staff')
      .insert({
        id: staffId,
        shop_id: shopId,
        name: member.name.trim(),
        phone: cleanPhone,
        role: member.role || 'Stylist',
        is_active: true,
        target_amount_minor: 500000,
        rating: '5.0',
        permissions: {
          customers: true,
          sales: true,
          appointments: true,
          expenses: false,
          reports: false,
          team: false,
          reminders: true,
          profile: false,
          expensesHistory: false,
          shareBills: false,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[Supabase] Staff insert warning:', error.message);
      return null;
    }
    return data?.id || staffId;
  } catch {
    return null;
  }
}

/**
 * Persist an expense strictly into the current salon's expenses table.
 */
export async function saveExpenseToDb(
  shopId: string,
  expense: Omit<Expense, 'id' | 'date'> & { date?: string }
): Promise<string | null> {
  try {
    const expId = generateUuid();

    // Look up category_id if available
    let catId: string | null = null;
    try {
      const { data: catRows } = await supabase
        .from('expense_categories')
        .select('id')
        .or(`shop_id.eq.${shopId},shop_id.is.null`)
        .limit(1);
      if (catRows && catRows.length > 0) {
        catId = catRows[0].id;
      }
    } catch {}

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        id: expId,
        shop_id: shopId,
        category_id: catId,
        note: expense.note.trim(),
        amount_minor: Math.round(expense.amount * 100),
        payment_method: expense.pm || 'UPI',
        expense_date: expense.date || new Date().toISOString().split('T')[0],
        include_in_profit: expense.inProfit !== false,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[Supabase] Expense insert warning:', error.message);
      return null;
    }
    return data?.id || expId;
  } catch {
    return null;
  }
}

/**
 * Update shop profile metadata strictly for this salon's shop_id.
 */
export async function updateShopProfileInDb(shopId: string, profile: Partial<ShopProfile>): Promise<boolean> {
  try {
    const updatePayload: Record<string, unknown> = {};
    if (profile.shopName) updatePayload.name = profile.shopName.trim();
    if (profile.phone) updatePayload.phone = profile.phone.trim();
    if (profile.address) updatePayload.address = profile.address.trim();
    if (profile.city) updatePayload.city = profile.city.trim();
    if (profile.pinCode) updatePayload.pin_code = profile.pinCode.trim();
    if (profile.gstin !== undefined) updatePayload.gstin = profile.gstin?.trim() || null;
    if (profile.upiId !== undefined) updatePayload.upi_id = profile.upiId?.trim() || '';
    if (profile.invoicePrefix) updatePayload.invoice_prefix = profile.invoicePrefix;
    if (profile.logoImg !== undefined) updatePayload.logo_path = profile.logoImg;

    const { error } = await supabase
      .from('shops')
      .update(updatePayload)
      .eq('id', shopId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Soft-delete a bill in Supabase (30-day restore bin).
 */
export async function deleteBillInDb(shopId: string, invoiceNumberOrId: string): Promise<boolean> {
  try {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('bills')
      .update({
        status: 'deleted',
        deleted_at: nowIso,
      })
      .eq('shop_id', shopId)
      .or(`invoice_number.eq.${invoiceNumberOrId},id.eq.${invoiceNumberOrId}`);

    return !error;
  } catch {
    return false;
  }
}
