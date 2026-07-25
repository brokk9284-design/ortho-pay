import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { FeeCalculation, FeeBreakdown, FeeCalculationInput } from "@/types";
import type { IFeeEngine } from "./index";

const BASE_FEE_PERCENTAGE = 1.5;
const MIN_FEE_PERCENTAGE = 0.5;
const MAX_FEE_PERCENTAGE = 5.0;

export class FeeEngine implements IFeeEngine {
  async calculateFee(input: FeeCalculationInput): Promise<FeeCalculation> {
    const breakdown = await this.getFeeBreakdown(input);

    const totalFee = (input.amount * breakdown.total) / 100;

    return {
      id: crypto.randomUUID(),
      transaction_id: null,
      base_fee: breakdown.base_fee,
      risk_premium: breakdown.risk_premium,
      loyalty_discount: breakdown.loyalty_discount,
      liquidity_premium: breakdown.liquidity_premium,
      urgency_premium: breakdown.urgency_premium,
      total_fee: Math.round(totalFee * 100) / 100,
      fee_percentage: breakdown.total,
      currency: input.currency,
      breakdown,
      created_at: new Date().toISOString(),
    };
  }

  async getFeeBreakdown(input: FeeCalculationInput): Promise<FeeBreakdown> {
    const baseFee = BASE_FEE_PERCENTAGE;

    // Risk premium: higher for new users with low success rate
    const successRateFactor = input.user_success_rate / 100;
    const txCountFactor = Math.min(1, input.user_transaction_count / 50);
    const riskPremium = Math.max(0, (1 - successRateFactor) * 0.5 + (1 - txCountFactor) * 0.3);

    // Loyalty discount: up to 0.5% off for high volume users
    const loyaltyDiscount = Math.min(0.5, txCountFactor * 0.5);

    // Liquidity premium: higher when queue depth is high
    const totalQueue = input.deposit_queue_depth + input.withdrawal_queue_depth;
    const liquidityPremium = Math.min(1, totalQueue / 100 * 0.2);

    // Urgency premium: priority requests cost more
    const urgencyPremium = input.requested_priority ? 0.5 : 0;

    let total = baseFee + riskPremium - loyaltyDiscount + liquidityPremium + urgencyPremium;
    total = Math.max(MIN_FEE_PERCENTAGE, Math.min(MAX_FEE_PERCENTAGE, total));

    const explanation = [
      `Base fee: ${baseFee}%`,
      `Risk premium: +${riskPremium.toFixed(2)}%`,
      `Loyalty discount: -${loyaltyDiscount.toFixed(2)}%`,
      `Liquidity premium: +${liquidityPremium.toFixed(2)}%`,
      `Urgency premium: +${urgencyPremium}%`,
      `Total: ${total.toFixed(2)}%`,
    ].join(", ");

    return {
      base_fee: baseFee,
      risk_premium: riskPremium,
      loyalty_discount: loyaltyDiscount,
      liquidity_premium: liquidityPremium,
      urgency_premium: urgencyPremium,
      total,
      explanation,
    };
  }

  async applyPromotion(code: string, baseFee: number): Promise<number> {
    const supabase = await createSupabaseAdminClient();
    const { data: promo } = await supabase
      .from("promotions")
      .select("fee_discount_percentage, max_uses, uses_count, valid_until, active")
      .eq("code", code)
      .single();

    if (!promo || !promo.active) return baseFee;
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) return baseFee;
    if (promo.max_uses && promo.uses_count >= promo.max_uses) return baseFee;

    const discount = (baseFee * Number(promo.fee_discount_percentage)) / 100;
    return Math.max(0, baseFee - discount);
  }

  async getFeeHistory(): Promise<Array<{ id: string; changed_at: string; old_value: unknown; new_value: unknown }>> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("fee_rules")
      .select("id, created_at, updated_at, fee_percentage")
      .order("updated_at", { ascending: false })
      .limit(20);

    return (data || []).map((r) => ({
      id: r.id,
      changed_at: r.updated_at || r.created_at,
      old_value: null,
      new_value: r.fee_percentage,
    }));
  }
}

export const feeEngine = new FeeEngine();
