import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { cacheSet, cacheGet, buildCacheKey } from "@/lib/redis";
import type { MatchResult, MatchScoreBreakdown, MarketplaceOrder, Currency, PaymentRail } from "@/types";
import type { IMatchingEngine } from "./index";

const WEIGHTS = {
  liquidity: 0.25,
  trust: 0.20,
  speed: 0.15,
  success_rate: 0.15,
  geo_match: 0.05,
  currency_match: 0.05,
  rail_match: 0.05,
  pricing: 0.05,
  dispute_penalty: 0.03,
  cancellation_penalty: 0.02,
};

const RESERVATION_TTL = 300;

export class MatchingEngine implements IMatchingEngine {
  async findMatches(order: MarketplaceOrder): Promise<MatchResult[]> {
    const supabase = await createSupabaseAdminClient();

    const { data: providers } = await supabase
      .from("provider_availability")
      .select("provider_id, available_liquidity, currency, payment_rails")
      .eq("online", true)
      .eq("currency", order.currency)
      .contains("payment_rails", [order.payment_rail]);

    if (!providers || providers.length === 0) return [];

    const scored = await Promise.all(
      providers.map(async (p) => {
        const result = await this.scoreProvider(order, p.provider_id);
        return { providerId: p.provider_id, result, availableLiquidity: Number(p.available_liquidity) };
      })
    );

    scored.sort((a, b) => b.result.total - a.result.total);

    const results: MatchResult[] = [];
    for (const s of scored) {
      if (s.result.total < 0.3) continue;

      const amountMatched = Math.min(order.amount, s.availableLiquidity);
      const feeTotal = (amountMatched * s.result.total) / 100;
      const expiresAt = new Date(Date.now() + RESERVATION_TTL * 1000).toISOString();

      results.push({
        order_id: order.id,
        provider_id: s.providerId,
        match_score: s.result.total,
        amount_matched: amountMatched,
        fee_total: feeTotal,
        settlement_time_hours: 24,
        reservation_expiry: expiresAt,
      });

      if (results.length >= 10) break;
    }

    return results;
  }

  async scoreProvider(order: MarketplaceOrder, providerId: string): Promise<MatchScoreBreakdown> {
    const supabase = await createSupabaseAdminClient();

    const [trustScoreResult, liquidityScoreResult, providerStatsResult, availabilityResult] = await Promise.all([
      supabase.from("trust_scores").select("score").eq("user_id", providerId).single(),
      supabase.from("liquidity_scores").select("score, available_liquidity").eq("provider_id", providerId).single(),
      supabase.from("provider_statistics").select("completion_rate, acceptance_rate, dispute_rate, response_time_avg").eq("provider_id", providerId).single(),
      supabase.from("provider_availability").select("available_liquidity").eq("provider_id", providerId).eq("currency", order.currency).single(),
    ]);

    const trustScore = trustScoreResult.data;
    const liquidityScore = liquidityScoreResult.data;
    const providerStats = providerStatsResult.data;
    const availability = availabilityResult.data;

    const stats = providerStats || {
      completion_rate: 0,
      acceptance_rate: 0,
      dispute_rate: 0,
      response_time_avg: 24,
    };

    const ts = trustScore?.score || 0;
    const availLiquidity = Number(availability?.available_liquidity || 0);

    const liquidity = Math.min(1, availLiquidity / order.amount);
    const trust = ts / 100;
    const speed = 1 - Math.min(1, Number(stats.response_time_avg || 24) / 168);
    const successRate = Number(stats.completion_rate || 0);
    const geoMatch = 1;
    const currencyMatch = 1;
    const railMatch = 1;
    const pricing = 0.5;
    const disputeRatePenalty = Number(stats.dispute_rate || 0);
    const cancellationRatePenalty = 0;
    const riskPenalty = 0;

    const total =
      liquidity * WEIGHTS.liquidity +
      trust * WEIGHTS.trust +
      speed * WEIGHTS.speed +
      successRate * WEIGHTS.success_rate +
      geoMatch * WEIGHTS.geo_match +
      currencyMatch * WEIGHTS.currency_match +
      railMatch * WEIGHTS.rail_match +
      pricing * WEIGHTS.pricing -
      disputeRatePenalty * WEIGHTS.dispute_penalty -
      cancellationRatePenalty * WEIGHTS.cancellation_penalty -
      riskPenalty;

    return {
      liquidity,
      trust,
      speed,
      success_rate: successRate,
      geo_match: geoMatch,
      currency_match: currencyMatch,
      rail_match: railMatch,
      pricing,
      dispute_rate_penalty: disputeRatePenalty,
      cancellation_rate_penalty: cancellationRatePenalty,
      risk_penalty: riskPenalty,
      total: Math.max(0, Math.min(1, total)),
    };
  }

  async reserveMatch(orderId: string, providerId: string, amount: number, ttlSeconds: number): Promise<MatchResult> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const result: MatchResult = {
      order_id: orderId,
      provider_id: providerId,
      match_score: 0,
      amount_matched: amount,
      fee_total: 0,
      settlement_time_hours: 24,
      reservation_expiry: expiresAt,
    };

    await cacheSet(buildCacheKey("match_reservation", orderId, providerId), result, ttlSeconds);
    return result;
  }

  async partialFulfillment(order: MarketplaceOrder): Promise<MatchResult[]> {
    return this.findMatches(order);
  }

  async smartRouting(order: MarketplaceOrder): Promise<MatchResult | null> {
    const matches = await this.findMatches(order);
    return matches[0] || null;
  }
}

export const matchingEngine = new MatchingEngine();
