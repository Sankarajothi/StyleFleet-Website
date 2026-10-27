'use client';

import React from 'react';
import Image from 'next/image';
import { useSalon } from './SalonContext';
import { useTranslationHelper } from '@/lib/translations';

interface SidebarProps {
  onOpenSignOutModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSignOutModal }) => {
  const {
    role,
    loggedInStaffName,
    currentScreen,
    setCurrentScreen,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    shopProfile,
    isDarkMode,
    language,
    appointments,
    bills,
  } = useSalon();

  const isStylist = role === 'stylist';
  const RESTRICTED_FOR_STYLIST = new Set(['accounts', 'staff', 'settings', 'whatsapp']);

  const t = useTranslationHelper(language);

  // Navigation Items matching screenshot architecture
  const menuSections = [
    {
      group: t.overview,
      items: [
        {
          id: 'home',
          label: t.dashboard,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          ),
        },
        {
          id: 'customers',
          label: t.customers,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          id: 'billing',
          label: t.billing,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          ),
        },
        {
          id: 'appointments',
          label: t.appointments,
          count: appointments.filter(a => a.status === 'Confirmed').length || undefined,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          ),
        },
      ],
    },
    {
      group: t.manage,
      items: [
        {
          id: 'accounts',
          label: t.accounts,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          ),
        },
        {
          id: 'reminders',
          label: t.reminders,
          count: appointments.filter(a => a.status === 'Confirmed').length || undefined,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
        },
        {
          id: 'whatsapp',
          label: t.marketing,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
        },
        {
          id: 'pricelist',
          label: t.pricelist,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          ),
        },
        {
          id: 'staff',
          label: t.team,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 00-3-3.87" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          ),
        },
        {
          id: 'sales',
          label: 'Sales',
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
        {
          id: 'settings',
          label: t.settings,
          icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          ),
        },
      ].filter((item) => !isStylist || !RESTRICTED_FOR_STYLIST.has(item.id)),
    },
  ];

  return (
    <>
      {/* 1. Desktop Sticky Sidebar (Visible on md and above) */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 z-30 border-r shrink-0 transition-all duration-300 select-none ${
          isDarkMode
            ? 'bg-[#0B1F44] border-[#2A3858] text-[#F8FAFC]'
            : 'bg-[#FAF8F3] border-[#CBD5E1] text-[#0F172A]'
        } ${sidebarCollapsed ? 'w-[74px]' : 'w-[250px]'}`}
      >
      {/* 1. Header: StyleFleet Logo Mark & Name */}
      <div className="px-5 py-6 flex items-center justify-between">
        <div
          onClick={() => setCurrentScreen('home')}
          className="flex items-center gap-3 cursor-pointer group"
          title="StyleFleet"
        >
          {/* Logo container: Official StyleFleet logo */}
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#D4AF37]/60 flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105 bg-[#0B1F44]">
            <Image
              src="/assets/stylefleet-logo.png"
              alt="StyleFleet Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>

          {!sidebarCollapsed && (
            <span className={`text-base font-black tracking-tight ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
              StyleFleet
            </span>
          )}
        </div>

        {/* Optional Collapse Arrow */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isDarkMode ? 'text-[#737D92] hover:text-[#F8FAFC]' : 'text-[#0F172A] hover:text-black'
          } ${sidebarCollapsed ? 'mx-auto mt-2' : ''}`}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* 2. Grouped Navigation Links (No scrollbar) */}
      <nav className="flex-1 overflow-y-auto px-3.5 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!sidebarCollapsed ? (
              <span className={`block px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                isDarkMode ? 'text-[#737D92]' : 'text-[#0F172A]'
              }`}>
                {section.group}
              </span>
            ) : (
              <div className={`h-px mx-2 my-2 ${isDarkMode ? 'bg-[#2A3858]' : 'bg-[#E2E8F0]'}`} />
            )}

            {section.items.map((item) => {
              const isActive = currentScreen === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all duration-150 group relative ${
                    isActive
                      ? isDarkMode
                        ? 'bg-[#1A2746] text-[#F8FAFC] shadow-sm font-bold border border-[#D4AF37]/30'
                        : 'bg-[#FEF3C7] text-[#0F172A] shadow-sm font-black border border-[#D4AF37]'
                      : isDarkMode
                      ? 'text-[#A7B0C3] hover:text-[#F8FAFC] hover:bg-[#121B33] font-medium'
                      : 'text-[#0F172A] hover:text-black hover:bg-[#E2E8F0]/70 font-bold'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? isDarkMode ? 'text-[#D4AF37]' : 'text-[#5B2500]'
                          : isDarkMode
                          ? 'text-[#A7B0C3] group-hover:text-[#F8FAFC]'
                          : 'text-[#0F172A] group-hover:text-black'
                      }`}
                    >
                      {item.icon}
                    </span>

                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {/* Badge Counter */}
                  {!sidebarCollapsed && item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isDarkMode
                          ? 'bg-[#1A2746] text-[#D4AF37] border-[#D4AF37]/40'
                          : 'bg-[#FEF3C7] text-[#5B2500] border-[#D4AF37]/50'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 3. Bottom Workspace Switcher Card */}
      <div className={`p-3.5 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-[#E2E8F0]'}`}>
        <div
          onClick={() => {
            if (!isStylist) setCurrentScreen('settings');
          }}
          className={`p-2.5 rounded-2xl border flex items-center justify-between transition-colors group ${
            isStylist ? 'cursor-default' : 'cursor-pointer'
          } ${
            isDarkMode
              ? 'bg-[#121B33] border-[#2A3858] hover:border-[#D4AF37]/50'
              : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#D4AF37]/50 shadow-sm'
          }`}
          title={isStylist ? 'Stylist Chair Workspace' : 'Switch Salon Branch / Settings'}
        >
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            {/* Square monogram avatar */}
            <div
              className={`w-9 h-9 rounded-xl border font-bold text-xs flex items-center justify-center shrink-0 shadow-inner transition-transform ${
                isStylist ? '' : 'group-hover:scale-105'
              } ${
                isDarkMode
                  ? 'bg-[#1A2746] border-[#2A3858] text-[#D4AF37]'
                  : 'bg-[#FEF3C7] border-[#E2E8F0] text-[#5B2500]'
              }`}
            >
              <span suppressHydrationWarning>{shopProfile.shopName.slice(0, 2).toUpperCase()}</span>
            </div>

            {!sidebarCollapsed && (
              <div className="overflow-hidden min-w-0">
                <p suppressHydrationWarning className={`text-xs font-black truncate leading-tight ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
                  {shopProfile.shopName}
                </p>
                <p className={`text-[10px] truncate leading-tight mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A] font-bold'}`}>
                  {isStylist ? (loggedInStaffName ? `${loggedInStaffName} · Chair` : 'Stylist Workspace') : 'Main branch'}
                </p>
              </div>
            )}
          </div>

          {!sidebarCollapsed && !isStylist && (
            <svg className={`w-3.5 h-3.5 transition-colors shrink-0 ml-1 ${isDarkMode ? 'text-[#A7B0C3] group-hover:text-white' : 'text-[#0F172A] group-hover:text-black'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          )}
        </div>
      </div>
    </aside>

    {/* 2. Mobile Slide-out Drawer (Visible when mobileMenuOpen is true on < md) */}
    {mobileMenuOpen && (
      <div className="md:hidden fixed inset-0 z-50 flex animate-fadeIn">
        {/* Backdrop Overlay */}
        <div
          className="fixed inset-0 bg-black/75 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`relative flex-1 flex flex-col max-w-[280px] w-full h-full shadow-2xl z-50 select-none border-r ${
            isDarkMode
              ? 'bg-[#0B1F44] border-[#2A3858] text-[#F8FAFC]'
              : 'bg-[#FAF8F3] border-slate-300 text-[#0F172A]'
          }`}
        >
          {/* Drawer Header with Logo and Close Button */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
            <div
              onClick={() => {
                setCurrentScreen('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#D4AF37]/60 flex items-center justify-center shrink-0 shadow-md bg-[#0B1F44]">
                <Image
                  src="/assets/stylefleet-logo.png"
                  alt="StyleFleet Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-base font-black tracking-tight ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
                StyleFleet
              </span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-[#121B33] border-[#2A3858] text-[#A7B0C3] hover:text-white'
                  : 'bg-white border-slate-300 text-slate-800 hover:text-black'
              }`}
              title="Close Menu"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Drawer Nav links */}
          <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 [scrollbar-width:none]">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <span className={`block px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                  isDarkMode ? 'text-[#737D92]' : 'text-[#0F172A]'
                }`}>
                  {section.group}
                </span>

                {section.items.map((item) => {
                  const isActive = currentScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentScreen(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all ${
                        isActive
                          ? isDarkMode
                            ? 'bg-[#1A2746] text-[#F8FAFC] shadow-sm font-bold border border-[#D4AF37]/40'
                            : 'bg-[#FEF3C7] text-[#0F172A] shadow-sm font-black border border-[#D4AF37]'
                          : isDarkMode
                          ? 'text-[#A7B0C3] hover:text-white hover:bg-[#121B33] font-medium'
                          : 'text-[#0F172A] hover:text-black hover:bg-[#E2E8F0]/70 font-bold'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? (isDarkMode ? 'text-[#D4AF37]' : 'text-[#5B2500]') : (isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A]')}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isDarkMode
                            ? 'bg-[#1A2746] text-[#D4AF37] border-[#D4AF37]/40'
                            : 'bg-[#FEF3C7] text-[#5B2500] border-[#D4AF37]/50'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Drawer Bottom Workspace Switcher Card */}
          <div className={`p-3.5 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-slate-300'}`}>
            <div
              onClick={() => {
                if (!isStylist) setCurrentScreen('settings');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-2xl border flex items-center justify-between transition-colors ${
                isStylist ? 'cursor-default' : 'cursor-pointer'
              } ${
                isDarkMode
                  ? 'bg-[#121B33] border-[#2A3858]'
                  : 'bg-white border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div suppressHydrationWarning className={`w-9 h-9 rounded-xl border font-black text-xs flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#D4AF37]' : 'bg-[#FEF3C7] border-slate-300 text-[#5B2500]'
                }`}>
                  {shopProfile.shopName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p suppressHydrationWarning className={`text-xs font-black truncate leading-tight ${isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>
                    {shopProfile.shopName}
                  </p>
                  <p className={`text-[10px] truncate leading-tight mt-0.5 font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A]'}`}>
                    {isStylist ? (loggedInStaffName ? `${loggedInStaffName} · Chair` : 'Stylist Workspace') : 'Main branch'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* 3. Mobile Bottom Navigation Bar (Phones & Small Tablets) */}
    <nav className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t px-2 py-1.5 flex items-center justify-around select-none ${
      isDarkMode
        ? 'bg-[#0B1F44] border-[#2A3858] text-[#F8FAFC]'
        : 'bg-[#FAF8F3] border-slate-300 text-[#0F172A]'
    }`}>
      {/* Home */}
      <button
        onClick={() => setCurrentScreen('home')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
          currentScreen === 'home'
            ? isDarkMode ? 'text-[#D4AF37]' : 'text-[#8C6239] font-black'
            : isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A] font-bold'
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentScreen === 'home' ? '2.5' : '2'}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
        <span className="text-[10px] tracking-tight">Home</span>
      </button>

      {/* Appointments */}
      <button
        onClick={() => setCurrentScreen('appointments')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all relative ${
          currentScreen === 'appointments'
            ? isDarkMode ? 'text-[#D4AF37]' : 'text-[#8C6239] font-black'
            : isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A] font-bold'
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentScreen === 'appointments' ? '2.5' : '2'}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="text-[10px] tracking-tight">Appts</span>
        {appointments.length > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#D4AF37]" />
        )}
      </button>

      {/* Center Quick Bill Button */}
      <button
        onClick={() => setCurrentScreen('billing')}
        className="relative -top-3 w-12 h-12 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] flex items-center justify-center border border-[#D4AF37] active:scale-95 transition-colors cursor-pointer"
        title="Express Billing"
      >
        <svg className="w-6 h-6 text-[#0B1F44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      </button>

      {/* Customers */}
      <button
        onClick={() => setCurrentScreen('customers')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
          currentScreen === 'customers'
            ? isDarkMode ? 'text-[#D4AF37]' : 'text-[#8C6239] font-black'
            : isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A] font-bold'
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={currentScreen === 'customers' ? '2.5' : '2'}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-[10px] tracking-tight">Clients</span>
      </button>

      {/* Menu Drawer Toggle */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
          mobileMenuOpen
            ? isDarkMode ? 'text-[#D4AF37]' : 'text-[#8C6239] font-black'
            : isDarkMode ? 'text-[#A7B0C3]' : 'text-[#0F172A] font-bold'
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
          <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
          <line x1="4" y1="18" x2="20" y2="18" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] tracking-tight">Menu</span>
      </button>
    </nav>
  </>
  );
};
