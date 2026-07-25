import { describe, it, expect } from "vitest";
import { validateBody, schemas, validateAmount, validateCurrency, sanitizeInput } from "@/lib/security/validation";

describe("Validation Schemas", () => {
  describe("createOrder", () => {
    it("validates a valid buy order", () => {
      const result = validateBody(schemas.createOrder, {
        side: "buy",
        amount: 100,
        currency: "USD",
        payment_rail: "ach",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid side", () => {
      const result = validateBody(schemas.createOrder, {
        side: "trade",
        amount: 100,
        currency: "USD",
        payment_rail: "ach",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative amount", () => {
      const result = validateBody(schemas.createOrder, {
        side: "buy",
        amount: -100,
        currency: "USD",
        payment_rail: "ach",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = validateBody(schemas.createOrder, { side: "buy" });
      expect(result.success).toBe(false);
    });
  });

  describe("createEscrow", () => {
    it("validates a valid escrow", () => {
      const result = validateBody(schemas.createEscrow, {
        gross_amount: 500,
        currency: "EUR",
        payment_rail: "sepa",
      });
      expect(result.success).toBe(true);
    });

    it("rejects amount over 10M", () => {
      const result = validateBody(schemas.createEscrow, {
        gross_amount: 10000001,
        currency: "USD",
        payment_rail: "ach",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("escrowAction", () => {
    it("validates release action", () => {
      const result = validateBody(schemas.escrowAction, { action: "release" });
      expect(result.success).toBe(true);
    });

    it("rejects unknown action", () => {
      const result = validateBody(schemas.escrowAction, { action: "cancel" });
      expect(result.success).toBe(false);
    });
  });

  describe("createDispute", () => {
    it("validates a valid dispute", () => {
      const result = validateBody(schemas.createDispute, {
        escrow_id: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Item not delivered",
        description: "The provider failed to deliver the agreed service.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty reason", () => {
      const result = validateBody(schemas.createDispute, {
        escrow_id: "550e8400-e29b-41d4-a716-446655440000",
        reason: "",
        description: "desc",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("calculateFee", () => {
    it("validates valid fee calc input", () => {
      const result = validateBody(schemas.calculateFee, {
        amount: 1000,
        currency: "USD",
        payment_rail: "ach",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("utility functions", () => {
    it("validateAmount accepts positive numbers", () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(-1)).toBe(false);
    });

    it("validateCurrency checks supported currencies", () => {
      expect(validateCurrency("USD")).toBe(true);
      expect(validateCurrency("EUR")).toBe(true);
      expect(validateCurrency("JPY")).toBe(false);
    });

    it("sanitizeInput trims and removes angle brackets", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
      expect(sanitizeInput("<script>alert(1)</script>")).toBe("scriptalert(1)/script");
    });
  });
});
