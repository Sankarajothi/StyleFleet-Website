'use client';

import React, { useState, useMemo } from 'react';
import { useSalon, Customer } from '@/components/SalonContext';

type MarketingTab = 'festival' | 'recall';

interface FestivalTemplate {
  id: string;
  name: string;
  title: string;
  tag: string;
  defaultDiscount: string;
  defaultValidity: string;
  defaultMessage: string;
}

export const WhatsAppMarketingView: React.FC = () => {
  const { isDarkMode, customers, shopProfile, showToast, role } = useSalon();

  const [activeTab, setActiveTab] = useState<MarketingTab>('festival');

  // Festival Templates specified by user
  const festivalTemplates: FestivalTemplate[] = [
    {
      id: 'diwali',
      name: 'Diwali Festive Spark',
      title: 'Diwali Festive Spark',
      tag: 'Festival Special',
      defaultDiscount: 'Flat 25% OFF',
      defaultValidity: 'Valid till Nov 15',
      defaultMessage: 'Hello {name}! Light up your celebration with a fresh look at {shopName}! Enjoy {discount} on all premium Hair Spa, Keratin & Glow Facials. {validity}. Book your chair now: {phone}',
    },
    {
      id: 'pongal',
      name: 'Pongal Harvest Flow',
      title: 'Pongal Harvest Flow',
      tag: 'Harvest Festival',
      defaultDiscount: 'Special ₹799 Combo',
      defaultValidity: 'Valid this week only',
      defaultMessage: 'Hello {name}! Celebrate the harvest season with {shopName}! Treat yourself to our Festive Grooming Combo ({discount}) — Haircut + Beard Styling + Refreshing Clean-up. {validity}. Reply to reserve!',
    },
    {
      id: 'newyear',
      name: 'New Year Fresh Look',
      title: 'New Year Fresh Look',
      tag: 'New Year 2027',
      defaultDiscount: 'Flat 20% OFF',
      defaultValidity: 'Valid till Jan 10',
      defaultMessage: 'Hello {name}! Step into the New Year with a trendsetting makeover at {shopName}! Enjoy {discount} across all color & grooming services. {validity}. Let\'s make this year stylish!',
    },
    {
      id: 'joyglow',
      name: 'Customers Joy Glow',
      title: 'Customers Joy Glow',
      tag: 'Loyalty Reward',
      defaultDiscount: 'Complimentary Detan',
      defaultValidity: 'Valid for next 7 days',
      defaultMessage: 'Hello {name}! You bring joy to {shopName}! As a special thank you, enjoy a {discount} on your next haircut or spa service. {validity}. We can\'t wait to welcome you back!',
    },
    {
      id: 'festive_session',
      name: 'Festive Session Special',
      title: 'Festive Session Special',
      tag: 'Grand Seasonal',
      defaultDiscount: 'Flat 30% OFF Combos',
      defaultValidity: 'Valid this festive weekend',
      defaultMessage: 'Hello {name}! Complete festive grooming at {shopName}! Avail {discount} on our Royal Treatment Package. {validity}. Slots are filling fast — reply YES to book!',
    },
    {
      id: 'weekend_recharge',
      name: 'Weekend Recharge Combo',
      title: 'Weekend Recharge Combo',
      tag: 'Weekend Deal',
      defaultDiscount: '₹499 Relaxing Combo',
      defaultValidity: 'Valid Saturday & Sunday',
      defaultMessage: 'Hello {name}! Need a weekend refresh? Head over to {shopName} for our {discount} (Deep Head Massage + Refreshing Hair Wash). {validity}. Unwind in luxury!',
    },
    {
      id: 'personalized',
      name: 'Personalized Special Offer',
      title: 'Personalized VIP Offer',
      tag: 'Personalized',
      defaultDiscount: 'Exclusive 20% OFF',
      defaultValidity: 'Valid for 10 days',
      defaultMessage: 'Dear {name}! An exclusive privilege from {shopName}: Enjoy {discount} on any service of your choice. {validity}. Crafted especially for our valued patron.',
    },
    {
      id: 'custom',
      name: 'Write My Own Message',
      title: 'Custom Promotional Message',
      tag: 'Custom Template',
      defaultDiscount: 'Custom Offer',
      defaultValidity: 'Limited Period',
      defaultMessage: 'Hello {name}! Greetings from {shopName}. We have a special surprise for your next grooming appointment. Reply to book your slot today!',
    },
  ];

  // Active Selected Template for Editing & Sending
  const [selectedTemplate, setSelectedTemplate] = useState<FestivalTemplate>(festivalTemplates[0]);
  const [offerTitle, setOfferTitle] = useState(festivalTemplates[0].title);
  const [offerDiscount, setOfferDiscount] = useState(festivalTemplates[0].defaultDiscount);
  const [offerValidity, setOfferValidity] = useState(festivalTemplates[0].defaultValidity);
  const [offerMessage, setOfferMessage] = useState(festivalTemplates[0].defaultMessage);

  // Customer Selection State for Broadcast
  const [selectedCustPhones, setSelectedCustPhones] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState<'all' | 'vip' | 'regulars'>('all');
  const [showSendModal, setShowSendModal] = useState(false);

  // Select a template
  const handleSelectTemplate = (tpl: FestivalTemplate) => {
    setSelectedTemplate(tpl);
    setOfferTitle(tpl.title);
    setOfferDiscount(tpl.defaultDiscount);
    setOfferValidity(tpl.defaultValidity);
    setOfferMessage(tpl.defaultMessage);
  };

  // Filtered customer list for recipient selection
  const eligibleCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (customerFilter === 'vip') return c.vip;
      if (customerFilter === 'regulars') return (c.visits || 0) >= 2;
      return true;
    });
  }, [customers, customerFilter]);

  // Compute live preview message for display
  const sampleCustomerName = eligibleCustomers[0]?.name || 'Priya Sharma';
  const livePreviewText = useMemo(() => {
    return offerMessage
      .replace(/{name}/g, sampleCustomerName)
      .replace(/{shopName}/g, shopProfile.shopName || 'StyleFleet Salon')
      .replace(/{discount}/g, offerDiscount)
      .replace(/{validity}/g, offerValidity)
      .replace(/{phone}/g, shopProfile.phone || '9876543210');
  }, [offerMessage, sampleCustomerName, shopProfile, offerDiscount, offerValidity]);

  // Send WhatsApp Broadcast
  const handleSendBroadcast = (targetCustomer?: Customer) => {
    const shopName = shopProfile.shopName || 'StyleFleet Salon';
    const shopPhone = shopProfile.phone || '9876543210';

    if (targetCustomer) {
      const cleanPhone = (targetCustomer.phone || '').replace(/\D/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length < 10) {
        showToast(`Customer ${targetCustomer.name} has no valid mobile number.`, 'error');
        return;
      }
      const personalizedMsg = offerMessage
        .replace(/{name}/g, targetCustomer.name)
        .replace(/{shopName}/g, shopName)
        .replace(/{discount}/g, offerDiscount)
        .replace(/{validity}/g, offerValidity)
        .replace(/{phone}/g, shopPhone);

      const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(personalizedMsg)}`;
      window.open(url, '_blank');
      showToast(`WhatsApp offer sent to ${targetCustomer.name}!`);
      return;
    }

    if (selectedCustPhones.length === 0) {
      showToast('Please select at least one customer to broadcast.', 'error');
      return;
    }

    // Launch first recipient
    const firstCust = customers.find((c) => c.phone.slice(-10) === selectedCustPhones[0]);
    if (firstCust) {
      const cleanPhone = firstCust.phone.replace(/\D/g, '').slice(-10);
      const personalizedMsg = offerMessage
        .replace(/{name}/g, firstCust.name)
        .replace(/{shopName}/g, shopName)
        .replace(/{discount}/g, offerDiscount)
        .replace(/{validity}/g, offerValidity)
        .replace(/{phone}/g, shopPhone);

      const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(personalizedMsg)}`;
      window.open(url, '_blank');
      showToast(`WhatsApp broadcast dispatched for ${selectedCustPhones.length} client(s)!`);
      setShowSendModal(false);
    }
  };

  // ================= RECALL MESSAGES DATA (SLIDER / SWIPE) =================
  const recallCampaigns = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inactiveClients = customers.filter((c) => c.status === 'inactive' || (c.visits && c.visits > 0 && Math.random() > 0.5));
    const vipClients = customers.filter((c) => c.vip);

    return [
      {
        id: 'recall_30',
        title: '30 Days Inactive Clients',
        badge: '30+ Days Away',
        desc: 'Gentle check-in for regulars who haven’t visited the salon in the past 30 days.',
        count: Math.max(4, Math.round(customers.length * 0.3)),
        message: 'Hello {name}! We miss you at {shopName}! It\'s been about a month since your last grooming session. Book this week and enjoy Flat 15% OFF your service! Reply to claim.',
      },
      {
        id: 'recall_60',
        title: '60 Days Lapsed Clients',
        badge: '60+ Days Away',
        desc: 'High-incentive win-back message with a complimentary hair wash or head massage voucher.',
        count: Math.max(2, Math.round(customers.length * 0.2)),
        message: 'Hello {name}! We haven\'t seen you in a while at {shopName}. We\'d love to welcome you back with a Complimentary Nourishing Hair Wash + 20% OFF! Reply YES to book your chair.',
      },
      {
        id: 'recall_vip',
        title: 'VIP Regular Check-In',
        badge: 'VIP Loyalty',
        desc: 'Priority chair booking and special appreciation message for your highest-spending patrons.',
        count: vipClients.length || 3,
        message: 'Dear {name}! As our valued VIP regular at {shopName}, priority styling chairs are open for you this weekend. Enjoy a complimentary beard styling or blow-dry on us!',
      },
      {
        id: 'recall_90',
        title: '90+ Days Lost Client Win-Back',
        badge: 'Lost Client Reunion',
        desc: 'Exclusive comeback deal to reconnect with customers who have not booked in 3+ months.',
        count: Math.max(1, Math.round(customers.length * 0.15)),
        message: 'Hello {name}! Long time no see! {shopName} has refreshed its menu with exciting new services. Here is an exclusive 30% Welcome Back Voucher just for you! Reply to reserve.',
      },
    ];
  }, [customers]);

  const handleSendRecall = (campaign: typeof recallCampaigns[0]) => {
    const shopName = shopProfile.shopName || 'StyleFleet Salon';
    const sampleCust = customers.find((c) => c.phone) || { name: 'Valued Client', phone: '9876543210' };
    const cleanPhone = sampleCust.phone.replace(/\D/g, '').slice(-10);
    const msg = campaign.message
      .replace(/{name}/g, sampleCust.name)
      .replace(/{shopName}/g, shopName);

    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showToast(`WhatsApp recall dispatched for "${campaign.title}"!`);
  };

  if (role === 'stylist') {
    return (
      <div className="p-8 rounded-3xl border text-center text-xs bg-[#0F1C36] border-white/10 text-[#A7B0C3] my-6">
        <strong className="text-white text-sm block mb-1">Access Restricted to Salon Owner</strong>
        <span>Bulk WhatsApp broadcasts and promotional marketing are reserved for salon owners.</span>
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-fadeIn pb-16">
      {/* ================= 1. HEADER & SUB-TABS (FESTIVAL OFFERS VS RECALL SLIDER) ================= */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.131-.538-1.839-.765-3.023-2.627-3.114-2.748-.09-.122-.745-.989-.745-1.895 0-.907.472-1.352.641-1.536.17-.184.37-.23.493-.23.123 0 .247.001.355.006.114.005.267-.043.418.32.155.371.531 1.294.577 1.389.047.094.078.204.016.326-.062.123-.093.2-.185.309-.092.109-.194.244-.277.328-.093.094-.19.196-.082.381.108.185.481.794 1.031 1.285.709.632 1.306.828 1.492.92.185.093.293.078.401-.047.108-.124.463-.54.586-.726.123-.185.247-.154.416-.093.17.062 1.079.509 1.264.601.185.093.308.139.354.216.046.078.046.452-.098.857z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                WhatsApp Marketing & Broadcast Hub
              </h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Official API
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
              Festival promotional campaigns, personalized discount broadcasts & client retention sliders
            </p>
          </div>
        </div>

        {/* TWO TABS: FESTIVAL OFFERS VS RECALL SLIDER */}
        <div
          className={`p-1.5 rounded-2xl border flex items-center gap-1 shrink-0 ${
            isDarkMode ? 'bg-[#0B1F44] border-[#2A3858]' : 'bg-slate-100 border-slate-300'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('festival')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'festival'
                ? 'bg-[#D4AF37] text-[#0B1F44]'
                : isDarkMode
                ? 'text-[#A7B0C3] hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Festival Offers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recall')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'recall'
                ? 'bg-[#D4AF37] text-[#0B1F44]'
                : isDarkMode
                ? 'text-[#A7B0C3] hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Recall Messages (Slider)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ======================= TAB 1: FESTIVAL OFFERS ========================== */}
      {/* ========================================================================= */}
      {activeTab === 'festival' && (
        <div className="space-y-6">
          {/* Top Quick Selector: 8 Festival Templates */}
          <div>
            <span className={`text-xs font-bold block mb-2.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Choose Festival & Seasonal Template
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {festivalTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedTemplate.id === tpl.id
                      ? 'bg-[#D4AF37] text-[#0B1F44] border-[#D4AF37] shadow-md'
                      : isDarkMode
                      ? 'bg-[#121B33] border-[#2A3858] text-slate-300 hover:text-white hover:border-[#D4AF37]/50'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-[#D4AF37]'
                  }`}
                >
                  <strong className="text-xs font-black block leading-tight">
                    {tpl.name}
                  </strong>
                  <span className={`text-[10px] mt-2 block font-semibold ${selectedTemplate.id === tpl.id ? 'text-[#0B1F44]/80' : 'text-[#D4AF37]'}`}>
                    {tpl.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2 Columns: Edit Steps on Left, Live WhatsApp Preview & Customers on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Steps to Edit the Message */}
            <div
              className={`lg:col-span-6 p-6 rounded-3xl border space-y-4 ${
                isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Customize Offer Message
                </h3>
                <span className="text-xs font-bold text-[#D4AF37]">
                  {selectedTemplate.name}
                </span>
              </div>

              {/* Step 1: Offer Title */}
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Offer Title
                </label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="e.g. Diwali Festive Spark"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Step 2: Discount & Validity Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Discount / Flat Offer
                  </label>
                  <input
                    type="text"
                    value={offerDiscount}
                    onChange={(e) => setOfferDiscount(e.target.value)}
                    placeholder="e.g. Flat 25% OFF"
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold outline-none ${
                      isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Validity Period
                  </label>
                  <input
                    type="text"
                    value={offerValidity}
                    onChange={(e) => setOfferValidity(e.target.value)}
                    placeholder="e.g. Valid till Nov 15"
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold outline-none ${
                      isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Step 3: Message Text Body (with {name} tag already inserted) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Message Template Body
                  </label>
                  <span className="text-[10px] text-[#D4AF37] font-semibold">
                    &#123;name&#125; tag auto-personalized per client
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs font-medium outline-none resize-none leading-relaxed ${
                    isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Supported dynamic variables: <code className="text-[#D4AF37]">&#123;name&#125;</code>, <code className="text-[#D4AF37]">&#123;shopName&#125;</code>, <code className="text-[#D4AF37]">&#123;discount&#125;</code>, <code className="text-[#D4AF37]">&#123;validity&#125;</code>, <code className="text-[#D4AF37]">&#123;phone&#125;</code>.
                </p>
              </div>

              {/* Action Buttons: Choose Customers & Quick Send */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSendModal(true)}
                  className="flex-1 py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-transform active:scale-95"
                >
                  <svg className="w-4 h-4 text-[#0B1F44]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Select Customers & Broadcast</span>
                </button>
              </div>
            </div>

            {/* Right Column: Real-Time WhatsApp Chat Bubble Preview */}
            <div
              className={`lg:col-span-6 p-6 rounded-3xl border space-y-4 flex flex-col justify-between ${
                isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className={`text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      WhatsApp Live Message Preview
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Client: {sampleCustomerName}
                  </span>
                </div>

                {/* WhatsApp Chat Simulation Card */}
                <div className="mt-4 p-4 rounded-2xl bg-[#0b141a] border border-[#1f2c34] text-white shadow-inner space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                      SF
                    </div>
                    <div>
                      <strong className="text-xs font-bold block">{shopProfile.shopName || 'StyleFleet Salon'}</strong>
                      <span className="text-[10px] text-emerald-400">Verified Business Account</span>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-[#005c4b] p-3.5 rounded-2xl rounded-tl-none max-w-sm text-xs leading-relaxed shadow-sm">
                    <p className="whitespace-pre-line text-slate-100">
                      {livePreviewText}
                    </p>
                    <div className="flex justify-end items-center gap-1 mt-1 text-[9px] text-emerald-200/70">
                      <span>12:00 PM</span>
                      <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Quick Send to First 3 Customers */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <span className={`text-[11px] font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Quick Send to Client:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {eligibleCustomers.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSendBroadcast(c)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                        isDarkMode ? 'bg-[#0B1F44] border-[#2A3858] text-white hover:border-emerald-500' : 'bg-slate-100 border-slate-300 text-slate-800 hover:border-emerald-500'
                      }`}
                    >
                      <span>{c.name}</span>
                      <svg className="w-3 h-3 fill-emerald-400" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.131-.538-1.839-.765-3.023-2.627-3.114-2.748-.09-.122-.745-.989-.745-1.895 0-.907.472-1.352.641-1.536.17-.184.37-.23.493-.23.123 0 .247.001.355.006.114.005.267-.043.418.32.155.371.531 1.294.577 1.389.047.094.078.204.016.326-.062.123-.093.2-.185.309-.092.109-.194.244-.277.328-.093.094-.19.196-.082.381.108.185.481.794 1.031 1.285.709.632 1.306.828 1.492.92.185.093.293.078.401-.047.108-.124.463-.54.586-.726.123-.185.247-.154.416-.093.17.062 1.079.509 1.264.601.185.093.308.139.354.216.046.078.046.452-.098.857z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ======================= TAB 2: RECALL MESSAGES (SLIDER) ================= */}
      {/* ========================================================================= */}
      {activeTab === 'recall' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Client Recall & Retention Carousel
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-[#737D92]' : 'text-slate-500'}`}>
                Swipe or slide through re-engagement campaigns targeting inactive, VIP & lapsed customers
              </p>
            </div>
          </div>

          {/* Swipe / Slider Horizontal Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-2">
            {recallCampaigns.map((camp) => (
              <div
                key={camp.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 shadow-sm transition-all ${
                  isDarkMode ? 'bg-[#121B33] border-[#2A3858] hover:border-[#D4AF37]/50' : 'bg-white border-slate-200 hover:border-[#D4AF37]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold uppercase">
                      {camp.badge}
                    </span>
                    <span className="text-xs font-black text-[#D4AF37]">
                      {camp.count} Clients
                    </span>
                  </div>

                  <h4 className={`text-sm font-black mt-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {camp.title}
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                    {camp.desc}
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-black/20 border border-white/5 text-[11px] text-slate-300 leading-snug">
                    <p className="line-clamp-3 italic">
                      &quot;{camp.message.replace(/{shopName}/g, shopProfile.shopName || 'StyleFleet')}&quot;
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendRecall(camp)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-transform active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.131-.538-1.839-.765-3.023-2.627-3.114-2.748-.09-.122-.745-.989-.745-1.895 0-.907.472-1.352.641-1.536.17-.184.37-.23.493-.23.123 0 .247.001.355.006.114.005.267-.043.418.32.155.371.531 1.294.577 1.389.047.094.078.204.016.326-.062.123-.093.2-.185.309-.092.109-.194.244-.277.328-.093.094-.19.196-.082.381.108.185.481.794 1.031 1.285.709.632 1.306.828 1.492.92.185.093.293.078.401-.047.108-.124.463-.54.586-.726.123-.185.247-.154.416-.093.17.062 1.079.509 1.264.601.185.093.308.139.354.216.046.078.046.452-.098.857z" />
                  </svg>
                  <span>Broadcast Recall</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: SELECT CUSTOMERS TO BROADCAST ================= */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`p-6 rounded-3xl border max-w-lg w-full space-y-4 shadow-2xl ${
              isDarkMode ? 'bg-[#1A2746] border-[#2A3858] text-[#F8FAFC]' : 'bg-white border-[#E2E8F0] text-[#1F2937]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className={`text-base font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Select Recipients for &quot;{offerTitle}&quot;
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-slate-600'}`}>
                  Choose clients from your CRM roster to dispatch WhatsApp offers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="w-7 h-7 rounded-xl border border-white/10 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filter Chips: All, VIP, Regulars */}
            <div className="flex items-center gap-2 text-xs">
              {(['all', 'vip', 'regulars'] as const).map((flt) => (
                <button
                  key={flt}
                  type="button"
                  onClick={() => setCustomerFilter(flt)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                    customerFilter === flt
                      ? 'bg-[#D4AF37] text-[#0B1F44]'
                      : isDarkMode
                      ? 'bg-[#121B33] text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {flt} ({eligibleCustomers.length})
                </button>
              ))}
            </div>

            {/* Customers Checkbox List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
              {eligibleCustomers.map((c) => {
                const clean = c.phone.replace(/\D/g, '').slice(-10);
                const isSelected = selectedCustPhones.includes(clean);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCustPhones(selectedCustPhones.filter((p) => p !== clean));
                      } else {
                        setSelectedCustPhones([...selectedCustPhones, clean]);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-[#0B1F44] border-[#D4AF37]'
                          : 'bg-amber-50 border-[#D4AF37]'
                        : isDarkMode
                        ? 'bg-[#121B33] border-white/5'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <strong className={`block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{c.name}</strong>
                      <span className="text-[10px] text-slate-400">+91 {clean}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedCustPhones(eligibleCustomers.map((c) => c.phone.replace(/\D/g, '').slice(-10)))}
                className="px-3 py-2 rounded-xl border border-white/10 text-xs font-semibold cursor-pointer"
              >
                Select All ({eligibleCustomers.length})
              </button>
              <button
                type="button"
                onClick={() => handleSendBroadcast()}
                className="flex-1 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] font-black text-xs cursor-pointer shadow-md"
              >
                Broadcast to {selectedCustPhones.length} Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};