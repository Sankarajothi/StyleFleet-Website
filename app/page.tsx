'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Crown, 
  Sparkles, 
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
  Star
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

  // Instant One-Click Demo Login for Owner or Supervisor
  const handleQuickDemoLogin = async (demoRole: 'owner' | 'stylist') => {
    const demoPhone = demoRole === 'owner' ? '9999999999' : '8888888888';
    setRole(demoRole);
    setPhone(demoPhone);
    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: demoPhone }),
      });
      const data = await res.json();
      if (data.success && data.sessionId) {
        setOtpSessionId(data.sessionId);
        setOtp(['1', '2', '3', '4', '5', '6']);
        setAuthStep('otp');
        showToast(`Demo ${demoRole === 'owner' ? 'Owner' : 'Supervisor'} selected! Accessing workspace...`, 'success');
        setTimeout(() => {
          verifyOtp('123456');
        }, 350);
      }
    } catch {
      showToast('Error initializing demo login', 'error');
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
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#D4AF37] selection:text-[#07152B]">
      {/* ================= FLOATING DOCK NAVIGATION BAR ================= */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-7xl mx-auto w-full transition-all">
        <div className="rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between bg-[#0B1E3B]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40">
          {/* Brand Logo & Name */}
          <button onClick={returnHome} className="flex items-center gap-3 group text-left">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#D4AF37]/50 shadow-md bg-[#07152B] flex items-center justify-center p-0 shrink-0">
              <img
                src="/assets/stylefleet-logo.png"
                alt="StyleFleet Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-cover"
                style={{ maxWidth: '40px', maxHeight: '40px' }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-[0.2em] text-white">
                STYLEFLEET
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold">
                Salon Management
              </span>
            </div>
          </button>

          {/* Center Nav Links (Home view only) */}
          {view === 'home' && (
            <nav className="hidden md:flex items-center gap-2 bg-[#07152B]/80 px-2 py-1 rounded-2xl border border-white/[0.06]">
              <a
                href="#features"
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Features
              </a>
              <a
                href="#stats"
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Performance
              </a>
              <button
                onClick={() => openLogin('stylist')}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all"
              >
                Stylist Portal
              </button>
            </nav>
          )}

          {/* Action Buttons: Sign In Removed, Direct Get Started Entry */}
          <div className="flex items-center gap-2.5">
            {view === 'home' ? (
              <button
                onClick={() => openLogin('owner')}
                className="px-5 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-xs sm:text-sm font-extrabold shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={returnHome}
                className="text-xs sm:text-sm py-2 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white flex items-center gap-2 transition-all font-semibold"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= VIEW 1: HOME / LANDING PAGE ================= */}
      {view === 'home' && (
        <main className="flex-1">
          {/* HERO SECTION WITH ARCHITECTURAL LUXURY FRAMING */}
          <section className="relative pt-8 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: High-Impact Editorial Copy */}
              <div className="lg:col-span-7 space-y-7 text-left">
                {/* Subtle Micro-Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B1E3B] border border-[#D4AF37]/30 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span className="text-[11px] font-bold tracking-widest uppercase text-[#D4AF37]">
                    Salon Management Architecture
                  </span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.04]">
                  Your salon,<br />
                  <span className="font-display italic text-[#F7C948] font-normal">
                    flawlessly
                  </span> operated.
                </h1>

                <p className="text-base sm:text-lg text-[#94A3B8] max-w-xl leading-relaxed font-normal">
                  Bring express 15 second billing, real time chair schedules, and stylist commission tracking into one seamless, professional workspace.
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => openLogin('owner')}
                    className="py-4 px-8 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-base font-extrabold shadow-md active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Get Started as Owner</span>
                  </button>
                  <button
                    onClick={() => openLogin('stylist')}
                    className="bg-[#0B1E3B] hover:bg-[#0D2348] border border-white/10 hover:border-[#D4AF37]/50 text-white text-base py-4 px-7 font-semibold rounded-2xl transition-all cursor-pointer"
                  >
                    <span>Stylist Workspace</span>
                  </button>
                </div>

                {/* Trust Proof */}
                <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs font-semibold text-[#8B98AF]">
                  <span>Trusted by over 350 modern salons and master stylists</span>
                  <span className="hidden sm:inline text-white/20">|</span>
                  <span className="text-white font-bold text-xs">4.9 out of 5 Rating from Salon Operators</span>
                </div>
              </div>

              {/* Right Column: 3D Architectural Showcase with Real-Time Floating Chips */}
              <div className="lg:col-span-5 relative">
                {/* Main Showcase Card */}
                <div className="bg-[#0B1E3B] border border-white/15 p-3 rounded-3xl relative group shadow-2xl transition-all">
                  <div className="relative w-full h-[480px] rounded-2xl overflow-hidden bg-[#091730]">
                    <img
                      src="/images/hero-salon.jpg"
                      alt="Luxury modern salon styling stations and gold arched mirrors"
                      className="w-full h-full object-cover object-center filter brightness-[1.02] contrast-[1.05] transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Photo Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07152B]/90 via-[#07152B]/20 to-transparent" /* taste-skill-ignore */ />
                    
                    {/* Live Status Pill */}
                    <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#07152B]/95 border border-white/20 text-[11px] font-semibold text-white shadow-xl">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      <span>Salon Live (4 Chairs Active)</span>
                    </div>

                    {/* Integrated Micro Quick-Stats Bar in Hero Visual */}
                    <div className="absolute bottom-4 left-4 right-4 z-10 p-3.5 rounded-2xl bg-[#07152B]/90 border border-white/10 backdrop-blur-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8B98AF] block">Today Chair Turnover</span>
                        <strong className="text-sm font-extrabold text-white">
                          <AnimatedCounter value={32} suffix=" Clients Served" />
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#8B98AF] block">Floor Utilization</span>
                        <span className="text-sm font-extrabold text-[#D4AF37]">
                          <AnimatedCounter value={94} suffix=".2%" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Curved Luxury Dashboard Widget (Organic curved contour with running numbers) */}
                <div className="hidden sm:block absolute left-[-20px] bottom-[60px] min-w-[240px] bg-[#0D2244]/95 border border-[#D4AF37]/45 rounded-[32px] rounded-tl-[12px] p-4 shadow-2xl z-20 animate-floating-dashboard backdrop-blur-md">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      <p className="text-[10px] font-bold text-[#A7B0C3]">Today Billing</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      +22.8%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      <AnimatedCounter value={38450} prefix="₹ " />
                    </span>
                    <span className="text-xs font-semibold text-[#A7B0C3]">
                      <AnimatedCounter value={18} suffix=" bills" />
                    </span>
                  </div>
                  {/* Micro Visual Chart Bar */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden flex">
                    <div className="bg-[#D4AF37] h-full rounded-full transition-all duration-1000" style={{ width: '74%' }} />
                  </div>
                  <p className="text-[10px] text-[#D4AF37] mt-2 font-medium flex items-center justify-between">
                    <span>18 Completed Bills</span>
                    <span className="text-emerald-400 font-semibold">Zero Dues</span>
                  </p>
                </div>

                {/* Floating Curved Capsule 2: Live Next Chair Appointment */}
                <div className="hidden sm:flex absolute right-[-15px] top-[35px] items-center gap-3 bg-[#0D2244]/95 border border-white/20 rounded-[28px] rounded-tr-[10px] p-3.5 shadow-2xl z-20 animate-float-reverse backdrop-blur-md">
                  <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#E0C068] font-bold text-xs shrink-0">
                    02
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#A7B0C3]">Live Chair Schedule</p>
                    <p className="text-sm font-bold text-white">Chair 02, Hair Spa</p>
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      <span>In Chair Active Session</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* STATS TICKER SECTION WITH RUNNING NUMBERS */}
          <section id="stats" className="scroll-mt-24 border-y border-white/10 bg-[#0B1E3B] py-10 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-gold-gradient block">
                  <AnimatedCounter value={15} suffix=" Seconds" />
                </span>
                <span className="text-xs sm:text-sm text-[#CBD5E1] block font-medium">Express Multi Service Checkout</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-gold-gradient block">
                  <AnimatedCounter value={99} suffix=".2%" />
                </span>
                <span className="text-xs sm:text-sm text-[#CBD5E1] block font-medium">Appointment Attendance Rate</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-gold-gradient block">
                  <AnimatedCounter value={360} suffix="° Tracking" />
                </span>
                <span className="text-xs sm:text-sm text-[#CBD5E1] block font-medium">Real Time Financial Audit</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-gold-gradient block">Zero</span>
                <span className="text-xs sm:text-sm text-[#CBD5E1] block font-medium">Scheduling Conflicts</span>
              </div>
            </div>
          </section>

          {/* ================= DEDICATED FEATURES BENTO MATRIX ================= */}
          <section id="features" className="scroll-mt-24 py-24 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs font-semibold text-[#E0C068]">
                <span>Designed for Professional Salon Operations</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Everything your salon needs to thrive.
              </h2>
              <p className="text-sm sm:text-base text-[#A7B0C3]">
                Interact with the live modules below. Designed for speed, high visual elegance, and effortless front desk execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* FEATURE 1: Instant Multi-Service Checkout */}
              <article className="bento-card-luxury flex flex-col justify-between group" id="billing">
                {/* Visual Header */}
                <div className="relative h-[220px] overflow-hidden bg-[#091730]">
                  <img
                    src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
                    alt="Instant Multi-Service Checkout"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[1.03] saturate-[1.08]"
                  />
                  {/* Photo Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E3B] via-[#0B1E3B]/30 to-transparent" /* taste-skill-ignore */ />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07152B] border border-[#D4AF37]/40 text-[10px] font-bold text-[#E0C068]">
                    <span>Express Engine</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-7 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest block mb-1">
                      CHECKOUT
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">Instant Multi Service Checkout</h3>
                    <p className="text-xs sm:text-sm text-[#A7B0C3] leading-relaxed">
                      Add multiple services across hair, skin, and spa in seconds. Assign stylists per service, record cash, card, or UPI split payments, and generate itemized bills instantly.
                    </p>
                  </div>

                  {/* LIVE INTERACTIVE DEMO WIDGET */}
                  <div className="p-3.5 rounded-xl bg-[#07152B] border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-[#8B98AF] uppercase tracking-wider">Try Interactive Services:</span>
                      <span className="text-[#D4AF37]">Click to Add or Remove</span>
                    </div>

                    {/* Service Toggle Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {demoServicesList.map((service) => {
                        const isSelected = demoSelectedServices.includes(service.id);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => toggleDemoService(service.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-[#D4AF37] text-[#07152B] font-bold shadow-md'
                                : 'bg-white/5 text-[#CBD5E1] border border-white/10 hover:border-white/20'
                            }`}
                          >
                            <span>{isSelected ? '•' : '+'}</span>
                            <span>{service.name.split(' ')[0]} ₹{service.price}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Live Ticket Calculation Preview */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-[#CBD5E1] font-semibold">
                        Selected: <strong className="text-white">{demoSelectedServices.length} items</strong>
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-[#8B98AF] block">Simulated Total</span>
                        <strong className="text-sm font-extrabold text-[#D4AF37]">₹ {demoTotal}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5">
                    <span>Explore Express Checkout</span>
                  </div>
                </div>
              </article>

              {/* FEATURE 2: Chair Schedule & Walk-ins */}
              <article className="bento-card-luxury flex flex-col justify-between group" id="appointments">
                {/* Visual Header */}
                <div className="relative h-[220px] overflow-hidden bg-[#091730]">
                  <img
                    src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
                    alt="Chair Schedule and Walk-ins"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[1.03] saturate-[1.08]"
                  />
                  {/* Photo Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E3B] via-[#0B1E3B]/30 to-transparent" /* taste-skill-ignore */ />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07152B] border border-[#D4AF37]/40 text-[10px] font-bold text-[#E0C068]">
                    <span>Floor Queue Monitor</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-7 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest block mb-1">
                      FLOOR MANAGEMENT
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">Chair Schedule and Walk ins</h3>
                    <p className="text-xs sm:text-sm text-[#A7B0C3] leading-relaxed">
                      Eliminate chair confusion and salon bottlenecks. Monitor real time chair turnover, accommodate walk in guests seamlessly, and balance workload across all active styling stations.
                    </p>
                  </div>

                  {/* LIVE CHAIR STATUS PREVIEW WIDGET */}
                  <div className="p-3.5 rounded-xl bg-[#07152B] border border-white/10 space-y-2">
                    <span className="text-[11px] font-bold text-[#8B98AF] uppercase tracking-wider block">
                      Live Styling Stations
                    </span>
                    <div className="space-y-1.5">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <strong className="text-white">Chair 01</strong>
                          <span className="text-[11px] text-[#CBD5E1]">Cut & Style</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#E0C068]">18 min left</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          <strong className="text-white">Chair 02</strong>
                          <span className="text-[11px] text-[#CBD5E1]">Walk-in Ready</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400">Available</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <strong className="text-white">Chair 03</strong>
                          <span className="text-[11px] text-[#CBD5E1]">Keratin Spa</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#E0C068]">45 min left</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5">
                    <span>View Floor Queue</span>
                  </div>
                </div>
              </article>

              {/* FEATURE 3: Appointments Booking */}
              <article className="bento-card-luxury flex flex-col justify-between group" id="booking">
                {/* Visual Header */}
                <div className="relative h-[220px] overflow-hidden bg-[#091730]">
                  <img
                    src="/images/stylist-workspace.jpg"
                    alt="Appointments Booking"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[1.03] saturate-[1.08]"
                  />
                  {/* Photo Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E3B] via-[#0B1E3B]/30 to-transparent" /* taste-skill-ignore */ />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07152B] border border-[#D4AF37]/40 text-[10px] font-bold text-[#E0C068]">
                    <span>Booking Schedule</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-7 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest block mb-1">
                      APPOINTMENTS
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">Appointments Booking</h3>
                    <p className="text-xs sm:text-sm text-[#A7B0C3] leading-relaxed">
                      Empower your front desk with a centralized booking schedule. Track confirmed appointments, avoid double bookings, reassign stylists on the fly, and send automated client reminders.
                    </p>
                  </div>

                  {/* LIVE APPOINTMENTS CALENDAR PREVIEW */}
                  <div className="p-3.5 rounded-xl bg-[#07152B] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#8B98AF]">
                      <span className="uppercase tracking-wider">Today Schedule</span>
                      <span className="text-[#D4AF37]">Confirmed Slots</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-white block">Deepa K.</strong>
                          <span className="text-[10px] text-[#A7B0C3]">10:30 AM, Balayage</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#E0C068] font-bold text-[10px] border border-[#D4AF37]/30">
                          VIP Platinum
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-white block">Priya M.</strong>
                          <span className="text-[10px] text-[#A7B0C3]">01:15 PM, Hair Color</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5">
                    <span>Manage Appointments</span>
                  </div>
                </div>
              </article>
            </div>
          </section>

          {/* CTA BANNER */}
          <section className="py-20 px-4 sm:px-8 max-w-5xl mx-auto">
            <div className="bg-[#0B1E3B] border border-[#D4AF37]/50 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
              <div className="max-w-2xl mx-auto space-y-5 relative z-10">
                <span className="text-xs font-bold text-[#E0C068] uppercase tracking-[0.25em] block">
                  Elevate Your Salon
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                  Make every salon day flow effortlessly.
                </h2>
                <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
                  Step into a more organised, elegant way to run your salon, serve your clients, and empower your styling team.
                </p>
                <div className="pt-4 flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => openLogin('owner')}
                    className="py-4 px-9 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#07152B] text-base font-extrabold shadow-xl shadow-[#D4AF37]/25 active:scale-[0.98] transition-all"
                  >
                    <span>Get Started as Owner</span>
                  </button>
                  <button
                    onClick={() => openLogin('stylist')}
                    className="bg-[#07152B] hover:bg-[#0D2348] border border-white/10 hover:border-[#D4AF37]/50 text-white py-4 px-7 text-base font-semibold rounded-2xl transition-all"
                  >
                    <span>Stylist Workspace</span>
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
                  {/* One-Click Instant Demo Access */}
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                        <span>One-Click Demo Access</span>
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-mono">Code: 123456</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('owner')}
                        className="px-3 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Demo Owner</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin('stylist')}
                        className="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Scissors className="w-3.5 h-3.5 text-sky-400" />
                        <span>Demo Supervisor</span>
                      </button>
                    </div>
                  </div>

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
