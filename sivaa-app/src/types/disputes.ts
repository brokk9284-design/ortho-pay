import type { DisputeStatus, DisputeInitiator } from "./enums";

export interface Dispute {
  id: string;
  escrow_id: string;
  transaction_id: string | null;
  initiated_by: DisputeInitiator;
  initiator_id: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolved_by: string | null;
  resolution: string | null;
  resolution_type: "buyer_favor" | "provider_favor" | "split" | "refund" | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  message: string;
  created_at: string;
}

export interface DisputeEvidence {
  id: string;
  dispute_id: string;
  uploaded_by: string;
  file_url: string;
  file_type: "image" | "pdf" | "video" | "receipt" | "tracking" | "log" | "other";
  description: string | null;
  created_at: string;
}

export interface DisputeDecision {
  id: string;
  dispute_id: string;
  decided_by: string;
  decision: "buyer_favor" | "provider_favor" | "split" | "refund";
  reasoning: string;
  financial_impact: number;
  created_at: string;
}

export interface DisputeAction {
  id: string;
  dispute_id: string;
  action: string;
  performed_by: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
