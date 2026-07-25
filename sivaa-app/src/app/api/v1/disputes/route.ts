import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { auditService } from "@/lib/services/audit/audit.service";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/security/middleware";
import { validateBody, schemas, validationErrorResponse } from "@/lib/security/validation";
import { publish } from "@/lib/events/event-bus";
import type { ApiError, DisputeInitiator } from "@/types";

function errorResponse(error: ApiError, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req);
    if (rateLimited) return rateLimited;

    const user = await requireAuth();
    const supabase = await createSupabaseAdminClient();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("disputes")
      .select("*", { count: "exact" })
      .eq("initiator_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq("status", status);

    const { data, count } = await query;

    return NextResponse.json({
      data: data || [],
      pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to list disputes", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to list disputes", retryable: true }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req);
    if (rateLimited) return rateLimited;

    const user = await requireAuth();
    const body = await req.json();

    const validation = validateBody(schemas.createDispute, body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { escrow_id, reason, description, initiated_by } = validation.data;

    const supabase = await createSupabaseAdminClient();

    const { data: escrow } = await supabase
      .from("escrows")
      .select("buyer_id, provider_id, status")
      .eq("id", escrow_id)
      .single();

    if (!escrow) {
      return errorResponse({ code: "NOT_FOUND", message: "Escrow not found", retryable: false }, 404);
    }

    if (escrow.buyer_id !== user.id && escrow.provider_id !== user.id) {
      return errorResponse({ code: "FORBIDDEN", message: "Not a participant in this escrow", retryable: false }, 403);
    }

    const { data: existingDispute } = await supabase
      .from("disputes")
      .select("id")
      .eq("escrow_id", escrow_id)
      .in("status", ["open", "review", "evidence", "decision"])
      .single();

    if (existingDispute) {
      return errorResponse({ code: "DISPUTE_EXISTS", message: "An active dispute already exists for this escrow", retryable: false }, 409);
    }

    const initiatorType = (initiated_by || (escrow.buyer_id === user.id ? "buyer" : "provider")) as DisputeInitiator;

    const { data: dispute, error } = await supabase
      .from("disputes")
      .insert({
        escrow_id,
        initiated_by: initiatorType,
        initiator_id: user.id,
        reason,
        description,
        status: "open",
      })
      .select()
      .single();

    if (error || !dispute) {
      return errorResponse({ code: "CREATE_FAILED", message: "Failed to create dispute", retryable: false }, 500);
    }

    await supabase.from("escrows").update({ status: "disputed" }).eq("id", escrow_id);

    await publish("DISPUTE_OPENED", { disputeId: dispute.id, escrow_id, userId: user.id }, user.id);
    await auditService.logAction(user.id, "user", "dispute", dispute.id, "open_dispute", { escrow_id, reason });

    return NextResponse.json({ data: dispute }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to create dispute", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to create dispute", retryable: true }, 500);
  }
}
