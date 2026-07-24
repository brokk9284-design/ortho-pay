import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SQL_PATH = join(process.cwd(), "..", "database_init_sivaa.sql");
const sqlContent = existsSync(SQL_PATH)
  ? readFileSync(SQL_PATH, "utf-8")
  : readFileSync(join(process.cwd(), "..", "..", "database_init_sivaa.sql"), "utf-8");

describe("Database Schema — RLS Policy Verification", () => {
  it("enables RLS on wallets table", () => {
    expect(sqlContent).toMatch(/CREATE TABLE[\s\S]*wallets/i);
    expect(sqlContent).toMatch(/ALTER TABLE[\s\S]*wallets[\s\S]*ENABLE ROW LEVEL SECURITY/i);
    expect(sqlContent.toLowerCase()).toContain("wallets");
    expect(sqlContent).toMatch(/ALTER TABLE.*wallets.*ENABLE ROW LEVEL SECURITY/i);
  });

  it("prevents users from updating other users' wallets", () => {
    expect(sqlContent).toMatch(/wallets.*user_id.*auth\.uid\(\)/i);
    expect(sqlContent).toMatch(/Allow users to view own wallet/i);
    expect(sqlContent).toMatch(/Allow admins to update wallets/i);
  });

  it("enables RLS on support_tickets table", () => {
    expect(sqlContent).toMatch(/ALTER TABLE.*support_tickets.*ENABLE ROW LEVEL SECURITY/i);
  });

  it("prevents users from reading other users' support tickets", () => {
    expect(sqlContent).toMatch(/support_tickets.*user_id.*auth\.uid\(\)/i);
  });

  it("enables RLS on payments table", () => {
    expect(sqlContent).toMatch(/ALTER TABLE.*payments.*ENABLE ROW LEVEL SECURITY/i);
  });

  it("restricts payment reads to sender or receiver", () => {
    expect(sqlContent).toMatch(/payments.*sender_id.*auth\.uid\(\)|payments.*receiver_id.*auth\.uid\(\)/i);
  });

  it("enables RLS on kyc_documents table", () => {
    expect(sqlContent).toMatch(/ALTER TABLE.*kyc_documents.*ENABLE ROW LEVEL SECURITY/i);
  });

  it("restricts KYC documents to own user or admin", () => {
    expect(sqlContent).toMatch(/kyc_documents[\s\S]*auth\.uid\(\)\s*=\s*user_id/i);
    expect(sqlContent).toMatch(/kyc_documents[\s\S]*is_admin\(\)/i);
  });

  it("enables RLS on audit_logs table", () => {
    expect(sqlContent).toMatch(/ALTER TABLE.*audit_logs.*ENABLE ROW LEVEL SECURITY/i);
  });

  it("restricts audit_logs to admin-only read", () => {
    expect(sqlContent).toMatch(/audit_logs[\s\S]*is_admin\(\)/i);
  });

  it("has is_admin() helper function", () => {
    expect(sqlContent).toMatch(/CREATE.*FUNCTION.*is_admin\(\)/i);
    expect(sqlContent).toMatch(/SECURITY DEFINER/i);
  });
});

describe("Database Schema — Table Structure Verification", () => {
  it("creates payment_methods table with fee structure", () => {
    expect(sqlContent).toMatch(/CREATE TABLE.*payment_methods/i);
    expect(sqlContent).toMatch(/payment_methods.*fee_percentage/i);
    expect(sqlContent).toMatch(/payment_methods.*fee_fixed/i);
    expect(sqlContent).toMatch(/payment_methods.*min_amount/i);
    expect(sqlContent).toMatch(/payment_methods.*max_amount/i);
  });

  it("creates payments table with payment_method_id FK", () => {
    expect(sqlContent).toMatch(/CREATE TABLE.*payments/i);
    expect(sqlContent).toMatch(/payment_method_id.*REFERENCES.*payment_methods/i);
  });

  it("creates kyc_documents table", () => {
    expect(sqlContent).toMatch(/CREATE TABLE public\.kyc_documents/i);
    expect(sqlContent).toMatch(/document_type VARCHAR/i);
    expect(sqlContent).toMatch(/file_url/i);
    expect(sqlContent).toMatch(/status VARCHAR/i);
  });

  it("creates escrow_reviews table with audit trail", () => {
    expect(sqlContent).toMatch(/CREATE TABLE public\.escrow_reviews/i);
    expect(sqlContent).toMatch(/action VARCHAR/i);
    expect(sqlContent).toMatch(/admin_id UUID REFERENCES/i);
  });

  it("creates audit_logs table with insert-only trigger", () => {
    expect(sqlContent).toMatch(/CREATE TABLE public\.audit_logs/i);
    expect(sqlContent).toMatch(/prevent_audit_alteration/i);
    expect(sqlContent).toMatch(/BEFORE UPDATE ON public\.audit_logs/i);
    expect(sqlContent).toMatch(/BEFORE DELETE ON public\.audit_logs/i);
  });

  it("creates notifications table", () => {
    expect(sqlContent).toMatch(/CREATE TABLE public\.notifications/i);
    expect(sqlContent).toMatch(/notification_id UUID/i);
    expect(sqlContent).toMatch(/VARCHAR.*type/i);
    expect(sqlContent).toMatch(/read BOOLEAN/i);
  });

  it("seeds payment methods with crypto, cashapp, paypal, venmo", () => {
    expect(sqlContent).toMatch(/INSERT INTO public\.payment_methods/i);
    expect(sqlContent).toMatch(/'crypto'/i);
    expect(sqlContent).toMatch(/'cashapp'/i);
    expect(sqlContent).toMatch(/'paypal'/i);
    expect(sqlContent).toMatch(/'venmo'/i);
  });

  it("seeds fee rules with 3%, 2%, 1% tiers", () => {
    expect(sqlContent).toMatch(/INSERT INTO public\.fee_rules/i);
    expect(sqlContent).toMatch(/3\.00/i);
    expect(sqlContent).toMatch(/2\.00/i);
    expect(sqlContent).toMatch(/1\.00/i);
  });
});

describe("Database Schema — Index Verification", () => {
  it("indexes siva_tag for fast lookups", () => {
    expect(sqlContent).toMatch(/CREATE INDEX.*siva_tag/i);
  });

  it("indexes payment sender/receiver for query performance", () => {
    expect(sqlContent).toMatch(/CREATE INDEX.*payments.*sender_id|CREATE INDEX.*payments.*receiver_id/i);
  });

  it("indexes notifications for user queries", () => {
    expect(sqlContent).toMatch(/CREATE INDEX.*notifications.*user_id/i);
  });
});
