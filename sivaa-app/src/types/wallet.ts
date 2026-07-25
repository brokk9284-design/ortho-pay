import type { Currency, WalletStatus, LedgerDirection, LedgerCategory } from "./enums";

export interface Wallet {
  wallet_id: string;
  user_id: string;
  available_balance: number;
  reserved_balance: number;
  pending_balance: number;
  lifetime_volume: number;
  currency: Currency;
  status: WalletStatus;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  wallet_id: string;
  currency: Currency;
  available: number;
  reserved: number;
  pending: number;
  snapshot_at: string;
}

export interface LedgerEntry {
  id: string;
  wallet_id: string;
  transaction_id: string | null;
  direction: LedgerDirection;
  credit: number;
  debit: number;
  balance_before: number;
  balance_after: number;
  currency: Currency;
  category: LedgerCategory;
  reference: string | null;
  created_at: string;
}

export interface WalletReservation {
  id: string;
  wallet_id: string;
  amount: number;
  currency: Currency;
  reason: string;
  expires_at: string;
  created_at: string;
}

export interface WalletLimit {
  id: string;
  wallet_id: string;
  daily_limit: number;
  single_transaction_limit: number;
  monthly_limit: number;
  currency: Currency;
  updated_at: string;
}

export interface BalanceReconciliation {
  wallet_id: string;
  ledger_sum: number;
  stored_balance: number;
  difference: number;
  reconciled_at: string;
}
