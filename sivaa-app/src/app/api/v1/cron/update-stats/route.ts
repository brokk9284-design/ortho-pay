import { NextRequest, NextResponse } from "next/server";
import { reputationEngine } from "@/lib/services/reputation/reputation.service";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createSupabaseAdminClient();

    const { data: providers } = await supabase
      .from("provider_availability")
      .select("provider_id")
      .limit(100);

    let updated = 0;
    for (const provider of providers || []) {
      try {
        await reputationEngine.updateScores(provider.provider_id);
        updated++;
      } catch (err) {
        logger.error("Failed to update provider scores", { providerId: provider.provider_id }, err as Error);
      }
    }

    logger.info("Cron update-stats completed", { updated });
    return NextResponse.json({ data: { providers_updated: updated } });
  } catch (err) {
    logger.error("Cron update-stats failed", {}, err as Error);
    return NextResponse.json({ error: { code: "CRON_FAILED", message: "Stats update failed", retryable: true } }, { status: 500 });
  }
}
