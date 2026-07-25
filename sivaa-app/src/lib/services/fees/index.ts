import type { FeeCalculation, FeeBreakdown, FeeCalculationInput } from "@/types";

export interface IFeeEngine {
  calculateFee(input: FeeCalculationInput): Promise<FeeCalculation>;
  getFeeBreakdown(input: FeeCalculationInput): Promise<FeeBreakdown>;
  applyPromotion(code: string, baseFee: number): Promise<number>;
  getFeeHistory(): Promise<Array<{ id: string; changed_at: string; old_value: unknown; new_value: unknown }>>;
}
