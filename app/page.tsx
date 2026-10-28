'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Crown, 
  Scissors, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Calendar, 
  Zap, 
  TrendingUp, 
  UserCheck, 
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Star,
  Check,
  X,
  MessageCircle,
  Sparkles,
  BarChart3,
  Users,
  Smartphone,
  Globe,
  Receipt,
  Layers,
  Award
} from 'lucide-react';
import { OwnerRegistrationView } from '@/components/owner-registration';
import { AnimatedCounter } from '@/components/animated-counter';
import { findSalonByPhone } from '@/lib/supabase-service';

export default function HomePage() {
  const router = useRouter();
  const [view, setView] = useState<'home' | 'login' | 'register'>('home');
  const [role, setRole] = useState<'owner' | 'stylist'>('owner');
  const [authStep, setAuthStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Interactive Dribbble Demo State
  const [demoSelectedServices, setDemoSelectedServices] = useState<string[]>([
    'Haircut & Fade',
    'Beard Sculpt',
  ]);
  const [demoActiveChair, setDemoActiveChair] = useState<number>(2);
  const [landingLang, setLandingLang] = useState<'en' | 'ta'>('en');
  const [pricingInterval, setPricingInterval] = useState<'annual' | 'monthly'>('annual');

  const demoServicesList = [
    { id: 'Haircut & Fade', name: 'Signature Haircut & Fade', price: 800, time: '35m' },
    { id: 'Beard Sculpt', name: 'Beard Precision Sculpt', price: 450, time: '20m' },
    { id: 'Keratin Ritual', name: 'Moroccan Keratin Spa', price: 1800, time: '55m' },
    { id: 'Gold Glow Facial', name: '24K Luxury Gold Facial', price: 1400, time: '40m' },
  ];

  const demoTotal = demoSelectedServices.reduce((sum, serviceId) => {
    const item = demoServicesList.find((s) => s.id === serviceId);
    return sum + (item ? item.price : 0);
  }, 0);

  const toggleDemoService = (serviceId: string) => {
    if (demoSelectedServices.includes(serviceId)) {
      if (demoSelectedServices.length > 1) {
        setDemoSelectedServices(demoSelectedServices.filter((s) => s !== serviceId));
      }
    } else {
      setDemoSelectedServices([...demoSelectedServices, serviceId]);
    }
  };

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // Switch to login page
  const openLogin = (selectedRole: 'owner' | 'stylist' = 'owner') => {
    setRole(selectedRole);
    setAuthStep('phone');
    setPhone('');
    setOtp(['', '', '', '', '', '']);
    setView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnHome = () => {
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Timer for OTP resend countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authStep === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [authStep, countdown]);

  // Phone submission handler - Dispatches real SMS OTP via 2Factor API
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    if (!agreeToTerms) {
      showToast('Please agree to the Terms of Service & Privacy Policy of StyleFleet', 'error');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();

      if (data.success && data.sessionId) {
        setOtpSessionId(data.sessionId);
        setCountdown(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setAuthStep('otp');
        showToast(data.message || `Verification code sent to +91 ${cleanPhone}`, 'success');
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 150);
      } else {
        showToast(data.error || 'Failed to send OTP via SMS', 'error');
      }
    } catch {
      showToast('Network error sending OTP. Please try again.', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP code via 2Factor API
  const handleResend = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();

      if (data.success && data.sessionId) {
        setOtpSessionId(data.sessionId);
        setCountdown(30);
        setCanResend(false);
        showToast(`New verification code sent to +91 ${cleanPhone}`, 'success');
      } else {
        showToast(data.error || 'Failed to resend code', 'error');
      }
    } catch {
      showToast('Network error resending OTP', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // OTP box input handling
  const handleOtpChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = numeric ? numeric[0] : '';
    setOtp(newOtp);

    if (numeric && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 boxes filled
    if (newOtp.every((digit) => digit !== '')) {
      setTimeout(() => verifyOtp(newOtp.join('')), 200);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const newOtp = [...otp];
      for (let i = 0; i < pasteData.length; i++) {
        newOtp[i] = pasteData[i];
      }
      setOtp(newOtp);
      if (pasteData.length === 6) {
        setTimeout(() => verifyOtp(pasteData), 250);
      } else {
        otpRefs.current[pasteData.length]?.focus();
      }
    }
  };

  const verifyOtp = async (code: string) => {
    if (code.length < 6) {
      showToast('Please enter the complete 6-digit code', 'error');
      return;
    }

    setIsVerifyingOtp(true);

    // Verify through 2Factor API route if session exists
    if (otpSessionId) {
      try {
        const res = await fetch('/api/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: otpSessionId, otp: code }),
        });
        const data = await res.json();
        if (!data.success || !data.matched) {
          showToast(data.error || 'Invalid OTP code. Please check and try again.', 'error');
          setIsVerifyingOtp(false);
          return;
        }
      } catch {
        showToast('Verification server error. Please try again.', 'error');
        setIsVerifyingOtp(false);
        return;
      }
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Look up salon in cloud Supabase database
    const dbLookup = await findSalonByPhone(cleanPhone, role);

    // Helper: Clear local caches from other salons before loading new workspace
    const clearLocalSalonCache = () => {
      try {
        localStorage.removeItem('stylefleet_bills_db');
        localStorage.removeItem('stylefleet_appointments_db');
        localStorage.removeItem('stylefleet_customers_db');
        localStorage.removeItem('stylefleet_staff_team_db');
        localStorage.removeItem('stylefleet_expenses_db');
        localStorage.removeItem('stylefleet_shop_profile');
      } catch {}
    };

    if (role === 'stylist') {
      if (dbLookup.found && dbLookup.role === 'stylist' && dbLookup.shopId) {
        clearLocalSalonCache();
        const stylistDisplayName = dbLookup.staffName || 'Stylist';
        showToast(`Welcome back, ${stylistDisplayName}! Logged in to ${dbLookup.shopName || 'Salon'}.`, 'success');
        
        localStorage.setItem('stylefleet_shop_id', dbLookup.shopId);
        localStorage.setItem(
          'stylefleet_auth_session',
          JSON.stringify({
            isLoggedIn: true,
            role: 'stylist',
            phone: cleanPhone,
            shopId: dbLookup.shopId,
            staffName: dbLookup.staffName,
            staffId: dbLookup.staffId,
            shopName: dbLookup.shopName,
            timestamp: Date.now(),
          })
        );
        setTimeout(() => {
          router.push('/dashboard');
        }, 600);
        return;
      } else {
        showToast(
          dbLookup.error || 'This phone number is not registered as an active stylist. Please contact your salon owner.',
          'error'
        );
        setIsVerifyingOtp(false);
        return;
      }
    }

    // Role is Owner (or auto-detected from phone in database)
    if (dbLookup.found && dbLookup.role === 'stylist' && dbLookup.shopId) {
      clearLocalSalonCache();
      const stylistDisplayName = dbLookup.staffName || 'Stylist';
      showToast(`Welcome back, ${stylistDisplayName}! Logged in to ${dbLookup.shopName || 'Salon'}.`, 'success');
      
      localStorage.setItem('stylefleet_shop_id', dbLookup.shopId);
      localStorage.setItem(
        'stylefleet_auth_session',
        JSON.stringify({
          isLoggedIn: true,
          role: 'stylist',
          phone: cleanPhone,
          shopId: dbLookup.shopId,
          staffName: dbLookup.staffName,
          staffId: dbLookup.staffId,
          shopName: dbLookup.shopName,
          timestamp: Date.now(),
        })
      );
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
      return;
    }

    if (dbLookup.found && dbLookup.role === 'owner' && dbLookup.shopId) {
      clearLocalSalonCache();
      showToast(`Welcome back! Logged in to ${dbLookup.shopName || 'your salon'}.`, 'success');
      localStorage.setItem('stylefleet_shop_id', dbLookup.shopId);
      localStorage.setItem(
        'stylefleet_auth_session',
        JSON.stringify({
          isLoggedIn: true,
          role: 'owner',
          phone: cleanPhone,
          shopId: dbLookup.shopId,
          shopName: dbLookup.shopName,
          timestamp: Date.now(),
        })
      );
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } else {
      // New Owner -> Route to Registration Form
      showToast('New Salon Owner! Complete your salon registration.', 'success');
      setTimeout(() => {
        router.push(`/register?phone=${cleanPhone}`);
      }, 500);
    }
  };

  if (view === 'register') {
    return (
      <OwnerRegistrationView
        initialPhone={phone}
        onBackToLogin={() => setView('login')}
        onRegistrationComplete={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#D4AF37] selection:text-[#07152B] bg-[#07152B] text-slate-100 relative overflow-x-hidden">
      {/* Ambient Drifting Glow Orbs */}
      <div className="ambient-glow-wrapper">
        <div className="glow-orb glow-gold" />
        <div className="glow-orb glow-blue" />
      </div>

      {/* ================= FLOATING LUXURY PILL NAVBAR ================= */}
      <header className="sticky top-4 z-50 px-4 sm:px-6 w-full max-w-6xl mx-auto transition-all">
        <div className="floating-pill-nav rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xl">
          {/* Brand Logo & Title */}
          <button onClick={returnHome} className="flex items-center gap-3 group text-left">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#D4AF37]/60 shadow-lg bg-[#07152B] flex items-center justify-center p-0 shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/assets/stylefleet-logo.png"
                alt="StyleFleet Logo"
                width={36}
                height={36}
                className="w-9 h-9 object-cover"
                style={{ maxWidth: '36px', maxHeight: '36px' }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
                StyleFleet
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-bold">
                Salon OS
              </span>
            </div>
          </button>

          {/* Center Nav Links (Home view only) */}
          {view === 'home' && (
            <nav className="hidden lg:flex items-center gap-1 bg-[#07152B]/70 px-3 py-1 rounded-full border border-white/[0.06]">
              <a
                href="#features"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-all"
              >
                {landingLang === 'en' ? 'Features' : 'அம்சங்கள்'}
              </a>
              <a
                href="#comparison"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-all"
              >
                {landingLang === 'en' ? 'Comparison' : 'ஒப்பீடு'}
              </a>
              <a
                href="#bento"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-all"
              >
                {landingLang === 'en' ? 'Ecosystem' : 'தள மேலோட்டம்'}
              </a>
              <a
                href="#testimonials"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-all"
              >
                {landingLang === 'en' ? 'Reviews' : 'மதிப்புரைகள்'}
              </a>
              <a
                href="#pricing"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-all"
              >
                {landingLang === 'en' ? 'Pricing' : 'விலை விவரம்'}
              </a>
            </nav>
          )}

          {/* Right Action Cluster: Language Switcher + Quick Portal Entry */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Pill */}
            {view === 'home' && (
              <div className="flex items-center p-0.5 rounded-full bg-[#07152B]/90 border border-white/10 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLandingLang('en')}
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    landingLang === 'en'
                      ? 'bg-[#D4AF37] text-[#07152B] shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLandingLang('ta')}
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    landingLang === 'ta'
                      ? 'bg-[#D4AF37] text-[#07152B] shadow-sm'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            )}

            {view === 'home' ? (
              <>
                <button
                  onClick={() => openLogin('stylist')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{landingLang === 'en' ? 'Stylist Portal' : 'ஸ்டைலிஸ்ட்'}</span>
                </button>
                <button
                  onClick={() => openLogin('owner')}
                  className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5A623] hover:from-[#E0C068] hover:to-[#E5B224] text-[#07152B] text-xs sm:text-sm font-extrabold shadow-lg shadow-[#D4AF37]/20 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5 text-[#07152B]" />
                  <span>{landingLang === 'en' ? 'Get Started' : 'தொடங்கு'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={returnHome}
                className="text-xs sm:text-sm py-1.5 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white flex items-center gap-2 transition-all font-semibold"
              >
                <span>← Back to Home</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= VIEW 1: HOME / LANDING PAGE ================= */}
      {view === 'home' && (
        <main className="flex-1 relative z-10">
          
          {/* ================= SECTION 1: HERO (RealBroks Inspired) ================= */}
          <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 max-w-6xl mx-auto text-center overflow-hidden">
            {/* Subtle Hero Radial Grid Background */}
            <div className="absolute inset-0 hero-mesh-bg pointer-events-none opacity-60" />
            
            {/* Trust Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B1E3B]/90 border border-[#D4AF37]/40 shadow-xl mb-6 backdrop-blur-md animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold text-[#E0C068] tracking-wide">
                {landingLang === 'en'
                  ? '⭐ Trusted by 500+ Luxury Salons & Master Stylists across India'
                  : '⭐ இந்தியாவின் 500+ பிரீமியம் சலூன்கள் & ஸ்டைலிஸ்ட்டுகளின் நம்பகமான தேர்வு'}
              </span>
            </div>

            {/* Main Punchy Editorial Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
              {landingLang === 'en' ? (
                <>
                  Built for Salons.{' '}
                  <span className="bg-gradient-to-r from-[#D4AF37] via-[#F7C948] to-[#F5A623] bg-clip-text text-transparent">
                    Designed for Growth.
                  </span>
                </>
              ) : (
                <>
                  சலூன்களுக்காக உருவாக்கப்பட்டது.{' '}
                  <span className="bg-gradient-to-r from-[#D4AF37] via-[#F7C948] to-[#F5A623] bg-clip-text text-transparent">
                    வளர்ச்சிக்காக வடிவமைக்கப்பட்டது.
                  </span>
                </>
              )}
            </h1>

            {/* Hero Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              {landingLang === 'en'
                ? 'Say goodbye to chaotic paper registers and messy calculations. StyleFleet delivers 15-second multi-service billing, real-time styling chair matrix, automatic WhatsApp invoices, and 360° financial audits in one unified luxury workspace.'
                : 'பழைய லெட்ஜர் கணக்குகளுக்கும் பில்லிங் நெரிசலுக்கும் முற்றுப்புள்ளி வையுங்கள். 15 விநாடி பில்லிங், சேர் மேனேஜ்மென்ட், வாட்ஸ்அப் இன்வாய்ஸ் மற்றும் முழு வருமானக் கணக்குகள் ஒரே பிரீமியம் தளத்தில்.'}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => openLogin('owner')}
                className="py-4 px-8 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F5A623] to-[#D4AF37] hover:brightness-110 text-[#07152B] text-base font-extrabold shadow-2xl shadow-[#D4AF37]/30 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Crown className="w-5 h-5 text-[#07152B]" />
                <span>{landingLang === 'en' ? 'Get Started as Owner' : 'உரிமையாளராகத் தொடங்கு'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => openLogin('stylist')}
                className="py-4 px-7 rounded-full bg-[#0B1E3B]/90 hover:bg-[#0D2448] border border-white/15 hover:border-[#D4AF37]/50 text-white text-base font-semibold shadow-xl active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md"
              >
                <Scissors className="w-4 h-4 text-[#D4AF37]" />
                <span>{landingLang === 'en' ? 'Stylist Workspace' : 'ஸ்டைலிஸ்ட் தளம்'}</span>
              </button>
            </div>

            {/* Micro Feature Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{landingLang === 'en' ? 'Zero Hardware Lock-in' : 'எந்த மொபைல் அல்லது டேப்பிலும் இயங்கும்'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{landingLang === 'en' ? 'Direct WhatsApp Billing' : 'வாட்ஸ்அப் டிஜிட்டல் பில்கள்'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{landingLang === 'en' ? 'Instant 60s Setup' : '60 வினாடி உடனடி தொடக்கம்'}</span>
              </div>
            </div>

            {/* ================= HERO DEVICE / LIVE INTERACTIVE SHOWCASE ================= */}
            <div className="mt-14 relative max-w-5xl mx-auto">
              {/* Outer Glow Halo */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#D4AF37]/30 via-blue-500/20 to-[#D4AF37]/30 rounded-[32px] blur-2xl opacity-75" />

              {/* Luxury Frame Container */}
              <div className="relative rounded-[28px] bg-[#091730]/95 border border-white/15 shadow-2xl overflow-hidden backdrop-blur-2xl">
                {/* Frame Header / Browser Bar */}
                <div className="px-5 py-3.5 bg-[#07152B]/95 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-3 text-[11px] font-mono text-slate-400 hidden sm:inline">
                      https://app.stylefleet.in/billing/express
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Salon Floor • 4 Chairs Active</span>
                  </div>
                </div>

                {/* Hero Showcase Interior: Split Billing Simulator */}
                <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                  {/* Left Column: Interactive Service Selector */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                          Interactive Front-Desk Demo
                        </span>
                        <h3 className="text-xl font-extrabold text-white">Express Service Matrix</h3>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Click to select services:</span>
                    </div>

                    {/* Services Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {demoServicesList.map((service) => {
                        const isSelected = demoSelectedServices.includes(service.id);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => toggleDemoService(service.id)}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-md shadow-[#D4AF37]/10'
                                : 'bg-[#0B1E3B]/70 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                                  isSelected ? 'bg-[#D4AF37] text-[#07152B]' : 'bg-white/10 text-slate-400'
                                }`}
                              >
                                {isSelected ? '✓' : '+'}
                              </div>
                              <div>
                                <strong className="text-xs font-bold text-white block leading-tight">
                                  {service.name}
                                </strong>
                                <span className="text-[10px] text-slate-400">{service.time} session</span>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-[#D4AF37]">₹{service.price}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Stylist & Payment Mode Selector Preview */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#0B1E3B]/80 border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Assigned Stylist
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold flex items-center justify-center">
                            A
                          </div>
                          <span className="text-xs font-bold text-white">Anand (Master)</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0B1E3B]/80 border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Payment Mode
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            UPI Split
                          </span>
                          <span className="text-xs font-bold text-white">Instant QR Pay</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Luxury Invoice Preview */}
                  <div className="lg:col-span-5 bg-[#0B1E3B]/90 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <img
                            src="/assets/stylefleet-logo.png"
                            alt="StyleFleet"
                            width={22}
                            height={22}
                            className="w-5 h-5 object-contain"
                          />
                          <span className="text-xs font-extrabold text-white">Luxe Salon • Digital Bill</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                          #SF-8924
                        </span>
                      </div>

                      {/* Line Items */}
                      <div className="py-3 space-y-2">
                        {demoSelectedServices.map((id) => {
                          const item = demoServicesList.find((s) => s.id === id);
                          if (!item) return null;
                          return (
                            <div key={id} className="flex items-center justify-between text-xs">
                              <span className="text-slate-300">{item.name}</span>
                              <span className="text-white font-bold">₹{item.price}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Calculations */}
                      <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Subtotal ({demoSelectedServices.length} items)</span>
                          <span>₹{demoTotal}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>GST / Taxes (Included)</span>
                          <span>₹0.00</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-extrabold text-white pt-2 border-t border-white/10">
                          <span>Grand Total</span>
                          <span className="text-xl text-[#D4AF37]">₹{demoTotal}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-5 space-y-2">
                      <button
                        type="button"
                        onClick={() => openLogin('owner')}
                        className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BE5B] text-black text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 fill-black" />
                        <span>Share on WhatsApp & Print</span>
                      </button>
                      <p className="text-[10px] text-center text-slate-400">
                        Average checkout completed in under 15 seconds
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Live Badge 1: Daily Revenue */}
              <div className="hidden sm:block absolute -left-6 bottom-8 min-w-[220px] bg-[#0D2244]/95 border border-[#D4AF37]/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-floating-dashboard text-left">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Today Collection
                  </span>
                  <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    +22.8%
                  </span>
                </div>
                <div className="text-2xl font-black text-white">
                  <AnimatedCounter value={38450} prefix="₹ " />
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: '74%' }} />
                </div>
                <span className="text-[10px] text-[#D4AF37] font-semibold mt-1 block">
                  18 Bills • Zero Outstanding Dues
                </span>
              </div>

              {/* Floating Live Badge 2: Chair Schedule */}
              <div className="hidden sm:flex absolute -right-6 top-12 items-center gap-3 bg-[#0D2244]/95 border border-white/20 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl animate-float-reverse text-left">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#E0C068] font-black text-xs">
                  02
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Floor Schedule</span>
                  <strong className="text-xs font-bold text-white block">Chair 02: Hair Spa</strong>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    In Session • 22 mins left
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 2: STATS TICKER ================= */}
          <section id="stats" className="border-y border-white/10 bg-[#0B1E3B]/80 py-10 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-[#D4AF37] block">
                  <AnimatedCounter value={15} suffix=" Seconds" />
                </span>
                <span className="text-xs sm:text-sm text-slate-300 block font-medium">
                  {landingLang === 'en' ? 'Express Multi-Service Checkout' : 'மின்னல் வேக பில்லிங் வேகம்'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-[#D4AF37] block">
                  <AnimatedCounter value={99} suffix=".2%" />
                </span>
                <span className="text-xs sm:text-sm text-slate-300 block font-medium">
                  {landingLang === 'en' ? 'Appointment Retention via WhatsApp' : 'வாடிக்கையாளர் வருகை விகிதம்'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-[#D4AF37] block">
                  <AnimatedCounter value={360} suffix="° Tracking" />
                </span>
                <span className="text-xs sm:text-sm text-slate-300 block font-medium">
                  {landingLang === 'en' ? 'Real-Time Financial Audit' : 'முழுமையான வருமானக் கணக்குகள்'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-[#D4AF37] block">
                  ₹0
                </span>
                <span className="text-xs sm:text-sm text-slate-300 block font-medium">
                  {landingLang === 'en' ? 'Hardware Lock-in (Any Device)' : 'கூடுதல் மிஷின் செலவுகள் இல்லை'}
                </span>
              </div>
            </div>
          </section>

          {/* ================= SECTION 3: COMPARISON SHOWCASE (Old Way vs StyleFleet Way) ================= */}
          <section id="comparison" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs font-bold text-[#E0C068]">
                <span>{landingLang === 'en' ? 'The Industry Shift' : 'புரட்சிகர மாற்றம்'}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {landingLang === 'en'
                  ? 'The Old Way vs The StyleFleet Way'
                  : 'பழைய முறைகள் vs StyleFleet முறை'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                {landingLang === 'en'
                  ? 'Why premier salons are switching from paper books and clunky legacy software to StyleFleet.'
                  : 'பாரம்பரிய லெட்ஜர் குறிப்புகளிலிருந்து நவீன சலூன்கள் ஏன் StyleFleet-க்கு மாறுகின்றன என்பதைக் காணுங்கள்.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Card: The Old Way */}
              <div className="rounded-3xl p-8 bg-[#091730] border border-rose-500/25 relative overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      {landingLang === 'en' ? 'Legacy Practice' : 'பழைய முறை'}
                    </span>
                    <h3 className="text-2xl font-extrabold text-white">
                      {landingLang === 'en' ? 'The Traditional Way' : 'லெட்ஜர் & பழைய சாஃப்ட்வேர்'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✕</span>
                    <span>
                      <strong className="text-white block font-bold">
                        {landingLang === 'en' ? 'Chaotic Paper Registers' : 'காகித லெட்ஜர் குழப்பங்கள்'}
                      </strong>
                      {landingLang === 'en'
                        ? 'Lost receipts, accidental calculation mistakes, and messy handwriting at the counter.'
                        : 'பில் புத்தகங்கள் தொலைந்து போவது, கூட்டல் கணக்கு தவறுகள் மற்றும் கவுண்ட்டர் தாமதம்.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✕</span>
                    <span>
                      <strong className="text-white block font-bold">
                        {landingLang === 'en' ? 'Empty Styling Chairs & Double-Bookings' : 'சேர் முரண்பாடுகள் & வீண் காத்திருப்பு'}
                      </strong>
                      {landingLang === 'en'
                        ? 'No visibility over which stylist is available, causing walk-in clients to walk away.'
                        : 'எந்த ஸ்டைலிஸ்ட் ஃப்ரீயாக இருக்கிறார் என்று தெரியாமல் வாடிக்கையாளர்கள் கிளம்பி விடுவது.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✕</span>
                    <span>
                      <strong className="text-white block font-bold">
                        {landingLang === 'en' ? 'Stylist Commission Disputes' : 'கமிஷன் கணக்கு வாக்குவாதங்கள்'}
                      </strong>
                      {landingLang === 'en'
                        ? 'Nightly arguments over tips, service share, and deductions without an audit trail.'
                        : 'தினசரி இரவு ஸ்டைலிஸ்ட்டுகளுடன் கமிஷன் மற்றும் டிப்ஸ் குறித்து எழும் சந்தேகங்கள்.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs shrink-0 mt-0.5">✕</span>
                    <span>
                      <strong className="text-white block font-bold">
                        {landingLang === 'en' ? 'Expensive Clunky POS Machines' : 'விலையுயர்ந்த POS மிஷின்கள்'}
                      </strong>
                      {landingLang === 'en'
                        ? 'Forced hardware purchases, monthly hardware rentals, and device breakdowns.'
                        : 'ஆயிரக்கணக்கான ரூபாய் கொடுத்து வாங்க வேண்டிய தேவையற்ற பெரிய மிஷின்கள்.'}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Right Card: The StyleFleet Way */}
              <div className="rounded-3xl p-8 bg-gradient-to-b from-[#0D2244] to-[#07152B] border-2 border-[#D4AF37] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 bg-[#D4AF37] text-[#07152B] font-extrabold text-[10px] uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-md">
                  {landingLang === 'en' ? 'Recommended' : 'புதிய தரநிலை'}
                </div>

                <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                      {landingLang === 'en' ? 'Next-Gen Platform' : 'நவீன தொழில்நுட்பம்'}
                    </span>
                    <h3 className="text-2xl font-extrabold text-white">
                      {landingLang === 'en' ? 'The StyleFleet Way' : 'StyleFleet சொகுசு வழி'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">✓</span>
                    <span>
                      <strong className="text-white block font-bold">
                        {landingLang === 'en' ? '15-Second Express Digital Checkout' : '15 வினாடி மின்னல் வேக பில்லிங்'}
                      </strong>
                      {landingLang === 'en'
                        ? 'Rapid multi-service selection, split UPI/Card/Cash, and immediate WhatsApp invoices.'
                        : 'பல சேவைகளை நொடிகளில் தேர்ந்தெடுத்து, UPI அல்லது ரொக்கமாக பில் போட்டு வாட்ஸ்அப்பில் அனுப்பலாம்.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">✓</span>
                    <span>
                      <strong className="text-white block font-bold">
                        {landingLang === 'en' ? 'Live Floor Chair Matrix' : 'நேரடி சேர் கண்காணிப்பு'}
                      </strong>
                      {landingLang === 'en'
                        ? 'Instant visibility of occupied, cleaning, and ready styling chairs to maximize turnover.'
                        : 'ஒவ்வொரு சேரிலும் யார் இருக்கிறார்கள், எப்போது முடியும் என்பதை துல்லியமாகத் தெரிந்துகொள்ளலாம்.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">✓</span>
                    <span>
                      <strong className="text-white block font-bold">
                        {landingLang === 'en' ? 'Automated Stylist Commission Audits' : 'வெளிப்படையான கமிஷன் கணக்குகள்'}
                      </strong>
                      {landingLang === 'en'
                        ? 'Every staff member views their own daily tips and earnings live with granular owner permissions.'
                        : 'ஸ்டைலிஸ்ட்டுகள் தங்கள் உழைப்பின் பலனையும் கமிஷனையும் தங்கள் மொபைலிலேயே உடனடியாகப் பார்க்கலாம்.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">✓</span>
                    <span>
                      <strong className="text-white block font-bold">
                        {landingLang === 'en' ? 'Cloud Native on Any Mobile or Tab' : 'எந்த மொபைலிலும் இயங்கும் க்ளவுட் தளம்'}
                      </strong>
                      {landingLang === 'en'
                        ? 'Open in your mobile browser or iPad. Zero installation, zero hardware cost, instant OTP login.'
                        : 'விலையுயர்ந்த மிஷின் தேவையில்லை. உங்கள் மொபைல் அல்லது டேப்லெட்டிலேயே 100% இயங்கும்.'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ================= SECTION 4: BENTO GRID ECOSYSTEM ================= */}
          <section id="bento" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs font-bold text-[#E0C068]">
                <span>{landingLang === 'en' ? 'Integrated Salon Architecture' : 'ஒருங்கிணைந்த சலூன் கட்டமைப்பு'}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {landingLang === 'en'
                  ? 'From First Haircut to Final Store Profit.'
                  : 'முதல் ஹேர்கட் முதல் இறுதி லாபம் வரை.'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                {landingLang === 'en'
                  ? 'Explore the modular building blocks that make StyleFleet the gold standard for premier salons.'
                  : 'சலூன் நிர்வாகத்தின் ஒவ்வொரு அம்சத்தையும் அதிவேகமாகவும் அழகாகவும் மாற்றும் கருவிகள்.'}
              </p>
            </div>

            {/* Bento Grid Layout (5 Tiles) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* TILE 1 (Large 2-col): Express Checkout */}
              <div className="md:col-span-2 bento-card-luxury p-7 sm:p-8 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                      01 • Express Front Desk
                    </span>
                    <h3 className="text-2xl font-extrabold text-white">
                      {landingLang === 'en' ? 'Express Multi-Service Checkout' : 'மின்னல் வேக பில்லிங் முறை'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                      {landingLang === 'en'
                        ? 'Combine haircut, coloring, spa rituals, and beard sculpt in one consolidated receipt. Assign individual stylists to each service and process UPI or cash splits effortlessly.'
                        : 'ஒரே பில்லில் பல சேவைகளை நொடிகளில் சேர்த்து, தனித்தனி ஸ்டைலிஸ்ட்டுகளை நியமித்து, பணத்தை விரைவாக வசூலிக்கலாம்.'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                </div>

                {/* Micro Visual Card */}
                <div className="mt-6 p-4 rounded-2xl bg-[#07152B]/80 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>{landingLang === 'en' ? 'Live Front Desk Queue' : 'லைவ் கவுண்ட்டர்'}</span>
                    <span className="text-[#D4AF37]">{landingLang === 'en' ? 'Avg Checkout: 14.8s' : 'சராசரி நேரம்: 14.8 விநாடி'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-slate-400 block font-medium">Haircut</span>
                      <strong className="text-white block font-bold">₹800</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-slate-400 block font-medium">Beard Trim</span>
                      <strong className="text-white block font-bold">₹450</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] text-slate-400 block font-medium">Keratin Spa</span>
                      <strong className="text-white block font-bold">₹1,800</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40">
                      <span className="text-[10px] text-[#E0C068] block font-bold">Total</span>
                      <strong className="text-white block font-extrabold">₹3,050</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* TILE 2: Live Floor Chair Matrix */}
              <div className="bento-card-luxury p-7 sm:p-8 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                      02 • Floor Queue
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {landingLang === 'en' ? 'Live Chair Matrix' : 'லைவ் சேர் கண்காணிப்பு'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {landingLang === 'en'
                      ? 'Eliminate client wait-time chaos. Track chair occupancy, turnover cycles, and stylist allocations in real-time.'
                      : 'எந்த சேர் பிஸியாக உள்ளது, எது தயாராக உள்ளது என்பதை உடனுக்குடன் தெரிந்துகொண்டு வாடிக்கையாளர்களை வரவேற்கலாம்.'}
                  </p>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="p-2.5 rounded-xl bg-[#07152B]/80 border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-white">Chair 01</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-semibold">Active Fade</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#07152B]/80 border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="font-bold text-white">Chair 02</span>
                    </div>
                    <span className="text-blue-300 text-[11px] font-semibold">Walk-in Ready</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#07152B]/80 border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="font-bold text-white">Chair 03</span>
                    </div>
                    <span className="text-amber-300 text-[11px] font-semibold">Keratin Spa (30m)</span>
                  </div>
                </div>
              </div>

              {/* TILE 3: Automated WhatsApp Invoicing */}
              <div className="bento-card-luxury p-7 sm:p-8 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                      03 • Customer Delight
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {landingLang === 'en' ? 'Automated WhatsApp Bills' : 'வாட்ஸ்அப் டிஜிட்டல் பில்'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {landingLang === 'en'
                      ? 'Customers receive itemized luxury digital receipts right on their WhatsApp with salon branding and UPI QR code.'
                      : 'வாடிக்கையாளர்களின் வாட்ஸ்அப்பிற்கே அழகிய டிஜிட்டல் பில் மற்றும் பேமெண்ட் QR தானாகச் செல்லும்.'}
                  </p>
                </div>

                <div className="mt-5 p-3.5 rounded-xl bg-[#07152B] border border-emerald-500/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>WhatsApp Message Preview</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed italic bg-black/20 p-2 rounded-lg">
                    “Dear Priya, thank you for visiting Luxe Salon! Your bill of ₹1,800 is paid. View your itemized receipt here...”
                  </p>
                </div>
              </div>

              {/* TILE 4: Stylist Workspace & Tips */}
              <div className="bento-card-luxury p-7 sm:p-8 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                      04 • Staff Harmony
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                      <Scissors className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {landingLang === 'en' ? 'Stylist Commission Hub' : 'ஸ்டைலிஸ்ட் கமிஷன் தளம்'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {landingLang === 'en'
                      ? 'Empower stylists with dedicated logins. They see their assigned queue, tips earned, and commission totals transparently.'
                      : 'ஸ்டைலிஸ்ட்டுகளுக்கான தனி லாகின். அவர்கள் செய்த பில்கள், அன்றைய டிப்ஸ் மற்றும் கமிஷன் அனைத்தும் வெளிப்படை.'}
                  </p>
                </div>

                <div className="mt-5 p-3.5 rounded-xl bg-[#07152B]/80 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Stylist Anand</span>
                    <span className="text-emerald-400 font-bold">₹1,240 Commission</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Stylist Deepa</span>
                    <span className="text-emerald-400 font-bold">₹1,680 Commission</span>
                  </div>
                  <div className="pt-1.5 border-t border-white/10 flex justify-between text-[11px] text-slate-400 font-semibold">
                    <span>Auto-Audited Daily</span>
                    <span className="text-white font-bold">Zero Disputes</span>
                  </div>
                </div>
              </div>

              {/* TILE 5: 360° Financial Audits */}
              <div className="bento-card-luxury p-7 sm:p-8 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                      05 • Profit Intelligence
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {landingLang === 'en' ? '360° Financial Audits' : 'முழு லாபக் கணக்குகள்'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {landingLang === 'en'
                      ? 'Live tracking of salon revenue, everyday tea/utility expenses, product costs, and true net profit in one tap.'
                      : 'தினசரி வசூல், டீ மற்றும் இதர செலவுகள், பொருட்கள் கொள்முதல் மற்றும் நிகர லாபத்தை ஒரு கிளிக்கில் தெரிந்து கொள்ளலாம்.'}
                  </p>
                </div>

                <div className="mt-5 p-3.5 rounded-xl bg-[#07152B]/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Daily Revenue</span>
                    <span className="text-white font-bold">₹38,450</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Recorded Expenses</span>
                    <span className="text-rose-400 font-bold">- ₹4,200</span>
                  </div>
                  <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                    <span className="text-[#D4AF37]">Net Store Profit</span>
                    <span className="text-emerald-400 font-extrabold">₹34,250</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ================= SECTION 5: MULTI-LANGUAGE SECTION ================= */}
          <section id="languages" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
            <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#0B1E3B] via-[#091730] to-[#0B1E3B] border border-white/10 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs font-bold text-[#E0C068]">
                    <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{landingLang === 'en' ? 'Regional Excellence' : 'பன்மொழி ஆதரவு'}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {landingLang === 'en'
                      ? 'Speaks your language. Delights your clients.'
                      : 'உங்கள் மொழியில் இயங்கும். வாடிக்கையாளர்களுக்கு எளிதாகும்.'}
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {landingLang === 'en'
                      ? 'StyleFleet bridges language barriers effortlessly. Generate invoices and WhatsApp alerts in English, Tamil (தமிழ்), or Hindi (हिन्दी) so every client and staff feels right at home.'
                      : 'ஆங்கிலம், தமிழ் மற்றும் ஹிந்தி ஆகிய மூன்று மொழிகளிலும் பில்களையும் வாட்ஸ்அப் செய்திகளையும் அனுப்பி உங்கள் வாடிக்கையாளர்களிடம் நற்பெயரைப் பெறுங்கள்.'}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white">
                      English (Global)
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#E0C068]">
                      தமிழ் (Tamil Nadu)
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white">
                      हिन्दी (North India)
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#07152B] p-5 rounded-2xl border border-white/10 text-left space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white">பில் முன்னோட்டம் (Tamil Bill)</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      உறுதி செய்யப்பட்டது
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>முடி திருத்துதல் (Haircut)</span>
                      <strong className="text-white">₹800</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>தாடி ஷேப்பிங் (Beard Sculpt)</span>
                      <strong className="text-white">₹450</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>கேரட்டின் ஸ்பா (Keratin Spa)</span>
                      <strong className="text-white">₹1,800</strong>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between font-extrabold text-sm text-white">
                      <span className="text-[#D4AF37]">மொத்தத் தொகை:</span>
                      <span className="text-[#D4AF37]">₹3,050</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 6: VERIFIED TESTIMONIALS ================= */}
          <section id="testimonials" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs font-bold text-[#E0C068]">
                <span>{landingLang === 'en' ? 'Salon Owner Feedback' : 'உரிமையாளர்களின் கருத்துகள்'}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {landingLang === 'en'
                  ? 'Loved by India’s Master Stylists'
                  : 'சலூன் உரிமையாளர்கள் கொண்டாடும் தளம்'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                {landingLang === 'en'
                  ? 'Read how salon owners transformed their daily operations and unlocked higher client retention.'
                  : 'StyleFleet மூலம் தங்கள் சலூன் வருவாயையும் வேகத்தையும் உயர்த்திய முன்னணி உரிமையாளர்களின் அனுபவம்.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Review 1 */}
              <div className="rounded-2xl p-7 bg-[#0B1E3B] border border-white/10 shadow-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {landingLang === 'en'
                      ? '“StyleFleet reduced our front desk rush by 80%. Our clients love receiving their digital bills directly on WhatsApp, and tracking chair turnover is effortless.”'
                      : '“எங்கள் சலூனின் கூட்ட நெரிசல் பில்லிங் நேரம் 80% குறைந்துள்ளது. வாட்ஸ்அப் பில் முறையை வாடிக்கையாளர்கள் மிகவும் விரும்புகிறார்கள்.”'}
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center font-bold text-[#D4AF37]">
                    KR
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-white block">Kavitha R.</strong>
                    <span className="text-[10px] text-slate-400 block">The Velvet Mirror, Chennai</span>
                  </div>
                </div>
              </div>

              {/* Review 2 */}
              <div className="rounded-2xl p-7 bg-[#0B1E3B] border border-[#D4AF37]/40 shadow-xl flex flex-col justify-between relative">
                <div className="absolute top-4 right-4 text-[10px] bg-[#D4AF37]/15 text-[#E0C068] font-bold px-2 py-0.5 rounded border border-[#D4AF37]/30">
                  Verified Owner
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {landingLang === 'en'
                      ? '“Stylists can track their own daily commissions and tips clearly. Zero disputes and total peace of mind every single night when closing registers.”'
                      : '“ஸ்டைலிஸ்ட்டுகள் தங்கள் கமிஷனை தெளிவாகப் பார்க்க முடிகிறது. தினமும் இரவில் கமிஷன் குறித்த எந்த வாக்குவாதமும் இல்லாமல் நிம்மதியாக உள்ளது.”'}
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center font-bold text-[#D4AF37]">
                    RK
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-white block">Rajesh K.</strong>
                    <span className="text-[10px] text-slate-400 block">Blade & Beard Studio, Coimbatore</span>
                  </div>
                </div>
              </div>

              {/* Review 3 */}
              <div className="rounded-2xl p-7 bg-[#0B1E3B] border border-white/10 shadow-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {landingLang === 'en'
                      ? '“Best salon software hands down. Setup took less than 2 minutes using mobile OTP. No expensive POS machines needed, runs straight on our counter tablet.”'
                      : '“சிறந்த சலூன் மென்பொருள்! மொபைல் எண் மூலம் 2 நிமிடத்தில் தொடங்கியது. பெரிய மிஷின் எதுவும் தேவையில்லாமல் டேப்லெட்டிலேயே இயங்குகிறது.”'}
                  </p>
                </div>
                <div className="pt-6 border-t border-white/10 mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center font-bold text-[#D4AF37]">
                    AM
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-white block">Ananya M.</strong>
                    <span className="text-[10px] text-slate-400 block">Glamour Lounge, Bengaluru</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 7: TRANSPARENT PRICING ================= */}
          <section id="pricing" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs font-bold text-[#E0C068]">
                <span>{landingLang === 'en' ? 'Simple & Transparent' : 'வெளிப்படையான கட்டணங்கள்'}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {landingLang === 'en' ? 'Plans Built for Your Salon' : 'உங்கள் சலூனுக்கேற்ற திட்டங்கள்'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                {landingLang === 'en'
                  ? 'All plans include unlimited bills, appointments, WhatsApp sharing, and multi-stylist permissions.'
                  : 'அனைத்து திட்டங்களிலும் அன்லிமிடெட் பில்லிங், வாட்ஸ்அப் பகிர்வு மற்றும் ஸ்டைலிஸ்ட் கமிஷன் அணுகல் உண்டு.'}
              </p>

              {/* Billing Toggle: Annual (Save 20%) vs Monthly */}
              <div className="pt-2 flex items-center justify-center gap-3">
                <span className={`text-xs font-bold ${pricingInterval === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
                  {landingLang === 'en' ? 'Monthly' : 'மாதாந்திர'}
                </span>
                <button
                  type="button"
                  onClick={() => setPricingInterval(pricingInterval === 'annual' ? 'monthly' : 'annual')}
                  className="w-14 h-7 rounded-full bg-[#0B1E3B] border border-white/20 p-1 transition-colors relative flex items-center"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-[#D4AF37] transition-transform ${
                      pricingInterval === 'annual' ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${pricingInterval === 'annual' ? 'text-white' : 'text-slate-400'}`}>
                  <span>{landingLang === 'en' ? 'Annual' : 'ஆண்டு திட்டம்'}</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                    Save 20%
                  </span>
                </span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              
              {/* TIER 1: Boutique / Studio */}
              <div className="rounded-3xl p-8 bg-[#0B1E3B] border border-white/10 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Studio</h3>
                    <span className="text-xs text-slate-400 block mt-1">For single-chair artists & boutique studios</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      ₹{pricingInterval === 'annual' ? '599' : '749'}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <ul className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Unlimited Digital Bills & Receipts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Up to 2 Stylist Accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>WhatsApp Bill Sharing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Daily Expense Tracking</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => openLogin('owner')}
                  className="mt-8 w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer"
                >
                  Get Started with Studio
                </button>
              </div>

              {/* TIER 2: Professional (Most Popular with Gold Halo) */}
              <div className="rounded-3xl p-8 bg-gradient-to-b from-[#0D2244] to-[#07152B] border-2 border-[#D4AF37] shadow-2xl flex flex-col justify-between relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#07152B] text-[10px] uppercase font-black px-3.5 py-1 rounded-full shadow-md">
                  Most Popular for Salons
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Professional</h3>
                    <span className="text-xs text-slate-300 block mt-1">For growing unisex salons & spas</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-[#D4AF37]">
                      ₹{pricingInterval === 'annual' ? '1,199' : '1,499'}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <ul className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-slate-200">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>All Studio features included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Up to 10 Stylist Workspaces</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Live Chair Floor Matrix & Queue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Staff Commission & Tip Breakdown</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>360° Financial Audit & Profit Analysis</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => openLogin('owner')}
                  className="mt-8 w-full py-3.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs font-black shadow-xl shadow-[#D4AF37]/25 transition-all cursor-pointer"
                >
                  Start Professional Plan
                </button>
              </div>

              {/* TIER 3: Multi-Outlet Enterprise */}
              <div className="rounded-3xl p-8 bg-[#0B1E3B] border border-white/10 shadow-xl flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Enterprise</h3>
                    <span className="text-xs text-slate-400 block mt-1">For luxury salon chains & multi-outlet brands</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      ₹{pricingInterval === 'annual' ? '2,499' : '2,999'}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <ul className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Everything in Professional</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Unlimited Stylists & Staff</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Custom WhatsApp Sender ID Integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#D4AF37]" />
                      <span>Dedicated Priority Relationship Manager</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => openLogin('owner')}
                  className="mt-8 w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer"
                >
                  Talk to Enterprise Sales
                </button>
              </div>

            </div>
          </section>

          {/* ================= SECTION 8: BOTTOM CTA BANNER ================= */}
          <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto">
            <div className="relative rounded-3xl p-10 sm:p-16 text-center overflow-hidden bg-gradient-to-r from-[#0B1E3B] via-[#0D2244] to-[#0B1E3B] border border-[#D4AF37]/50 shadow-2xl">
              {/* Gold Halo background flare */}
              <div className="absolute -inset-10 bg-radial-gradient from-[#D4AF37]/15 to-transparent blur-3xl pointer-events-none" />

              <div className="max-w-2xl mx-auto space-y-5 relative z-10">
                <span className="text-xs font-extrabold text-[#E0C068] uppercase tracking-[0.25em] block">
                  {landingLang === 'en' ? 'Start Your Salon Transformation' : 'இன்றே தொடங்குங்கள்'}
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {landingLang === 'en'
                    ? 'Make every salon day flow effortlessly.'
                    : 'ஒவ்வொரு நாளும் உங்கள் சலூனை எளிதாக வழிநடத்துங்கள்.'}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  {landingLang === 'en'
                    ? 'Join over 500+ modern salons and master stylists operating with high visual elegance, zero hardware lock-in, and instant mobile setup.'
                    : '500-க்கும் மேற்பட்ட சலூன்களுடன் இணைந்து உங்கள் சேவையை மேலும் பிரீமியமாக மாற்றுங்கள். தொடங்குவதற்கு 60 விநாடிகள் மட்டுமே.'}
                </p>
                <div className="pt-4 flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => openLogin('owner')}
                    className="py-4 px-9 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5A623] hover:brightness-110 text-[#07152B] text-base font-extrabold shadow-2xl shadow-[#D4AF37]/30 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-5 h-5 text-[#07152B]" />
                    <span>{landingLang === 'en' ? 'Get Started as Owner' : 'உரிமையாளராகத் தொடங்கு'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openLogin('stylist')}
                    className="bg-[#07152B] hover:bg-[#0D2348] border border-white/15 hover:border-[#D4AF37]/50 text-white py-4 px-8 text-base font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Scissors className="w-4 h-4 text-[#D4AF37]" />
                    <span>{landingLang === 'en' ? 'Stylist Workspace' : 'ஸ்டைலிஸ்ட் தளம்'}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

        </main>
      )}

      {/* ================= VIEW 2: DEDICATED CLEAN LOGIN PAGE ================= */}
      {view === 'login' && (
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-8 relative z-10">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#0B1E3B]">
            
            {/* Left Visual Panel - Dynamically switches between Owner & Stylist */}
            <div className="hidden md:block md:col-span-5 relative bg-[#07152B] overflow-hidden min-h-[520px]">
              {/* 1. Salon Owner Visual */}
              <div
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  role === 'owner' ? 'opacity-100 scale-100 z-10 pointer-events-auto' : 'opacity-0 scale-105 z-0 pointer-events-none'
                }`}
              >
                <img
                  src="/images/owner-workspace.jpg"
                  alt="Executive Salon Owner Workspace"
                  className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07152B] via-[#07152B]/45 to-transparent" /* taste-skill-ignore */ />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0B1E3B]/70" /* taste-skill-ignore */ />
              </div>

              {/* 2. Stylist Visual */}
              <div
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  role === 'stylist' ? 'opacity-100 scale-100 z-10 pointer-events-auto' : 'opacity-0 scale-105 z-0 pointer-events-none'
                }`}
              >
                <img
                  src="/images/stylist-workspace.jpg"
                  alt="Master Hair Stylist Workspace"
                  className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07152B] via-[#07152B]/45 to-transparent" /* taste-skill-ignore */ />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0B1E3B]/70" /* taste-skill-ignore */ />
              </div>

              {/* Visual Panel Info Overlay */}
              <div className="absolute bottom-8 left-7 right-7 z-20 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07152B]/95 border border-[#F5A623]/50 shadow-lg">
                  <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center p-0.5 bg-[#F5A623]/20 shrink-0">
                    <img src="/assets/stylefleet-logo.png" alt="StyleFleet" width={20} height={20} className="w-5 h-5 object-contain" style={{ maxWidth: '20px', maxHeight: '20px' }} />
                  </div>
                  <span className="text-[11px] font-bold text-[#F5A623] uppercase tracking-wider flex items-center gap-1.5">
                    {role === 'owner' ? (
                      <>
                        <Crown className="w-3.5 h-3.5 text-[#F5A623]" />
                        <span>Owner Workspace</span>
                      </>
                    ) : (
                      <>
                        <Scissors className="w-3.5 h-3.5 text-[#F5A623]" />
                        <span>Stylist Workspace</span>
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    {role === 'owner' ? 'Total Salon Command' : 'Precision Hair & Beauty'}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed font-normal bg-[#07152B]/90 p-3 rounded-2xl border border-white/10 shadow-md">
                    {role === 'owner'
                      ? '“Complete visibility over express billing, chair schedules, staff commissions, and real-time revenue analytics.”'
                      : '“Dedicated chair schedules, service queues, personal tips tally, and transparent commission audits built for artists.”'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-[#F5A623]">
                  <span>Unified Luxury Salon Management Platform</span>
                </div>
              </div>
            </div>

            {/* Right Form Panel (Clean, Uncluttered, Pure Inputs) */}
            <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
              
              {/* Top Control */}
              <button
                onClick={returnHome}
                className="self-start mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F5A623] transition-colors"
              >
                <span>←</span> <span>Back to StyleFleet Home</span>
              </button>

              {/* Title & Badge */}
              <div className="space-y-1 mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {role === 'owner' ? 'Salon Owner Workspace' : 'Stylist Workspace'}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30">
                    {role === 'owner' ? (
                      <>
                        <Crown className="w-3 h-3 text-[#F5A623]" />
                        <span>Owner</span>
                      </>
                    ) : (
                      <>
                        <Scissors className="w-3 h-3 text-[#F5A623]" />
                        <span>Stylist</span>
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {role === 'owner'
                    ? 'Sign in to access your salon billing, appointments, staff team & real-time revenue analytics.'
                    : 'Sign in to review your scheduled appointments, active chair queue & personal tips.'}
                </p>
              </div>

              {/* Role Selection Tabs */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <button
                  type="button"
                  onClick={() => {
                    setRole('owner');
                    setAuthStep('phone');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    role === 'owner'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15 -translate-y-0.5'
                      : 'bg-[#07152B] border-white/5 hover:border-white/20'
                  }`}
                >
                  <Crown className={`w-5 h-5 mb-1.5 ${role === 'owner' ? 'text-[#F5A623]' : 'text-[#94A3B8]'}`} />
                  <strong className="text-xs block font-bold text-white">Salon Owner</strong>
                  <span className="text-[10px] text-[#94A3B8] block mt-0.5">Billing & Management</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('stylist');
                    setAuthStep('phone');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    role === 'stylist'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15 -translate-y-0.5'
                      : 'bg-[#07152B] border-white/5 hover:border-white/20'
                  }`}
                >
                  <Scissors className={`w-5 h-5 mb-1.5 ${role === 'stylist' ? 'text-[#F5A623]' : 'text-[#94A3B8]'}`} />
                  <strong className="text-xs block font-bold text-white">Stylist</strong>
                  <span className="text-[10px] text-[#94A3B8] block mt-0.5">Queue & Daily Tips</span>
                </button>
              </div>

              {/* STEP 1: CLEAN MOBILE INPUT */}
              {authStep === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4 pt-2">
                  <div>
                    <label htmlFor="mobile-input" className="block text-xs font-bold text-[#94A3B8] mb-2">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-sm font-bold text-[#F5A623] select-none">+91</span>
                      <input
                        id="mobile-input"
                        type="tel"
                        maxLength={10}
                        inputMode="numeric"
                        placeholder="Enter 10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        className="w-full py-3.5 pl-14 pr-4 rounded-2xl bg-[#07152B] border border-white/10 focus:border-[#F5A623] outline-none text-white text-sm font-semibold transition-all placeholder:text-[#94A3B8]/50"
                      />
                    </div>
                  </div>

                  {/* Terms and Policy Agreement */}
                  <div
                    className="flex items-center gap-2.5 pt-0.5 select-none cursor-pointer group"
                    onClick={() => setAgreeToTerms(!agreeToTerms)}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        agreeToTerms
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-[#07152B]'
                          : 'bg-[#07152B] border-white/20 opacity-0'
                      }`}
                    >
                      <svg className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <label className="text-[11px] text-[#94A3B8] cursor-pointer leading-tight group-hover:text-slate-300">
                      I agree to the <span className="text-[#D4AF37] font-semibold hover:underline">Terms of Service</span> & <span className="text-[#D4AF37] font-semibold hover:underline">Privacy Policy</span> of StyleFleet
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className={`py-3.5 px-4 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-sm font-extrabold shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2 mt-2 ${
                      isSendingOtp ? 'opacity-70 cursor-wait' : ''
                    }`}
                  >
                    {isSendingOtp ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[#07152B] border-t-transparent rounded-full animate-spin" />
                        <span>Sending SMS Code via 2Factor...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue with Mobile</span>
                        <span>↗</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-[#5E697E] pt-2">
                    Secure authentication via SMS verification code.
                  </p>
                </form>
              )}

              {/* STEP 2: CLEAN 6-DIGIT OTP VERIFICATION */}
              {authStep === 'otp' && (
                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#A7B0C3] block">Verification code sent to</span>
                      <strong className="text-xs font-bold text-white">+91 {phone}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthStep('phone')}
                      className="text-xs font-bold text-[#E0C068] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      verifyOtp(otp.join(''));
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-[#A7B0C3] mb-2">
                        Enter 6-Digit OTP
                      </label>
                      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpRefs.current[idx] = el;
                            }}
                            type="text"
                            maxLength={1}
                            inputMode="numeric"
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            className="w-full h-11 sm:h-12 text-center text-lg sm:text-xl font-bold bg-[#07152B] border border-white/10 rounded-xl sm:rounded-2xl text-white outline-none focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20 transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                      <span>
                        {canResend ? (
                          <button
                            type="button"
                            onClick={handleResend}
                            className="text-[#F5A623] font-bold hover:underline"
                          >
                            Resend code
                          </button>
                        ) : (
                          `Resend code in ${countdown}s`
                        )}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifyingOtp}
                      className={`py-3.5 px-4 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-sm font-extrabold shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2 ${
                        isVerifyingOtp ? 'opacity-70 cursor-wait' : ''
                      }`}
                    >
                      {isVerifyingOtp ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-[#07152B] border-t-transparent rounded-full animate-spin" />
                          <span>Verifying with 2Factor...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Access Workspace</span>
                          <span>↗</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/[0.08] py-8 px-4 sm:px-8 bg-[#07152B] text-xs text-[#94A3B8]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand & Platform */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#D4AF37]/40 bg-[#0B1E3B] flex items-center justify-center p-0 shrink-0">
              <img src="/assets/stylefleet-logo.png" alt="StyleFleet" width={32} height={32} className="w-8 h-8 object-cover" style={{ maxWidth: '32px', maxHeight: '32px' }} />
            </div>
            <span className="text-white font-semibold text-xs tracking-wide">Salon Management Platform</span>
          </div>

          {/* Clean minimal copyright notice */}
          <div className="text-center sm:text-right text-[#94A3B8] text-xs font-medium">
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>

      {/* ================= TOAST NOTIFICATION ================= */}
      {toast && (
        <div
          className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl bg-[#0B1E3B] border border-white/10 shadow-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn"
          style={{ borderColor: toast.type === 'error' ? '#EF4444' : '#F5A623' }}
        >
          {toast.type === 'error' ? (
            <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="text-white">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
