import { describe, it, expect } from "vitest";
import { FeeEngine } from "@/lib/services/fees/fee.service";
import type { FeeCalculationInput } from "@/types";

const mockInput: FeeCalculationInput = {
  amount: 1000,
  currency: "USD",
  payment_rail: "ach",
  pool_type: "standard",
  user_id: "test-user",
  user_tier: "consumer",
  user_transaction_count: 10,
  user_success_rate: 95,
  deposit_queue_depth: 0,
  withdrawal_queue_depth: 0,
  requested_priority: false,
  time_in_queue_seconds: 0,
};

describe("FeeEngine", () => {
  const engine = new FeeEngine();

  it("calculates fee with valid input", async () => {
    const result = await engine.calculateFee(mockInput);
    expect(result.total_fee).toBeGreaterThan(0);
    expect(result.fee_percentage).toBeGreaterThan(0);
    expect(result.fee_percentage).toBeLessThanOrEqual(5);
    expect(result.currency).toBe("USD");
    expect(result.breakdown).toBeDefined();
  });

  it("applies urgency premium for priority requests", async () => {
    const base = await engine.getFeeBreakdown(mockInput);
    const priority = await engine.getFeeBreakdown({ ...mockInput, requested_priority: true });
    expect(priority.urgency_premium).toBeGreaterThan(base.urgency_premium);
    expect(priority.total).toBeGreaterThan(base.total);
  });

  it("applies loyalty discount for high volume users", async () => {
    const newUser = await engine.getFeeBreakdown({ ...mockInput, user_transaction_count: 0 });
    const experienced = await engine.getFeeBreakdown({ ...mockInput, user_transaction_count: 100 });
    expect(experienced.loyalty_discount).toBeGreaterThan(newUser.loyalty_discount);
  });

  it("applies risk premium for low success rate", async () => {
    const highRisk = await engine.getFeeBreakdown({ ...mockInput, user_success_rate: 30 });
    const lowRisk = await engine.getFeeBreakdown({ ...mockInput, user_success_rate: 98 });
    expect(highRisk.risk_premium).toBeGreaterThan(lowRisk.risk_premium);
  });

  it("clamps total fee between min and max", async () => {
    const extremeInput = { ...mockInput, amount: 10000000, user_success_rate: 0, user_transaction_count: 0, requested_priority: true, deposit_queue_depth: 1000, withdrawal_queue_depth: 1000 };
    const result = await engine.getFeeBreakdown(extremeInput);
    expect(result.total).toBeLessThanOrEqual(5);
    expect(result.total).toBeGreaterThanOrEqual(0.5);
  });

  it("breakdown explanation contains all components", async () => {
    const result = await engine.getFeeBreakdown(mockInput);
    expect(result.explanation).toContain("Base fee");
    expect(result.explanation).toContain("Risk premium");
    expect(result.explanation).toContain("Loyalty discount");
    expect(result.explanation).toContain("Total");
  });

  it("returns fee calculation with id and timestamp", async () => {
    const result = await engine.calculateFee(mockInput);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeDefined();
  });
});
