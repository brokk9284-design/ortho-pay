import type { TrustScore, LiquidityScore, UserStatistics, ProviderStatistics } from "@/types";

export interface IReputationEngine {
  calculateTrustScore(userId: string): Promise<TrustScore>;
  calculateLiquidityScore(providerId: string): Promise<LiquidityScore>;
  updateScores(userId: string): Promise<void>;
  getScoreHistory(userId: string): Promise<TrustScore[]>;
  getProviderRanking(limit: number): Promise<Array<{ provider_id: string; rank: number; trust_score: number; liquidity_score: number }>>;
  getUserStatistics(userId: string): Promise<UserStatistics | null>;
  getProviderStatistics(providerId: string): Promise<ProviderStatistics | null>;
}
