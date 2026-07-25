# ORTHO-PAY — Agent Handoff Document

## Project Overview

ORTHO-PAY is an escrow payment platform built with **Next.js 16 (App Router)**, **Supabase** (PostgreSQL), and a custom design system. Users send money via `$ORTHO` paytags; every transaction is held in escrow and reviewed by admin before release.

- **Live URL:** https://www.ortho-m8.com
- **Vercel Project:** https://vercel.com/broks-projects-90e1eaf4/sivaa-app
- **Framework:** Next.js 16.2.11 (Turbopack)
- **Database:** Supabase (PostgreSQL)
- **Storage:** GitHub-based storage (`src/lib/github-storage.ts`)
- **Legal pages:** `/terms`, `/privacy`, `/cookies` (GDPR/NDPR compliant)
- **Auth:** Custom JWT-based auth with Supabase (`src/lib/auth.ts`)

---

## Key Docs to Read

| Doc | Path | Purpose |
|-----|------|---------|
| Design System | `DESIGN.md` (repo root) | Full design tokens, color system, component specs |
| Implementation Plan | `implementation_plan.md` (repo root) | Feature roadmap and implementation status |
| SQL Schema | `sivaa-app/sql/deposits_withdrawals.sql` | Deposits & withdrawals table definitions |
| SQL Migration | `sivaa-app/sql/add_avatar_url.sql` | Adds `avatar_url` column to profiles |
| Next.js Docs | `sivaa-app/node_modules/next/dist/docs/` | **IMPORTANT:** Next.js 16 has breaking changes — read before writing code |

---

## Project Structure

```
sivaa-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout — theme init, favicon swap scripts
│   │   ├── page.tsx                # Landing page (hero video, features, pricing, FAQ, footer with legal links)
│   │   ├── terms/page.tsx          # Terms & Conditions (GDPR/NDPR compliant)
│   │   ├── privacy/page.tsx        # Privacy Policy (GDPR/NDPR compliant)
│   │   ├── cookies/page.tsx        # Cookie Policy (GDPR compliant)
│   │   ├── globals.css             # Global CSS imports
│   │   ├── admin/page.tsx          # Admin dashboard (users, deposits, fees, withdrawals)
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # User dashboard (balance, transactions, send money)
│   │   │   ├── portfolio/page.tsx  # Transaction history + 7-day chart
│   │   │   ├── deposit/page.tsx    # Deposit flow (payment methods, receipt upload)
│   │   │   ├── withdraw/page.tsx   # Withdrawal flow
│   │   │   ├── settings/page.tsx   # Profile, KYC, avatar upload
│   │   │   ├── request/page.tsx    # Payment requests
│   │   │   └── notifications/page.tsx
│   │   └── api/v1/
│   │       ├── auth/               # login, logout, register, me, verify-otp, resend-otp
│   │       ├── admin/balance-adjust/  # Admin manual credit/debit
│   │       ├── deposits/           # GET (list), POST (create), PATCH (approve/reject)
│   │       ├── withdrawals/        # GET (list), POST (create), PATCH (approve/reject)
│   │       ├── wallet/             # history, freeze
│   │       ├── payments/           # list, 2fa, approve, reject
│   │       ├── users/              # list, [id] (admin manage)
│   │       ├── fees/               # list, manage (CRUD)
│   │       ├── kyc/                # upload, manage
│   │       ├── notifications/      # list, mark-all-read
│   │       ├── payment-methods/    # list
│   │       ├── payment-requests/   # list, manage
│   │       ├── profile/            # user self-update (avatar_url)
│   │       ├── storage/            # upload, file
│   │       ├── receipts/           # list
│   │       ├── reports/            # fraud, revenue
│   │       └── chats/              # messages, upload
│   ├── components/
│   │   ├── ThemeProvider.tsx       # Light/dark theme context (active provider)
│   │   ├── ThemeToggle.tsx         # Sun/moon toggle button
│   │   ├── BrandIcon.tsx           # Reusable SVG icons (CashApp, BTC, PayPal, Venmo)
│   │   ├── ErrorBoundary.tsx
│   │   ├── Toast.tsx
│   │   └── DashboardShared.tsx     # EmptyState, LoadingState shared components
│   ├── lib/
│   │   ├── auth.ts                 # requireAuth, requireAdmin (JWT + Supabase)
│   │   ├── github-storage.ts       # File storage via GitHub repo
│   │   ├── supabase/server.ts      # createSupabaseServerClient
│   │   ├── chat.ts                 # Chat utilities
│   │   └── utils.ts                # Helpers (formatCurrency, etc.)
│   └── ui/                         # Design system (CSS-only)
│       ├── index.css               # Imports all UI CSS
│       ├── foundation/             # Tokens: colors, spacing, typography, shadows
│       ├── themes/                 # light.css, dark.css (high-contrast.css removed)
│       ├── components/             # buttons, cards, inputs, navigation CSS
│       ├── motion/                 # transitions, animations
│       └── accessibility/          # focus, keyboard, screen-reader, contrast
├── public/
│   ├── orthopay-lightmode.svg      # App icon (light mode)
│   ├── orthopay-darkmode.svg       # App icon (dark mode)
│   ├── manifest.webmanifest        # PWA manifest
│   └── favicon.svg                 # Legacy favicon (unused now)
└── sql/
    ├── deposits_withdrawals.sql    # Table schemas
    └── add_avatar_url.sql          # Migration
```

---

## Database Schema (Key Tables)

- **profiles** — user_id, siva_tag, name, email, kyc_status, country, avatar_url, marketing_consent
- **wallets** — wallet_id, user_id, total_received, total_sent, locked_balance, status (active/frozen/suspended)
- **wallet_transactions** — transaction_id, wallet_id, amount (signed), type (adjust_in/adjust_out/payment_out/payment_in/escrow_hold/escrow_release), description, created_at
- **deposits** — deposit_id, user_id, wallet_id, amount, method, reference, status (pending/approved/rejected), receipt_url, reviewed_by, reviewed_at
- **withdrawals** — withdrawal_id, user_id, wallet_id, amount, withdrawal_type, reference, status, reviewed_by, reviewed_at
- **payments** — payment_id, sender_id, receiver_id, gross_amount, fee_amount, net_amount, status (escrow_held/completed/reversed), reference, 2fa_verified
- **fee_rules** — fee_rule_id, tier, min_amount, max_amount, fee_percentage, fee_fixed
- **payment_methods** — method_id, label, icon_key, fee_percentage, fee_fixed, min_amount, max_amount, config
- **notifications** — notification_id, user_id, title, message, type, read
- **audit_logs** — log_id, actor_id, actor_type, action, table_name, record_id, old_value, new_value
- **kyc_documents** — document_id, user_id, document_type, file_url, status

**Balance formula:** `available = wallets.total_received - wallets.total_sent`

---

## Recent Changes

### Phase 1: Transaction History & Balance Fixes (Previous Session)

#### 1. Fixed: Deposit approval not updating user balance
- **Root cause:** `/api/v1/wallet/history` only selected `wallet_id` and returned `{ transactions }` — no wallet object. Dashboard checked `data?.wallet` which was always `undefined`.
- **Fix:** Updated `src/app/api/v1/wallet/history/route.ts` to select `wallet_id, total_received, total_sent, locked_balance, status` and return `{ wallet, transactions }`.
- **Also:** Added error checking on wallet update in `src/app/api/v1/deposits/route.ts` (PATCH approve) and `src/app/api/v1/admin/balance-adjust/route.ts` to catch silent Supabase failures.

#### 2. Fixed: Transaction history missing deposits, withdrawals, and admin adjustments
- **Dashboard (`src/app/dashboard/page.tsx`):** Already fetched deposits + withdrawals. Added wallet_transactions (adjust_in/adjust_out) mapping from wallet history API response. Added `adjustment_in`/`adjustment_out` types to Transaction interface, formatAmount, and rendering.
- **Portfolio (`src/app/dashboard/portfolio/page.tsx`):** Previously only fetched `/api/v1/payments`. Now also fetches deposits, withdrawals, and wallet_transactions. Updated chart, filter, formatAmount, and rendering to handle all types.

#### 3. Removed high-contrast theme
- Removed `high-contrast` from `Theme` type in `src/ui/themes/theme-provider.tsx`
- Removed `@import './themes/high-contrast.css'` from `src/ui/index.css`
- Removed `[data-theme='high-contrast']` rules from `src/ui/components/buttons/theme-toggle.css`
- Cleaned up comments in `src/ui/accessibility/contrast.css`
- Note: `src/ui/themes/high-contrast.css` file still exists but is no longer imported. Can be deleted.
- Note: `src/components/ThemeProvider.tsx` is the **active** provider (imported in layout.tsx). `src/ui/themes/theme-provider.tsx` is a legacy duplicate not imported anywhere.

#### 4. Theme-aware favicon/app icons
- `src/app/layout.tsx` metadata references `orthopay-lightmode.svg` / `orthopay-darkmode.svg` with `prefers-color-scheme` media queries
- Inline scripts swap favicon on theme change via MutationObserver on `data-theme`
- `public/manifest.webmanifest` for PWA support

---

### Phase 2: Landing Page Redesign — Dashboard-Aligned Dark Theme (Recent Sessions)

Complete redesign of `src/app/page.tsx` to match the dashboard's dark theme. Replaced the previous Anton/Condiment/neon-green/liquid-glass design with a unified system.

#### Unified Design System (across landing + auth + dashboard)
- **Fonts:** Nunito (`font-display`) for headings, `system-ui` (`font-body`) for body text — matches dashboard typography
- **Colors:** `#0a0a0a` (page bg), `#1a1a1a` (card bg), `#262626` (borders), `#ffffff` (text), `rgba(255,255,255,0.5-0.7)` (muted text), `var(--color-primary)` (blue `#3b82f6` for accents/buttons)
- **Card style:** Rounded corners (`rounded-2xl`/`rounded-3xl`), `#1a1a1a` bg, `1px solid #262626` border — no glassmorphism
- **No liquid glass:** Removed `.liquid-glass` CSS class usage. No backdrop-blur, no gradient borders.
- **No neon green:** Replaced `#6FFF00` with `var(--color-primary)` (blue) everywhere
- **No space bg:** Replaced `#010828` with `#0a0a0a`

#### Landing Page Sections (5 total)
1. **Hero** — Full-viewport video background (CloudFront), dark card navbar with nav links, bold heading "Send money safely with escrow protection" (font-weight 900), `$ORTHO paytags` overlay positioned below hero text (not overlapping), CTA buttons (blue primary + dark secondary), trust badges, mobile drawer menu
2. **About/Intro** — Video background, "What we do" heading with `escrow` accent, 3-column key points grid (Buyer Protection, Seller Confidence, Global Access)
3. **Features Grid + How It Works** — 3-column dark card grid with video thumbnails, sponsor logos (Cash App, Venmo, PayPal, Stripe, Binance, Bitcoin), 3-step how-it-works section
4. **Pricing** — 3-tier pricing cards (Personal $0, Business $29, Enterprise $199) with feature lists
5. **CTA/Final** — Full-width video with "SEND MONEY. RECEIVE MONEY. TRUST THE PROCESS." text overlay, footer with legal page links

#### Video Lazy Loading
- `LazyVideo` component using `IntersectionObserver` — only loads video source when element is within 200px of viewport. Hero video loads eagerly (`eager` prop), all others lazy load.
- Improves landing page performance significantly by deferring 5+ video downloads.

#### Social Links Removed
- Removed all social icon blocks from landing page (desktop hero, mobile hero, CTA bottom-left)
- Removed `Mail`, `AtSign`, `Code` icon imports from `lucide-react`
- Social links (mailto, Twitter, GitHub) no longer appear anywhere on the landing page

#### Theme Toggle Removed from Landing
- Removed `<ThemeToggle />` component and its import from `src/app/page.tsx`
- Theme toggle now only exists in the dashboard (as intended)

#### Hero Text Fixes
- `$ORTHO paytags` overlay repositioned from `top-0` (overlapping heading) to `-bottom-8 sm:-bottom-10 lg:-bottom-12` (below heading)
- Hero heading boldness increased: added `font-black` class and `fontWeight: 900` inline style

#### Footer Updated
- Added legal page links: Terms, Privacy, Cookies (alongside How it works, Pricing, FAQ, Dashboard)
- Footer links use `flex-wrap` for responsive wrapping

#### Files Modified
- `src/app/page.tsx` — Complete rewrite (~440 lines, dashboard-aligned dark theme, lazy video, no social links, no theme toggle)
- `src/app/layout.tsx` — Removed USA & England from metadata description (now Global)

---

### Phase 3: Legal Pages — GDPR/NDPR Compliance (Recent Session)

Created three legal pages with full GDPR and NDPR compliant content, styled to match the unified dark theme.

#### Pages Created
- **`src/app/terms/page.tsx`** — Terms & Conditions page covering user obligations, escrow service terms, fees, prohibited activities, account termination, liability, governing law, GDPR/NDPR references
- **`src/app/privacy/page.tsx`** — Privacy Policy page covering data collection, lawful basis (GDPR Art. 6), data retention, user rights (access, rectification, erasure, portability), NDPR (Nigeria Data Protection Regulation) compliance, contact info
- **`src/app/cookies/page.tsx`** — Cookie Policy page covering cookie types (essential, functional, analytics), GDPR consent, cookie management, third-party cookies

#### Routes
- `/terms` — Terms & Conditions
- `/privacy` — Privacy Policy
- `/cookies` — Cookie Policy

#### Design
- All legal pages use the same dark theme: `#0a0a0a` bg, `#1a1a1a` cards, `#262626` borders, Nunito/system-ui fonts
- Consistent header with back link to landing page
- Content in readable card-based layout with section headings

---

### Phase 4: Auth Pages — Unified Dark Theme (Recent Session)

All auth pages updated to match the dashboard dark theme (replacing the previous space/neon-green design).

#### Register Page (`src/app/register/page.tsx`)
- **Design:** Dark bg (`#0a0a0a`), dark inputs (`#1a1a1a` with `#262626` border), blue primary button (`var(--color-primary)`), Nunito/system-ui fonts
- **T&C acceptance checkbox:** Added required checkbox linking to `/terms`, `/privacy`, `/cookies` — registration is blocked if not accepted
- **Form fields:** First Name, Last Name, Email, Password (with eye toggle), Confirm Password, Country, Marketing Consent checkbox, T&C acceptance checkbox
- **Social buttons:** Google and Github (decorative — no OAuth implemented yet)
- **Motion animations:** `motion/react` (v12) with fade-in + slide-up staggered children

#### Login Page (`src/app/login/page.tsx`)
- Dark bg, bordered inputs, blue primary button, Nunito/system-ui fonts

#### Verify OTP Page (`src/app/verify-otp/page.tsx`)
- Dark bg, bordered input, blue button — matches unified design

#### Forgot Password Page (`src/app/forgot-password/page.tsx`)
- Dark bg, bordered input, blue button — matches unified design

#### Register API (`src/app/api/v1/auth/register/route.ts`)
- Added `marketing_consent` parameter acceptance
- Stores `marketing_consent` in profiles table (defaults to `true` if not provided)

---

### Phase 5: KYC Fixes (Recent Session)

#### KYC Document Upload — Admin Client
- **Root cause:** RLS policies prevented profile `kyc_status` updates from the user's session client.
- **Fix:** `src/app/api/v1/kyc/route.ts` now uses Supabase admin client (service role) to update `profiles.kyc_status` to `'pending'` on document upload.

#### Dashboard KYC Status Display
- **Root cause:** Dashboard hardcoded `Verified` badge regardless of actual status.
- **Fix:** `src/app/dashboard/page.tsx` now fetches `kycStatus` from `/api/v1/auth/me` and displays it dynamically (unverified, pending, verified, rejected).

#### Settings Page
- `src/app/dashboard/settings/page.tsx` — Changed hardcoded 'USA & UK' region to 'Global'

---

### Phase 6: Bug Fixes (Previous Sessions)

#### Hydration mismatch in ThemeToggle
- **Root cause:** `ThemeProvider` used `getInitialTheme()` which reads `localStorage` during SSR, causing server/client mismatch.
- **Fix:** Added `mounted` state to `ThemeProvider` — server always renders `'light'`, client syncs actual theme after mount via `useEffect`.
- **Files:** `src/components/ThemeProvider.tsx`, `src/components/ThemeToggle.tsx`

#### Blank white page (CSS not loading)
- **Root cause:** Next.js Turbopack inferred workspace root as parent dir instead of `sivaa-app/` due to multiple `package-lock.json` files.
- **Fix:** Added `turbopack.root: path.join(__dirname)` to `next.config.ts`.

#### Lucide-react icon compatibility
- `Chrome`, `Github`, `Twitter` icons don't exist in the installed version of lucide-react
- Replaced with `Globe` (Google), `Code` (Github), `AtSign` (Twitter) — all verified to exist

---

### Phase 7: Deployment (Latest)

- Deployed to Vercel production via `npx vercel --prod --yes`
- **Live URL:** https://www.ortho-m8.com
- Build passes with 0 errors (TypeScript + Turbopack)
- All 56 routes generated successfully (including `/terms`, `/privacy`, `/cookies`)
- Vercel project: `sivaa-app` under `broks-projects-90e1eaf4`

---

## Deployment

```bash
# From sivaa-app directory
npx vercel --prod --yes
```

- Deploys to: https://www.ortho-m8.com
- Vercel project: `sivaa-app` under `broks-projects-90e1eaf4`
- Environment variables: `.env.local` and `.env` (Supabase URL, Supabase service key, JWT secret, GitHub PAT for storage)

---

## Known Issues & Next Steps

1. **`src/ui/themes/high-contrast.css`** — File still exists but unused. Safe to delete.
2. **`src/ui/themes/theme-provider.tsx`** — Legacy duplicate of `src/components/ThemeProvider.tsx`. Not imported anywhere. Safe to delete.
3. **`public/favicon.svg`** — Old "OP" text favicon. Replaced by orthopay SVGs but file still exists.
4. **Race condition in transaction merging** — Multiple `setTransactions((prev) => [...prev, ...newTxns])` calls run in parallel from independent fetches. React batches state updates, so this generally works, but if data grows large, consider consolidating into a single fetch or using Promise.all.
5. **No tests** — `src/lib/__tests__/` directory exists but appears empty. Consider adding tests for wallet balance calculations and deposit/withdrawal approval flows.
6. **Supabase RLS** — Ensure Row Level Security policies allow the service role to update wallets on deposit/withdrawal approval.
7. **Withdrawal approval** — Check if withdrawal PATCH route also updates `total_sent` and inserts `wallet_transactions`. Same pattern as deposits — verify it's not missing.
8. **Email notifications** — `src/lib/email/` exists. Verify email sending works for deposit/withdrawal approval notifications.
9. **Social login buttons** — Google/Github buttons on register page are decorative only. OAuth not implemented.
10. **`marketing_consent` column** — May need to add `ALTER TABLE profiles ADD COLUMN marketing_consent boolean DEFAULT true;` to Supabase if not already present.
11. **`motion` package** — Added as dependency for onboarding animations. Version: latest (v12+). Import via `motion/react`.
12. **Landing page videos** — Served from CloudFront (`d8j0ntlcm91z4.cloudfront.net`). If URLs expire, update video constants at top of `src/app/page.tsx` and `src/app/register/page.tsx`.
13. **Legal pages are static** — Terms, Privacy, and Cookies pages are static content. Consider adding a cookie consent banner on the landing page for full GDPR compliance.
14. **Theme toggle only on dashboard** — Landing page no longer has a theme toggle. It uses the dark theme by default. The toggle remains in the dashboard layout.

---

## Key Patterns

- **Auth:** `requireAuth()` returns `{ id, siva_tag, email }`. `requireAdmin()` returns `{ admin: { admin_id } }`. Both throw Response on failure.
- **Supabase:** Always use `createSupabaseServerClient()` in server components/API routes. Use `createSupabaseAdminClient()` for operations that bypass RLS (e.g., KYC status updates).
- **Error handling on wallet updates:** Always check the `{ error }` return from Supabase `.update()` calls. Silent failures were the root cause of the balance bug.
- **Transaction types in UI:** `sent`, `received`, `deposit`, `withdrawal`, `adjustment_in`, `adjustment_out`. Each has its own icon and color in the dashboard and portfolio.
- **Theme:** Only `light` and `dark`. Set via `data-theme` attribute on `<html>`. Stored in `localStorage` as `ortho-pay-theme`. Provider uses `mounted` flag to prevent hydration mismatch. Theme toggle only in dashboard, not on landing page.
- **Unified design system:** `#0a0a0a` (page bg), `#1a1a1a` (card bg), `#262626` (borders), `#ffffff` (text), `var(--color-primary)` (blue `#3b82f6` for accents). Fonts: Nunito (`font-display`), system-ui (`font-body`). Used across landing, auth, and dashboard.
- **Video lazy loading:** `LazyVideo` component with `IntersectionObserver` — pass `eager` prop for above-the-fold videos only.
- **Turbopack root:** Set in `next.config.ts` via `turbopack.root: path.join(__dirname)` to fix CSS import resolution when parent directory has its own `package-lock.json`.
- **Motion animations:** Import from `motion/react` (not `framer-motion`). Use `motion.div` with `initial`/`animate`/`transition` props.
- **Legal pages:** Static pages at `/terms`, `/privacy`, `/cookies`. Linked in landing page footer and register page T&C checkbox.
