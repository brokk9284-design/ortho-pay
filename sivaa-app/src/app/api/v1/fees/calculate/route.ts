import { NextRequest, NextResponse } from "next/server";
import { feeEngine } from "@/lib/services/fees/fee.service";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/security/middleware";
import { validateBody, schemas, validationErrorResponse } from "@/lib/security/validation";
import type { ApiError, Currency, PaymentRail, MarketplacePool } from "@/types";

function errorResponse(error: ApiError, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req);
    if (rateLimited) return rateLimited;

    const user = await requireAuth();
    const body = await req.json();

    const validation = validateBody(schemas.calculateFee, body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { amount, currency, payment_rail, pool_type, requested_priority } = validation.data;

    const supabase = await createSupabaseAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, created_at")
      .eq("id", user.id)
      .single();

    const { count: txCount } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", user.id);

    const accountAgeDays = profile
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
      : 0;

    const calculation = await feeEngine.calculateFee({
      amount,
      currency: currency as Currency,
      payment_rail: payment_rail as PaymentRail,
      pool_type: (pool_type || "standard") as MarketplacePool,
      user_id: user.id,
      user_tier: profile?.user_type || "consumer",
      user_transaction_count: txCount || 0,
      user_success_rate: 95,
      deposit_queue_depth: 0,
      withdrawal_queue_depth: 0,
      requested_priority: requested_priority || false,
      time_in_queue_seconds: 0,
    });

    return NextResponse.json({ data: calculation });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to calculate fee", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to calculate fee", retryable: true }, 500);
  }
}
