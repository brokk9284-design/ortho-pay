import type { Currency, PaymentRail, MarketplacePool, UserRole } from "./enums";

export interface FeeRule {
  id: string;
  pool_type: MarketplacePool | null;
  payment_rail: PaymentRail | null;
  user_tier: string | null;
  provider_tier: string | null;
  min_amount: number;
  max_amount: number | null;
  fee_percentage: number;
  fee_fixed: number;
  settlement_speed: "instant" | "standard" | "economy" | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeTier {
  id: string;
  tier_name: string;
  min_volume: number;
  fee_discount_percentage: number;
  benefits: Record<string, unknown> | null;
  created_at: string;
}

export interface FeeCalculation {
  id: string;
  transaction_id: string | null;
  base_fee: number;
  risk_premium: number;
  loyalty_discount: number;
  liquidity_premium: number;
  urgency_premium: number;
  total_fee: number;
  fee_percentage: number;
  currency: Currency;
  breakdown: FeeBreakdown;
  created_at: string;
}

export interface FeeBreakdown {
  base_fee: number;
  risk_premium: number;
  loyalty_discount: number;
  liquidity_premium: number;
  urgency_premium: number;
  total: number;
  explanation: string;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  fee_discount_percentage: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

export interface FeeCalculationInput {
  amount: number;
  currency: Currency;
  payment_rail: PaymentRail;
  pool_type: MarketplacePool;
  user_id: string;
  user_tier: string;
  user_transaction_count: number;
  user_success_rate: number;
  deposit_queue_depth: number;
  withdrawal_queue_depth: number;
  requested_priority: boolean;
  time_in_queue_seconds: number;
}
