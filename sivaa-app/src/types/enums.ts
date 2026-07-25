export type UserRole = "consumer" | "provider" | "merchant" | "business" | "enterprise" | "admin" | "support" | "compliance";

export type VerificationLevel = "unverified" | "pending" | "verified" | "rejected";

export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export type WalletStatus = "active" | "frozen" | "suspended";

export type Currency = "USD" | "EUR" | "GBP" | "CAD";

export type PaymentRail = "faster_payments" | "sepa" | "sepa_instant" | "ach" | "interac" | "internal";

export type MarketplacePool = "instant" | "standard" | "business" | "merchant" | "premium" | "institutional";

export type OrderSide = "buy" | "sell";

export type OrderStatus = "open" | "matched" | "partially_matched" | "cancelled" | "expired";

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn" | "expired";

export type EscrowType = "manual" | "automatic" | "delivery" | "digital_goods" | "milestone" | "subscription" | "multi_party";

export type EscrowStatus = "created" | "funded" | "held" | "released" | "reversed" | "expired" | "disputed";

export type SettlementStatus = "pending" | "in_progress" | "completed" | "failed" | "retrying";

export type TransactionStatus = "pending" | "processing" | "completed" | "failed" | "reversed";

export type DisputeStatus = "open" | "review" | "evidence" | "decision" | "appeal" | "closed";

export type DisputeInitiator = "buyer" | "provider" | "merchant" | "business" | "administrator";

export type NotificationChannel = "email" | "sms" | "push" | "in_app" | "realtime";

export type NotificationCategory = "escrow" | "marketplace" | "payments" | "verification" | "security" | "system";

export type NotificationDeliveryStatus = "pending" | "sent" | "failed" | "delivered";

export type LedgerDirection = "credit" | "debit";

export type LedgerCategory =
  | "payment_in"
  | "payment_out"
  | "escrow_hold"
  | "escrow_release"
  | "escrow_refund"
  | "deposit"
  | "withdrawal"
  | "fee"
  | "adjust_in"
  | "adjust_out"
  | "settlement"
  | "fx_conversion";

export type RiskDecision = "auto_approve" | "standard_review" | "enhanced_review" | "auto_block";

export type EventType =
  | "USER_REGISTERED"
  | "ESCROW_CREATED"
  | "MATCH_FOUND"
  | "PAYMENT_SENT"
  | "PAYMENT_RECEIVED"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED"
  | "WITHDRAWAL_COMPLETED"
  | "SETTLEMENT_COMPLETED"
  | "LEDGER_UPDATED"
  | "NOTIFICATION_SENT"
  | "ESCROW_RELEASED"
  | "ESCROW_REFUNDED"
  | "ESCROW_EXPIRED"
  | "OFFER_ACCEPTED"
  | "OFFER_REJECTED"
  | "REPUTATION_UPDATED"
  | "FEE_CALCULATED"
  | "RISK_ASSESSED"
  | "KYC_SUBMITTED"
  | "KYC_APPROVED"
  | "KYC_REJECTED";

export type ActorType = "user" | "admin" | "system";
