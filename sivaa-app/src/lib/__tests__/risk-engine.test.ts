import { describe, it, expect } from "vitest";
import { RiskEngine } from "@/lib/services/risk/risk.service";
import type { RiskFactors } from "@/types";

const mockFactors: RiskFactors = {
  account_age_days: 365,
  kyc_status: "verified",
  transaction_frequency_30d: 10,
  average_transaction_amount_30d: 500,
  distinct_counterparties_30d: 5,
  transaction_amount: 1000,
  amount_vs_historical_average: 1.5,
  payment_method_risk_weight: 0,
  time_of_day: 14,
  time_since_last_transaction: 3600,
  counterparty_risk_score: 10,
  previous_disputes_count: 0,
  previous_rejections_count: 0,
  deposits_last_1h: 0,
  deposits_last_24h: 2,
  withdrawals_last_1h: 0,
  withdrawals_last_24h: 1,
  total_volume_last_24h: 1000,
  velocity_score: 10,
  device_fingerprint: null,
  ip_address: null,
  geolocation: null,
};

describe("RiskEngine", () => {
  const engine = new RiskEngine();

  it("auto-approves low risk transactions", () => {
    expect(engine.getRiskDecision(10)).toBe("auto_approve");
    expect(engine.getRiskDecision(19)).toBe("auto_approve");
  });

  it("standard review for moderate risk", () => {
    expect(engine.getRiskDecision(20)).toBe("standard_review");
    expect(engine.getRiskDecision(49)).toBe("standard_review");
  });

  it("enhanced review for high risk", () => {
    expect(engine.getRiskDecision(50)).toBe("enhanced_review");
    expect(engine.getRiskDecision(79)).toBe("enhanced_review");
  });

  it("auto-block for very high risk", () => {
    expect(engine.getRiskDecision(80)).toBe("auto_block");
    expect(engine.getRiskDecision(100)).toBe("auto_block");
  });

  it("assesses risk for verified user with good history", () => {
    const factors = { ...mockFactors };
    const score = (engine as unknown as { calculateScore: (f: RiskFactors) => number }).calculateScore(factors);
    expect(score).toBeLessThan(20);
  });

  it("high risk for new unverified user", () => {
    const factors: RiskFactors = {
      ...mockFactors,
      account_age_days: 3,
      kyc_status: "unverified",
      transaction_frequency_30d: 60,
      amount_vs_historical_average: 4,
      previous_disputes_count: 5,
      deposits_last_1h: 7,
    };
    const score = (engine as unknown as { calculateScore: (f: RiskFactors) => number }).calculateScore(factors);
    expect(score).toBeGreaterThan(50);
  });

  it("night time adds risk", () => {
    const dayScore = (engine as unknown as { calculateScore: (f: RiskFactors) => number }).calculateScore({ ...mockFactors, time_of_day: 14 });
    const nightScore = (engine as unknown as { calculateScore: (f: RiskFactors) => number }).calculateScore({ ...mockFactors, time_of_day: 3 });
    expect(nightScore).toBeGreaterThan(dayScore);
  });
});
