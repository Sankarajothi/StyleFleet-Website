# StyleFleet Web OS

StyleFleet is a modern salon management and express billing web application built with Next.js 14, Tailwind CSS, and Supabase. It connects to the StyleFleet cloud backend and shares architecture, multi-tenancy rules, and role-based access with the official StyleFleet Android app.

---

## ✨ Features

- **Multi-Tenant Architecture:** Every salon's data is strictly scoped by `shop_id`.
- **Role-Based Access Control:**
  - **Salon Owners:** Full access to all salon analytics, all-time bills, expenses, staff roster, catalog, and settings.
  - **Stylists:** Restricted strictly to today's appointments, today's chair receipts, and assigned clients. Historical financials and owner settings are protected.
- **Express Billing & Invoicing:** Minor-unit paise financial precision (`total_minor`, `paid_amount_minor`, `due_amount_minor`), line items snapshotting, and multi-mode payment reconciliation (UPI, Cash, Card).
- **Accounts & P&L Ledger:** Real-time Gross Sales, Total Expenses, Operating vs. Non-Operating payouts, Net Profit, Margin %, and full CSV export.
- **Yesterday vs. Today Analytics:** Daily comparative breakdown by payment mode.
- **2Factor SMS Authentication:** Secure OTP delivery and verification.
- **Luxury Royal Obsidian Dark Theme:** `#0B1F44` background, `#121B33` card surface, and `#D4AF37` champagne gold accents.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL= your_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
TWO_FACTOR_API_KEY=your_2factor_api_key
TWO_FACTOR_TEMPLATE_NAME=your_template
```

### 3. Installation & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend / Database:** [Supabase](https://supabase.com/)
- **Icons:** Lucide React
- **SMS Gateway:** 2Factor SMS API
