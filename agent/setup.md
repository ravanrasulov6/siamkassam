# SIAM Kassam — Project Setup & Roadmap

> **Last Updated:** 2026-03-10  
> **Status:** � Phase 2 Complete — Ready for Phase 3 Execution

---

## Project Overview

**SIAM Kassam** is a modern SaaS business management platform designed for small and medium retail businesses in Azerbaijan.

It provides:
- **POS** (Point of Sale) — fast, mobile-first sales interface
- **Inventory Management** — product catalog, stock tracking, low stock alerts
- **Debt & Credit Tracking** — customer/supplier debt ledger with payment history
- **Customer Management** — CRM basics, purchase history, credit limits
- **Sales Analytics** — revenue charts, product performance, business KPIs
- **Financial Reporting** — daily/monthly reports, profit/loss, expense tracking

**Primary goal:** Create a simple, fast, and scalable alternative to 1C-style retail systems.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18+ (Vite) | Component-based SPA |
| **Routing** | React Router v6 | Client-side navigation |
| **Styling** | Vanilla CSS (Design System) | Responsive, mobile-first |
| **Backend** | Supabase | Auth, Database, Storage, RLS |
| **Database** | PostgreSQL 17 | Data persistence |
| **Architecture** | Multi-tier (non-serverless) | Scalable SaaS structure |
| **Deployment** | TBD | Production hosting |

---

## Supabase Project

| Property | Value |
|----------|-------|
| **Project ID** | `wwrahddgifggepxjjvxg` |
| **Project Name** | siamkassam |
| **Region** | ap-northeast-1 |
| **Status** | ✅ ACTIVE_HEALTHY |
| **PostgreSQL** | v17.6 |
| **Tables Created** | 0 (awaiting Phase 0) |
| **Migrations Applied** | 0 (awaiting Phase 0) |

---

## Active Skills

Loaded from [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills):

### Product & Planning
| Skill | Path | Purpose |
|-------|------|---------|
| Brainstorming | `agent/skills/brainstorming/SKILL.md` | Product ideation and feature exploration |
| Writing Plans | `agent/skills/writing-plans/SKILL.md` | Structured development plans |

### Design & UX
| Skill | Path | Purpose |
|-------|------|---------|
| UI/UX Pro Max | `agent/skills/ui-ux-pro-max/SKILL.md` | High-quality SaaS UX standards |
| Antigravity Design Expert | `agent/skills/antigravity-design-expert/SKILL.md` | Premium interactive UI patterns |

### Architecture
| Skill | Path | Purpose |
|-------|------|---------|
| Architecture Patterns | `agent/skills/architecture-patterns/SKILL.md` | Clean architecture and modular structure |
| Senior Architect | `agent/skills/senior-architect/SKILL.md` | System scalability and SaaS strategy |

### Development
| Skill | Path | Purpose |
|-------|------|---------|
| Frontend Design | `agent/skills/frontend-design/SKILL.md` | Production-ready React architecture |
| API Design Principles | `agent/skills/api-design-principles/SKILL.md` | Database and API design |

---

## Core System Modules

```
┌──────────────────────────────────────────────────┐
│  📊 Dashboard     — KPIs, charts, quick actions  │
│  🛒 Sales / POS   — Quick sale, cart, checkout   │
│  📦 Products      — Catalog, categories, stock   │
│  👥 Customers     — CRM, history, debt limits    │
│  💳 Debts         — Receivable/payable tracking  │
│  📈 Reports       — Revenue, profit, analytics   │
│  ⚙️ Settings      — Business, users, roles       │
└──────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 0 — Foundation Setup ✅
**Objective:** Initialize project, connect Supabase, create design system.

| Task | Status |
|------|--------|
| React + Vite project init | ✅ Completed |
| Supabase client connection | ✅ Completed |
| CSS design system tokens | ✅ Completed |
| Project folder structure | ✅ Completed |
| DB: `businesses` + `profiles` tables | ✅ Completed |
| RLS policies for multi-tenancy | ✅ Completed |

**Database tables:** `businesses`, `profiles`  
**Expected duration:** ~2 hours

---

### Phase 1 — Authentication + Onboarding ⏳
**Objective:** User registration, login, and multi-step business onboarding flow.

| Task | Status |
|------|--------|
| Email/Password auth (Supabase Auth) | ✅ Completed |
| Multi-step onboarding carousel (5 steps) | ✅ Completed |
| Business profile creation | ✅ Completed |
| Protected routes | ✅ Completed |
| Auth context + state management | ✅ Completed |

**Onboarding flow:** Welcome → Name → Store Info → Scale → Complete  
**Expected duration:** ~4 hours

---

### Phase 2 — Product & Inventory MVP ⬜
**Objective:** Product catalog, category management, stock tracking.

| Task | Status |
|------|--------|
| Category CRUD | ⬜ Not started |
| Product CRUD (name, barcode, prices, stock) | ⬜ Not started |
| Stock adjustment with logging | ⬜ Not started |
| Low stock alerts | ⬜ Not started |
| Product search and filter | ⬜ Not started |

**Database tables:** `categories`, `products`, `product_stock_log`  
**Expected duration:** ~6 hours

---

### Phase 8 — Performance Optimization ⚡ ✅
**Objective:** Solve lag, freezing, and loading hangs through architectural and database improvements.

| Task | Status |
|------|--------|
| **Lazy Loading**: Route-based code splitting | ✅ Completed |
| **Context Memoization**: useMemo for global state | ✅ Completed |
| **DB Optimization**: Indexes for sales/expenses | ✅ Completed |
| **Parallel Data**: Promise.all for dashboard | ✅ Completed |
| **GPU Acceleration**: CSS 'will-change' hints | ✅ Completed |

**Expected duration:** ~4 hours

---

### Phase 3 — Sales (POS) + Debt Tracking ✅
**Objective:** POS interface, cart management, credit sales, debt ledger.

| Task | Status |
|------|--------|
| POS quick-sale interface | ✅ Completed |
| Cart management + checkout | ✅ Completed |
| Payment methods (cash/card/credit) | ✅ Completed |
| Customer CRUD | ✅ Completed |
| Debt creation on credit sales | ✅ Completed |
| Debt payment recording | ✅ Completed |
| Supplier management + debts | ✅ Completed |

**Database tables:** `customers`, `suppliers`, `sales`, `sale_items`, `debt_transactions`  
**Expected duration:** ~8 hours

---

### Phase 4 — Dashboard & Analytics ✅
**Objective:** Real-time KPIs, charts, revenue analytics, expense tracking.

| Task | Status |
|------|--------|
| KPI cards (revenue, debts, products, stock) | ✅ Completed |
| Revenue chart (daily/weekly/monthly) | ✅ Completed |
| Top selling products | ✅ Completed |
| Recent sales list | ✅ Completed |
| Debt summary (top debtors) | ✅ Completed |
| Expense tracking | ✅ Completed |

**Database tables:** `expenses` + analytics views  
**Expected duration:** ~5 hours

---

### Phase 5 — Reports, Settings & Polish ✅
**Objective:** Detailed reports, settings, employee management, production readiness.

| Task | Status |
|------|--------|
| Reports page (date-range, export) | ✅ Completed |
| Settings page (business + user profile) | ✅ Completed |
| Employee management (invite, roles) | ✅ Completed |
| Responsive navigation (sidebar + bottom nav) | ✅ Completed |
| Loading/error/empty states | ✅ Completed |
| Performance optimization | ✅ Completed |

**Expected duration:** ~5 hours

---

### Phase 6 — UI/UX Polish & Feature Completion ✅
**Objective:** Address all non-functional buttons across the app, fix navigation loopholes, and finalize MVP mobile usage.

| Task | Status |
|------|--------|
| **Global Navigation:** Implement Mobile Bottom Navigation Bar (Home, Satış, Əlavə Et, Borclar, Menyu) | ✅ Completed |
| **Dashboard:** Implement Date Filtering logic (Bu Həftə, Bu Ay, Seçilmiş Aralıq) | ✅ Completed |
| **Settings:** Make "Yeni İstifadəçi Dəvət Et" (Invite User / Cashier) button functional | ✅ Completed |
| **Settings:** Fully operational "Receipt Settings" (Logo uploading, footer text for thermal printers) | ✅ Completed |
| **Reports (Hesabatlar):** Connect "Export to Excel/PDF" buttons for data downloading | ✅ Completed |
| **Products:** Make categories dynamic and fully link "Kateqoriya" filters/managers | ✅ Completed |
| **Debts & Customers:** Advanced debt tracking UI (Partial payment validation, detailed receipt view) | ✅ Completed |
| **General UI:** Complete all missing empty states, loading states, and error alerts globally | ✅ Completed |

**Expected duration:** ~6 hours

---

### Phase 7 — AI Automations & Futuristic Features 🚀 ✅
**Objective:** Transform the app into a next-generation SaaS using GenAI, Voice, and Computer Vision.

| Task | Status |
|------|--------|
| **Voice-to-Inventory (Səsli Anbar Girişi)**: Speak "İphone 17 pro aldım 350 manata" -> AI detects product, cost, and creates a pending stock entry for Admin approval. | ✅ Completed |
| **Optical Debt Digitization (Borc Dəftərinin Rəqəmsallaşdırılması)**: Take a photo of a physical "Borc Dəftəri" -> AI extracts names, amounts, dates and populates the `debts` table. | ✅ Completed |
| **Smart Expense Scanning (Ağıllı Çek Oxuyucu)**: Upload a receipt -> AI categorizes the expense and records it automatically. | ✅ Completed |
| **AI Business Assistant (Süni Zəka Məsləhətçisi)**: Chatbot for the owner (e.g., "Hansı məhsul mənə zərər gətirir?", "Kimin borcu daha çox gecikir?"). | ✅ Completed |

**Database tables (Phase 7):** `pending_ai_entries` (for approval queue)
**Edge Function:** `ai-process` (Rule-based MVP + Gemini AI Vision/Text)
**Expected duration:** ~10 hours

---

## Frontend Architecture

```
src/
├── components/
│   ├── ui/           # Button, Input, Card, Modal, Badge, DataTable
│   ├── layout/       # Sidebar, Header, MobileNav, AppLayout
│   ├── pos/          # ProductSearch, Cart, CartItem, CheckoutPanel
│   └── dashboard/    # KPICard, RevenueChart, TopProducts
├── pages/
│   ├── auth/         # LoginPage, RegisterPage
│   ├── onboarding/   # OnboardingFlow + step components
│   ├── dashboard/    # DashboardPage
│   ├── products/     # ProductsPage, ProductFormPage
│   ├── sales/        # POSPage
│   ├── customers/    # CustomersPage, CustomerDetailPage
│   ├── debts/        # DebtsOverview
│   ├── reports/      # ReportsPage
│   └── settings/     # SettingsPage, EmployeesPage
├── hooks/            # useAuth, useBusiness, useProducts, etc.
├── services/         # Supabase service layer per module
├── context/          # AuthContext, BusinessContext
├── utils/            # Formatters, validators, helpers
├── styles/           # Design system CSS
└── lib/
    └── supabase.js   # Supabase client init
```

---

## Database Schema Summary

| Table | Phase | Purpose |
|-------|-------|---------|
| `businesses` | 0 | Multi-tenant root entity |
| `profiles` | 0 | User profiles (extends auth.users) |
| `categories` | 2 | Product categories |
| `products` | 2 | Product catalog |
| `product_stock_log` | 2 | Stock change audit trail |
| `customers` | 3 | Customer records |
| `suppliers` | 3 | Supplier records |
| `sales` | 3 | Sale transactions |
| `sale_items` | 3 | Line items per sale |
| `debt_transactions` | 3 | Debt/payment ledger |
| `expenses` | 4 | Business expenses |

**Total: 11 tables across 4 phases**

---

## Navigation

### Desktop → Left Sidebar
📊 Dashboard → 🛒 Satış → 📦 Məhsullar → 👥 Müştərilər → 💳 Borclar → 📈 Hesabatlar → ⚙️ Parametrlər

### Mobile → Bottom Tab Bar (5 tabs)
📊 Home | 🛒 Satış | ➕ Əlavə et | 💳 Borclar | ⋯ Ətraflı

---

## Development Principles

1. **Mobile-first responsive design** — every screen starts from mobile viewport
2. **Multi-tenant by default** — RLS on every table, business_id isolation
3. **Service layer pattern** — no direct Supabase calls from components
4. **Progressive complexity** — MVP first, polish later
5. **Real data validation** — test with multiple users before marking complete
6. **Each phase verified before next** — no skipping ahead

---

## Future Roadmap (Post-MVP)

- Barcode scanner (camera-based)
- Multi-language (AZ/EN/RU)
- Receipt printing (thermal)
- WhatsApp debt reminders
- Subscription billing (SaaS model)
- Multi-branch / multi-warehouse
- AI demand forecasting
- Offline mode (PWA + sync)
