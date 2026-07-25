import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { TrustScore, LiquidityScore, UserStatistics, ProviderStatistics } from "@/types";
import type { IReputationEngine } from "./index";

export class ReputationEngine implements IReputationEngine {
  async calculateTrustScore(userId: string): Promise<TrustScore> {
    const supabase = await createSupabaseAdminClient();

    const { data: stats } = await supabase
      .from("user_statistics")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("kyc_status, created_at")
      .eq("id", userId)
      .single();

    const s = stats as UserStatistics | null;
    const accountAgeDays = profile ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) : 0;
    const completionRate = s && s.total_transactions > 0 ? s.completed_transactions / s.total_transactions : 0;
    const disputeRate = s && s.total_transactions > 0 ? s.disputed_transactions / s.total_transactions : 0;

    const identityVerification = profile?.kyc_status === "verified" ? 100 : 0;
    const transactionVolume = Math.min(100, (s?.total_volume || 0) / 10000);
    const completionScore = completionRate * 100;
    const disputePenalty = disputeRate * 100;
    const accountAgeScore = Math.min(100, accountAgeDays / 365 * 100);

    const score = Math.max(0, Math.min(100,
      identityVerification * 0.2 +
      transactionVolume * 0.2 +
      completionScore * 0.3 +
      accountAgeScore * 0.15 +
      (100 - disputePenalty) * 0.15
    ));

    const trustScore: TrustScore = {
      id: crypto.randomUUID(),
      user_id: userId,
      score: Math.round(score),
      identity_verification: identityVerification,
      transaction_volume: transactionVolume,
      completion_rate: completionRate,
      response_time: s?.average_response_time_hours || 0,
      dispute_rate: disputeRate,
      chargeback_rate: 0,
      cancellation_rate: s && s.total_transactions > 0 ? s.cancelled_transactions / s.total_transactions : 0,
      account_age_days: accountAgeDays,
      community_feedback: 0,
      snapshot_at: new Date().toISOString(),
    };

    await supabase.from("trust_scores").upsert(trustScore).eq("user_id", userId);
    return trustScore;
  }

  async calculateLiquidityScore(providerId: string): Promise<LiquidityScore> {
    const supabase = await createSupabaseAdminClient();

    const { data: stats } = await supabase
      .from("provider_statistics")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    const { data: availability } = await supabase
      .from("provider_availability")
      .select("available_liquidity")
      .eq("provider_id", providerId)
      .single();

    const s = stats as ProviderStatistics | null;
    const availableLiquidity = Number(availability?.available_liquidity || 0);
    const acceptanceRate = s?.acceptance_rate || 0;
    const completionRate = s?.completion_rate || 0;

    const score = Math.max(0, Math.min(100,
      Math.min(100, availableLiquidity / 1000) * 0.4 +
      acceptanceRate * 100 * 0.3 +
      completionRate * 100 * 0.3
    ));

    const liquidityScore: LiquidityScore = {
      id: crypto.randomUUID(),
      provider_id: providerId,
      score: Math.round(score),
      available_liquidity: availableLiquidity,
      reliability: completionRate,
      settlement_history: 0,
      acceptance_rate: acceptanceRate,
      availability: 1,
      response_speed: 0,
      snapshot_at: new Date().toISOString(),
    };

    await supabase.from("liquidity_scores").upsert(liquidityScore).eq("provider_id", providerId);
    return liquidityScore;
  }

  async updateScores(userId: string): Promise<void> {
    await this.calculateTrustScore(userId);

    const supabase = await createSupabaseAdminClient();
    const { data: availability } = await supabase
      .from("provider_availability")
      .select("provider_id")
      .eq("provider_id", userId)
      .single();

    if (availability) {
      await this.calculateLiquidityScore(userId);
    }
  }

  async getScoreHistory(userId: string): Promise<TrustScore[]> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("trust_scores")
      .select("*")
      .eq("user_id", userId)
      .order("snapshot_at", { ascending: false })
      .limit(30);
    return (data || []) as TrustScore[];
  }

  async getProviderRanking(limit: number): Promise<Array<{ provider_id: string; rank: number; trust_score: number; liquidity_score: number }>> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("trust_scores")
      .select("user_id, score")
      .order("score", { ascending: false })
      .limit(limit);

    return (data || []).map((row, i) => ({
      provider_id: row.user_id,
      rank: i + 1,
      trust_score: row.score,
      liquidity_score: 0,
    }));
  }

  async getUserStatistics(userId: string): Promise<UserStatistics | null> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("user_statistics")
      .select("*")
      .eq("user_id", userId)
      .single();
    return data as UserStatistics | null;
  }

  async getProviderStatistics(providerId: string): Promise<ProviderStatistics | null> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("provider_statistics")
      .select("*")
      .eq("provider_id", providerId)
      .single();
    return data as ProviderStatistics | null;
  }
}

export const reputationEngine = new ReputationEngine();
