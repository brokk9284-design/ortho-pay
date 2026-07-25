# ORTHO-PAY v2.0 Implementation Plan

## P2P Liquidity Exchange with Intelligent Escrow

Based on: Op1 Architecture & Framework Spec, Op2 Frontend Spec, Op3 Backend Spec, Op4 Database Spec, Op5 Business Logic Spec.

---

## Current State (v1)

- Basic escrow payment app with admin-approved transactions
- Next.js 16 App Router + Supabase PostgreSQL + Vercel
- Custom JWT auth, GitHub-based file storage
- Flat fee tiers (3% / 2% / 1% by amount range)
- Single user type (consumer), single admin role
- No marketplace, no matching, no liquidity providers
- No Redis, no event-driven processing, no reputation system
- No dispute engine, no multi-rail settlement, no risk engine
- Deployed at https://www.ortho-m8.com (Vercel, stays as-is)

## Target State (v2)

- P2P liquidity exchange with intelligent escrow
- Next.js 16 App Router + Supabase PostgreSQL + Upstash Redis + Netlify
- Marketplace matching engine with provider competition
- Multiple user roles: Consumer, Liquidity Provider, Merchant, Business, Enterprise
- Dynamic fees based on transaction, user, liquidity, and market conditions
- Reputation and trust scoring system
- Multi-rail settlement (Faster Payments, SEPA, ACH, Interac)
- Dispute engine with evidence workflow
- Event-driven architecture with idempotency
- Risk engine for fraud prevention
- Immutable ledger with balance reconciliation

## Platform Change

- **v1 stays on Vercel** at https://www.ortho-m8.com (frozen, no new work)
- **v2 deploys on Netlify** from the `Version-2` branch
- Supabase remains the database (same project or new project, decided per phase)

---

## Architecture Principles (from Op1)

1. API-first: All business operations through API routes. Clients never touch financial tables directly.
2. Event-driven: Long-running workflows modeled as async events, not synchronous chains.
3. Stateless frontend: Frontend is presentation only. Critical state lives in backend or cache.
4. Security by default: RLS, server-side authorization, idempotency, immutable audit logs.
5. Performance: Cache frequently accessed non-sensitive data in Redis. No DB polling.
6. Modularity: Business domains (matching, escrow, reputation, fees, compliance) isolated.
7. Observability: Every critical action logged, traceable, monitored.
8. Scalability: Design so services can be extracted without major rewrites.
9. Infrastructure simplicity: Managed serverless (Supabase, Netlify, Upstash) until scale justifies more.
10. Business logic over CRUD: Database stores state. API routes implement financial rules.

---

## Phased Build Sequence

### Phase 0: Foundation and Infrastructure (Week 1-2)

**Goal:** Set up the infrastructure layer and project scaffolding for v2.

**0.1 Netlify Configuration**
- Configure `netlify.toml` with Next.js plugin, build settings, environment variables
- Set up Netlify project connected to `Version-2` branch on GitHub
- Configure redirect rules for Next.js App Router
- Test deploy to confirm build passes

**0.2 Upstash Redis Integration**
- Create Upstash Redis instance (free tier)
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to env
- Install `@upstash/redis` package
- Create `src/lib/redis.ts` client wrapper
- Implement base caching utilities: get, set, delete, expire, incr

**0.3 Project Structure Refactor**
- Create service layer directories:
  ```
  src/lib/services/
    identity/
    wallet/
    marketplace/
    matching/
    escrow/
    settlement/
    fees/
    reputation/
    risk/
    notifications/
    audit/
  ```
- Create repository layer:
  ```
  src/lib/repositories/
    profiles.repo.ts
    wallets.repo.ts
    ledger.repo.ts
    marketplace.repo.ts
    escrow.repo.ts
    settlements.repo.ts
    fees.repo.ts
    reputation.repo.ts
    disputes.repo.ts
    notifications.repo.ts
    audit.repo.ts
  ```
- Create event system:
  ```
  src/lib/events/
    event-bus.ts
    event-types.ts
    handlers/
  ```

**0.4 Type System**
- Define all v2 TypeScript types in `src/types/`:
  - User roles and permissions
  - Wallet with available/reserved/pending balances
  - Ledger entries (immutable, credit/debit, balance_before/after)
  - Marketplace orders and provider offers
  - Escrow with lifecycle states
  - Settlement with retry tracking
  - Fee calculations with breakdown
  - Trust and liquidity scores
  - Disputes with evidence
  - Risk events and scores
  - Notifications with delivery status
  - Audit records

**0.5 Monitoring Foundation**
- Install Sentry SDK (`@sentry/nextjs`)
- Configure error boundaries at route level
- Add structured logging utility (`src/lib/logger.ts`)

**Exit Criteria:**
- Netlify deploy succeeds from Version-2 branch
- Redis client connects and basic get/set works
- Service layer directories exist with placeholder interfaces
- Type system covers all v2 domains
- Sentry captures errors

---

### Phase 1: Database Schema Migration (Week 2-3)

**Goal:** Evolve the database from v1's simple tables to v2's full financial system of record.

**1.1 Identity Domain**
- `profiles` (extend): add `user_type` enum (consumer, provider, merchant, business, enterprise), `trust_score` int, `verification_level` enum
- `roles` (new): role assignments per user
- `permissions` (new): granular permissions
- `devices` (new): device fingerprints for risk engine
- `mfa` (new): MFA configuration per user
- `verification_requests` (new): KYC/AML verification workflow

**1.2 Wallet Domain**
- `wallets` (extend): add `reserved_balance`, `pending_balance`, `lifetime_volume`, `currency` (default USD, future multi-currency)
- `wallet_balances` (new): snapshot of available/reserved/pending per currency
- `ledger_entries` (new, replaces `wallet_transactions`): immutable, credit/debit, balance_before/after, category, reference
- `ledger_categories` (new): enum/table of ledger entry types
- `wallet_limits` (new): per-user transaction limits by role and tier
- `wallet_reservations` (new): temporary liquidity holds with expiry

**1.3 Marketplace Domain**
- `marketplace_orders` (new): buy/sell requests with amount, currency, payment_rail, pool_type
- `provider_offers` (new): provider responses to orders with fee, settlement time
- `market_depth` (new): current liquidity per currency/rail/pool
- `matching_queue` (new): pending orders awaiting match
- `provider_rankings` (new): cached ranking scores
- `provider_availability` (new): real-time provider status

**1.4 Escrow Domain**
- `escrows` (new, extends `payments` concept): full lifecycle with type (manual, auto, delivery, milestone, multi-party)
- `escrow_participants` (new): multiple parties per escrow
- `escrow_events` (new): state transition log
- `escrow_documents` (new): attached evidence/contracts
- `escrow_timers` (new): expiry and auto-release schedules
- `escrow_releases` (new): release records with settlement references

**1.5 Transaction Domain**
- `transactions` (new): logical transactions separate from ledger
- `transaction_items` (new): line items per transaction
- `transaction_status_history` (new): state transitions
- `transaction_metadata` (new): JSONB for extensible metadata

**1.6 Liquidity Domain**
- `liquidity_pools` (new): instant, standard, business, merchant, premium, institutional
- `liquidity_providers` (new): provider profiles with capabilities
- `provider_balances` (new): per-provider liquidity tracking
- `provider_limits` (new): per-provider transaction limits
- `provider_statistics` (new): historical performance metrics

**1.7 Settlement Domain**
- `settlements` (new): settlement records with status and references
- `settlement_batches` (new): batch settlement grouping
- `settlement_attempts` (new): retry tracking per settlement
- `settlement_failures` (new): failure records with reasons
- `payment_routes` (new): rail selection per settlement (faster_payments, sepa, ach, interac)

**1.8 Fee Domain**
- `fee_rules` (extend): add `pool_type`, `payment_rail`, `user_tier`, `provider_tier`, `settlement_speed`
- `fee_tiers` (new): user/provider tier definitions
- `fee_calculations` (new): per-transaction fee breakdown records
- `fee_history` (new): fee rule change audit trail
- `promotions` (new): promotional fee adjustments

**1.9 Reputation Domain**
- `trust_scores` (new): historical snapshots, never overwrite
- `user_statistics` (new): aggregate performance metrics
- `provider_statistics` (new): provider-specific metrics
- `performance_history` (new): per-transaction performance records

**1.10 Dispute Domain**
- `disputes` (new): dispute records with status lifecycle
- `dispute_messages` (new): communication during dispute
- `dispute_evidence` (new): file references (images, PDFs, video, logs)
- `dispute_decisions` (new): admin/system decisions
- `dispute_actions` (new): action log during dispute

**1.11 Compliance Domain**
- `kyc_profiles` (new, extends `kyc_documents`): structured KYC data
- `aml_checks` (new): AML screening records
- `sanctions_checks` (new): sanctions list screening
- `risk_events` (new): risk engine output per transaction
- `device_history` (new): device usage per user
- `ip_history` (new): IP address log per user

**1.12 Administration Domain**
- `admin_actions` (new, extends `audit_logs`): admin-specific action log
- `feature_flags` (new): runtime feature toggles
- `system_settings` (new): configurable platform parameters
- `maintenance_windows` (new): scheduled downtime

**1.13 Audit Domain**
- `audit_logs` (extend): add `ip`, `device`, `metadata` JSONB fields
- Ensure INSERT-only enforcement via trigger (prevent UPDATE/DELETE)

**1.14 Schema Standards**
- All new tables: UUID primary keys (UUIDv7 preferred)
- All new tables: `created_at`, `updated_at` timestamps
- Soft deletes only on profiles, notifications, preferences
- Never soft delete: ledger, transactions, escrows, audit, settlement
- RLS on every table
- Indexes on: user_id, wallet_id, escrow_id, transaction_id, status, created_at, payment_tag, email
- Composite indexes for common filter patterns
- CHECK constraints on financial tables
- Enum types for statuses

**1.15 Migration Strategy**
- Write forward-only SQL migration files in `sql/migrations/`
- Each migration numbered: `001_identity.sql`, `002_wallet.sql`, etc.
- Test against dev Supabase project first
- Never modify production tables directly
- Backfill data from v1 tables where mapping exists

**Exit Criteria:**
- All migration SQL files written and tested against dev Supabase
- RLS policies defined for every new table
- Indexes created
- v1 data preserved and accessible
- Ledger entries table replaces wallet_transactions (with migration script)

---

### Phase 2: Backend Service Layer (Week 3-5)

**Goal:** Build the service layer that implements business logic, isolated from routing.

**2.1 Identity Service** (`src/lib/services/identity/`)
- `authenticate()`: validate JWT, check session in Redis
- `authorize()`: check role and permissions
- `createSession()`: store session in Redis with TTL
- `revokeSession()`: remove from Redis
- `assignRole()`: admin-only role assignment
- `checkMFA()`: verify MFA code
- Rate limiting on login, OTP, password reset via Redis

**2.2 Wallet Service** (`src/lib/services/wallet/`)
- `getBalances()`: available, reserved, pending (derived from ledger)
- `reserveBalance()`: atomic reserve with PostgreSQL transaction + row lock
- `releaseReserve()`: release reserved back to available
- `debit()`: create ledger entry, recalculate balance
- `credit()`: create ledger entry, recalculate balance
- `reconcile()`: verify balance matches ledger sum
- `checkLimits()`: validate against wallet_limits
- Never execute external payments from wallet service

**2.3 Marketplace Service** (`src/lib/services/marketplace/`)
- `createOrder()`: buyer posts request (amount, currency, rail, pool)
- `createOffer()`: provider responds with fee and settlement time
- `getMarketDepth()`: current liquidity per currency/rail/pool (Redis cached)
- `getProviderAvailability()`: online providers with capacity (Redis cached)
- `cancelOrder()`: buyer cancels before match
- `withdrawOffer()`: provider withdraws offer before acceptance

**2.4 Matching Engine** (`src/lib/services/matching/`)
- `findMatches()`: score and rank providers for a buyer request
- `scoreProvider()`: compute match quality score:
  ```
  Score = liquidity + trust + speed + successRate + geoMatch
        + currencyMatch + railMatch + pricing
        - disputeRate - cancellationRate - riskScore
  ```
- `reserveMatch()`: atomic reservation with timer (Redis countdown)
- `partialFulfillment()`: split across multiple providers
- `reverseMatch()`: buyer posts request, providers compete on fees
- `smartRouting()`: fallback through premium, business, merchant, internal reserve
- Cold start: weighted scoring function with hand-tuned weights
- Future: GBDT model once 1000+ matches exist (per AI Research Brief)

**2.5 Escrow Engine** (`src/lib/services/escrow/`)
- `createEscrow()`: initialize escrow with participants, type, terms
- `transitionState()`: explicit state machine (created -> funded -> held -> released/reversed)
- `startTimer()`: auto-release countdown
- `expireEscrow()`: handle timeout
- `releaseEscrow()`: release funds to provider
- `refundEscrow()`: return funds to buyer
- `addMilestone()`: for milestone escrow type
- `approveMilestone()`: partial release
- `addDocument()`: attach evidence
- `getEscrowHistory()`: full event log

**2.6 Settlement Engine** (`src/lib/services/settlement/`)
- `initiateSettlement()`: create settlement record
- `selectRail()`: choose payment rail based on geography and preference
- `executeSettlement()`: call provider adapter
- `retrySettlement()`: exponential backoff retry
- `reconcileSettlement()`: verify completion
- `batchSettlements()`: group settlements for efficiency
- Idempotency: settlement key prevents double execution

**2.7 Fee Engine** (`src/lib/services/fees/`)
- `calculateFee()`: compute fee with full breakdown:
  ```
  BaseFee(method, amount)
    + RiskPremium(method_risk, user_risk)
    - LoyaltyDiscount(user_volume, user_success_rate)
    + LiquidityPremium(deposit_queue_depth, withdrawal_queue_depth)
    + UrgencyPremium(requested_priority, time_in_queue)
  ```
- `getFeeBreakdown()`: detailed breakdown for user transparency
- `applyPromotion()`: check and apply active promotions
- `getFeeHistory()`: audit trail of fee rules
- Constraints: min 0.5%, max 5%, always disclosed before confirmation
- Cold start: current fee_rules as baseline, dynamic adjustments phased in

**2.8 Reputation Engine** (`src/lib/services/reputation/`)
- `calculateTrustScore()`: identity verification, volume, completion rate, response time, disputes, chargebacks, cancellations, account age
- `calculateLiquidityScore()`: available liquidity, reliability, settlement history, acceptance rate, availability, response speed
- `updateScores()`: after every transaction completion
- `getScoreHistory()`: historical snapshots (never overwrite)
- `getProviderRanking()`: ranked list for matching engine
- Scores influence: marketplace visibility, limits, fees, priority, matching probability

**2.9 Risk Engine** (`src/lib/services/risk/`)
- `assessRisk()`: compute risk score (0-100) per transaction
- Inputs: velocity, device fingerprint, IP changes, geolocation, browser integrity, payment behavior, failed attempts, sanctions screening, historical disputes
- `getRiskDecision()`: auto-approve (0-30), standard review (31-60), enhanced review (61-80), auto-block (81-100)
- `logRiskEvent()`: store risk assessment in `risk_events`
- `screenSanctions()`: check against sanctions lists
- `checkVelocity()`: rate of transactions per time window (Redis)
- Cold start: rule-based scoring, transition to ML per AI Research Brief

**2.10 Notification Service** (`src/lib/services/notifications/`)
- `sendNotification()`: email, SMS, push, in-app, realtime
- `queueNotification()`: async dispatch, never block financial operations
- `getNotificationPreferences()`: per-user channel preferences
- `updateDeliveryStatus()`: track sent/failed/delivered
- Email: Resend API
- SMS: Twilio (or MessageBird)
- Push: Firebase Cloud Messaging
- Realtime: Supabase Realtime

**2.11 Audit Service** (`src/lib/services/audit/`)
- `logAction()`: immutable append-only record
- `getAuditTrail()`: query by entity, user, action, date range
- `exportAuditLog()`: for compliance reporting
- Never edit or delete audit records

**2.12 Event Bus** (`src/lib/events/`)
- Event types: USER_REGISTERED, ESCROW_CREATED, MATCH_FOUND, PAYMENT_SENT, PAYMENT_RECEIVED, DISPUTE_OPENED, DISPUTE_RESOLVED, WITHDRAWAL_COMPLETED, SETTLEMENT_COMPLETED, LEDGER_UPDATED, NOTIFICATION_SENT
- `publish(event)`: emit event to handlers
- `subscribe(eventType, handler)`: register handler
- Each handler independently retryable
- Events persist in audit log for replay

**Exit Criteria:**
- All services implemented with unit tests
- Services are pure business logic, no routing concerns
- PostgreSQL transactions used for all multi-step financial operations
- Row locking prevents double reservation, double release, double refund
- Idempotency keys accepted on all financial endpoints
- Event bus publishes and handles all event types
- Rate limiting active on auth endpoints via Redis

---

### Phase 3: API Route Layer (Week 5-6)

**Goal:** Build thin controller routes that validate requests and orchestrate services.

**3.1 Auth Routes** (extend existing)
- `POST /api/v1/auth/register`: add user_type, assign role, create wallet, init reputation
- `POST /api/v1/auth/login`: add Redis session, rate limiting
- `POST /api/v1/auth/logout`: revoke Redis session
- `GET /api/v1/auth/me`: include role, trust_score, verification_level
- `POST /api/v1/auth/mfa/setup`: enable MFA
- `POST /api/v1/auth/mfa/verify`: verify MFA code

**3.2 User Routes** (extend existing)
- `GET /api/v1/users/:id`: full profile with reputation summary
- `PATCH /api/v1/users/:id`: update profile, preferences
- `GET /api/v1/users/:id/reputation`: trust score, liquidity score, history
- `PATCH /api/v1/users/:id/limits`: admin-only, set transaction limits

**3.3 Wallet Routes** (extend existing)
- `GET /api/v1/wallet`: available, reserved, pending balances
- `GET /api/v1/wallet/history`: ledger entries with pagination
- `GET /api/v1/wallet/limits`: current transaction limits
- `POST /api/v1/wallet/reserve`: reserve balance (internal, not user-facing)
- `POST /api/v1/wallet/release`: release reservation (internal)

**3.4 Marketplace Routes** (new)
- `POST /api/v1/marketplace/orders`: create buy/sell request
- `GET /api/v1/marketplace/orders`: list orders (filtered by status, pool, currency)
- `GET /api/v1/marketplace/orders/:id`: order details with offers
- `DELETE /api/v1/marketplace/orders/:id`: cancel order
- `POST /api/v1/marketplace/offers`: provider creates offer
- `GET /api/v1/marketplace/offers`: list offers for an order
- `POST /api/v1/marketplace/offers/:id/accept`: buyer accepts offer
- `GET /api/v1/marketplace/depth`: market depth per currency/rail/pool
- `GET /api/v1/marketplace/providers`: available providers (Redis cached)

**3.5 Escrow Routes** (new)
- `POST /api/v1/escrows`: create escrow
- `GET /api/v1/escrows`: list escrows (filtered by status, participant)
- `GET /api/v1/escrows/:id`: escrow details with events and documents
- `POST /api/v1/escrows/:id/release`: release escrow
- `POST /api/v1/escrows/:id/refund`: refund escrow
- `POST /api/v1/escrows/:id/milestone`: add/approve milestone
- `POST /api/v1/escrows/:id/documents`: attach document
- `GET /api/v1/escrows/:id/events`: state transition history

**3.6 Transaction Routes** (new)
- `GET /api/v1/transactions`: list transactions (paginated, filtered)
- `GET /api/v1/transactions/:id`: transaction details with items and ledger entries
- `GET /api/v1/transactions/:id/status-history`: state transitions

**3.7 Settlement Routes** (new)
- `POST /api/v1/settlements`: initiate settlement
- `GET /api/v1/settlements`: list settlements (filtered by status)
- `GET /api/v1/settlements/:id`: settlement details with attempts
- `POST /api/v1/settlements/:id/retry`: retry failed settlement

**3.8 Fee Routes** (extend existing)
- `POST /api/v1/fees/calculate`: calculate fee for a prospective transaction
- `GET /api/v1/fees/rules`: list active fee rules
- `POST /api/v1/fees/rules`: admin-only, create fee rule
- `PATCH /api/v1/fees/rules/:id`: admin-only, update fee rule
- `GET /api/v1/fees/tiers`: list fee tiers
- `GET /api/v1/fees/promotions`: list active promotions

**3.9 Reputation Routes** (new)
- `GET /api/v1/reputation/:userId`: trust score, liquidity score, statistics
- `GET /api/v1/reputation/:userId/history`: score history snapshots
- `GET /api/v1/reputation/leaderboard`: top providers by ranking

**3.10 Dispute Routes** (new)
- `POST /api/v1/disputes`: open dispute
- `GET /api/v1/disputes`: list disputes (filtered by status, participant)
- `GET /api/v1/disputes/:id`: dispute details with messages and evidence
- `POST /api/v1/disputes/:id/messages`: add message
- `POST /api/v1/disputes/:id/evidence`: upload evidence
- `POST /api/v1/disputes/:id/decision`: admin-only, make decision
- `POST /api/v1/disputes/:id/appeal`: request appeal

**3.11 Notification Routes** (extend existing)
- `GET /api/v1/notifications`: list with category filtering
- `PATCH /api/v1/notifications/:id/read`: mark as read
- `PATCH /api/v1/notifications/read-all`: mark all as read
- `GET /api/v1/notifications/preferences`: get preferences
- `PATCH /api/v1/notifications/preferences`: update preferences
- WebSocket/Realtime: subscribe to live notifications

**3.12 Admin Routes** (extend existing)
- `GET /api/v1/admin/overview`: platform stats (volume, revenue, pending, open disputes)
- `GET /api/v1/admin/users`: list all users with filters
- `PATCH /api/v1/admin/users/:id`: suspend, adjust limits, assign role
- `GET /api/v1/admin/escrows`: all escrows with filters
- `POST /api/v1/admin/escrows/:id/decision`: approve/reject/hold
- `GET /api/v1/admin/settlements`: all settlements with filters
- `GET /api/v1/admin/feature-flags`: list flags
- `PATCH /api/v1/admin/feature-flags/:id`: toggle flag
- `GET /api/v1/admin/audit-logs`: query audit trail

**3.13 Compliance Routes** (new)
- `POST /api/v1/compliance/kyc/upload`: upload KYC document
- `GET /api/v1/compliance/kyc/status`: get KYC status
- `POST /api/v1/compliance/kyc/review`: admin-only, approve/reject
- `GET /api/v1/compliance/aml/:userId`: AML check history
- `GET /api/v1/compliance/risk/:transactionId`: risk assessment

**3.14 API Standards**
- All financial endpoints accept `Idempotency-Key` header
- All endpoints return structured errors: `{ code, message, retryable }`
- Pagination on all list endpoints: `?page=1&limit=20`
- Versioning: all routes under `/api/v1/`
- Rate limiting via Redis on: login, OTP, escrow creation, marketplace posting, withdrawals
- Input validation on every endpoint (zod or custom)
- No `SELECT *` in any query

**Exit Criteria:**
- All routes implemented and tested
- Idempotency keys prevent duplicate execution
- Rate limiting active on protected endpoints
- Structured error responses on all endpoints
- No route directly modifies financial tables (all go through services)
- API documentation generated
- PIVP validation gate passes

---

### Phase 4: Frontend Evolution (Week 6-8)

**Goal:** Evolve the frontend from v1's basic dashboard to v2's full marketplace experience.

**4.1 Design System Update** (per Op2 Spec)
- Adopt 8-point spacing system: 4, 8, 12, 16, 24, 32, 40, 48, 64
- Card system: large (24px padding), medium (20px), small (16px)
- Border radius: cards 20px, buttons 14px, inputs 14px, chips 999px, modal 24px
- Typography: Space Grotesk (headings) + Inter (body)
- Font scale: Display 56px, H1 48px, H2 36px, H3 28px, H4 22px, Body Large 18px, Body 16px, Caption 14px, Small 12px
- Color system: Deep Navy, Brand Blue, Accent Green + semantic colors (success/warning/danger/info)
- Update CSS foundation files to match new tokens
- Max content width: 1440px, never full-width stretching
- Section spacing: landing 80px, dashboard 24px, forms 24px, buttons 16px

**4.2 State Management**
- Install TanStack Query (`@tanstack/react-query`) for server state
- Install Zustand for lightweight client state
- Create API service layer: `src/services/` with typed API clients
- All API calls go through service layer, no direct fetch in components
- Query keys standardized for cache invalidation

**4.3 Reusable Components** (per Op2 Spec)
- Button (variants: primary, secondary, ghost, danger)
- Input (with label, error, help text)
- Card (large, medium, small)
- Modal (with backdrop, escape, focus trap)
- Avatar (with fallback, sizes)
- Notification (toast, inline)
- BalanceCard (available, reserved, pending)
- EscrowCard (status, participants, timer)
- MarketplaceCard (order details, offers)
- ProviderCard (trust score, liquidity, rating)
- TransactionCard (type, amount, status, date)
- Search (global search across entities)
- Tabs (for filtered views)
- Badge (status, role, verification)
- Tag (pool type, payment rail)
- EmptyState (illustration, explanation, CTA)
- Skeleton (card, table, list)
- Toast (success, error, info)

**4.4 Landing Page Update**
- Keep animated video backgrounds (per spec: do not remove)
- Add gradient overlays for readability
- Improve typography with new font system
- Reduce competing colors, increase whitespace
- Simplify CTA hierarchy (one primary action per section)
- Add marketplace preview section
- Add provider onboarding CTA
- Mobile-first: test at 375px first

**4.5 Dashboard Redesign** (per Op2 Spec layout)
- Hero Balance (available, reserved, pending)
- Quick Actions (Send, Request, Deposit, Withdraw)
- Liquidity Status (marketplace depth, available providers)
- Recent Activity (transactions, escrows)
- Pending Escrows (with timer countdown)
- Marketplace (active orders, recent matches)
- Insights (trust score, liquidity score, performance)
- Notifications (unified center with categories)
- Footer

**4.6 Navigation**
- Mobile: bottom navigation (Home, Pay, Activity, Market, Profile)
- Desktop: sidebar navigation
- Never mix both simultaneously
- Role-based navigation: different items for consumer vs provider vs merchant

**4.7 New Pages**
- `/marketplace`: marketplace order board, create order, browse providers
- `/marketplace/order/:id`: order details with provider offers
- `/escrows`: escrow list with status filters
- `/escrows/:id`: escrow detail with timeline, documents, participants
- `/disputes`: dispute list
- `/disputes/:id`: dispute detail with messages, evidence, decision
- `/reputation`: trust score, liquidity score, history, leaderboard
- `/settlements`: settlement history
- `/onboarding/provider`: liquidity provider registration flow
- `/onboarding/merchant`: merchant registration flow

**4.8 Existing Page Updates**
- `/dashboard`: full redesign per Op2 layout
- `/dashboard/deposit`: integrate with marketplace orders
- `/dashboard/withdraw`: integrate with marketplace orders
- `/dashboard/portfolio`: add escrow, marketplace, settlement tabs
- `/dashboard/settings`: add role management, MFA, notification preferences
- `/dashboard/notifications`: category filtering, realtime updates
- `/register`: add user_type selection (consumer, provider, merchant, business)
- `/login`: add MFA step

**4.9 Forms**
- Inline validation on all forms
- Helpful error messages (what happened, what to do)
- Progress indicators on multi-step forms
- Keyboard accessibility on all inputs
- Autosave where appropriate (draft orders, dispute messages)

**4.10 Empty States and Loading**
- Every list view has an empty state component
- Every async load shows skeleton, never blank white
- Error states explain what happened and what to do next

**4.11 Accessibility**
- WCAG AA minimum contrast
- Touch targets minimum 44x44px
- Keyboard navigation on all interactive elements
- Screen reader labels on all controls
- Focus visible on all elements
- `prefers-reduced-motion` respected

**4.12 Internationalization Foundation**
- Currency formatting via `Intl.NumberFormat`
- Date/time via `Intl.DateTimeFormat`
- No hardcoded formatting
- Language support structure (future-ready, English first)

**Exit Criteria:**
- FCRP frontend review passes all 8 sections
- All new pages responsive at 375px, 768px, 1024px, 1440px
- No dead buttons, no 404 routes, no console errors
- All forms have inline validation
- All lists have empty states and skeleton loading
- Role-based navigation works
- TanStack Query caching reduces redundant API calls
- No prop drilling (context or Zustand stores used)

---

### Phase 5: External Integrations (Week 8-9)

**Goal:** Connect external services for settlement, notifications, and compliance.

**5.1 Payment Rail Adapters**
- `PaymentRailAdapter` interface: `settle()`, `verify()`, `getStatus()`
- `FasterPaymentsAdapter`: UK Faster Payments (future API integration)
- `SEPAdapter`: SEPA / SEPA Instant (future API integration)
- `ACHAdapter`: US ACH (future API integration)
- `InteracAdapter`: Canada Interac e-Transfer (future API integration)
- Each adapter behind interface so providers can be swapped
- Cold start: manual settlement confirmation, adapters phased in

**5.2 Email Service**
- Install Resend SDK (`resend`)
- Create `src/lib/services/notifications/email.ts`
- Templates: welcome, 2fa-code, password-reset, payment-confirmation, escrow-status, payment-request, dispute-opened, dispute-resolved
- Async dispatch via event bus, never block financial operations
- Track delivery status

**5.3 SMS Service**
- Install Twilio SDK (`twilio`)
- Create `src/lib/services/notifications/sms.ts`
- Templates: 2fa-code, escrow-status, withdrawal-completed
- Async dispatch, track delivery

**5.4 Push Notifications**
- Install Firebase Admin SDK
- Create `src/lib/services/notifications/push.ts`
- Register device tokens on login
- Send push on: escrow status change, match found, dispute update, settlement completed

**5.5 KYC/AML Integration**
- Create `src/lib/services/compliance/kyc.ts`
- Document upload to Supabase Storage (replace GitHub storage)
- Future: Onfido or Jumio API integration for automated verification
- Cold start: manual admin review, AI verification phased in per AI Research Brief

**5.6 Supabase Storage Migration**
- Migrate file storage from GitHub (`github-storage.ts`) to Supabase Storage
- Buckets: `avatars/`, `kyc/`, `receipts/`, `contracts/`, `attachments/`, `merchant-assets/`
- Never store uploads in PostgreSQL
- Set bucket permissions (public for avatars, private for KYC/receipts)

**Exit Criteria:**
- Email sending works for all templates
- SMS sending works for critical notifications
- Push notifications deliver to registered devices
- Supabase Storage replaces GitHub storage
- Payment rail adapters defined with interface, manual mode working
- All notifications are async, never block financial operations

---

### Phase 6: Background Jobs and Automation (Week 9-10)

**Goal:** Implement scheduled and event-driven background processing.

**6.1 Scheduled Jobs**
- Escrow expiry: check every 5 minutes, expire escrows past timer
- Auto-release: release escrows that met auto-release conditions
- Reputation recalculation: daily, recompute all trust/liquidity scores
- Daily limits reset: midnight UTC, reset per-day transaction counters
- Notification retries: every 15 minutes, retry failed notifications
- Settlement reconciliation: hourly, verify pending settlements
- Exchange rate refresh: every hour, update cached FX rates
- Queue imbalance check: every 10 minutes, alert admin if ratio > 3:1

**6.2 Implementation**
- Use Supabase Scheduled Functions (pg_cron) or Netlify Scheduled Functions
- Each job is idempotent
- Each job logs start, completion, and any errors
- Failed jobs alert admin via notification service

**6.3 Event-Driven Handlers**
- `ESCROW_CREATED` -> notify participants, reserve liquidity, start timer
- `MATCH_FOUND` -> notify provider, create escrow, reserve funds
- `PAYMENT_SENT` -> update escrow status, notify buyer
- `PAYMENT_RECEIVED` -> verify settlement, update ledger
- `SETTLEMENT_COMPLETED` -> release escrow, update reputation, distribute fees
- `DISPUTE_OPENED` -> freeze escrow, notify admin, notify participants
- `DISPUTE_RESOLVED` -> execute decision (release/refund), update reputation
- `WITHDRAWAL_COMPLETED` -> update ledger, notify user

**Exit Criteria:**
- All scheduled jobs running and logging
- Event handlers process all event types
- Failed jobs retry and alert
- No background job blocks user requests

---

### Phase 7: Security and Compliance Hardening (Week 10-11)

**Goal:** Meet financial platform security standards.

**7.1 RLS Policy Review**
- Every table has RLS enabled
- Policies enforce: owner access, admin access, role-based access
- Test: authenticated user cannot read other users' wallets, escrows, disputes
- Test: admin can read all, update only authorized tables
- Never disable RLS

**7.2 Idempotency Enforcement**
- Every financial endpoint requires `Idempotency-Key` header
- Redis stores key with request hash for 24 hours
- Same key + same request returns cached response
- Same key + different request returns 409 Conflict

**7.3 Rate Limiting**
- Login: 5 attempts per 15 minutes per IP
- OTP: 3 requests per 10 minutes per user
- Password reset: 3 per hour per email
- Escrow creation: 10 per hour per user
- Marketplace posting: 20 per hour per user
- Withdrawal: 5 per hour per user
- API abuse: 100 requests per minute per IP (global)

**7.4 Input Validation**
- Zod schemas on every API endpoint
- No client-provided financial values trusted
- Server recalculates fees, amounts, balances
- Sanitize all string inputs
- Validate file uploads (type, size)

**7.5 Audit Trail Completeness**
- Every financial action generates audit record
- Audit records include: user_id, actor_type, entity, entity_id, action, ip, device, metadata
- Audit table is INSERT-only (trigger prevents UPDATE/DELETE)
- Test: cannot modify audit records even with admin access

**7.6 Secrets Management**
- All secrets in Netlify environment variables
- No secrets in code, no secrets in client-side code
- `.env.example` committed with placeholder values only
- Service role key never exposed to client

**7.7 Compliance Checks**
- KYC required before any financial transaction
- AML screening on transactions above threshold
- Sanctions screening on all new users
- Risk score stored on every transaction
- Suspicious activity flagged for admin review

**Exit Criteria:**
- STBP security gate passes
- RLS tested with automated tests
- Idempotency tested with duplicate requests
- Rate limiting tested with burst requests
- Audit trail tested for immutability
- No secrets in client-accessible code
- PIVP validation gate passes

---

### Phase 8: Testing and Validation (Week 11-12)

**Goal:** Comprehensive test coverage for financial operations.

**8.1 Unit Tests**
- Wallet service: debit, credit, reserve, release, reconcile
- Matching engine: scoreProvider, findMatches, partialFulfillment
- Escrow engine: state transitions, timer, release, refund
- Fee engine: calculateFee with all variables, constraints (min/max)
- Reputation engine: trustScore, liquidityScore calculations
- Risk engine: riskScore thresholds, velocity checks

**8.2 Integration Tests**
- Full marketplace flow: create order -> receive offers -> accept -> escrow -> settle -> release
- Escrow lifecycle: create -> fund -> hold -> release -> settle -> ledger update
- Dispute flow: open -> evidence -> decision -> appeal -> resolved
- Settlement retry: fail -> retry -> succeed
- Idempotency: duplicate request returns same response
- Concurrency: parallel reservations on same wallet

**8.3 API Tests**
- Every endpoint tested for: auth required, authorization, validation, happy path, error path
- Rate limiting tested
- Pagination tested
- Structured error format verified

**8.4 Frontend Tests**
- Component rendering tests
- Form validation tests
- Empty state and loading state rendering
- Role-based navigation visibility
- Responsive layout at 375px, 768px, 1024px, 1440px

**8.5 Security Tests**
- RLS policy tests (user A cannot access user B's data)
- Idempotency key tests
- Rate limiting tests
- Input validation tests (SQL injection, XSS, path traversal)
- Audit immutability tests

**8.6 Performance Tests**
- Dashboard load: <500ms
- Wallet lookup: <100ms
- Marketplace search: <700ms
- Escrow creation: <1s
- Liquidity matching: <2s
- Auth: <300ms

**Exit Criteria:**
- All test suites pass
- Coverage >80% on service layer
- PIVP validation gate passes
- No Blocker or Critical issues open
- No self-certification: all results backed by command output

---

### Phase 9: Deployment and Monitoring (Week 12)

**Goal:** Deploy v2 to Netlify with full monitoring.

**9.1 Netlify Deployment**
- Configure build settings in `netlify.toml`
- Set all environment variables in Netlify dashboard
- Deploy from `Version-2` branch
- Configure custom domain (separate from v1's ortho-m8.com)
- Test all routes return 200

**9.2 Monitoring Setup**
- Sentry: error tracking, performance monitoring
- Netlify Analytics: frontend performance
- Supabase Logs: database queries, RLS denials, function logs
- Upstash Redis: connection health, memory usage
- Alert on: error rate spike, failed settlements, queue depth anomaly, Redis disconnection

**9.3 Health Checks**
- `GET /api/v1/health`: database, Redis, external services status
- Supabase connection test
- Redis connection test
- Email service test
- SMS service test

**9.4 Documentation**
- Update AGENT_HANDOFF.md with v2 state
- API documentation (endpoint list, request/response examples)
- Database schema documentation
- Deployment runbook
- Architecture decision records in `docs/architecture/`

**Exit Criteria:**
- v2 deployed and accessible on Netlify
- All monitoring active and alerting
- Health check endpoint returns green
- Documentation complete
- v1 on Vercel remains untouched and accessible

---

## Technology Stack Summary

| Component | Service | Notes |
|-----------|---------|-------|
| Frontend | Next.js 16 (App Router) | TypeScript, TailwindCSS, TanStack Query, Zustand |
| Backend | Next.js API Routes | Service layer + repository pattern |
| Database | Supabase PostgreSQL 16 | RLS, JSONB, UUIDs, materialized views |
| Cache | Upstash Redis | Sessions, rate limiting, matching queue, liquidity cache |
| Auth | Supabase Auth + custom JWT | MFA, passkeys (future), OAuth (future) |
| Storage | Supabase Storage | avatars, kyc, receipts, contracts, attachments |
| Email | Resend | Async via event bus |
| SMS | Twilio | Async via event bus |
| Push | Firebase Cloud Messaging | Async via event bus |
| Realtime | Supabase Realtime | Notifications, marketplace updates |
| Monitoring | Sentry + Netlify Analytics | Errors, performance, alerts |
| Hosting | Netlify | Deployed from Version-2 branch |
| Scheduled Jobs | Netlify Scheduled Functions | Escrow expiry, reputation recalc, reconciliation |

---

## Revenue Streams (per Op5 Spec)

1. Marketplace Matching Fee (on successful match)
2. Escrow Fee (for trust protection)
3. Instant Settlement Fee (optional premium)
4. Premium Subscription (advanced features)
5. Merchant Subscription (commercial tools)
6. Business Subscription (bulk payments, reporting, API)
7. API Usage (enterprise integrations)
8. FX Spread (cross-border transactions)
9. Priority Matching (higher ranking, faster execution)
10. White-label Platform (future)

---

## Risk and Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Forward-only migrations, v1 data preserved, backup before migration |
| Double execution of financial ops | Idempotency keys, PostgreSQL transactions, row locking |
| Race conditions in matching | Atomic reservations via Redis, PostgreSQL row locks |
| Secrets exposure | Netlify env vars only, no client-side secrets, service role key server-only |
| RLS bypass | Test all policies, service role key never sent to client |
| Scaling bottleneck | Redis caching, no DB polling, paginated queries, materialized views for analytics |
| Vendor lock-in | Provider adapters behind interfaces, Redis operations abstracted |

---

## File Size and Structure Rules (per GBEGP)

- No file exceeds 1000 lines
- CSS split by concern: foundation, themes, layouts, components, motion, responsiveness, accessibility, utilities
- TypeScript vectorized: one component per file, one hook per file, one service per file
- Backend split: controllers (routing) -> services (business logic) -> repositories (data access) -> validators -> middleware
- Frontend pages compose components, do not implement workflows inline
- Soft caps: CSS 150-250 lines, backend 200-300 lines, frontend 150-200 lines

---

## Workflow Gates

- **DFDI**: Spec approved before implementation begins (this document is the spec)
- **PIVP**: Validation gate after each phase, no Blocker/Critical open
- **FCRP**: Frontend review after Phase 4, all 8 sections must pass
- **STBP**: Security gate after Phase 7, all checks must pass
- **GBEGP**: Session bootstrap at start of each work session

---

## Next Action

Phase 0 is ready to begin. First task: configure `netlify.toml` and set up the Netlify deployment pipeline from the `Version-2` branch.
