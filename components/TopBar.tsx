'use client';

import React, { useState } from 'react';
import { useSalon } from './SalonContext';
import { useTranslationHelper } from '@/lib/translations';

interface TopBarProps {
  onOpenSignOutModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSignOutModal }) => {
  const {
    role,
    currentScreen,
    setCurrentScreen,
    isDarkMode,
    toggleTheme,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    shopProfile,
    loggedInStaffName,
    language,
    showToast,
    appointments,
    customers,
  } = useSalon();

  const t = useTranslationHelper(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Dynamic screen title matching the current active screen
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'home': return t.dashboard;
      case 'appointments': return t.appointments;
      case 'billing': return 'Sales';
      case 'customers': return t.customers;
      case 'pricelist': return t.pricelist;
      case 'staff': return t.team;
      case 'sales': return 'Sales';
      case 'reminders': return t.reminders;
      case 'whatsapp': return t.marketing;
      case 'accounts': return 'Expenses';
      case 'expenses': return 'Expenses';
      case 'reports': return 'Reports';
      case 'analytics': return 'Salon Intelligence';
      case 'settings': return t.settings;
      default: return t.dashboard;
    }
  };

  // Live formatted date (e.g. "Oct 21, 2026")
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header
      className={`px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between select-none transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#0B1F44] border-[#2A3858] text-[#F8FAFC]'
          : 'bg-[#FAF8F3] border-[#CBD5E1] text-[#0F172A]'
      }`}
    >
      {/* 1. Left Side: Screen Title & Date */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger (only on small screens < md) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded-xl border transition-colors shrink-0 ${
            isDarkMode
              ? 'bg-[#121B33] border-[#2A3858] text-[#A7B0C3] hover:text-[#F8FAFC]'
              : 'bg-[#FFFFFF] border-slate-300 text-[#0F172A] hover:text-black shadow-xs'
          }`}
          title="Open Navigation Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className={`text-base sm:text-lg font-black tracking-tight leading-tight truncate ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
            {getScreenTitle()}
          </h1>
          <p className={`text-[11px] sm:text-xs leading-tight mt-0.5 truncate ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A] font-bold'}`}>
            {formattedDate}
          </p>
        </div>
      </div>

      {/* 2. Right Side: Search Capsule, Reminder, Theme Switcher, User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Small background-free "View Analytics" text button for Owner */}
        {role === 'owner' && (
          <button
            type="button"
            onClick={() => setCurrentScreen('analytics')}
            className={`text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 px-2 py-1 ${
              currentScreen === 'analytics'
                ? 'text-[#D4AF37] underline underline-offset-4'
                : isDarkMode
                ? 'text-slate-300 hover:text-[#D4AF37]'
                : 'text-slate-700 hover:text-amber-800'
            }`}
            title="Open Salon Intelligence"
          >
            <svg className="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="hidden sm:inline">Salon Intelligence</span>
          </button>
        )}

        {/* Search Input Bar */}
        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-52 md:w-64 focus-within:border-[#D4AF37] transition-colors ${
            isDarkMode
              ? 'bg-[#121B33] border-[#2A3858] text-[#A7B0C3]'
              : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#374151]'
          }`}
        >
          <svg className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#4B5563]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-transparent border-none outline-none text-xs w-full ${
              isDarkMode
                ? 'text-[#F8FAFC] placeholder-[#737D92]'
                : 'text-[#1F2937] placeholder-[#4B5563]'
            }`}
          />
        </div>

        {/* Reminder / Notification Bell Button with badge, redirects to Reminders screen */}
        <button
          onClick={() => setCurrentScreen('reminders')}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors relative cursor-pointer ${
            currentScreen === 'reminders'
              ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
              : isDarkMode
              ? 'bg-[#121B33] border-[#2A3858] hover:border-[#D4AF37]/50 text-[#A7B0C3] hover:text-[#F8FAFC]'
              : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#D4AF37]/50 text-[#374151] hover:text-[#1F2937]'
          }`}
          title="Open Reminders & Automation"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className={`w-2.5 h-2.5 rounded-full bg-[#D4AF37] absolute top-1.5 right-1.5 border-2 ${
            isDarkMode ? 'border-[#121B33]' : 'border-[#FFFFFF]'
          }`} />
        </button>

        {/* 1-Click Sun / Moon Theme Switcher */}
        <button
          onClick={toggleTheme}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
            isDarkMode
              ? 'bg-[#121B33] border-[#2A3858] hover:border-[#D4AF37]/50 text-[#D4AF37]'
              : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#D4AF37]/50 text-[#B8863B]'
          }`}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User Profile Capsule */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-[#121B33]' : 'hover:bg-[#FFFFFF]'
            }`}
          >
            {/* Circular Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-inner ${
                isDarkMode
                  ? 'bg-[#1A2746] text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'bg-[#FEF3C7] text-[#5B2500] border border-[#D4AF37]/40'
              }`}
            >
              <span>{((role === 'stylist' && loggedInStaffName ? loggedInStaffName : shopProfile.ownerName) || 'Owner').slice(0, 2).toUpperCase()}</span>
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className={`text-xs font-black leading-tight ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
                {role === 'stylist' && loggedInStaffName ? loggedInStaffName : (shopProfile.ownerName || 'Salon Owner')}
              </span>
              <span className={`text-[10px] leading-tight ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A] font-bold'}`}>
                {role === 'owner' ? 'Owner' : 'Stylist'}
              </span>
            </div>

            <svg className={`w-3 h-3 shrink-0 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div
              className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-2xl py-2 z-50 animate-scaleIn ${
                isDarkMode
                  ? 'bg-[#121B33] border-[#2A3858]'
                  : 'bg-[#FFFFFF] border-[#E2E8F0] shadow-slate-200'
              }`}
            >
              <div className={`px-3 py-2 border-b ${isDarkMode ? 'border-[#2A3858]' : 'border-[#E2E8F0]'}`}>
                <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#1F2937]'}`}>
                  {role === 'stylist' && loggedInStaffName ? loggedInStaffName : (shopProfile.ownerName || 'Salon Owner')}
                </p>
                <p className={`text-[10px] truncate ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>+91 {shopProfile.phone}</p>
              </div>

              <button
                onClick={() => {
                  setCurrentScreen('settings');
                  setShowProfileMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white hover:bg-white/5'
                    : 'text-[#374151] hover:text-[#1F2937] hover:bg-[#F7F9FC]'
                }`}
              >
                <span>{t.shopProfile} & {t.settings}</span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  setShowProfileMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white hover:bg-white/5'
                    : 'text-[#374151] hover:text-[#1F2937] hover:bg-[#F7F9FC]'
                }`}
              >
                <span>{t.themeToggle} ({isDarkMode ? 'Light' : 'Dark'})</span>
              </button>

              <div className={`h-px my-1 ${isDarkMode ? 'bg-[#2A3858]' : 'bg-[#E2E8F0]'}`} />

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenSignOutModal();
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
              >
                <span>{t.signOut}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
