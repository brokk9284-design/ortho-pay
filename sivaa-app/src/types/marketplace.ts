import type { Currency, PaymentRail, MarketplacePool, OrderSide, OrderStatus, OfferStatus } from "./enums";

export interface MarketplaceOrder {
  id: string;
  user_id: string;
  side: OrderSide;
  amount: number;
  currency: Currency;
  payment_rail: PaymentRail;
  pool_type: MarketplacePool;
  status: OrderStatus;
  matched_amount: number;
  description: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderOffer {
  id: string;
  order_id: string;
  provider_id: string;
  fee_percentage: number;
  fee_fixed: number;
  settlement_time_hours: number;
  amount_offered: number;
  status: OfferStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketDepth {
  currency: Currency;
  payment_rail: PaymentRail;
  pool_type: MarketplacePool;
  buy_volume: number;
  sell_volume: number;
  provider_count: number;
  updated_at: string;
}

export interface MatchingQueueEntry {
  id: string;
  order_id: string;
  priority_score: number;
  queued_at: string;
}

export interface ProviderRanking {
  provider_id: string;
  rank: number;
  trust_score: number;
  liquidity_score: number;
  completion_rate: number;
  response_time_avg: number;
  currency: Currency;
  payment_rail: PaymentRail;
  updated_at: string;
}

export interface ProviderAvailability {
  provider_id: string;
  online: boolean;
  available_liquidity: number;
  currency: Currency;
  payment_rails: PaymentRail[];
  last_heartbeat: string;
}

export interface MatchResult {
  order_id: string;
  provider_id: string;
  match_score: number;
  amount_matched: number;
  fee_total: number;
  settlement_time_hours: number;
  reservation_expiry: string;
}

export interface MatchScoreBreakdown {
  liquidity: number;
  trust: number;
  speed: number;
  success_rate: number;
  geo_match: number;
  currency_match: number;
  rail_match: number;
  pricing: number;
  dispute_rate_penalty: number;
  cancellation_rate_penalty: number;
  risk_penalty: number;
  total: number;
}
