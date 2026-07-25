import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/lib/services/marketplace/marketplace.service";
import { requireAuth } from "@/lib/auth";
import { auditService } from "@/lib/services/audit/audit.service";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/security/middleware";
import { validateBody, schemas, validationErrorResponse } from "@/lib/security/validation";
import { escrowEngine } from "@/lib/services/escrow/escrow.service";
import type { ApiError } from "@/types";

function errorResponse(error: ApiError, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req);
    if (rateLimited) return rateLimited;

    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return errorResponse({ code: "MISSING_PARAM", message: "order_id is required", retryable: false }, 400);
    }

    const offers = await marketplaceService.getOffersForOrder(orderId);
    return NextResponse.json({ data: offers });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to list offers", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to list offers", retryable: true }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req);
    if (rateLimited) return rateLimited;

    const user = await requireAuth();
    const body = await req.json();

    const validation = validateBody(schemas.createOffer, body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { order_id, fee_percentage, fee_fixed, settlement_time_hours, amount_offered, message } = validation.data;

    const offer = await marketplaceService.createOffer(
      user.id,
      order_id,
      fee_percentage,
      fee_fixed,
      settlement_time_hours,
      amount_offered
    );

    await auditService.logAction(user.id, "user", "provider_offer", offer.id, "create_offer", { order_id, fee_percentage });

    return NextResponse.json({ data: offer }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to create offer", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to create offer", retryable: true }, 500);
  }
}
