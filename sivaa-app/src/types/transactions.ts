import type { TransactionStatus, Currency, PaymentRail, SettlementStatus } from "./enums";

export interface Transaction {
  id: string;
  buyer_id: string;
  provider_id: string | null;
  escrow_id: string | null;
  type: "marketplace" | "deposit" | "withdrawal" | "transfer" | "merchant_payment" | "service_payment";
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  currency: Currency;
  payment_rail: PaymentRail;
  status: TransactionStatus;
  reference: string;
  idempotency_key: string | null;
  risk_score: number | null;
  risk_decision: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  description: string;
  amount: number;
  metadata: Record<string, unknown> | null;
}

export interface TransactionStatusHistory {
  id: string;
  transaction_id: string;
  from_status: TransactionStatus | null;
  to_status: TransactionStatus;
  changed_by: string;
  changed_at: string;
}

export interface TransactionMetadata {
  transaction_id: string;
  key: string;
  value: unknown;
}

export interface Settlement {
  id: string;
  transaction_id: string;
  provider_id: string;
  amount: number;
  currency: Currency;
  payment_rail: PaymentRail;
  status: SettlementStatus;
  reference: string | null;
  idempotency_key: string;
  retry_count: number;
  next_retry_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettlementAttempt {
  id: string;
  settlement_id: string;
  attempt_number: number;
  status: "success" | "failed" | "pending";
  error_message: string | null;
  response_data: Record<string, unknown> | null;
  attempted_at: string;
}

export interface SettlementFailure {
  id: string;
  settlement_id: string;
  failure_reason: string;
  failure_code: string;
  occurred_at: string;
}

export interface PaymentRoute {
  id: string;
  settlement_id: string;
  rail: PaymentRail;
  provider_reference: string | null;
  estimated_time_hours: number;
  actual_time_hours: number | null;
}
