import { NextRequest, NextResponse } from "next/server";
import { marketplaceService } from "@/lib/services/marketplace/marketplace.service";
import { requireAuth } from "@/lib/auth";
import { auditService } from "@/lib/services/audit/audit.service";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/security/middleware";
import { validateBody, schemas, validationErrorResponse } from "@/lib/security/validation";
import type { ApiError, Currency, PaymentRail, MarketplacePool, OrderSide } from "@/types";

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
    const poolType = searchParams.get("pool_type") || undefined;
    const currency = searchParams.get("currency") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("marketplace_orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq("status", status);
    if (poolType) query = query.eq("pool_type", poolType);
    if (currency) query = query.eq("currency", currency);

    const { data, count } = await query;

    return NextResponse.json({
      data: data || [],
      pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to list orders", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to list orders", retryable: true }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req);
    if (rateLimited) return rateLimited;

    const user = await requireAuth();
    const body = await req.json();

    const validation = validateBody(schemas.createOrder, body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { side, amount, currency, payment_rail, pool_type, description } = validation.data;

    const order = await marketplaceService.createOrder(
      user.id,
      side as OrderSide,
      amount,
      currency as Currency,
      payment_rail as PaymentRail,
      (pool_type || "standard") as MarketplacePool
    );

    await auditService.logAction(user.id, "user", "marketplace_order", order.id, "create_order", { side, amount, currency });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to create order", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to create order", retryable: true }, 500);
  }
}
