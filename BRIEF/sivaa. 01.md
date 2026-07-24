This fits naturally into your UIOS architecture because the application is essentially a Payment Decision & Settlement Platform rather than just a wallet. The UI should remain simple, while the backend uses the intelligence architecture for verification, routing, fraud detection, reconciliation, and auditing.

Mobile App Specification

Project: Payment Middleman Platform (Working Name)


---

1. Objective

A mobile-first payment intermediary that enables users to send money to each other using a unique user identifier.

Instead of transferring directly to another person's bank, the payer transfers to the platform using one of the supported payment methods.

The platform verifies the payment, deducts its fee, credits the recipient, and records the transaction.


---

2. User Journey

Register

↓

Verify Account

↓

Receive Unique ID (§12345678)

↓

Search Recipient

↓

Enter Amount

↓

Fee Calculated

↓

Choose Payment Method

↓

Display Payment Details

↓

User Pays

↓

Click:
"I Have Made Payment"

↓

Verification

↓

Approved

↓

Recipient Credited

↓

Receipt

↓

History Updated


---

3. Main Navigation

Bottom Navigation (5 Tabs)

Home

Payments

Activity

Notifications

Profile


---

4. Authentication

Pages

Splash

Onboarding

Login

Register

OTP Verification

PIN Creation

Forgot Password

Device Verification



---

5. Home Dashboard

Displays

Balance

Pending Payments

Total Received

Total Sent

Quick Send

Recent Activity

Notifications

Verification Status


Quick Actions

Send

Receive

Payment History

Share ID

QR Code



---

6. Send Payment Flow

Recipient

↓

Enter §ID

↓

Recipient Found

↓

Confirm Name

↓

Enter Amount

↓

Fee Calculation

↓

Choose Payment Method

↓

View Account Details

↓

Transfer Money

↓

Click

"I Have Paid"

↓

Upload Receipt (Optional)

↓

Verification

↓

Success


---

7. Receive Screen

Displays

Personal QR

§ID

Share Button

Copy ID

Recent Incoming Payments



---

8. Activity Screen

Tabs

Sent

Received

Pending

Cancelled

Failed

Completed

Each transaction includes:

Sender

Receiver

Amount

Fee

Net Amount

Time

Status

Reference



---

9. Notifications

Payment received

Payment failed

Verification complete

Verification pending

System announcements

Security alerts


---

10. Profile

Personal Information

KYC

Linked Banks

Payment Methods

Security

PIN

Password

Support

Logout


---

11. Fee Engine

≤ ₦5,000

Fee = 3%

------------------

₦5,001–₦9,999

Fee = 2%

------------------

≥ ₦10,000

Fee = 1%

Database

fee_rules

rule_id

minimum_amount

maximum_amount

percentage

active


---

12. Payment Methods

Examples

Bank Transfer

USSD

Card

Wallet

Crypto

Internal Balance

Each method has

payment_methods

id

name

instructions

account_number

bank

status


---

13. User Schema

users

id UUID

public_id (§12345678)

name

phone

email

pin_hash

password_hash

kyc_status

created_at


---

14. Wallet Schema

wallets

wallet_id

user_id

balance

locked_balance

currency

status


---

15. Payment Schema

payments

payment_id

sender_id

receiver_id

gross_amount

fee_amount

net_amount

payment_method

reference

status

created_at


---

16. Verification Schema

payment_verifications

verification_id

payment_id

verification_method

verified

verified_by

verified_at


---

17. Transaction History

transaction_history

history_id

payment_id

actor

action

timestamp


---

18. Notifications

notifications

notification_id

user_id

title

message

read

created_at


---

19. Support

support_tickets

ticket_id

user_id

category

priority

status

assigned_to


---

20. Admin Dashboard

Users

Payments

Verifications

Pending Payments

Fee Reports

Revenue

Fraud Alerts

Support

Audit Logs

Analytics


---

21. Backend Stack

Language

TypeScript


Runtime

Node.js


Framework

NestJS


ORM

Prisma


Database

PostgreSQL


Cache

Redis


Realtime

Socket.IO


Queue

BullMQ


Authentication

JWT

Refresh Tokens


Validation

Zod


Storage

S3-compatible storage (receipts)



---

22. Mobile Stack

React Native

Expo

TypeScript

React Navigation

TanStack Query

Zustand

React Hook Form

NativeWind (Tailwind)



---

23. UI Theme

Minimal financial UI.

Primary screens should expose only:

Amount

Fee

Recipient

Status

Confirmation


No clutter.

Every screen should require no more than three taps to reach its primary action.


---

24. Future Intelligence Modules (UIOS Integration)

Because this aligns with your architecture, the app can later integrate selected UIOS engines:

QOF: Validate payment completeness before submission.

ARUEV: Detect fraud signals, inconsistent payment evidence, and verification uncertainty.

RGE: Recommend the fastest or cheapest payment method based on user history.

MOE: Monitor settlement latency, failed transactions, and system health.

LME: Learn user payment patterns to improve fraud detection and routing.

MME: Maintain long-term payment history and relationship graphs.

XTE: Provide a complete audit trail explaining why a payment was approved, rejected, or flagged.


This separation keeps the first version lightweight while allowing the platform to evolve into an intelligent payment infrastructure without redesigning the core architecture.