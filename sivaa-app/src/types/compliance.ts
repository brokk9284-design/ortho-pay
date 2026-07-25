import type { RiskDecision } from "./enums";

export interface RiskEvent {
  id: string;
  transaction_id: string | null;
  user_id: string;
  risk_score: number;
  decision: RiskDecision;
  factors: RiskFactors;
  assessed_at: string;
}

export interface RiskFactors {
  account_age_days: number;
  kyc_status: string;
  transaction_frequency_30d: number;
  average_transaction_amount_30d: number;
  distinct_counterparties_30d: number;
  transaction_amount: number;
  amount_vs_historical_average: number;
  payment_method_risk_weight: number;
  time_of_day: number;
  time_since_last_transaction: number;
  counterparty_risk_score: number;
  previous_disputes_count: number;
  previous_rejections_count: number;
  deposits_last_1h: number;
  deposits_last_24h: number;
  withdrawals_last_1h: number;
  withdrawals_last_24h: number;
  total_volume_last_24h: number;
  velocity_score: number;
  device_fingerprint: string | null;
  ip_address: string | null;
  geolocation: string | null;
}

export interface AmlCheck {
  id: string;
  user_id: string;
  check_type: "transaction" | "onboarding" | "periodic";
  status: "clear" | "flagged" | "blocked";
  risk_level: "low" | "medium" | "high" | "critical";
  details: Record<string, unknown> | null;
  checked_at: string;
}

export interface SanctionsCheck {
  id: string;
  user_id: string;
  screen_type: "name" | "entity" | "transaction";
  matched: boolean;
  match_details: Record<string, unknown> | null;
  checked_at: string;
}

export interface DeviceHistory {
  id: string;
  user_id: string;
  device_fingerprint: string;
  user_agent: string;
  ip_address: string;
  first_seen: string;
  last_seen: string;
}

export interface IpHistory {
  id: string;
  user_id: string;
  ip_address: string;
  geolocation: string | null;
  first_seen: string;
  last_seen: string;
}
