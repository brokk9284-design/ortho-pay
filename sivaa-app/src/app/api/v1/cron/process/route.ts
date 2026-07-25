import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { escrowEngine } from "@/lib/services/escrow/escrow.service";
import { settlementEngine } from "@/lib/services/settlement/settlement.service";
import { processNotificationQueue } from "@/lib/notifications/dispatcher";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    const supabase = await createSupabaseAdminClient();

    const now = new Date().toISOString();
    const { data: expiredEscrows } = await supabase
      .from("escrows")
      .select("id")
      .eq("status", "created")
      .lt("timer_expires_at", now);

    let expiredCount = 0;
    for (const escrow of expiredEscrows || []) {
      try {
        await escrowEngine.expireEscrow(escrow.id);
        expiredCount++;
      } catch (err) {
        logger.error("Failed to expire escrow", { escrowId: escrow.id }, err as Error);
      }
    }
    results.expired_escrows = expiredCount;

    const { data: retrySettlements } = await supabase
      .from("settlements")
      .select("id")
      .eq("status", "retrying")
      .lt("next_retry_at", now);

    let retriedCount = 0;
    for (const settlement of retrySettlements || []) {
      try {
        await settlementEngine.executeSettlement(settlement.id);
        retriedCount++;
      } catch (err) {
        logger.error("Failed to retry settlement", { settlementId: settlement.id }, err as Error);
      }
    }
    results.retried_settlements = retriedCount;

    const notificationResult = await processNotificationQueue();
    results.notifications = notificationResult;

    logger.info("Cron process completed", results);
    return NextResponse.json({ data: results });
  } catch (err) {
    logger.error("Cron process failed", {}, err as Error);
    return NextResponse.json({ error: { code: "CRON_FAILED", message: "Cron processing failed", retryable: true } }, { status: 500 });
  }
}
