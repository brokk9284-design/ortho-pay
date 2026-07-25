import { NextRequest, NextResponse } from "next/server";
import { escrowEngine } from "@/lib/services/escrow/escrow.service";
import { requireAuth } from "@/lib/auth";
import { auditService } from "@/lib/services/audit/audit.service";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { validateBody, schemas, validationErrorResponse } from "@/lib/security/validation";
import type { ApiError } from "@/types";

function errorResponse(error: ApiError, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const supabase = await createSupabaseAdminClient();

    const { data: escrow } = await supabase.from("escrows").select("*").eq("id", id).single();

    if (!escrow) {
      return errorResponse({ code: "NOT_FOUND", message: "Escrow not found", retryable: false }, 404);
    }

    if (escrow.buyer_id !== user.id && escrow.provider_id !== user.id) {
      return errorResponse({ code: "FORBIDDEN", message: "Not authorized to view this escrow", retryable: false }, 403);
    }

    const [events, milestones, documents] = await Promise.all([
      escrowEngine.getEscrowHistory(id),
      supabase.from("escrow_milestones").select("*").eq("escrow_id", id).order("created_at", { ascending: true }),
      supabase.from("escrow_documents").select("*").eq("escrow_id", id).order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      data: { ...escrow, events, milestones: milestones.data || [], documents: documents.data || [] },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to get escrow", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to get escrow", retryable: true }, 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const validation = validateBody(schemas.escrowAction, body);
    if (!validation.success) return validationErrorResponse(validation.error);

    const { action } = validation.data;

    const supabase = await createSupabaseAdminClient();
    const { data: escrow } = await supabase
      .from("escrows")
      .select("buyer_id, provider_id, status, gross_amount")
      .eq("id", id)
      .single();

    if (!escrow) {
      return errorResponse({ code: "NOT_FOUND", message: "Escrow not found", retryable: false }, 404);
    }

    const isBuyer = escrow.buyer_id === user.id;
    const isProvider = escrow.provider_id === user.id;

    switch (action) {
      case "fund": {
        if (!isBuyer) {
          return errorResponse({ code: "FORBIDDEN", message: "Only the buyer can fund an escrow", retryable: false }, 403);
        }

        const { data: wallet } = await supabase
          .from("wallets")
          .select("total_received, total_sent, reserved_balance")
          .eq("user_id", user.id)
          .single();

        if (wallet) {
          const available = Number(wallet.total_received) - Number(wallet.total_sent) - Number(wallet.reserved_balance);
          if (available < Number(escrow.gross_amount)) {
            return errorResponse({ code: "INSUFFICIENT_BALANCE", message: `Insufficient balance: have ${available}, need ${escrow.gross_amount}`, retryable: false }, 400);
          }
        }

        const updated = await escrowEngine.transitionState(id, "funded", user.id);
        await auditService.logAction(user.id, "user", "escrow", id, "fund_escrow", {});
        return NextResponse.json({ data: { funded: true } });
      }

      case "release": {
        if (!isBuyer) {
          return errorResponse({ code: "FORBIDDEN", message: "Only the buyer can release an escrow", retryable: false }, 403);
        }

        await escrowEngine.releaseEscrow(id, user.id);
        await auditService.logAction(user.id, "user", "escrow", id, "release_escrow", {});
        return NextResponse.json({ data: { released: true } });
      }

      case "refund": {
        if (!isBuyer && !isProvider) {
          return errorResponse({ code: "FORBIDDEN", message: "Not authorized", retryable: false }, 403);
        }

        await escrowEngine.refundEscrow(id, user.id);
        await auditService.logAction(user.id, "user", "escrow", id, "refund_escrow", {});
        return NextResponse.json({ data: { refunded: true } });
      }

      default:
        return errorResponse({ code: "INVALID_ACTION", message: `Unknown action: ${action}`, retryable: false }, 400);
    }
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to process escrow action", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to process action", retryable: true }, 500);
  }
}
