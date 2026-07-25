import type { MatchResult, MatchScoreBreakdown, MarketplaceOrder, Currency, PaymentRail } from "@/types";

export interface IMatchingEngine {
  findMatches(order: MarketplaceOrder): Promise<MatchResult[]>;
  scoreProvider(order: MarketplaceOrder, providerId: string): Promise<MatchScoreBreakdown>;
  reserveMatch(orderId: string, providerId: string, amount: number, ttlSeconds: number): Promise<MatchResult>;
  partialFulfillment(order: MarketplaceOrder): Promise<MatchResult[]>;
  smartRouting(order: MarketplaceOrder): Promise<MatchResult | null>;
}
