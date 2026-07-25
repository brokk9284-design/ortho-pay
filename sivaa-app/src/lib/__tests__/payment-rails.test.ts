import { describe, it, expect } from "vitest";
import { getRailAdapter, getEstimatedTime, FasterPaymentsAdapter, SepaAdapter, AchAdapter, InteracAdapter, InternalTransferAdapter } from "@/lib/integrations/payment-rails";

describe("Payment Rail Adapters", () => {
  describe("FasterPaymentsAdapter", () => {
    const adapter = new FasterPaymentsAdapter();

    it("validates UK account numbers", () => {
      expect(adapter.validateAccount("12345678")).toBe(true);
      expect(adapter.validateAccount("1234567")).toBe(false);
      expect(adapter.validateAccount("123456789")).toBe(false);
    });

    it("executes successfully for GBP", async () => {
      const result = await adapter.execute("set-123", 100, "GBP", "12345678");
      expect(result.success).toBe(true);
      expect(result.reference).toContain("FP-");
    });

    it("rejects non-GBP currency", async () => {
      const result = await adapter.execute("set-123", 100, "USD", "12345678");
      expect(result.success).toBe(false);
    });

    it("estimates 2 hours", () => {
      expect(adapter.getEstimatedTimeHours()).toBe(2);
    });
  });

  describe("SepaAdapter", () => {
    const adapter = new SepaAdapter();

    it("validates IBAN format", () => {
      expect(adapter.validateAccount("GB82WEST12345698765432")).toBe(true);
      expect(adapter.validateAccount("12345")).toBe(false);
    });

    it("executes successfully for EUR", async () => {
      const result = await adapter.execute("set-456", 500, "EUR", "GB82WEST12345698765432");
      expect(result.success).toBe(true);
      expect(result.reference).toContain("SEPA-");
    });

    it("estimates 24 hours", () => {
      expect(adapter.getEstimatedTimeHours()).toBe(24);
    });
  });

  describe("AchAdapter", () => {
    const adapter = new AchAdapter();

    it("validates US account numbers", () => {
      expect(adapter.validateAccount("123456789")).toBe(true);
      expect(adapter.validateAccount("12345678901234567")).toBe(true);
      expect(adapter.validateAccount("12345678")).toBe(false);
    });

    it("executes successfully for USD", async () => {
      const result = await adapter.execute("set-789", 1000, "USD", "123456789");
      expect(result.success).toBe(true);
      expect(result.reference).toContain("ACH-");
    });

    it("estimates 72 hours", () => {
      expect(adapter.getEstimatedTimeHours()).toBe(72);
    });
  });

  describe("InteracAdapter", () => {
    const adapter = new InteracAdapter();

    it("validates Canadian account numbers", () => {
      expect(adapter.validateAccount("1234567")).toBe(true);
      expect(adapter.validateAccount("123456")).toBe(false);
    });

    it("executes successfully for CAD", async () => {
      const result = await adapter.execute("set-012", 250, "CAD", "1234567");
      expect(result.success).toBe(true);
      expect(result.reference).toContain("INTERAC-");
    });
  });

  describe("InternalTransferAdapter", () => {
    const adapter = new InternalTransferAdapter();

    it("always validates account", () => {
      expect(adapter.validateAccount("anything")).toBe(true);
    });

    it("executes successfully for any currency", async () => {
      const result = await adapter.execute("set-345", 100, "USD", "any");
      expect(result.success).toBe(true);
      expect(result.reference).toContain("INT-");
    });

    it("estimates 0 hours (instant)", () => {
      expect(adapter.getEstimatedTimeHours()).toBe(0);
    });
  });

  describe("getRailAdapter", () => {
    it("returns correct adapter for each rail", () => {
      expect(getRailAdapter("faster_payments")).toBeInstanceOf(FasterPaymentsAdapter);
      expect(getRailAdapter("sepa")).toBeInstanceOf(SepaAdapter);
      expect(getRailAdapter("ach")).toBeInstanceOf(AchAdapter);
      expect(getRailAdapter("interac")).toBeInstanceOf(InteracAdapter);
      expect(getRailAdapter("internal")).toBeInstanceOf(InternalTransferAdapter);
    });

    it("getEstimatedTime returns correct hours", () => {
      expect(getEstimatedTime("faster_payments")).toBe(2);
      expect(getEstimatedTime("sepa")).toBe(24);
      expect(getEstimatedTime("ach")).toBe(72);
      expect(getEstimatedTime("internal")).toBe(0);
    });
  });
});
