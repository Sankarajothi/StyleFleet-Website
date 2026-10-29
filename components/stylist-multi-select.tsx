'use client';

import React, { useMemo } from 'react';
import { useSalon } from '@/components/SalonContext';
import {
  getAvailableStylistOptions,
  parseSelectedStylists,
  toggleStylistSelection,
} from '@/lib/salon-helpers';

interface StylistMultiSelectProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  sublabel?: string;
  className?: string;
  compact?: boolean;
}

export function StylistMultiSelect({
  value,
  onChange,
  label = 'Assign Stylist(s)',
  sublabel,
  className = '',
  compact = false,
}: StylistMultiSelectProps) {
  const { role, loggedInStaffName, shopProfile, staff, isDarkMode } = useSalon();

  const isStylist = role === 'stylist';
  const ownerName = shopProfile?.ownerName?.trim() || 'Owner';

  // Compute available stylist options with Owner always defaultly present first
  const stylistOptions = useMemo(() => {
    return getAvailableStylistOptions(ownerName, staff);
  }, [ownerName, staff]);

  // Determine fallback default based on role
  const defaultFallback = useMemo(() => {
    if (isStylist && loggedInStaffName) {
      return loggedInStaffName;
    }
    return ownerName;
  }, [isStylist, loggedInStaffName, ownerName]);

  // Parse currently selected stylists
  const selectedList = useMemo(() => {
    const list = parseSelectedStylists(value);
    if (list.length === 0) {
      return [defaultFallback];
    }
    return list;
  }, [value, defaultFallback]);

  const handleToggle = (stylistName: string) => {
    // If only 1 item is selected and user clicks it, keep it (must have at least one)
    if (
      selectedList.length === 1 &&
      selectedList[0].toLowerCase() === stylistName.trim().toLowerCase()
    ) {
      // Already selected single option, keep it
      return;
    }

    const nextValue = toggleStylistSelection(value, stylistName, defaultFallback);
    onChange(nextValue);
  };

  const handleSelectAll = () => {
    const allNames = stylistOptions.map((opt) => opt.name).join(', ');
    onChange(allNames);
  };

  const handleResetToDefault = () => {
    onChange(defaultFallback);
  };

  const isAllSelected = selectedList.length === stylistOptions.length;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Quick Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <label
            className={`block text-[11px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'
            }`}
          >
            {label}
            {sublabel && (
              <span className="ml-1 text-[10px] font-normal opacity-75">
                ({sublabel})
              </span>
            )}
          </label>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span
            className={`px-2 py-0.5 rounded-full border transition-all ${
              selectedList.length > 1
                ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                : isDarkMode
                ? 'bg-slate-800/80 border-[#2A3858] text-slate-300'
                : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}
          >
            {selectedList.length === 1
              ? '1 Selected'
              : `${selectedList.length} Stylists Assigned`}
          </span>

          {stylistOptions.length > 1 && (
            <>
              {!isAllSelected ? (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-0.5 rounded-md text-[10px] text-[#D4AF37] hover:underline cursor-pointer transition-colors"
                >
                  Select All
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className={`px-2 py-0.5 rounded-md text-[10px] hover:underline cursor-pointer transition-colors ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {isStylist ? 'My Chair Only' : 'Owner Only'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Interactive Stylist Chips (Owner + Stylists) */}
      <div
        className={`flex flex-wrap gap-2 p-2.5 rounded-2xl border transition-colors ${
          isDarkMode
            ? 'bg-[#121B33] border-[#2A3858]'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        {stylistOptions.map((opt) => {
          const isSelected = selectedList.some(
            (s) => s.toLowerCase() === opt.name.toLowerCase()
          );

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleToggle(opt.name)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'bg-[#D4AF37] text-[#0B1F44] border-[#D4AF37] shadow-sm shadow-[#D4AF37]/25 font-black'
                  : isDarkMode
                  ? 'bg-[#1A2746] text-[#A7B0C3] border-[#2A3858] hover:border-[#D4AF37]/50 hover:text-white'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#D4AF37] hover:text-slate-900 shadow-2xs'
              } ${compact ? 'px-2.5 py-1 text-[11px]' : ''}`}
            >
              {/* Checkbox / Active indicator */}
              <span
                className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-[#0B1F44] text-[#D4AF37]'
                    : isDarkMode
                    ? 'border border-[#2A3858] bg-[#121B33] group-hover:border-[#D4AF37]'
                    : 'border border-slate-300 bg-slate-50 group-hover:border-[#D4AF37]'
                }`}
              >
                {isSelected ? '✓' : ''}
              </span>

              {/* Name & Role Badge */}
              <span className="truncate max-w-[140px] sm:max-w-[180px]">
                {opt.name}
              </span>

              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase font-extrabold shrink-0 ${
                  isSelected
                    ? 'bg-[#0B1F44]/20 text-[#0B1F44]'
                    : opt.isOwner
                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {opt.isOwner ? '👑 Owner' : opt.role}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected string caption */}
      <p
        className={`text-[11px] truncate ${
          isDarkMode ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        <span className="font-semibold">Assigned:</span>{' '}
        <span className="font-bold text-[#D4AF37]">
          {selectedList.join(', ')}
        </span>
      </p>
    </div>
  );
}
