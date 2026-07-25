import type { RiskEvent, RiskFactors, RiskDecision } from "@/types";

export interface IRiskEngine {
  assessRisk(userId: string, transactionId: string | null, factors: RiskFactors): Promise<RiskEvent>;
  getRiskDecision(score: number): RiskDecision;
  logRiskEvent(event: RiskEvent): Promise<void>;
  screenSanctions(userId: string): Promise<boolean>;
  checkVelocity(userId: string): Promise<number>;
  getRiskEvent(transactionId: string): Promise<RiskEvent | null>;
}
