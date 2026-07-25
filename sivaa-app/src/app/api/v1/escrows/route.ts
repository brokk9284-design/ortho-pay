import { NextRequest, NextResponse } from "next/server";
import { escrowEngine } from "@/lib/services/escrow/escrow.service";
import { requireAuth } from "@/lib/auth";
import { auditService } from "@/lib/services/audit/audit.service";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/security/middleware";
import { validateBody, schemas, validationErrorResponse } from "@/lib/security/validation";
import type { ApiError, EscrowType, Currency, PaymentRail } from "@/types";

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
      .from("escrows")
      .select("*", { count: "exact" })
      .or(`buyer_id.eq.${user.id},provider_id.eq.${user.id}`)
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
    logger.error("Failed to list escrows", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to list escrows", retryable: true }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req);
    if (rateLimited) return rateLimited;

    const user = await requireAuth();
    const body = await req.json();

    const validation = validateBody(schemas.createEscrow, body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { provider_id, type, gross_amount, fee_amount, currency, payment_rail } = validation.data;

    const supabase = await createSupabaseAdminClient();
    const { data: wallet } = await supabase
      .from("wallets")
      .select("wallet_id, total_received, total_sent, reserved_balance")
      .eq("user_id", user.id)
      .single();

    if (wallet) {
      const available = Number(wallet.total_received) - Number(wallet.total_sent) - Number(wallet.reserved_balance);
      if (available < gross_amount) {
        return errorResponse({ code: "INSUFFICIENT_BALANCE", message: `Insufficient balance: have ${available}, need ${gross_amount}`, retryable: false }, 400);
      }
    }

    const escrow = await escrowEngine.createEscrow(
      user.id,
      provider_id || null,
      (type || "manual") as EscrowType,
      gross_amount,
      fee_amount || 0,
      currency as Currency,
      payment_rail as PaymentRail
    );

    await auditService.logAction(user.id, "user", "escrow", escrow.id, "create_escrow", { gross_amount, currency });

    return NextResponse.json({ data: escrow }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to create escrow", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to create escrow", retryable: true }, 500);
  }
}
