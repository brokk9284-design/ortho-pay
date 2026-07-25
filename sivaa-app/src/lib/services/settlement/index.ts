import type { Settlement, Currency, PaymentRail } from "@/types";

export interface ISettlementEngine {
  initiateSettlement(transactionId: string, providerId: string, amount: number, currency: Currency, rail: PaymentRail, idempotencyKey: string): Promise<Settlement>;
  selectRail(buyerCountry: string, providerCountry: string, currency: Currency): Promise<PaymentRail>;
  executeSettlement(settlementId: string): Promise<Settlement>;
  retrySettlement(settlementId: string): Promise<Settlement>;
  reconcileSettlement(settlementId: string): Promise<boolean>;
  getSettlement(settlementId: string): Promise<Settlement | null>;
}
