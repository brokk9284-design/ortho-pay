import type { Escrow, EscrowEvent, EscrowDocument, EscrowMilestone, EscrowType, Currency, PaymentRail } from "@/types";

export interface IEscrowEngine {
  createEscrow(buyerId: string, providerId: string | null, type: EscrowType, grossAmount: number, feeAmount: number, currency: Currency, rail: PaymentRail): Promise<Escrow>;
  transitionState(escrowId: string, toStatus: string, actorId: string): Promise<Escrow>;
  startTimer(escrowId: string, timerType: string, durationSeconds: number): Promise<void>;
  expireEscrow(escrowId: string): Promise<void>;
  releaseEscrow(escrowId: string, releasedBy: string): Promise<void>;
  refundEscrow(escrowId: string, refundedBy: string): Promise<void>;
  addMilestone(escrowId: string, description: string, percentage: number): Promise<EscrowMilestone>;
  approveMilestone(milestoneId: string, approvedBy: string): Promise<void>;
  addDocument(escrowId: string, uploadedBy: string, fileUrl: string, fileType: string, description: string): Promise<EscrowDocument>;
  getEscrowHistory(escrowId: string): Promise<EscrowEvent[]>;
}
