import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/lib/services/marketplace/marketplace.service";
import { escrowEngine } from "@/lib/services/escrow/escrow.service";
import { requireAuth } from "@/lib/auth";
import { auditService } from "@/lib/services/audit/audit.service";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/security/middleware";
import type { ApiError } from "@/types";

function errorResponse(error: ApiError, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rateLimited = await applyRateLimit(req);
    if (rateLimited) return rateLimited;

    const user = await requireAuth();
    const { id } = await params;

    const offer = await marketplaceService.getOffersForOrder(id);
    const targetOffer = offer.find((o) => o.id === id);

    if (!targetOffer) {
      return errorResponse({ code: "NOT_FOUND", message: "Offer not found", retryable: false }, 404);
    }

    if (targetOffer.provider_id !== user.id && targetOffer.status !== "pending") {
      const supabase = await createSupabaseAdminClient();
      const { data: order } = await supabase
        .from("marketplace_orders")
        .select("user_id, side, amount, currency, payment_rail")
        .eq("id", targetOffer.order_id)
        .single();

      if (!order || order.user_id !== user.id) {
        return errorResponse({ code: "FORBIDDEN", message: "Only the order owner can accept offers", retryable: false }, 403);
      }

      await supabase.from("provider_offers").update({ status: "accepted" }).eq("id", id);
      await supabase.from("marketplace_orders").update({ status: "matched" }).eq("id", targetOffer.order_id);

      const escrow = await escrowEngine.createEscrow(
        user.id,
        targetOffer.provider_id,
        "automatic",
        Number(targetOffer.amount_offered),
        Number(targetOffer.fee_fixed) + (Number(targetOffer.amount_offered) * Number(targetOffer.fee_percentage)) / 100,
        order.currency,
        order.payment_rail
      );

      await auditService.logAction(user.id, "user", "provider_offer", id, "accept_offer", { escrow_id: escrow.id });

      return NextResponse.json({ data: { escrow: escrow, offer_id: id, order_id: targetOffer.order_id } });
    }

    return errorResponse({ code: "INVALID_STATE", message: "Offer cannot be accepted", retryable: false }, 400);
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to accept offer", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to accept offer", retryable: true }, 500);
  }
}
