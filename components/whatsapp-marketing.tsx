'use client';

import React from 'react';
import { useSalon } from '@/components/SalonContext';

export const WhatsAppMarketingView: React.FC = () => {
  const { isDarkMode, showToast } = useSalon();

  const campaigns = [
    {
      title: 'Weekend Glow Spa Offer',
      desc: 'Flat 20% off on all Hair Spa & Hydra Facials this Saturday.',
      tag: 'Promotion',
      audience: 'All Registered Clients (42)',
    },
    {
      title: 'VIP Loyalty Bonus',
      desc: 'Reward top spending clients with a complimentary Beard Trim or Head Massage.',
      tag: 'Loyalty',
      audience: 'VIP Clients Only (12)',
    },
    {
      title: 'Inactive Client Winback',
      desc: 'Miss you message sent to clients who have not visited in 30+ days.',
      tag: 'Retention',
      audience: 'Inactive 30+ Days (18)',
    },
    {
      title: 'Festival Grooming Combo',
      desc: 'Haircut + Beard Styling + D-Tan cleanup at ₹999 combo price.',
      tag: 'Combo',
      audience: 'All Registered Clients (42)',
    },
  ];

  return (
    <section className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div
        className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isDarkMode ? 'bg-[#121B33] border-[#2A3858]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center font-black">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
              WhatsApp Salon Marketing & Client Retention
            </h2>
            <p className={`text-xs ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
              Send personalized promotional broadcasts and festive re-engagement campaigns directly to clients
            </p>
          </div>
        </div>
      </div>

      {/* Campaigns Grid - 4 Boxes in One Line Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {campaigns.map((campaign, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-lg ${
              isDarkMode
                ? 'bg-[#121B33] border-[#2A3858] hover:border-[#D4AF37]/40'
                : 'bg-white border-slate-200 hover:border-[#D4AF37]/60 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider">
                  {campaign.tag}
                </span>
                <span className={`text-[10px] font-medium ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
                  {campaign.audience}
                </span>
              </div>
              <h3 className={`text-base font-bold mt-3 ${isDarkMode ? 'text-white' : 'text-[#1F2937]'}`}>
                {campaign.title}
              </h3>
              <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? 'text-[#A7B0C3]' : 'text-[#374151]'}`}>
                {campaign.desc}
              </p>
            </div>

            <button
              onClick={() => showToast(`Campaign "${campaign.title}" queued for clients via WhatsApp Business!`, 'success')}
              className="py-3 px-4 rounded-2xl bg-[#D4AF37] hover:bg-[#C59F2E] text-[#0B1F44] text-xs font-extrabold shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all w-full cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#0B1F44]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Broadcast via WhatsApp Business</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
