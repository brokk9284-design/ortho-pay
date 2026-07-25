import type { Currency, PaymentRail } from "@/types";

export interface IPaymentRailAdapter {
  execute(settlementId: string, amount: number, currency: Currency, recipientAccount: string): Promise<{ success: boolean; reference: string | null; error?: string }>;
  getEstimatedTimeHours(): number;
  validateAccount(account: string): boolean;
}

export class FasterPaymentsAdapter implements IPaymentRailAdapter {
  async execute(settlementId: string, amount: number, currency: Currency, recipientAccount: string): Promise<{ success: boolean; reference: string | null; error?: string }> {
    if (currency !== "GBP") return { success: false, reference: null, error: "Faster Payments only supports GBP" };
    if (!this.validateAccount(recipientAccount)) return { success: false, reference: null, error: "Invalid UK account number" };
    return { success: true, reference: `FP-${settlementId}-${Date.now()}` };
  }
  getEstimatedTimeHours(): number { return 2; }
  validateAccount(account: string): boolean { return /^\d{8}$/.test(account); }
}

export class SepaAdapter implements IPaymentRailAdapter {
  async execute(settlementId: string, amount: number, currency: Currency, recipientAccount: string): Promise<{ success: boolean; reference: string | null; error?: string }> {
    if (currency !== "EUR") return { success: false, reference: null, error: "SEPA only supports EUR" };
    if (!this.validateAccount(recipientAccount)) return { success: false, reference: null, error: "Invalid IBAN" };
    return { success: true, reference: `SEPA-${settlementId}-${Date.now()}` };
  }
  getEstimatedTimeHours(): number { return 24; }
  validateAccount(account: string): boolean { return /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(account); }
}

export class SepaInstantAdapter implements IPaymentRailAdapter {
  async execute(settlementId: string, amount: number, currency: Currency, recipientAccount: string): Promise<{ success: boolean; reference: string | null; error?: string }> {
    if (currency !== "EUR") return { success: false, reference: null, error: "SEPA Instant only supports EUR" };
    if (!this.validateAccount(recipientAccount)) return { success: false, reference: null, error: "Invalid IBAN" };
    return { success: true, reference: `SEPAI-${settlementId}-${Date.now()}` };
  }
  getEstimatedTimeHours(): number { return 0.1; }
  validateAccount(account: string): boolean { return /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(account); }
}

export class AchAdapter implements IPaymentRailAdapter {
  async execute(settlementId: string, amount: number, currency: Currency, recipientAccount: string): Promise<{ success: boolean; reference: string | null; error?: string }> {
    if (currency !== "USD") return { success: false, reference: null, error: "ACH only supports USD" };
    if (!this.validateAccount(recipientAccount)) return { success: false, reference: null, error: "Invalid US account number" };
    return { success: true, reference: `ACH-${settlementId}-${Date.now()}` };
  }
  getEstimatedTimeHours(): number { return 72; }
  validateAccount(account: string): boolean { return /^\d{9,17}$/.test(account); }
}

export class InteracAdapter implements IPaymentRailAdapter {
  async execute(settlementId: string, amount: number, currency: Currency, recipientAccount: string): Promise<{ success: boolean; reference: string | null; error?: string }> {
    if (currency !== "CAD") return { success: false, reference: null, error: "Interac only supports CAD" };
    if (!this.validateAccount(recipientAccount)) return { success: false, reference: null, error: "Invalid Canadian account" };
    return { success: true, reference: `INTERAC-${settlementId}-${Date.now()}` };
  }
  getEstimatedTimeHours(): number { return 0.1; }
  validateAccount(account: string): boolean { return /^\d{7,12}$/.test(account); }
}

export class InternalTransferAdapter implements IPaymentRailAdapter {
  async execute(settlementId: string, amount: number, _currency: Currency, _recipientAccount: string): Promise<{ success: boolean; reference: string | null; error?: string }> {
    return { success: true, reference: `INT-${settlementId}-${Date.now()}` };
  }
  getEstimatedTimeHours(): number { return 0; }
  validateAccount(_account: string): boolean { return true; }
}

const adapters: Record<PaymentRail, IPaymentRailAdapter> = {
  faster_payments: new FasterPaymentsAdapter(),
  sepa: new SepaAdapter(),
  sepa_instant: new SepaInstantAdapter(),
  ach: new AchAdapter(),
  interac: new InteracAdapter(),
  internal: new InternalTransferAdapter(),
};

export function getRailAdapter(rail: PaymentRail): IPaymentRailAdapter {
  return adapters[rail];
}

export function getEstimatedTime(rail: PaymentRail): number {
  return adapters[rail].getEstimatedTimeHours();
}
