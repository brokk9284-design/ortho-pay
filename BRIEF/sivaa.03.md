For this architecture, I would simplify the stack even further.

Since you're using Vercel + Supabase only, the architecture becomes:

Frontend: Next.js (TypeScript) on Vercel

Backend: Next.js Route Handlers (TypeScript) on Vercel

Database: Supabase PostgreSQL

Authentication: Supabase Auth

Storage: Supabase Storage

Realtime: Supabase Realtime

Row Level Security (RLS): Supabase

Edge Functions: Optional (Supabase)

No Redis

No Prisma

No NestJS

No external queues

No external secrets manager


Everything remains TypeScript-based except PostgreSQL.


---

ADM-001

Administrative Management Dashboard Specification

Purpose

The Administrative Dashboard manages the complete payment platform.

Administrators should never need SQL.

Every operation is available from the dashboard.


---

Main Navigation

Overview

Users

Payments

Payment Verification

Wallets

Revenue

Fee Rules

Notifications

Reports

Audit Logs

Support

Security

Settings


---

Dashboard Home

Widgets

Total Users

Active Users

Pending Payments

Completed Payments

Failed Payments

Platform Revenue

Total Volume

Wallet Balances

Verification Queue

Open Support Tickets


Charts

Daily Revenue

Daily Transactions

User Growth

Fee Revenue

Payment Success Rate

Top Users



---

User Management

Search

Filter

Suspend

Activate

Reset PIN

Reset Password

View KYC

View History

View Wallet

Generate Report

Tables

users

wallets

devices

sessions

kyc_documents

login_history


---

Payment Management

View

Approve

Reject

Reverse

Refund

Investigate

Tables

payments

payment_attempts

payment_verifications

payment_events

payment_receipts


---

Wallet Management

Freeze

Unfreeze

Adjust Balance

Transfer

Lock Funds

Unlock Funds

Tables

wallets

wallet_transactions

wallet_adjustments

wallet_holds


---

Revenue Dashboard

Displays

Platform Revenue

Fees Collected

Daily Income

Monthly Income

Net Profit

Outstanding Settlement

Tables

fees

revenue

settlements

commission_history


---

Fee Management

Rules

₦0–5,000

3%

--------------

₦5,001–9,999

2%

--------------

₦10,000+

1%

Admin can:

Create

Disable

Schedule

Version


---

Verification Queue

Pending

Under Review

Verified

Rejected

Expired

Every payment displays

Receipt

Sender

Receiver

Amount

Time

Reference

Verification Result


---

Notifications

Broadcast

Targeted

Emergency

Maintenance

System Updates


---

Reports

Revenue

Payments

Fraud

Users

Support

Wallet

Verification

Exports

CSV

Excel

PDF


---

Support

Tickets

Live Status

Escalations

Responses

History


---

Audit Logs

Everything is immutable.

Shows

Who

Did What

When

Where

Old Value

New Value


---

Security Dashboard

Failed Logins

Blocked Users

Suspicious Payments

Large Transactions

Admin Activity

Device Changes


---

Settings

Platform Name

Logo

Fee Rules

Maintenance Mode

Registration

Limits

Payment Methods

Currencies


---

API Specification

Version

/api/v1/

Authentication

POST

/auth/login

/auth/register

/auth/logout

/auth/refresh

/auth/reset-password

Users

GET /users

GET /users/:id

PATCH /users/:id

DELETE /users/:id

Wallet

GET /wallet

GET /wallet/history

POST /wallet/transfer

POST /wallet/freeze

POST /wallet/unfreeze

Payments

POST /payments

GET /payments

GET /payments/:id

PATCH /payments/:id

POST /payments/verify

POST /payments/reverse

Fees

GET /fees

POST /fees

PATCH /fees

DELETE /fees

Reports

GET /reports/revenue

GET /reports/users

GET /reports/payments

GET /reports/fraud

Notifications

POST /notifications

GET /notifications

Support

POST /tickets

GET /tickets

PATCH /tickets/:id

Audit

GET /audit

Settings

GET /settings

PATCH /settings


---

Database Structure

Identity

users

profiles

devices

sessions

roles

permissions


---

Payment

payments

payment_methods

payment_attempts

payment_events

payment_receipts

payment_verifications


---

Wallet

wallets

wallet_transactions

wallet_adjustments

wallet_holds


---

Finance

fees

commissions

settlements

ledger

revenue


---

Notification

notifications

notification_templates


---

Support

tickets

ticket_messages


---

Analytics

daily_metrics

monthly_metrics

dashboards


---

Audit

audit_logs

system_events


---

Configuration

settings

feature_flags

fee_rules


---

Environment Variables

Vercel

NEXT_PUBLIC_APP_NAME=Payment Platform

NEXT_PUBLIC_APP_URL=https://your-domain.com

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxx

SUPABASE_SERVICE_ROLE_KEY=xxxxxxxx

NEXTAUTH_SECRET=generate-random-64-character-secret

NODE_ENV=production


---

Supabase

Project Settings

JWT_SECRET=generate-random-64-character-secret

POSTGRES_PASSWORD=strong-generated-password

DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

SUPABASE_ANON_KEY=generated-by-supabase

SUPABASE_SERVICE_ROLE_KEY=generated-by-supabase

Storage

STORAGE_BUCKET_RECEIPTS=receipts

STORAGE_BUCKET_AVATARS=avatars

STORAGE_BUCKET_DOCUMENTS=documents


---

Recommended Project Structure

apps/
  mobile/
  admin/

packages/
  ui/
  types/
  utils/

supabase/
  migrations/
  seed.sql
  functions/
  policies/
  storage/

src/
  app/
  components/
  features/
  services/
  hooks/
  lib/
  api/
  types/

This architecture remains entirely within the Vercel + Supabase ecosystem, using TypeScript end-to-end for application logic and PostgreSQL in Supabase for persistence. Authentication, storage, realtime updates, row-level security, API routes, and deployment are all handled by these two platforms, eliminating the need for additional infrastructure while keeping the system fully owned and extensible.