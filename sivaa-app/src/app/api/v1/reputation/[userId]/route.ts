import { NextRequest, NextResponse } from "next/server";
import { reputationEngine } from "@/lib/services/reputation/reputation.service";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/security/middleware";
import type { ApiError } from "@/types";

function errorResponse(error: ApiError, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const rateLimited = await applyRateLimit(req);
    if (rateLimited) return rateLimited;

    await requireAuth();
    const { userId } = await params;

    const [trust, liquidity] = await Promise.all([
      reputationEngine.calculateTrustScore(userId),
      reputationEngine.calculateLiquidityScore(userId),
    ]);

    return NextResponse.json({ data: { trust, liquidity } });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to get reputation", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to get reputation", retryable: true }, 500);
  }
}
