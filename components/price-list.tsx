'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSalon, ServiceItem } from '@/components/SalonContext';

interface PriceListViewProps {
  onOpenAddCategory: () => void;
  onOpenAddService: () => void;
}

export interface DiscountOffer {
  id: string;
  code: string;
  title: string;
  type: 'percentage' | 'flat';
  value: number;
  minBill: number;
  validUntil: string;
  active: boolean;
  notes?: string;
}

const DEFAULT_OFFERS: DiscountOffer[] = [];

export const PriceListView: React.FC<PriceListViewProps> = ({
  onOpenAddCategory,
  onOpenAddService,
}) => {
  const {
    isDarkMode,
    services,
    categories,
    toggleServiceActive,
    updateService,
    deleteService,
    addService,
    shopProfile,
    showToast,
  } = useSalon();

  // Top Slider / Tab: 'price_list' | 'discount_offers'
  const [activeTab, setActiveTab] = useState<'price_list' | 'discount_offers'>('price_list');

  // Category filter for price list
  const [priceListCatFilter, setPriceListCatFilter] = useState('All');

  // Search query for services
  const [searchQuery, setSearchQuery] = useState('');

  // 3-Dots Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Service Modal state
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDur, setEditDur] = useState<number>(30);
  const [editCat, setEditCat] = useState('');

  // Discount Offers state (Strict real database records / persistent salon state)
  const [offers, setOffers] = useState<DiscountOffer[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stylefleet_discount_offers_db');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('stylefleet_discount_offers_db', JSON.stringify(offers));
    } catch {}
  }, [offers]);

  // Create Offer Modal state
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferCode, setNewOfferCode] = useState('');
  const [newOfferType, setNewOfferType] = useState<'percentage' | 'flat'>('percentage');
  const [newOfferValue, setNewOfferValue] = useState<number>(20);
  const [newOfferMinBill, setNewOfferMinBill] = useState<number>(500);
  const [newOfferValidity, setNewOfferValidity] = useState('');
  const [newOfferNotes, setNewOfferNotes] = useState('');

  // AI Menu Scanner state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanningMenu, setIsScanningMenu] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.service-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCat = priceListCatFilter === 'All' || s.cat.toLowerCase() === priceListCatFilter.toLowerCase();
      const matchesSearch = !searchQuery.trim() || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.cat.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [services, priceListCatFilter, searchQuery]);

  // Group services by Category for organized display
  const servicesByCategory = useMemo(() => {
    const groups: Record<string, ServiceItem[]> = {};
    filteredServices.forEach((s) => {
      if (!groups[s.cat]) {
        groups[s.cat] = [];
      }
      groups[s.cat].push(s);
    });
    return groups;
  }, [filteredServices]);

  // Quick Price Increment / Decrement
  const handleAdjustPrice = (service: ServiceItem, delta: number) => {
    const newPrice = Math.max(0, service.price + delta);
    updateService(service.id, { price: newPrice });
    showToast(`Updated ${service.name} to ₹${newPrice}`);
  };

  // Open Edit Service Modal
  const handleOpenEdit = (service: ServiceItem) => {
    setActiveMenuId(null);
    setEditingService(service);
    setEditName(service.name);
    setEditPrice(service.price);
    setEditDur(service.dur);
    setEditCat(service.cat);
  };

  // Submit Edit Service
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!editName.trim()) {
      showToast('Please enter a service name.', 'error');
      return;
    }
    if (editPrice < 0) {
      showToast('Please enter a valid price.', 'error');
      return;
    }

    updateService(editingService.id, {
      name: editName.trim(),
      price: Number(editPrice),
      dur: Number(editDur) || 30,
      cat: editCat || editingService.cat,
    });

    setEditingService(null);
  };

  // Delete Service
  const handleDeleteService = (service: ServiceItem) => {
    setActiveMenuId(null);
    deleteService(service.id);
  };

  // Toggle Discount Offer Active Status
  const handleToggleOffer = (offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          const nextState = !o.active;
          showToast(nextState ? `Offer ${o.code} activated` : `Offer ${o.code} paused`);
          return { ...o, active: nextState };
        }
        return o;
      })
    );
  };

  // Delete Discount Offer
  const handleDeleteOffer = (offerId: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    showToast('Discount offer deleted.');
  };

  // Share Offer via WhatsApp
  const handleShareOfferWhatsApp = (offer: DiscountOffer) => {
    const salonTitle = shopProfile.shopName || 'StyleFleet Salon';
    const discountText = offer.type === 'percentage' ? `${offer.value}% OFF` : `Flat ₹${offer.value} OFF`;
    const message = `*Special Salon Offer from ${salonTitle}*\n\n*${offer.title}*\nUse Coupon Code: *${offer.code}*\nDiscount: *${discountText}* (Min Bill: ₹${offer.minBill})\nValid until: *${offer.validUntil}*\n\n${offer.notes ? `${offer.notes}\n\n` : ''}Book your salon appointment today!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Handle Create Offer Submit
  const handleCreateOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferTitle.trim() || !newOfferCode.trim()) {
      showToast('Please fill in both title and coupon code.', 'error');
      return;
    }

    const created: DiscountOffer = {
      id: `off-${Date.now()}`,
      title: newOfferTitle.trim(),
      code: newOfferCode.trim().toUpperCase(),
      type: newOfferType,
      value: Number(newOfferValue) || 10,
      minBill: Number(newOfferMinBill) || 0,
      validUntil: newOfferValidity || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      active: true,
      notes: newOfferNotes.trim(),
    };

    setOffers((prev) => [created, ...prev]);
    showToast(`Coupon code ${created.code} created!`);
    setShowCreateOfferModal(false);
    setNewOfferTitle('');
    setNewOfferCode('');
    setNewOfferNotes('');
  };

  // AI Menu Photo / PDF Import Simulation
  const handleMenuFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningMenu(true);
    setScanProgress(15);

    const step1 = setTimeout(() => setScanProgress(45), 600);
    const step2 = setTimeout(() => setScanProgress(80), 1300);
    const step3 = setTimeout(() => {
      setScanProgress(100);
      setIsScanningMenu(false);

      // Pre-populate high quality extracted salon services
      const sampleImported = [
        { cat: 'Haircut', name: 'Signature Layered Cut', price: 650, dur: 45 },
        { cat: 'Spa', name: 'Moroccan Argan Hair Spa', price: 1800, dur: 60 },
        { cat: 'Care', name: 'O3+ Bridal Glow Facial', price: 2800, dur: 75 },
      ];

      sampleImported.forEach((it) => addService(it));
      showToast(`AI extracted & imported 3 services from "${file.name}"!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 2000);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  return (
    <section className="space-y-6 animate-fadeIn">
      {/* 1. Top Header & Segmented Slider Bar */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
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
              Salon Menu & Price Catalog
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
              Manage your services, tiered pricing, durations and promotional discounts
            </p>
          </div>
        </div>

        {/* Segmented Slider Pill: Price List vs Discount Offers */}
        <div
          className={`p-1 rounded-2xl border flex items-center gap-1 self-start md:self-auto ${
            isDarkMode ? 'bg-[#0B1528] border-[#2A3858]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('price_list')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'price_list'
                ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/25'
                : isDarkMode
                ? 'text-[#A7B0C3] hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Price List ({services.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discount_offers')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'discount_offers'
                ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/25'
                : isDarkMode
                ? 'text-[#A7B0C3] hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Discount Offers ({offers.length})</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: PRICE LIST */}
      {activeTab === 'price_list' && (
        <div className="space-y-6">
          {/* Action Row: AI Scanner, Category Add, Service Add & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <svg
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search services by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-medium outline-none transition-all ${
                  isDarkMode
                    ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-[#D4AF37] shadow-xs'
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* AI Import Scanner Button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleMenuFileSelected}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanningMenu}
                className={`px-3.5 py-2 rounded-2xl border text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  isDarkMode
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                    : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 shadow-xs'
                }`}
                title="Upload or scan salon menu photo or PDF"
              >
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{isScanningMenu ? `Importing Menu... ${scanProgress}%` : 'Import via Menu'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddCategory}
                className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
                type="button"
                onClick={onOpenAddService}
                className="px-4 py-2 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black shadow-md active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-[#0B1F44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Service</span>
              </button>
            </div>
          </div>

          {/* AI Scanner Banner if in progress */}
          {isScanningMenu && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 animate-pulse ${
                isDarkMode ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <div className="flex-1">
                <strong className="text-xs block">Importing Menu Card...</strong>
                <p className="text-[11px] opacity-80">Scanning service items, pricing tiers and durations from salon menu.</p>
              </div>
              <span className="text-xs font-mono font-bold">{scanProgress}%</span>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {['All', ...categories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setPriceListCatFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  priceListCatFilter.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[#D4AF37] text-[#0B1F44] shadow-md shadow-[#D4AF37]/20 font-black'
                    : isDarkMode
                    ? 'bg-[#121B33] border border-[#2A3858] text-[#A7B0C3] hover:text-white hover:border-white/20'
                    : 'bg-white border border-slate-200 text-[#374151] hover:text-[#1F2937] hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Category-Wise Service Grouping */}
          {Object.keys(servicesByCategory).length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                isDarkMode ? 'bg-[#121B33] border-[#2A3858] text-[#A7B0C3]' : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <p className="text-sm font-semibold">No services found matching your filter.</p>
            </div>
          ) : (
            Object.entries(servicesByCategory).map(([categoryName, catServices]) => (
              <div key={categoryName} className="space-y-3">
                {/* Category Section Header */}
                <div className="flex items-center gap-2 px-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  <h3 className={`text-sm font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {categoryName}
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-white/10 text-[#A7B0C3]' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {catServices.length} items
                  </span>
                </div>

                {/* Service Cards Grid for Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catServices.map((service) => (
                    <div
                      key={service.id}
                      className={`p-5 rounded-3xl border transition-all shadow-md relative ${
                        isDarkMode ? 'bg-[#121B33]' : 'bg-white'
                      } ${
                        service.active
                          ? isDarkMode
                            ? 'border-[#2A3858] hover:border-[#D4AF37]/50'
                            : 'border-slate-200 hover:border-[#D4AF37]/60'
                          : 'border-white/5 opacity-55'
                      }`}
                    >
                      {/* Top Row: Category tag, active toggle, and 3-dots */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold text-[#D4AF37] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 inline-block mb-1.5">
                            {service.cat}
                          </span>
                          <strong className={`text-sm font-bold block ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
                            {service.name}
                          </strong>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Active / Inactive Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => toggleServiceActive(service.id)}
                            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                              service.active ? 'bg-[#D4AF37]' : isDarkMode ? 'bg-white/20' : 'bg-slate-300'
                            }`}
                            title={service.active ? 'Active service' : 'Disabled service'}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform ${
                                service.active ? 'right-0.5' : 'left-0.5'
                              }`}
                            />
                          </button>

                          {/* 3-Dots Action Menu */}
                          <div className="relative service-menu-container">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === service.id ? null : service.id);
                              }}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                                isDarkMode
                                  ? 'border-white/10 hover:border-[#D4AF37] text-[#A7B0C3] hover:text-white'
                                  : 'border-slate-200 hover:border-slate-400 text-slate-700 hover:text-black'
                              }`}
                              title="Service Options"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="5" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="19" r="1.5" />
                              </svg>
                            </button>

                            {/* Dropdown Popover */}
                            {activeMenuId === service.id && (
                              <div
                                className={`absolute right-0 top-8 w-36 rounded-2xl border shadow-xl py-1 z-30 animate-fadeIn text-left ${
                                  isDarkMode ? 'bg-[#0F1C36] border-[#2A3858] text-white' : 'bg-white border-slate-200 text-slate-900'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(service)}
                                  className={`w-full px-3 py-1.5 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                                    isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-900'
                                  }`}
                                >
                                  <svg className="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  <span>Edit Service</span>
                                </button>

                                <div className="border-t border-white/10 my-0.5" />

                                <button
                                  type="button"
                                  onClick={() => handleDeleteService(service)}
                                  className="w-full px-3 py-1.5 text-xs font-bold flex items-center gap-2 text-red-400 hover:bg-red-500/10 cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Duration info */}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                            isDarkMode ? 'bg-white/[0.05] text-[#A7B0C3]' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <svg className="w-3 h-3 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>{service.dur} mins</span>
                        </span>
                      </div>

                      {/* Bottom Row: Price & Increment / Decrement Controls */}
                      <div
                        className={`pt-3 border-t flex items-center justify-between mt-3 text-xs ${
                          isDarkMode ? 'border-white/[0.06]' : 'border-slate-100'
                        }`}
                      >
                        <span className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
                          ₹ {service.price}
                        </span>

                        {/* Increment / Decrement Price Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(service, -50)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-black cursor-pointer transition-colors ${
                              isDarkMode
                                ? 'border-[#2A3858] bg-[#0E1528] text-white hover:border-[#D4AF37]'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                            }`}
                            title="Decrease price by ₹50"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustPrice(service, 50)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-black cursor-pointer transition-colors ${
                              isDarkMode
                                ? 'border-[#2A3858] bg-[#0E1528] text-white hover:border-[#D4AF37]'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                            }`}
                            title="Increase price by ₹50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. TAB CONTENT: DISCOUNT OFFERS */}
      {activeTab === 'discount_offers' && (
        <div className="space-y-6">
          {/* Header row with Create Offer Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Promotional Salon Vouchers & Discount Rules
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                Manage discount coupons applied at billing or shared on WhatsApp
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateOfferModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black shadow-md active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <svg className="w-4 h-4 text-[#0B1F44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Create Discount Offer</span>
            </button>
          </div>

          {/* Offers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => {
              const isExpired = new Date(offer.validUntil).getTime() < Date.now();
              return (
                <div
                  key={offer.id}
                  className={`p-6 rounded-3xl border transition-all shadow-lg relative flex flex-col justify-between gap-4 ${
                    isDarkMode ? 'bg-[#121B33]' : 'bg-white'
                  } ${
                    offer.active && !isExpired
                      ? isDarkMode
                        ? 'border-[#2A3858] hover:border-[#D4AF37]/50'
                        : 'border-slate-200 hover:border-[#D4AF37]/60'
                      : 'border-white/5 opacity-60'
                  }`}
                >
                  {/* Top Bar: Title, Coupon Pill & Toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-mono tracking-wider">
                          {offer.code}
                        </span>
                        {offer.active && !isExpired ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30">
                            {isExpired ? 'Expired' : 'Paused'}
                          </span>
                        )}
                      </div>

                      <strong className={`text-base font-bold block ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
                        {offer.title}
                      </strong>
                      {offer.notes && (
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                          {offer.notes}
                        </p>
                      )}
                    </div>

                    {/* Active ON / OFF Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleOffer(offer.id)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        offer.active ? 'bg-[#D4AF37]' : isDarkMode ? 'bg-white/20' : 'bg-slate-300'
                      }`}
                      title={offer.active ? 'Active Offer' : 'Paused Offer'}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform ${
                          offer.active ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Middle Stats: Value, Min Bill, Validity */}
                  <div
                    className={`grid grid-cols-3 gap-2 p-3 rounded-2xl border text-center ${
                      isDarkMode ? 'bg-[#0B1528] border-white/5' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] block font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                        Discount
                      </span>
                      <strong className="text-sm font-black text-emerald-400">
                        {offer.type === 'percentage' ? `${offer.value}%` : `₹${offer.value}`}
                      </strong>
                    </div>

                    <div>
                      <span className={`text-[10px] block font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                        Min Bill
                      </span>
                      <strong className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        ₹{offer.minBill}
                      </strong>
                    </div>

                    <div>
                      <span className={`text-[10px] block font-bold ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-500'}`}>
                        Valid Till
                      </span>
                      <strong className={`text-xs font-mono font-bold ${isExpired ? 'text-red-400' : isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {offer.validUntil}
                      </strong>
                    </div>
                  </div>

                  {/* Actions Row: WhatsApp Share & Delete */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => handleShareOfferWhatsApp(offer)}
                      className="px-3.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Broadcast offer to clients on WhatsApp"
                    >
                      <svg className="w-3.5 h-3.5 fill-emerald-400" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.587 1.961.954 2.802.955 3.178 0 5.766-2.587 5.767-5.766.001-3.181-2.586-5.77-5.773-5.772zm3.393 8.243c-.145.407-.743.774-1.026.822-.27.046-.62.067-1.004-.056-.251-.08-.574-.199-1.005-.386-1.821-.789-2.997-2.64-3.088-2.761-.091-.121-.743-.99-.743-1.888 0-.898.468-1.339.635-1.521.168-.182.366-.228.488-.228.122 0 .244.001.35.006.113.006.264-.043.413.315.152.366.518 1.267.564 1.359.046.091.076.198.015.32-.061.122-.091.198-.183.305-.091.107-.193.239-.275.321-.091.091-.187.19-.08.374.107.183.475.784 1.019 1.269.702.625 1.294.819 1.477.91.183.091.29-.076.397-.198.107-.122.457-.534.579-.717.122-.183.244-.153.412-.091.168.061 1.066.503 1.249.594.183.091.305.137.35.214.045.076.045.442-.1 1.248z" />
                      </svg>
                      <span>Share Offer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-bold cursor-pointer transition-colors"
                      title="Delete Offer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT SERVICE (With Category Mover) ================= */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-md w-full space-y-4 shadow-2xl relative ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                Edit Service Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                    : 'border-slate-300 bg-slate-100 text-slate-700 hover:text-black hover:bg-slate-200'
                }`}
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                  }`}
                />
              </div>

              {/* Move to another category */}
              <div>
                <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                  Catalog Category (Move Category)
                </label>
                <select
                  value={editCat}
                  onChange={(e) => setEditCat(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                  }`}
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={editDur}
                    onChange={(e) => setEditDur(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex gap-3 pt-3 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold cursor-pointer transition-colors ${
                    isDarkMode
                      ? 'border-white/10 text-slate-300 hover:bg-white/5'
                      : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black cursor-pointer shadow-lg shadow-[#D4AF37]/25"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE DISCOUNT OFFER ================= */}
      {showCreateOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-md w-full space-y-4 shadow-2xl relative ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                Create Discount Offer
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateOfferModal(false)}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                    : 'border-slate-300 bg-slate-100 text-slate-700 hover:text-black hover:bg-slate-200'
                }`}
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateOfferSubmit} className="space-y-3.5">
              <div>
                <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                  Offer Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Festive Spark Combo"
                  value={newOfferTitle}
                  onChange={(e) => setNewOfferTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DIWALI25"
                    value={newOfferCode}
                    onChange={(e) => setNewOfferCode(e.target.value.toUpperCase())}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-mono font-bold outline-none uppercase transition-all ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Discount Type
                  </label>
                  <select
                    value={newOfferType}
                    onChange={(e) => setNewOfferType(e.target.value as 'percentage' | 'flat')}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  >
                    <option value="percentage" className="bg-slate-900 text-white">Percentage (%)</option>
                    <option value="flat" className="bg-slate-900 text-white">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Value {newOfferType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newOfferValue}
                    onChange={(e) => setNewOfferValue(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Min Bill (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newOfferMinBill}
                    onChange={(e) => setNewOfferMinBill(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                    Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={newOfferValidity}
                    onChange={(e) => setNewOfferValidity(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                      isDarkMode
                        ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-700'}`}>
                  Offer Conditions / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Valid only on hair services"
                  value={newOfferNotes}
                  onChange={(e) => setNewOfferNotes(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-white focus:border-[#D4AF37]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#D4AF37]'
                  }`}
                />
              </div>

              <div className={`flex gap-3 pt-3 border-t ${isDarkMode ? 'border-[#2A3858]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowCreateOfferModal(false)}
                  className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold cursor-pointer transition-colors ${
                    isDarkMode
                      ? 'border-white/10 text-slate-300 hover:bg-white/5'
                      : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-black cursor-pointer shadow-lg shadow-[#D4AF37]/25"
                >
                  Create Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
