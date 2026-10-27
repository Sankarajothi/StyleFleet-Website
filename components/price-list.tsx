'use client';

import React, { useState } from 'react';
import { useSalon } from '@/components/SalonContext';

interface PriceListViewProps {
  onOpenAddCategory: () => void;
  onOpenAddService: () => void;
}

export const PriceListView: React.FC<PriceListViewProps> = ({
  onOpenAddCategory,
  onOpenAddService,
}) => {
  const { isDarkMode, services, categories, toggleServiceActive } = useSalon();
  const [priceListCatFilter, setPriceListCatFilter] = useState('All');

  return (
    <section className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-black">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
              Salon Price List & Menu Catalog
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
              Manage your service menu, pricing tiers, durations and catalog categories
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onOpenAddCategory}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isDarkMode
                ? 'bg-white/[0.06] hover:bg-white/[0.12] border-[#2A3858] text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-[#1F2937]'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Category</span>
          </button>
          <button
            onClick={onOpenAddService}
            className="px-4 py-2 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-extrabold shadow-md active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[#0B1F44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setPriceListCatFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              priceListCatFilter === cat
                ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/20'
                : isDarkMode
                ? 'bg-[#121B33] border border-[#2A3858] text-[#A7B0C3] hover:text-white hover:border-white/20'
                : 'bg-white border border-slate-200 text-[#374151] hover:text-[#1F2937] hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services
          .filter((s) => priceListCatFilter === 'All' || s.cat === priceListCatFilter)
          .map((service) => (
            <div
              key={service.id}
              className={`p-5 rounded-3xl border transition-all shadow-lg ${
                isDarkMode ? 'bg-[#121B33]' : 'bg-white'
              } ${
                service.active
                  ? isDarkMode
                    ? 'border-[#2A3858] hover:border-[#D4AF37]/40'
                    : 'border-slate-200 hover:border-[#D4AF37]/60'
                  : 'border-white/5 opacity-55'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 inline-block mb-1.5">
                    {service.cat}
                  </span>
                  <strong className={`text-sm font-bold block ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
                    {service.name}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => toggleServiceActive(service.id)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    service.active ? 'bg-[#D4AF37]' : 'bg-white/20'
                  }`}
                  title={service.active ? 'Active service' : 'Disabled service'}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform ${
                      service.active ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div
                className={`pt-3.5 border-t flex items-center justify-between mt-3 text-xs ${
                  isDarkMode ? 'border-white/[0.06]' : 'border-slate-100'
                }`}
              >
                <span className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
                  ₹ {service.price}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full border text-[11px] flex items-center gap-1 ${
                    isDarkMode
                      ? 'bg-white/[0.05] border-white/5 text-[#A7B0C3]'
                      : 'bg-slate-50 border-slate-200 text-[#374151]'
                  }`}
                >
                  <svg className="w-3 h-3 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{service.dur} mins</span>
                </span>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};
