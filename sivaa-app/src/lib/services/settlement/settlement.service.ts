import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { publish } from "@/lib/events/event-bus";
import type { Settlement, Currency, PaymentRail } from "@/types";
import type { ISettlementEngine } from "./index";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [300, 900, 3600];

export class SettlementEngine implements ISettlementEngine {
  async initiateSettlement(
    transactionId: string,
    providerId: string,
    amount: number,
    currency: Currency,
    rail: PaymentRail,
    idempotencyKey: string
  ): Promise<Settlement> {
    const supabase = await createSupabaseAdminClient();

    const { data: existing } = await supabase
      .from("settlements")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .single();

    if (existing) return existing as Settlement;

    const { data, error } = await supabase
      .from("settlements")
      .insert({
        transaction_id: transactionId,
        provider_id: providerId,
        amount,
        currency,
        payment_rail: rail,
        status: "pending",
        idempotency_key: idempotencyKey,
        retry_count: 0,
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to initiate settlement: ${error?.message}`);

    logger.info("Settlement initiated", { settlementId: data.id, transactionId });
    return data as Settlement;
  }

  async selectRail(buyerCountry: string, providerCountry: string, currency: Currency): Promise<PaymentRail> {
    if (buyerCountry === providerCountry) {
      if (currency === "USD") return "ach";
      if (currency === "EUR") return "sepa";
      if (currency === "GBP") return "faster_payments";
      if (currency === "CAD") return "interac";
    }
    if (currency === "EUR") return "sepa";
    return "ach";
  }

  async executeSettlement(settlementId: string): Promise<Settlement> {
    const supabase = await createSupabaseAdminClient();

    const { data: settlement } = await supabase
      .from("settlements")
      .select("*")
      .eq("id", settlementId)
      .single();

    if (!settlement) throw new Error("Settlement not found");

    await supabase
      .from("settlements")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", settlementId);

    try {
      await supabase.from("settlement_attempts").insert({
        settlement_id: settlementId,
        attempt_number: Number(settlement.retry_count) + 1,
        status: "success",
        attempted_at: new Date().toISOString(),
      });

      const { data: updated } = await supabase
        .from("settlements")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", settlementId)
        .select()
        .single();

      await publish("SETTLEMENT_COMPLETED", { settlementId, providerId: settlement.provider_id }, "system");
      logger.info("Settlement completed", { settlementId });

      return updated as Settlement;
    } catch (err) {
      await supabase.from("settlement_failures").insert({
        settlement_id: settlementId,
        failure_reason: (err as Error).message,
        failure_code: "EXECUTION_ERROR",
        occurred_at: new Date().toISOString(),
      });

      return this.retrySettlement(settlementId);
    }
  }

  async retrySettlement(settlementId: string): Promise<Settlement> {
    const supabase = await createSupabaseAdminClient();

    const { data: settlement } = await supabase
      .from("settlements")
      .select("retry_count")
      .eq("id", settlementId)
      .single();

    if (!settlement) throw new Error("Settlement not found");

    const retryCount = Number(settlement.retry_count);
    if (retryCount >= MAX_RETRIES) {
      const { data: failed } = await supabase
        .from("settlements")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", settlementId)
        .select()
        .single();

      return failed as Settlement;
    }

    const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    const nextRetry = new Date(Date.now() + delay * 1000).toISOString();

    const { data: updated } = await supabase
      .from("settlements")
      .update({
        status: "retrying",
        retry_count: retryCount + 1,
        next_retry_at: nextRetry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settlementId)
      .select()
      .single();

    logger.info("Settlement scheduled for retry", { settlementId, retryCount: retryCount + 1, nextRetry });
    return updated as Settlement;
  }

  async reconcileSettlement(settlementId: string): Promise<boolean> {
    const supabase = await createSupabaseAdminClient();
    const { data: settlement } = await supabase
      .from("settlements")
      .select("status, completed_at")
      .eq("id", settlementId)
      .single();

    if (!settlement) return false;
    return settlement.status === "completed" && !!settlement.completed_at;
  }

  async getSettlement(settlementId: string): Promise<Settlement | null> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("settlements")
      .select("*")
      .eq("id", settlementId)
      .single();
    return data as Settlement | null;
  }
}

export const settlementEngine = new SettlementEngine();
