export interface TrustScore {
  id: string;
  user_id: string;
  score: number;
  identity_verification: number;
  transaction_volume: number;
  completion_rate: number;
  response_time: number;
  dispute_rate: number;
  chargeback_rate: number;
  cancellation_rate: number;
  account_age_days: number;
  community_feedback: number;
  snapshot_at: string;
}

export interface LiquidityScore {
  id: string;
  provider_id: string;
  score: number;
  available_liquidity: number;
  reliability: number;
  settlement_history: number;
  acceptance_rate: number;
  availability: number;
  response_speed: number;
  snapshot_at: string;
}

export interface UserStatistics {
  user_id: string;
  total_transactions: number;
  completed_transactions: number;
  disputed_transactions: number;
  cancelled_transactions: number;
  total_volume: number;
  average_fulfillment_time_hours: number;
  average_response_time_hours: number;
  distinct_counterparties: number;
  first_transaction_at: string | null;
  last_transaction_at: string | null;
  updated_at: string;
}

export interface ProviderStatistics {
  provider_id: string;
  total_offers: number;
  accepted_offers: number;
  rejected_offers: number;
  withdrawn_offers: number;
  total_settled: number;
  average_settlement_time_hours: number;
  acceptance_rate: number;
  completion_rate: number;
  dispute_rate: number;
  total_liquidity_provided: number;
  updated_at: string;
}

export interface PerformanceHistory {
  id: string;
  user_id: string;
  transaction_id: string;
  metric: string;
  value: number;
  recorded_at: string;
}
