'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useSalon } from '@/components/SalonContext';
import { getShopPrefixFromShopName, formatInvoiceNumber, generateTimeSlotsFromBookingHours } from '@/lib/salon-helpers';

interface SettingsViewProps {
  onOpenSignOutModal: () => void;
}

type SettingsTab = 'profile' | 'invoicing' | 'billing' | 'help';

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenSignOutModal }) => {
  const {
    isDarkMode,
    shopProfile,
    updateShopProfile,
    language,
    setLanguage,
    staff,
    bills,
    showToast,
    setCurrentScreen,
  } = useSalon();

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Modals
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePhoneModal, setShowChangePhoneModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Profile Edit Form State
  const [editShopName, setEditShopName] = useState(shopProfile.shopName);
  const [editOwnerName, setEditOwnerName] = useState(shopProfile.ownerName);
  const [editPhone, setEditPhone] = useState(shopProfile.phone);
  const [editAddress, setEditAddress] = useState(shopProfile.address);
  const [editCity, setEditCity] = useState(shopProfile.city);
  const [editPinCode, setEditPinCode] = useState(shopProfile.pinCode);
  const [editGstin, setEditGstin] = useState(shopProfile.gstin);
  const [editUpiId, setEditUpiId] = useState(shopProfile.upiId);

  // Invoice Settings State
  const [applyGst, setApplyGst] = useState<boolean>(shopProfile.applyGst ?? true);
  const [gstRate, setGstRate] = useState<number>(shopProfile.gstRate ?? 18);
  const [invoicePrefix, setInvoicePrefix] = useState<string>(
    shopProfile.invoicePrefix || getShopPrefixFromShopName(shopProfile.shopName)
  );
  const [invoicePrefixFormat, setInvoicePrefixFormat] = useState<'standard' | 'monthly' | 'yearly'>(
    shopProfile.invoicePrefixFormat || 'monthly'
  );
  const [bookingHours, setBookingHours] = useState<string>(shopProfile.bookingHours || '09:30 AM – 08:30 PM');

  // Social Media Links State
  const [instagram, setInstagram] = useState(shopProfile.instagram || '@royalcutsandspa');
  const [facebook, setFacebook] = useState(shopProfile.facebook || 'facebook.com/royalcutsandspa');
  const [googleMaps, setGoogleMaps] = useState(shopProfile.googleMaps || 'maps.google.com/?q=RoyalCutsSpa');

  // Change Phone Number State
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  // Rating State
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');

  // Delete Account Confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Shop Billing Progress (100 Free Bills)
  const billsFinished = (bills || []).filter((b) => !b.isDeleted).length;
  const billsUsagePct = Math.min((billsFinished / 100) * 100, 100);

  // Open Edit Profile
  const handleOpenEditProfile = () => {
    setEditShopName(shopProfile.shopName);
    setEditOwnerName(shopProfile.ownerName);
    setEditPhone(shopProfile.phone);
    setEditAddress(shopProfile.address);
    setEditCity(shopProfile.city);
    setEditPinCode(shopProfile.pinCode);
    setEditGstin(shopProfile.gstin);
    setEditUpiId(shopProfile.upiId);
    setShowEditProfileModal(true);
  };

  // Save Edit Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopProfile({
      shopName: editShopName.trim(),
      ownerName: editOwnerName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
      city: editCity.trim(),
      pinCode: editPinCode.trim(),
      gstin: editGstin.trim(),
      upiId: editUpiId.trim(),
    });
    setShowEditProfileModal(false);
    showToast('Salon Profile updated successfully!');
  };

  // Save Invoice Settings
  const handleSaveInvoiceSettings = () => {
    updateShopProfile({
      applyGst,
      gstRate: Number(gstRate) || 0,
      invoicePrefix: invoicePrefix.trim() || getShopPrefixFromShopName(shopProfile.shopName),
      invoicePrefixFormat,
      bookingHours: bookingHours.trim(),
    });
    showToast('Invoice settings saved successfully!');
  };

  // Save Social Links
  const handleSaveSocialLinks = () => {
    updateShopProfile({
      instagram,
      facebook,
      googleMaps,
    });
    showToast('Social media links updated!');
  };

  // Handle Change Phone
  const handleSendOtp = () => {
    const clean = newPhoneNumber.replace(/\D/g, '');
    if (clean.length !== 10) {
      showToast('Please enter a valid 10-digit number.', 'error');
      return;
    }
    setOtpSent(true);
    showToast(`Verification OTP sent to +91 ${clean}!`);
  };

  const handleVerifyChangePhone = () => {
    if (otpValue.trim() !== '1234' && otpValue.trim().length !== 4) {
      showToast('Enter 4-digit verification code (demo: 1234)', 'error');
      return;
    }
    updateShopProfile({ phone: newPhoneNumber.replace(/\D/g, '') });
    setShowChangePhoneModal(false);
    setOtpSent(false);
    setOtpValue('');
    setNewPhoneNumber('');
    showToast('Owner login phone number updated successfully!');
  };

  // Handle Submit Rating
  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRateModal(false);
    setRatingFeedback('');
    showToast(`Thank you for rating StyleFleet ${ratingStars} Stars! ⭐`);
  };

  // Handle Permanent Delete
  const handleConfirmPermanentDelete = () => {
    if (deleteConfirmText.trim() !== 'DELETE') {
      showToast('Please type DELETE in capital letters to confirm.', 'error');
      return;
    }
    setShowDeleteAccountModal(false);
    try {
      localStorage.clear();
    } catch {}
    showToast('Account data wiped successfully.');
    window.location.href = '/';
  };

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
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                Salon Operations & System Settings
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                Enterprise
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Shop profile, invoice customization, GST & UPI, subscription, and help desk
            </p>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/20 border border-white/10 shrink-0 self-start sm:self-auto">
          {[
            { id: 'profile', label: 'Shop Profile' },
            { id: 'invoicing', label: 'Invoice Settings' },
            { id: 'billing', label: 'Subscription & Billing' },
            { id: 'help', label: 'Settings & Help' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#D4AF37] text-[#0B1F44]'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. TAB: SHOP PROFILE                                           */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Shop Profile Identity Card with Logo, Owner info & Edit Button */}
          <div
            className={`p-6 rounded-3xl border transition-all shadow-lg ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-5 border-b border-white/10">
              <div className="flex items-center gap-4">
                {/* Salon Logo (Square luxury border) */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-[#0B1F44] flex items-center justify-center shrink-0 shadow-lg relative group">
                  <Image
                    src={shopProfile.logoImg || '/assets/stylefleet-logo.png'}
                    alt="Salon Logo"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {shopProfile.shopName}
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Verified
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                    Managed by <strong>{shopProfile.ownerName}</strong> · Login Phone: <strong>+91 {shopProfile.phone}</strong>
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                    {shopProfile.address}, {shopProfile.city} - {shopProfile.pinCode}
                  </p>
                </div>
              </div>

              {/* Action: Edit Profile Button */}
              <button
                type="button"
                onClick={handleOpenEditProfile}
                className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-bold active:scale-95 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Shop Profile</span>
              </button>
            </div>

            {/* Profile Metrics: Owner Login Number, GST, UPI ID, Team Count */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
              <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                  Owner Login Mobile
                </span>
                <strong className={`text-sm font-black block mt-1 font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  +91 {shopProfile.phone}
                </strong>
                <button
                  type="button"
                  onClick={() => setShowChangePhoneModal(true)}
                  className="text-[10px] text-[#D4AF37] hover:underline font-bold mt-1 block"
                >
                  Change Number →
                </button>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                  Salon GSTIN
                </span>
                <strong className="text-sm font-black text-sky-400 block mt-1 font-mono truncate">
                  {shopProfile.gstin || 'Unregistered'}
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                  Tax Identification
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                  Payment UPI ID
                </span>
                <strong className="text-sm font-black text-emerald-400 block mt-1 font-mono truncate">
                  {shopProfile.upiId || 'royalcuts@upi'}
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                  Direct Inflow Receiver
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-[#D4AF37]/30' : 'bg-[#FFFDF5] border-[#D4AF37]/40'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                  Team Members
                </span>
                <strong className={`text-sm font-black block mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {staff.length} Stylists
                </strong>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('staff')}
                  className="text-[10px] text-[#D4AF37] hover:underline font-bold mt-1 block"
                >
                  Manage Team →
                </button>
              </div>
            </div>

            {/* SHOP BILLS USAGE PROGRESS BAR (FREE STARTER PLAN - 100 BILLS) */}
            <div className={`mt-5 p-4 sm:p-5 rounded-2xl border ${
              isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                    <h4 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Shop Billing Usage (Free Starter Plan)
                    </h4>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      billsFinished >= 100
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {billsFinished >= 100 ? 'Limit Finished' : `${100 - billsFinished} Bills Remaining`}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                    {billsFinished} of 100 free bills finished. Upgrade for unlimited billing & WhatsApp invoices.
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black font-mono text-[#D4AF37]">
                    {billsFinished} / 100 Bills
                  </span>
                  <span className="text-[11px] block text-slate-400">
                    {Math.round(billsUsagePct)}% Completed
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-3 rounded-full bg-slate-800/50 overflow-hidden p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    billsFinished >= 100
                      ? 'bg-rose-500'
                      : billsUsagePct > 75
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-[#D4AF37] to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(billsUsagePct, 100)}%` }}
                />
              </div>

              {/* Upgrade Trigger if approaching or finished */}
              {billsFinished >= 80 && (
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-white/5">
                  <span className="text-xs text-amber-400 font-semibold">
                    {billsFinished >= 100
                      ? 'Free version finished. Upgrade to subscribe for unlimited bills.'
                      : 'You are close to your 100 free bills limit. Upgrade now to avoid interruption.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('billing')}
                    className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    Upgrade Plan →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Plan Card / Pro Badge */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDarkMode
                ? 'bg-[#121B33] border-[#2A3858]'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#D4AF37]">
                    StyleFleet Enterprise Edition
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#0B1F44]">
                    ACTIVE
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Unlimited bills, WhatsApp marketing, financial drill-down, and automated reminders
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => showToast('Your StyleFleet Enterprise plan is currently active and fully upgraded!')}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shrink-0 ${
                isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              Plan Details & Upgrade
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TAB: INVOICE SETTINGS                                       */}
      {/* ============================================================== */}
      {activeTab === 'invoicing' && (
        <div className="space-y-6 animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border space-y-5 shadow-lg ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Invoice & Billing Settings
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Configure tax application, invoice numbering prefix, and booking schedule
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveInvoiceSettings}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-bold transition-colors cursor-pointer active:scale-95"
              >
                Save Settings
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* 1. Apply GST on Invoices Switch with Custom Slab Rate */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <strong className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Apply GST on Invoices
                    </strong>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                      Include GST tax calculation on printable & WhatsApp bills
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setApplyGst(!applyGst)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      applyGst ? 'bg-[#D4AF37]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        applyGst ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {applyGst && (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                        GST Slab Rate (%):
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={gstRate}
                          onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                          placeholder="e.g. 18"
                          className={`w-24 px-3 py-1.5 rounded-xl border text-xs font-bold text-center outline-none ${
                            isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                        <span className={`text-xs font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>%</span>
                      </div>
                    </div>
                    {/* Quick slab select chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {[0, 5, 12, 18, 28].map((slab) => (
                        <button
                          key={slab}
                          type="button"
                          onClick={() => setGstRate(slab)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            gstRate === slab
                              ? 'bg-[#D4AF37] text-[#0B1F44] shadow-sm'
                              : isDarkMode
                              ? 'bg-[#121B33] text-[#A7B0C3] hover:text-white border border-white/5'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-2xs'
                          }`}
                        >
                          {slab}% GST
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Invoice Prefix: Derived from Shop Name, Monthly (RCS-OCT-001) / Yearly (RCS-2026-001) */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <strong className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Invoice Numbering Prefix & Format
                    </strong>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                      Derived automatically from salon name ({getShopPrefixFromShopName(shopProfile.shopName)}) or custom
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const autoPrefix = getShopPrefixFromShopName(shopProfile.shopName);
                      setInvoicePrefix(autoPrefix);
                      showToast(`Prefix set to shop initials: ${autoPrefix}`);
                    }}
                    className="text-[10px] text-[#D4AF37] hover:underline font-bold shrink-0 cursor-pointer"
                  >
                    Use Initials ({getShopPrefixFromShopName(shopProfile.shopName)})
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                      placeholder={getShopPrefixFromShopName(shopProfile.shopName)}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none uppercase ${
                        isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border shrink-0 ${
                      isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-[#D4AF37]' : 'bg-white border-slate-300 text-[#0B1F44]'
                    }`}>
                      Acronym: {getShopPrefixFromShopName(shopProfile.shopName)}
                    </span>
                  </div>

                  {/* Format Selector: Monthly (RCS-OCT-001) / Yearly (RCS-2026-001) / Standard (RCS-001) */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { id: 'monthly', label: 'Monthly', example: `${invoicePrefix || getShopPrefixFromShopName(shopProfile.shopName)}-OCT-001` },
                      { id: 'yearly', label: 'Yearly', example: `${invoicePrefix || getShopPrefixFromShopName(shopProfile.shopName)}-${new Date().getFullYear()}-001` },
                      { id: 'standard', label: 'Standard', example: `${invoicePrefix || getShopPrefixFromShopName(shopProfile.shopName)}-001` },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setInvoicePrefixFormat(fmt.id as 'standard' | 'monthly' | 'yearly')}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          invoicePrefixFormat === fmt.id
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold shadow-xs'
                            : isDarkMode
                            ? 'bg-[#121B33] border-white/5 text-[#A7B0C3] hover:text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase">{fmt.label}</div>
                        <div className="text-[10px] font-mono mt-0.5 truncate">{fmt.example}</div>
                      </button>
                    ))}
                  </div>

                  {/* Live Preview Pill */}
                  <div className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                    isDarkMode ? 'bg-[#121B33]/60 border-white/5' : 'bg-amber-50/70 border-amber-200'
                  }`}>
                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                      Sample Next Bill ID:
                    </span>
                    <span className="font-mono font-black text-[#D4AF37]">
                      {formatInvoiceNumber(invoicePrefix || getShopPrefixFromShopName(shopProfile.shopName), invoicePrefixFormat, 1, new Date())}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Appointment Booking Hours & Available Slots Preview */}
              <div
                className={`p-4 rounded-2xl border space-y-3 sm:col-span-2 ${
                  isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Appointment Booking Hours & Available Time Slots
                    </strong>
                    <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                      Defines the valid time slot intervals clients and staff can book in the Appointments system
                    </span>
                  </div>
                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['09:00 AM – 08:00 PM', '09:30 AM – 08:30 PM', '10:00 AM – 09:00 PM', '10:00 AM – 10:00 PM'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBookingHours(preset)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                          bookingHours === preset
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0B1F44] font-bold'
                            : isDarkMode
                            ? 'bg-[#121B33] border-white/5 text-[#A7B0C3] hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:text-black'
                        }`}
                      >
                        {preset.split(' – ')[0]} - {preset.split(' – ')[1]}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="e.g. 09:30 AM – 08:30 PM"
                  value={bookingHours}
                  onChange={(e) => setBookingHours(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                    isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />

                {/* Slot Preview */}
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                    Generated Booking Slots Preview ({generateTimeSlotsFromBookingHours(bookingHours).length} slots):
                  </div>
                  <div className={`flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl border ${
                    isDarkMode ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'
                  }`}>
                    {generateTimeSlotsFromBookingHours(bookingHours).map((slot) => (
                      <span
                        key={slot}
                        className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${
                          isDarkMode
                            ? 'bg-[#121B33] border-white/10 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TAB: SUBSCRIPTION & BILLING                                 */}
      {/* ============================================================== */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border space-y-5 shadow-lg ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Subscription & Billing
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Manage your salon license, tax invoices, and payment methods
                </p>
              </div>

              <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Active Lifetime
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Plan</span>
                <strong className="text-lg font-black text-[#D4AF37] block mt-1">Enterprise Pro</strong>
                <span className="text-[10px] text-emerald-400 font-bold">Unlimited Chairs & Outlets</span>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Billing Cycle</span>
                <strong className={`text-lg font-black block mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Annual / Lifetime
                </strong>
                <span className="text-[10px] text-sky-400 font-bold">Auto-renewal enabled</span>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Next Invoice</span>
                <strong className={`text-lg font-black block mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  ₹ 0.00
                </strong>
                <span className="text-[10px] text-slate-400 font-medium">Fully Settled</span>
              </div>
            </div>

            {/* Billing Receipts Download */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDarkMode ? 'bg-[#0B172E] border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <strong className={`text-xs font-bold block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  GST Tax Invoices for StyleFleet Software
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                  Download past software subscription receipts for input tax credit (ITC)
                </span>
              </div>

              <button
                type="button"
                onClick={() => showToast('Downloading StyleFleet GST Subscription Tax Invoice...')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shrink-0"
              >
                Download Receipt (.pdf)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TAB: SETTINGS & HELP (LANGUAGE, SOCIAL, REVIEWS, ACCOUNT)   */}
      {/* ============================================================== */}
      {activeTab === 'help' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. App Language & Social Media Links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* App Language */}
            <div
              className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
                isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <h3 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  App Language / भाषा / மொழி
                </h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Select your primary language for dashboard navigation and receipts
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {[
                  { id: 'en', label: 'English', native: 'Default' },
                  { id: 'hi', label: 'हिन्दी', native: 'Hindi' },
                  { id: 'ta', label: 'தமிழ்', native: 'Tamil' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLanguage(l.id as 'en' | 'hi' | 'ta');
                      showToast(`Language switched to ${l.label}`);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      language === l.id
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0B1F44] font-black shadow-md'
                        : isDarkMode
                        ? 'bg-[#0B172E] border-white/5 text-[#A7B0C3] hover:text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-black'
                    }`}
                  >
                    <strong className="text-xs block">{l.label}</strong>
                    <span className="text-[10px] block opacity-75">{l.native}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Social Media Links */}
            <div
              className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
                isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Social Media Handles
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                    Connect your salon social profiles to receipts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveSocialLinks}
                  className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#0B1F44] text-xs font-black cursor-pointer"
                >
                  Save
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Instagram</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${
                      isDarkMode ? 'bg-[#0B172E] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Facebook</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${
                      isDarkMode ? 'bg-[#0B172E] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Google Maps / Review URL</label>
                  <input
                    type="text"
                    value={googleMaps}
                    onChange={(e) => setGoogleMaps(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${
                      isDarkMode ? 'bg-[#0B172E] border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Rate & Review StyleFleet & Help Desk Support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rate & Reviews StyleFleet */}
            <div
              className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
                isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Rate & Review StyleFleet
                </h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your feedback helps us continuously assist salon owners
                </p>
              </div>

              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <svg
                      className={`w-5 h-5 ${star <= ratingStars ? 'text-[#D4AF37] fill-[#D4AF37]' : isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
                <span className="text-xs font-bold text-[#D4AF37] ml-2">
                  {ratingStars} of 5 Stars
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowRateModal(true)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
              >
                Write Feedback / Review
              </button>
            </div>

            {/* Help Desk Support */}
            <div
              className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
                isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Help Desk & VIP Support
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                    Direct priority support line for salon managers
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Online
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <a
                  href="https://wa.me/919876543210?text=Hi%20StyleFleet%20Support,%20I%20need%20assistance%20with%20my%20salon%20software"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-center text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>WhatsApp Help</span>
                </a>

                <a
                  href="tel:+919876543210"
                  className={`p-3 rounded-2xl border text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isDarkMode ? 'bg-[#0B172E] border-white/10 text-white hover:bg-white/5' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Call Support</span>
                </a>
              </div>
            </div>
          </div>

          {/* 3. Account Management Module (Privacy Policy, FAQ, Change Phone, Sign Out, Delete Account) */}
          <div
            className={`p-6 rounded-3xl border space-y-4 shadow-lg ${
              isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Account Management & Security
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Privacy guidelines, frequently asked questions, session control, and data retention
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {/* Privacy Policy */}
              <button
                type="button"
                onClick={() => setShowPrivacyPolicyModal(true)}
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#0B172E] border-white/5 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 mx-auto rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <strong className={`text-xs font-bold block mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Privacy Policy
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                  Data encryption terms
                </span>
              </button>

              {/* FAQ */}
              <button
                type="button"
                onClick={() => setShowFaqModal(true)}
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#0B172E] border-white/5 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 mx-auto rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <strong className={`text-xs font-bold block mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Salon FAQ
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                  Common questions
                </span>
              </button>

              {/* Change Phone Number */}
              <button
                type="button"
                onClick={() => setShowChangePhoneModal(true)}
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  isDarkMode ? 'bg-[#0B172E] border-white/5 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <strong className={`text-xs font-bold block mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Change Phone
                </strong>
                <span className={`text-[10px] block ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                  Update owner mobile
                </span>
              </button>

              {/* Sign Out */}
              <button
                type="button"
                onClick={onOpenSignOutModal}
                className="p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-center transition-all cursor-pointer"
              >
                <div className="w-8 h-8 mx-auto rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <strong className="text-xs font-bold block mt-2 text-red-400">
                  Sign Out
                </strong>
                <span className="text-[10px] block text-red-400/80">
                  End current session
                </span>
              </button>

              {/* Permanently Delete Account */}
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmText('');
                  setShowDeleteAccountModal(true);
                }}
                className="p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-center transition-all cursor-pointer"
              >
                <div className="w-8 h-8 mx-auto rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <strong className="text-xs font-bold block mt-2 text-red-400">
                  Delete Account
                </strong>
                <span className="text-[10px] block text-red-400/80">
                  Wipe all records
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT SHOP PROFILE ================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-lg w-full space-y-4 shadow-2xl relative ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Edit Shop Profile & Branding
              </h3>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="w-7 h-7 rounded-xl border border-white/10 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-white/5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Salon Business Name *</label>
                  <input
                    type="text"
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">UPI Receiver ID *</label>
                  <input
                    type="text"
                    value={editUpiId}
                    onChange={(e) => setEditUpiId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Pin Code</label>
                  <input
                    type="text"
                    value={editPinCode}
                    onChange={(e) => setEditPinCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={editGstin}
                    onChange={(e) => setEditGstin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-black/20 outline-none uppercase font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-[#0B1F44] text-xs font-black shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHANGE PHONE NUMBER MODULE ================= */}
      {showChangePhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-sm w-full space-y-4 shadow-2xl relative ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Change Owner Login Number
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePhoneModal(false)}
                className="w-7 h-7 rounded-xl border border-white/10 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-white/5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Current Number: <strong className="font-mono text-white">+91 {shopProfile.phone}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">New 10-Digit Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D4AF37]">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter new number"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-3 py-2 rounded-xl border text-xs font-mono font-bold bg-black/20 outline-none"
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black shadow-md cursor-pointer"
                >
                  Send Verification OTP
                </button>
              ) : (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="block text-[10px] font-bold text-slate-400">Enter OTP (Demo: 1234)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="4-digit code"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-center text-sm font-mono font-bold bg-black/20 outline-none tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyChangePhone}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md"
                  >
                    Verify & Confirm Update
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRIVACY POLICY ================= */}
      {showPrivacyPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-md w-full space-y-4 shadow-2xl relative ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                StyleFleet Privacy Policy & Security
              </h3>
              <button
                type="button"
                onClick={() => setShowPrivacyPolicyModal(false)}
                className="w-7 h-7 rounded-xl border border-white/10 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-white/5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={`space-y-3 text-xs leading-relaxed max-h-72 overflow-y-auto pr-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              <p>
                <strong>1. Client Confidentiality:</strong> All phone numbers, billing transactions, and customer notes stored in StyleFleet Salon OS belong solely to your salon.
              </p>
              <p>
                <strong>2. No Third-Party Data Selling:</strong> We never sell, share, or broker your salon client contacts to advertising networks.
              </p>
              <p>
                <strong>3. End-to-End Encryption:</strong> Invoices generated through WhatsApp use direct encrypted links without passing sensitive customer card credentials through untrusted intermediaries.
              </p>
              <p>
                <strong>4. Local & Cloud Sync:</strong> Salon operators retain total autonomy to download full Excel & PDF archives at any moment.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPrivacyPolicyModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-[#0B1F44] text-xs font-black shadow-md"
            >
              Close Privacy Terms
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: SALON FAQ ================= */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-md w-full space-y-4 shadow-2xl relative ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Frequently Asked Questions (FAQ)
              </h3>
              <button
                type="button"
                onClick={() => setShowFaqModal(false)}
                className="w-7 h-7 rounded-xl border border-white/10 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-white/5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
              <details className="p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <summary className="font-bold text-[#D4AF37]">How do I share receipts on WhatsApp?</summary>
                <p className="mt-1.5 text-slate-300 leading-relaxed">
                  After completing a checkout in Express Billing, click &quot;Save & Share Bill&quot;. A prefilled WhatsApp message opens automatically for the client.
                </p>
              </details>

              <details className="p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <summary className="font-bold text-[#D4AF37]">How is Net Profit calculated?</summary>
                <p className="mt-1.5 text-slate-300 leading-relaxed">
                  Net Profit = Total Collected Sales Inflow minus Operating Expenses (excluding items toggled as owner drawings).
                </p>
              </details>

              <details className="p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <summary className="font-bold text-[#D4AF37]">Can I restrict staff access?</summary>
                <p className="mt-1.5 text-slate-300 leading-relaxed">
                  Yes, in the Team section, open the 3-dot menu next to any stylist and click &quot;Stylist Permissions&quot; to toggle billing, appointment, or CRM access.
                </p>
              </details>
            </div>

            <button
              type="button"
              onClick={() => setShowFaqModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-[#0B1F44] text-xs font-black"
            >
              Close FAQ
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: RATE & REVIEW STYLEFLEET ================= */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-sm w-full space-y-4 shadow-2xl relative ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Review StyleFleet Salon OS
              </h3>
              <button
                type="button"
                onClick={() => setShowRateModal(false)}
                className="w-7 h-7 rounded-xl border border-white/10 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-white/5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-3">
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRatingStars(s)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <svg
                      className={`w-6 h-6 ${s <= ratingStars ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-slate-400 stroke-current fill-none'}`}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Your Feedback / Review Comments</label>
                <textarea
                  rows={3}
                  placeholder="Tell us what you like about StyleFleet..."
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  className="w-full p-2.5 rounded-xl border text-xs bg-black/20 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="flex-1 py-2 rounded-xl border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#D4AF37] text-[#0B1F44] text-xs font-black shadow-md"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PERMANENTLY DELETE ACCOUNT MODULE ================= */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border border-red-500/50 max-w-sm w-full space-y-4 shadow-2xl relative text-center ${
              isDarkMode ? 'bg-[#1A1828] text-white' : 'bg-white text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <h3 className="text-base font-black text-red-400">Permanently Delete Account?</h3>
              <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                This action is irreversible. All client databases, bills, expenses, and staff credentials will be erased forever.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 block">
                Type <strong>DELETE</strong> below to confirm:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-red-500/40 text-xs font-bold bg-black/30 outline-none text-center tracking-widest text-red-300"
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={deleteConfirmText.trim() !== 'DELETE'}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-md transition-all cursor-pointer"
              >
                Erase & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};