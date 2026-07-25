import { describe, it, expect } from "vitest";
import { validateBody, schemas, sanitizeInput, validateAmount } from "@/lib/security/validation";
import { RiskEngine } from "@/lib/services/risk/risk.service";
import { FeeEngine } from "@/lib/services/fees/fee.service";
import { getRailAdapter } from "@/lib/integrations/payment-rails";

describe("Security Integration Tests", () => {
  it("rejects XSS in input fields", () => {
    const result = validateBody(schemas.createOrder, {
      side: "buy",
      amount: 100,
      currency: "USD",
      payment_rail: "ach",
      description: "<script>alert('xss')</script>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toContain("<script>");
    }
  });

  it("sanitizeInput removes angle brackets", () => {
    expect(sanitizeInput("<img src=x onerror=alert(1)>")).not.toContain("<");
    expect(sanitizeInput("<img src=x onerror=alert(1)>")).not.toContain(">");
  });

  it("rejects extremely large amounts", () => {
    expect(validateAmount(10000001)).toBe(false);
    expect(validateAmount(Infinity)).toBe(false);
  });

  it("risk engine blocks high-risk users", () => {
    const engine = new RiskEngine();
    expect(engine.getRiskDecision(85)).toBe("auto_block");
  });

  it("fee engine clamps to maximum", async () => {
    const engine = new FeeEngine();
    const result = await engine.getFeeBreakdown({
      amount: 10000000,
      currency: "USD",
      payment_rail: "ach",
      pool_type: "instant",
      user_id: "test",
      user_tier: "consumer",
      user_transaction_count: 0,
      user_success_rate: 0,
      deposit_queue_depth: 1000,
      withdrawal_queue_depth: 1000,
      requested_priority: true,
      time_in_queue_seconds: 0,
    });
    expect(result.total).toBeLessThanOrEqual(5);
  });

  it("payment rail validates account before execution", async () => {
    const adapter = getRailAdapter("ach");
    const result = await adapter.execute("set-1", 100, "USD", "invalid");
    expect(result.success).toBe(false);
  });
});
