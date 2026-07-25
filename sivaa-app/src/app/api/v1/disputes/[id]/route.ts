import { NextRequest, NextResponse } from "next/server";
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

    const { data: dispute } = await supabase.from("disputes").select("*").eq("id", id).single();

    if (!dispute) {
      return errorResponse({ code: "NOT_FOUND", message: "Dispute not found", retryable: false }, 404);
    }

    if (dispute.initiator_id !== user.id) {
      const { data: escrow } = await supabase
        .from("escrows")
        .select("buyer_id, provider_id")
        .eq("id", dispute.escrow_id)
        .single();

      if (!escrow || (escrow.buyer_id !== user.id && escrow.provider_id !== user.id)) {
        return errorResponse({ code: "FORBIDDEN", message: "Not authorized", retryable: false }, 403);
      }
    }

    const [messagesResult, evidenceResult] = await Promise.all([
      supabase.from("dispute_messages").select("*").eq("dispute_id", id).order("created_at", { ascending: true }),
      supabase.from("dispute_evidence").select("*").eq("dispute_id", id).order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      data: {
        ...dispute,
        messages: messagesResult.data || [],
        evidence: evidenceResult.data || [],
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to get dispute", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to get dispute", retryable: true }, 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const supabase = await createSupabaseAdminClient();

    const { data: dispute } = await supabase.from("disputes").select("id, status, initiator_id").eq("id", id).single();

    if (!dispute) {
      return errorResponse({ code: "NOT_FOUND", message: "Dispute not found", retryable: false }, 404);
    }

    switch (action) {
      case "message": {
        const validation = validateBody(schemas.disputeMessage, body);
        if (!validation.success) return validationErrorResponse(validation.error);

        const { message } = validation.data;

        const { data: msg, error } = await supabase
          .from("dispute_messages")
          .insert({
            dispute_id: id,
            sender_id: user.id,
            sender_type: "user",
            message,
          })
          .select()
          .single();

        if (error || !msg) {
          return errorResponse({ code: "CREATE_FAILED", message: "Failed to send message", retryable: false }, 500);
        }

        return NextResponse.json({ data: msg }, { status: 201 });
      }

      case "evidence": {
        const validation = validateBody(schemas.disputeEvidence, body);
        if (!validation.success) return validationErrorResponse(validation.error);

        const { file_url, file_type, description } = validation.data;

        const { data: evidence, error } = await supabase
          .from("dispute_evidence")
          .insert({
            dispute_id: id,
            uploaded_by: user.id,
            file_url,
            file_type,
            description: description || null,
          })
          .select()
          .single();

        if (error || !evidence) {
          return errorResponse({ code: "CREATE_FAILED", message: "Failed to upload evidence", retryable: false }, 500);
        }

        await auditService.logAction(user.id, "user", "dispute_evidence", evidence.id, "upload_evidence", { dispute_id: id });

        return NextResponse.json({ data: evidence }, { status: 201 });
      }

      default:
        return errorResponse({ code: "INVALID_ACTION", message: `Unknown action: ${action}`, retryable: false }, 400);
    }
  } catch (err) {
    if (err instanceof Response) return err;
    logger.error("Failed to process dispute action", {}, err as Error);
    return errorResponse({ code: "INTERNAL_ERROR", message: "Failed to process action", retryable: true }, 500);
  }
}
