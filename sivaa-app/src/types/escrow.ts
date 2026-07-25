import type { EscrowType, EscrowStatus, Currency, PaymentRail } from "./enums";

export interface Escrow {
  id: string;
  buyer_id: string;
  provider_id: string | null;
  type: EscrowType;
  status: EscrowStatus;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  currency: Currency;
  payment_rail: PaymentRail;
  reference: string;
  timer_expires_at: string | null;
  released_at: string | null;
  reversed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EscrowParticipant {
  id: string;
  escrow_id: string;
  user_id: string;
  role: "buyer" | "provider" | "merchant" | "arbiter";
  joined_at: string;
}

export interface EscrowEvent {
  id: string;
  escrow_id: string;
  event_type: string;
  actor_id: string;
  actor_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface EscrowDocument {
  id: string;
  escrow_id: string;
  uploaded_by: string;
  file_url: string;
  file_type: string;
  description: string | null;
  created_at: string;
}

export interface EscrowTimer {
  id: string;
  escrow_id: string;
  timer_type: "auto_release" | "expiry" | "milestone";
  expires_at: string;
  executed: boolean;
  created_at: string;
}

export interface EscrowRelease {
  id: string;
  escrow_id: string;
  amount: number;
  released_by: string;
  release_type: "manual" | "automatic" | "milestone" | "delivery";
  settlement_id: string | null;
  created_at: string;
}

export interface EscrowMilestone {
  id: string;
  escrow_id: string;
  description: string;
  percentage: number;
  amount: number;
  status: "pending" | "approved" | "released";
  approved_by: string | null;
  approved_at: string | null;
  released_at: string | null;
  created_at: string;
}
