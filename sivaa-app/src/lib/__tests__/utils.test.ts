import { describe, it, expect } from "vitest";
import { calculateFee, generateReference, hashPin } from "@/lib/utils";

const FEE_RULES = [
  { minimum_amount: 0, maximum_amount: 49.99, percentage: 3.0 },
  { minimum_amount: 50, maximum_amount: 499.99, percentage: 2.0 },
  { minimum_amount: 500, maximum_amount: null, percentage: 1.0 },
];

describe("Fee Calculation — Boundary Tests", () => {
  it("charges 3% for $0.01 (micro tier)", () => {
    expect(calculateFee(0.01, FEE_RULES)).toBe(0);
  });

  it("charges 3% for $25.00 (micro tier)", () => {
    expect(calculateFee(25.00, FEE_RULES)).toBe(0.75);
  });

  it("charges 3% for $49.99 (micro tier boundary)", () => {
    expect(calculateFee(49.99, FEE_RULES)).toBe(1.50);
  });

  it("charges 2% for $50.00 (standard tier boundary)", () => {
    expect(calculateFee(50.00, FEE_RULES)).toBe(1.00);
  });

  it("charges 2% for $50.01 (standard tier)", () => {
    expect(calculateFee(50.01, FEE_RULES)).toBe(1.00);
  });

  it("charges 2% for $250.00 (standard tier)", () => {
    expect(calculateFee(250.00, FEE_RULES)).toBe(5.00);
  });

  it("charges 2% for $499.99 (standard tier boundary)", () => {
    expect(calculateFee(499.99, FEE_RULES)).toBe(10.00);
  });

  it("charges 1% for $500.00 (premium tier boundary)", () => {
    expect(calculateFee(500.00, FEE_RULES)).toBe(5.00);
  });

  it("charges 1% for $500.01 (premium tier)", () => {
    expect(calculateFee(500.01, FEE_RULES)).toBe(5.00);
  });

  it("charges 1% for $10,000.00 (premium tier)", () => {
    expect(calculateFee(10000.00, FEE_RULES)).toBe(100.00);
  });

  it("returns 0 for amount of 0", () => {
    expect(calculateFee(0, FEE_RULES)).toBe(0);
  });

  it("returns 0 when no rules match", () => {
    expect(calculateFee(100, [])).toBe(0);
  });
});

describe("Payment Method Fee Calculation", () => {
  function calculateMethodFee(amount: number, fee_percentage: number, fee_fixed: number) {
    const percentageFee = Math.round(amount * (fee_percentage / 100) * 100) / 100;
    return Math.round((percentageFee + fee_fixed) * 100) / 100;
  }

  it("crypto: 1.5% + $0 fixed for $100", () => {
    expect(calculateMethodFee(100, 1.5, 0)).toBe(1.50);
  });

  it("cashapp: 2.5% + $0.50 fixed for $100", () => {
    expect(calculateMethodFee(100, 2.5, 0.5)).toBe(3.00);
  });

  it("paypal: 3.0% + $0.30 fixed for $100", () => {
    expect(calculateMethodFee(100, 3.0, 0.3)).toBe(3.30);
  });

  it("venmo: 2.0% + $0 fixed for $500.01", () => {
    expect(calculateMethodFee(500.01, 2.0, 0)).toBe(10.00);
  });

  it("handles rounding correctly for $49.99 at 3%", () => {
    expect(calculateMethodFee(49.99, 3.0, 0)).toBe(1.50);
  });
});

describe("Reference Generation", () => {
  it("generates a reference with ORTHO-PAY prefix", () => {
    const ref = generateReference();
    expect(ref).toMatch(/^ORTHO-PAY-/);
  });

  it("generates unique references", () => {
    const refs = new Set(Array.from({ length: 100 }, () => generateReference()));
    expect(refs.size).toBe(100);
  });

  it("supports custom prefix", () => {
    const ref = generateReference("TEST");
    expect(ref).toMatch(/^TEST-/);
  });
});

describe("PIN Hashing", () => {
  it("hashes a PIN to a 64-char hex string", () => {
    const hash = hashPin("1234");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces consistent hashes for same input", () => {
    expect(hashPin("1234")).toBe(hashPin("1234"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashPin("1234")).not.toBe(hashPin("5678"));
  });
});
