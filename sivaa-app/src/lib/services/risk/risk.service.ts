import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { RiskEvent, RiskFactors, RiskDecision } from "@/types";
import type { IRiskEngine } from "./index";

export class RiskEngine implements IRiskEngine {
  async assessRisk(userId: string, transactionId: string | null, factors: RiskFactors): Promise<RiskEvent> {
    const score = this.calculateScore(factors);
    const decision = this.getRiskDecision(score);

    const event: RiskEvent = {
      id: crypto.randomUUID(),
      transaction_id: transactionId,
      user_id: userId,
      risk_score: score,
      decision,
      factors,
      assessed_at: new Date().toISOString(),
    };

    await this.logRiskEvent(event);
    return event;
  }

  getRiskDecision(score: number): RiskDecision {
    if (score < 20) return "auto_approve";
    if (score < 50) return "standard_review";
    if (score < 80) return "enhanced_review";
    return "auto_block";
  }

  async logRiskEvent(event: RiskEvent): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    const { error } = await supabase.from("risk_events").insert({
      id: event.id,
      transaction_id: event.transaction_id,
      user_id: event.user_id,
      risk_score: event.risk_score,
      decision: event.decision,
      factors: event.factors,
      assessed_at: event.assessed_at,
    });

    if (error) logger.error("Failed to log risk event", { userId: event.user_id }, new Error(error.message));
  }

  async screenSanctions(userId: string): Promise<boolean> {
    const supabase = await createSupabaseAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", userId)
      .single();

    if (!profile) return false;

    return true;
  }

  async checkVelocity(userId: string): Promise<number> {
    const supabase = await createSupabaseAdminClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .gte("created_at", oneHourAgo);

    return count || 0;
  }

  async getRiskEvent(transactionId: string): Promise<RiskEvent | null> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("risk_events")
      .select("*")
      .eq("transaction_id", transactionId)
      .single();
    return data as RiskEvent | null;
  }

  private calculateScore(factors: RiskFactors): number {
    let score = 0;

    if (factors.account_age_days < 7) score += 15;
    else if (factors.account_age_days < 30) score += 8;

    if (factors.kyc_status !== "verified") score += 20;

    if (factors.transaction_frequency_30d > 50) score += 15;
    if (factors.amount_vs_historical_average > 3) score += 20;

    if (factors.previous_disputes_count > 3) score += 15;
    if (factors.previous_rejections_count > 2) score += 10;

    if (factors.deposits_last_1h > 5) score += 10;
    if (factors.withdrawals_last_24h > 10) score += 10;

    if (factors.time_of_day < 6 || factors.time_of_day > 22) score += 5;

    return Math.min(100, score);
  }
}

export const riskEngine = new RiskEngine();
