'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Crosshair, 
  Upload, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Sun, 
  Moon,
  Camera,
  Check
} from 'lucide-react';
import { ShopProfile, StaffMember } from '@/components/SalonContext';
import { registerNewSalonInDb } from '@/lib/supabase-service';

interface OwnerRegistrationProps {
  initialPhone?: string;
  onBackToLogin?: () => void;
  onRegistrationComplete?: (registeredShop: ShopProfile) => void;
}

export function OwnerRegistrationView({
  initialPhone = '',
  onBackToLogin,
  onRegistrationComplete,
}: OwnerRegistrationProps) {
  const router = useRouter();

  // Theme Support (defaults to dark or reads from localStorage / html class)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('stylefleet_theme');
      if (stored === 'light') return false;
      return true;
    }
    return true;
  });

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stylefleet_theme', nextMode ? 'dark' : 'light');
      if (nextMode) {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.body.classList.add('light');
      }
    }
  };

  // Step 1: Salon Details | Step 2: Styling Team Setup
  const [step, setStep] = useState<1 | 2>(1);

  // STEP 1 STATE: Salon & Owner Profile (In exact order: Shop Name, Owner Name, Phone, Address + GPS, City, Pin, GST, Logo)
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState(initialPhone || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [gstin, setGstin] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>('');

  // GPS State
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string>('');

  // STEP 2 STATE: Styling Team Members (Starts empty; clean database onboarding)
  const [stylists, setStylists] = useState<Array<{ name: string; phone: string; role: string }>>([]);
  const [newStylistName, setNewStylistName] = useState('');
  const [newStylistPhone, setNewStylistPhone] = useState('');
  const [newStylistRole, setNewStylistRole] = useState('Senior Stylist');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerToast('Image is larger than 2MB. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setLogoPreview(result);
        triggerToast('Salon logo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Live GPS Detection
  const handleFetchGPS = () => {
    if (!navigator.geolocation) {
      triggerToast('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGPS(true);
    setGpsStatusMessage('Connecting to device GPS satellites...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setGpsCoordinates({ lat, lng });
        setIsLocatingGPS(false);
        setGpsStatusMessage(`GPS Location pinned: ${lat}, ${lng}`);
        triggerToast(`Live GPS pinned: ${lat}, ${lng}`);

        // If address is empty, append coordinates
        if (!address.trim()) {
          setAddress(`Salon Location (GPS: ${lat}, ${lng})`);
        }
      },
      (error) => {
        setIsLocatingGPS(false);
        let errorMsg = 'Could not fetch GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'GPS location permission denied in browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'GPS location request timed out.';
        }
        setGpsStatusMessage(errorMsg);
        triggerToast(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Validate Step 1
  const handleProceedToTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      triggerToast('Please enter your salon / shop name');
      return;
    }
    if (!ownerName.trim()) {
      triggerToast('Please enter the owner full name');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      triggerToast('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!address.trim()) {
      triggerToast('Please enter your salon address');
      return;
    }
    if (!city.trim()) {
      triggerToast('Please enter your city');
      return;
    }
    if (!pinCode.trim() || pinCode.length < 6) {
      triggerToast('Please enter a valid 6-digit pin code');
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add Stylist to List
  const handleAddStylist = () => {
    if (!newStylistName.trim()) {
      triggerToast('Please enter stylist full name');
      return;
    }
    const cleanNumber = newStylistPhone.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      triggerToast('Please enter a valid 10-digit mobile number');
      return;
    }
    if (stylists.some((s) => s.phone === cleanNumber)) {
      triggerToast('A stylist with this phone number is already added');
      return;
    }
    if (stylists.length >= 3) {
      triggerToast('Maximum 3 stylists allowed per salon account (StyleFleet plan limit)');
      return;
    }

    setStylists([
      ...stylists,
      {
        name: newStylistName.trim(),
        phone: cleanNumber,
        role: newStylistRole || 'Stylist',
      },
    ]);
    setNewStylistName('');
    setNewStylistPhone('');
    triggerToast(`Added ${newStylistName.trim()} to styling team!`);
  };

  // Remove Stylist
  const handleRemoveStylist = (idx: number) => {
    const target = stylists[idx];
    setStylists(stylists.filter((_, i) => i !== idx));
    triggerToast(`Removed ${target.name} from team.`);
  };

  // Final Registration Submission to Supabase Cloud Database
  const handleCompleteRegistration = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Generate Invoice Prefix from Shop Name
      const words = shopName.trim().split(/\s+/);
      const prefix = words.map((w) => w[0]?.toUpperCase() || '').slice(0, 3).join('') || 'SF';
      const cleanPhone = phone.replace(/\D/g, '');

      // Register completely isolated new salon into Supabase
      const dbResult = await registerNewSalonInDb({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        city: city.trim(),
        pinCode: pinCode.trim(),
        gstin: gstin.trim().toUpperCase() || undefined,
        upiId: `${shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
        logoImg: logoPreview || undefined,
        latitude: gpsCoordinates?.lat,
        longitude: gpsCoordinates?.lng,
        gpsAddress: gpsStatusMessage || undefined,
        stylists: stylists.map((s) => ({ name: s.name, phone: s.phone })),
      });

      if (!dbResult.success || !dbResult.shopId) {
        triggerToast(dbResult.error || 'Registration failed. Please check your details.');
        setIsSubmitting(false);
        return;
      }

      const activeShopId = dbResult.shopId;

      const registeredProfile: ShopProfile = {
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        city: city.trim(),
        pinCode: pinCode.trim(),
        gstin: gstin.trim().toUpperCase(),
        upiId: `${shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
        bookingHours: '09:00 AM – 09:00 PM',
        invoicePrefix: `${prefix}-`,
        invoicePrefixFormat: 'standard',
        logoImg: logoPreview || '',
        latitude: gpsCoordinates?.lat,
        longitude: gpsCoordinates?.lng,
        gpsAddress: gpsStatusMessage || '',
        googleMaps: gpsCoordinates
          ? `https://maps.google.com/?q=${gpsCoordinates.lat},${gpsCoordinates.lng}`
          : '',
        applyGst: Boolean(gstin.trim()),
        gstRate: 18,
      };

      // Save to localStorage for SalonContext persistence
      try {
        // Clear local caches from any previous salons
        localStorage.removeItem('stylefleet_bills_db');
        localStorage.removeItem('stylefleet_appointments_db');
        localStorage.removeItem('stylefleet_customers_db');
        localStorage.removeItem('stylefleet_staff_team_db');
        localStorage.removeItem('stylefleet_expenses_db');

        localStorage.setItem('stylefleet_shop_id', activeShopId);
        localStorage.setItem('stylefleet_shop_profile', JSON.stringify(registeredProfile));

        // Set active session
        localStorage.setItem(
          'stylefleet_auth_session',
          JSON.stringify({
            isLoggedIn: true,
            role: 'owner',
            phone: cleanPhone,
            shopId: activeShopId,
            shopName: registeredProfile.shopName,
            timestamp: Date.now(),
          })
        );
      } catch {}

      triggerToast(`Congratulations! ${registeredProfile.shopName} is saved in cloud database.`);

      if (onRegistrationComplete) {
        onRegistrationComplete(registeredProfile);
      } else {
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      triggerToast(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? 'bg-[#07152B] text-white' : 'bg-[#FAF8F3] text-[#0F172A]'
      }`}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#0B1E3B] border border-[#D4AF37] text-white text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Dock */}
      <header
        className={`sticky top-0 z-40 px-4 sm:px-8 py-3.5 border-b backdrop-blur-xl ${
          isDarkMode
            ? 'bg-[#0B1E3B]/90 border-white/10'
            : 'bg-white/95 border-slate-200'
        }`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#D4AF37]/50 bg-[#07152B] flex items-center justify-center">
              <img
                src="/assets/stylefleet-logo.png"
                alt="StyleFleet"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-wide block leading-none">
                StyleFleet
              </span>
              <span className="text-[10px] text-[#D4AF37] font-bold">
                Salon Owner Registration
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDarkMode
                  ? 'border-white/10 bg-[#07152B] text-[#A7B0C3] hover:text-white'
                  : 'border-slate-200 bg-slate-100 text-[#475569] hover:text-black'
              }`}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-[#D4AF37]" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-sky-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Back to Login */}
            {onBackToLogin && (
              <button
                type="button"
                onClick={onBackToLogin}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                  isDarkMode
                    ? 'border-white/10 text-[#A7B0C3] hover:text-white hover:bg-white/5'
                    : 'border-slate-300 text-slate-700 hover:text-black hover:bg-slate-100'
                }`}
              >
                Back to Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Registration Content Container */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Step Indicator Tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div
              className={`flex-1 h-1 absolute left-0 right-0 top-1/2 -translate-y-1/2 z-0 ${
                isDarkMode ? 'bg-white/10' : 'bg-slate-200'
              }`}
            >
              <div
                className="h-full bg-[#D4AF37] transition-all duration-300"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>

            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${
                step === 1
                  ? 'bg-[#D4AF37] text-[#07152B] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                  : 'bg-[#0B1E3B] text-white border-white/20'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-[#07152B] text-[#D4AF37] flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span>Salon & Owner Profile</span>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => {
                if (shopName.trim() && ownerName.trim() && phone.replace(/\D/g, '').length === 10) {
                  setStep(2);
                } else {
                  triggerToast('Please complete salon details and mobile in step 1 first');
                }
              }}
              className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${
                step === 2
                  ? 'bg-[#D4AF37] text-[#07152B] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                  : isDarkMode
                  ? 'bg-[#0B1E3B] text-[#A7B0C3] border-white/10'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-700/50 text-white flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <span>Styling Team Setup</span>
            </button>
          </div>
        </div>

        {/* ================= STEP 1: SALON & OWNER DETAILS ================= */}
        {step === 1 && (
          <form
            onSubmit={handleProceedToTeam}
            className={`rounded-3xl p-6 sm:p-9 border shadow-xl space-y-6 ${
              isDarkMode
                ? 'bg-[#0B1E3B] border-white/10 text-white'
                : 'bg-white border-slate-200 text-[#0F172A]'
            }`}
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Register Your Salon</h1>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'
                }`}
              >
                Set up your salon profile, live GPS coordinates, and brand logo to launch your workspace.
              </p>
            </div>

            {/* Field Grid: 1. Shop Name & 2. Owner Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Salon / Shop Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2
                    className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-[#8B98AF]' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Cuts & Spa"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs font-semibold outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#07152B] border-white/10 text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-[#0F172A] focus:border-[#D4AF37]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Owner Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User
                    className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-[#8B98AF]' : 'text-slate-400'
                    }`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sankar Kumar"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs font-semibold outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#07152B] border-white/10 text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-[#0F172A] focus:border-[#D4AF37]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 3. Owner Mobile Number (Freely Editable, Not Pre-filled) */}
            <div>
              <label className="block text-xs font-bold mb-1.5">
                Owner Mobile Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none">
                  <Phone
                    className={`w-4 h-4 ${
                      isDarkMode ? 'text-[#8B98AF]' : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold select-none ${
                      isDarkMode ? 'text-[#D4AF37]' : 'text-[#8C6239]'
                    }`}
                  >
                    +91
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`w-full pl-16 pr-4 py-3 rounded-2xl border text-xs font-semibold outline-none transition-colors ${
                    isDarkMode
                      ? 'bg-[#07152B] border-white/10 text-white focus:border-[#D4AF37]'
                      : 'bg-white border-slate-300 text-[#0F172A] focus:border-[#D4AF37]'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] block mt-1 ${
                  isDarkMode ? 'text-[#8B98AF]' : 'text-slate-500'
                }`}
              >
                Owner will use this number for secure OTP authentication.
              </span>
            </div>

            {/* 4. Address with Live GPS Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold">
                  Salon Street Address <span className="text-rose-400">*</span>
                </label>

                {/* Live GPS Pin Button */}
                <button
                  type="button"
                  onClick={handleFetchGPS}
                  disabled={isLocatingGPS}
                  className="px-3 py-1 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  title="Detect GPS location using device sensors"
                >
                  <Crosshair
                    className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`}
                  />
                  <span>{isLocatingGPS ? 'Fetching GPS...' : 'Fetch Live GPS Location'}</span>
                </button>
              </div>

              <div className="relative">
                <MapPin
                  className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                    isDarkMode ? 'text-[#8B98AF]' : 'text-slate-400'
                  }`}
                />
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. 12 Anna Salai, Opposite LIC Tower, Mount Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-semibold outline-none resize-none transition-colors ${
                    isDarkMode
                      ? 'bg-[#07152B] border-white/10 text-white focus:border-[#D4AF37]'
                      : 'bg-white border-slate-300 text-[#0F172A] focus:border-[#D4AF37]'
                  }`}
                />
              </div>

              {/* GPS Coordinates Badge if Pinned */}
              {gpsCoordinates && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span className="text-emerald-400 font-bold">
                      GPS Pinned: {gpsCoordinates.lat}° N, {gpsCoordinates.lng}° E
                    </span>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${gpsCoordinates.lat},${gpsCoordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#D4AF37] hover:underline"
                  >
                    View Map ↗
                  </a>
                </div>
              )}
            </div>

            {/* 5. City & 6. Pin Code Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  City <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border text-xs font-semibold outline-none transition-colors ${
                    isDarkMode
                      ? 'bg-[#07152B] border-white/10 text-white focus:border-[#D4AF37]'
                      : 'bg-white border-slate-300 text-[#0F172A] focus:border-[#D4AF37]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  6-Digit Pin Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="e.g. 600002"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full px-4 py-3 rounded-2xl border text-xs font-semibold outline-none transition-colors ${
                    isDarkMode
                      ? 'bg-[#07152B] border-white/10 text-white focus:border-[#D4AF37]'
                      : 'bg-white border-slate-300 text-[#0F172A] focus:border-[#D4AF37]'
                  }`}
                />
              </div>
            </div>

            {/* 7. GST (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold">GST Number</label>
                <span
                  className={`text-[11px] font-semibold ${
                    isDarkMode ? 'text-[#8B98AF]' : 'text-slate-400'
                  }`}
                >
                  Optional
                </span>
              </div>
              <input
                type="text"
                maxLength={15}
                placeholder="e.g. 33AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className={`w-full px-4 py-3 rounded-2xl border text-xs font-semibold outline-none transition-colors font-mono ${
                  isDarkMode
                    ? 'bg-[#07152B] border-white/10 text-white focus:border-[#D4AF37]'
                    : 'bg-white border-slate-300 text-[#0F172A] focus:border-[#D4AF37]'
                }`}
              />
            </div>

            {/* 8. Upload Salon Logo (Placed as the LAST Field Below All Fields) */}
            <div
              className={`p-5 rounded-2xl border ${
                isDarkMode
                  ? 'bg-[#07152B] border-white/10'
                  : 'bg-[#FAF8F3] border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold block">Upload Salon Logo</span>
                <span
                  className={`text-[11px] font-semibold ${
                    isDarkMode ? 'text-[#8B98AF]' : 'text-slate-400'
                  }`}
                >
                  Optional
                </span>
              </div>
              <p
                className={`text-[11px] mb-4 ${
                  isDarkMode ? 'text-[#8B98AF]' : 'text-slate-500'
                }`}
              >
                Upload your salon logo to feature on customer bills, thermal print receipts, and the command center.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Circular Luxury Logo Preview / Dropzone */}
                <div className="relative group shrink-0">
                  <div
                    className={`w-24 h-24 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center shadow-md relative transition-all ${
                      logoPreview
                        ? 'border-[#D4AF37] bg-black/20'
                        : isDarkMode
                        ? 'border-white/20 bg-[#0B1E3B]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Salon Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <Camera className="w-6 h-6 text-[#8B98AF] mb-1" />
                        <span className="text-[10px] font-semibold text-[#8B98AF]">
                          Salon Logo
                        </span>
                      </div>
                    )}
                  </div>

                  <label
                    htmlFor="logo-file-input"
                    className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#D4AF37] text-[#07152B] flex items-center justify-center shadow-md cursor-pointer hover:bg-[#C59F2E] transition-transform active:scale-95"
                    title="Upload Salon Logo Photo"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </label>
                  <input
                    id="logo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>

                {/* Upload Action & Notes */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label
                      htmlFor="logo-file-input"
                      className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoPreview ? 'Change Logo Photo' : 'Choose Logo Photo'}</span>
                    </label>

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => setLogoPreview('')}
                        className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition-colors"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>

                  <p
                    className={`text-[11px] ${
                      isDarkMode ? 'text-[#8B98AF]' : 'text-slate-500'
                    }`}
                  >
                    PNG, JPG, or SVG recommended. Maximum size 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 1 Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-sm font-extrabold shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <span>Continue to Styling Team Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: STYLING TEAM (WORKERS) SETUP ================= */}
        {step === 2 && (
          <div
            className={`rounded-3xl p-6 sm:p-9 border shadow-xl space-y-6 ${
              isDarkMode
                ? 'bg-[#0B1E3B] border-white/10 text-white'
                : 'bg-white border-slate-200 text-[#0F172A]'
            }`}
          >
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Add Your Styling Team</h2>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'
                }`}
              >
                Add your stylists and team members now. They will immediately be able to log in to StyleFleet with their mobile number and OTP.
              </p>
            </div>

            {/* Quick Add Stylist Form Box */}
            <div
              className={`p-5 rounded-2xl border space-y-3.5 ${
                isDarkMode
                  ? 'bg-[#07152B] border-white/10'
                  : 'bg-[#FAF8F3] border-slate-200'
              }`}
            >
              <span className="text-xs font-bold block">Quick Add Stylist</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Stylist Name */}
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Stylist Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sankar / Deepa"
                    value={newStylistName}
                    onChange={(e) => setNewStylistName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                      isDarkMode
                        ? 'bg-[#0B1E3B] border-white/10 text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>

                {/* Stylist Phone */}
                <div>
                  <label className="block text-[11px] font-semibold mb-1">10-Digit Mobile</label>
                  <input
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="e.g. 9840112233"
                    value={newStylistPhone}
                    onChange={(e) =>
                      setNewStylistPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                      isDarkMode
                        ? 'bg-[#0B1E3B] border-white/10 text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>

                {/* Stylist Specialization */}
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Role / Specialization</label>
                  <select
                    value={newStylistRole}
                    onChange={(e) => setNewStylistRole(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                      isDarkMode
                        ? 'bg-[#0B1E3B] border-white/10 text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  >
                    <option value="Senior Stylist">Senior Stylist</option>
                    <option value="Hair Specialist">Hair Specialist</option>
                    <option value="Beard Specialist">Beard Specialist</option>
                    <option value="Spa Therapist">Spa Therapist</option>
                    <option value="Color Specialist">Color Specialist</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddStylist}
                  className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stylist to Team</span>
                </button>
              </div>
            </div>

            {/* List of Added Stylists */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">
                  Styling Team Members ({stylists.length})
                </span>
                <span
                  className={`text-[11px] ${
                    isDarkMode ? 'text-[#8B98AF]' : 'text-slate-500'
                  }`}
                >
                  Can be edited anytime in Team settings
                </span>
              </div>

              {stylists.length === 0 ? (
                <div
                  className={`p-6 rounded-2xl border text-center text-xs ${
                    isDarkMode
                      ? 'bg-[#07152B] border-white/10 text-[#8B98AF]'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  No stylists added yet. You can add them above or skip and configure later.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stylists.map((st, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                        isDarkMode
                          ? 'bg-[#07152B] border-white/10'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                          {st.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-xs block font-bold">{st.name}</strong>
                          <span
                            className={`text-[11px] block ${
                              isDarkMode ? 'text-[#8B98AF]' : 'text-slate-500'
                            }`}
                          >
                            +91 {st.phone} · {st.role}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveStylist(idx)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDarkMode
                            ? 'border-white/10 text-[#8B98AF] hover:text-rose-400 hover:bg-rose-500/10'
                            : 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Remove Stylist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Helper Note for Owner */}
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
                isDarkMode
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Stylists added here will be automatically authorized. Once you launch, they can enter the Stylist Workspace using their mobile number and SMS verification code.
              </span>
            </div>

            {/* Action Footer Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 justify-between border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`w-full sm:w-auto px-5 py-3 rounded-2xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  isDarkMode
                    ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Salon Details</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={isSubmitting}
                  className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl border text-xs font-bold transition-colors ${
                    isDarkMode
                      ? 'border-white/10 text-[#A7B0C3] hover:text-white hover:bg-white/5'
                      : 'border-slate-300 text-slate-600 hover:text-black hover:bg-slate-100'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Skip Team Setup
                </button>

                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={isSubmitting}
                  className={`flex-1 sm:flex-none py-3 px-7 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-extrabold shadow-lg shadow-[#D4AF37]/25 inline-flex items-center justify-center gap-2 active:scale-95 transition-all ${
                    isSubmitting ? 'opacity-70 cursor-wait' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#07152B] border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Cloud DB...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete & Launch Salon</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
