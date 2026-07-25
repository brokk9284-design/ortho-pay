import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { publish } from "@/lib/events/event-bus";
import type { Escrow, EscrowEvent, EscrowDocument, EscrowMilestone, EscrowType, EscrowStatus, Currency, PaymentRail } from "@/types";
import type { IEscrowEngine } from "./index";

const VALID_TRANSITIONS: Record<string, string[]> = {
  created: ["funded", "expired"],
  funded: ["held", "reversed", "disputed"],
  held: ["released", "reversed", "disputed"],
  released: [],
  reversed: [],
  expired: [],
  disputed: ["held", "released", "reversed"],
};

export class EscrowEngine implements IEscrowEngine {
  async createEscrow(
    buyerId: string,
    providerId: string | null,
    type: EscrowType,
    grossAmount: number,
    feeAmount: number,
    currency: Currency,
    rail: PaymentRail
  ): Promise<Escrow> {
    const supabase = await createSupabaseAdminClient();
    const netAmount = grossAmount - feeAmount;
    const reference = `ESC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const { data, error } = await supabase
      .from("escrows")
      .insert({
        buyer_id: buyerId,
        provider_id: providerId,
        type,
        status: "created",
        gross_amount: grossAmount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        currency,
        payment_rail: rail,
        reference,
      })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to create escrow: ${error?.message}`);

    await this.recordEvent(data.id, "escrow_created", buyerId, "user", { gross_amount: grossAmount, currency });
    await publish("ESCROW_CREATED", { escrowId: data.id, buyerId, providerId, amount: grossAmount }, buyerId);

    logger.info("Escrow created", { escrowId: data.id, buyerId, grossAmount });
    return data as Escrow;
  }

  async transitionState(escrowId: string, toStatus: string, actorId: string): Promise<Escrow> {
    const supabase = await createSupabaseAdminClient();

    const { data: escrow } = await supabase
      .from("escrows")
      .select("status, buyer_id, provider_id")
      .eq("id", escrowId)
      .single();

    if (!escrow) throw new Error(`Escrow not found: ${escrowId}`);

    const currentStatus = escrow.status as EscrowStatus;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new Error(`Invalid transition: ${currentStatus} -> ${toStatus}`);
    }

    const updateData: Record<string, unknown> = { status: toStatus, updated_at: new Date().toISOString() };
    if (toStatus === "released") updateData.released_at = new Date().toISOString();
    if (toStatus === "reversed") updateData.reversed_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("escrows")
      .update(updateData)
      .eq("id", escrowId)
      .select()
      .single();

    if (error || !updated) throw new Error(`Failed to update escrow: ${error?.message}`);

    await this.recordEvent(escrowId, `escrow_${toStatus}`, actorId, "user", { from: currentStatus, to: toStatus });

    if (toStatus === "released") {
      await publish("ESCROW_RELEASED", { escrowId, actorId }, actorId);
    } else if (toStatus === "reversed") {
      await publish("ESCROW_REFUNDED", { escrowId, actorId }, actorId);
    }

    logger.info("Escrow transition", { escrowId, from: currentStatus, to: toStatus, actorId });
    return updated as Escrow;
  }

  async startTimer(escrowId: string, timerType: string, durationSeconds: number): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();

    const { error } = await supabase.from("escrow_timers").insert({
      escrow_id: escrowId,
      timer_type: timerType,
      expires_at: expiresAt,
      executed: false,
    });

    if (error) throw new Error(`Failed to start timer: ${error.message}`);
  }

  async expireEscrow(escrowId: string): Promise<void> {
    await this.transitionState(escrowId, "expired", "system");
    await publish("ESCROW_EXPIRED", { escrowId }, "system");
  }

  async releaseEscrow(escrowId: string, releasedBy: string): Promise<void> {
    await this.transitionState(escrowId, "released", releasedBy);
  }

  async refundEscrow(escrowId: string, refundedBy: string): Promise<void> {
    await this.transitionState(escrowId, "reversed", refundedBy);
  }

  async addMilestone(escrowId: string, description: string, percentage: number): Promise<EscrowMilestone> {
    const supabase = await createSupabaseAdminClient();

    const { data: escrow } = await supabase
      .from("escrows")
      .select("gross_amount")
      .eq("id", escrowId)
      .single();

    if (!escrow) throw new Error("Escrow not found");

    const amount = (Number(escrow.gross_amount) * percentage) / 100;

    const { data, error } = await supabase
      .from("escrow_milestones")
      .insert({ escrow_id: escrowId, description, percentage, amount, status: "pending" })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to add milestone: ${error?.message}`);
    return data as EscrowMilestone;
  }

  async approveMilestone(milestoneId: string, approvedBy: string): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    const { error: approveErr } = await supabase
      .from("escrow_milestones")
      .update({ status: "approved", approved_by: approvedBy, approved_at: new Date().toISOString() })
      .eq("id", milestoneId);

    if (approveErr) throw new Error(`Failed to approve milestone: ${approveErr.message}`);
  }

  async addDocument(escrowId: string, uploadedBy: string, fileUrl: string, fileType: string, description: string): Promise<EscrowDocument> {
    const supabase = await createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("escrow_documents")
      .insert({ escrow_id: escrowId, uploaded_by: uploadedBy, file_url: fileUrl, file_type: fileType, description })
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to add document: ${error?.message}`);
    return data as EscrowDocument;
  }

  async getEscrowHistory(escrowId: string): Promise<EscrowEvent[]> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("escrow_events")
      .select("*")
      .eq("escrow_id", escrowId)
      .order("created_at", { ascending: true });
    return (data || []) as EscrowEvent[];
  }

  private async recordEvent(
    escrowId: string,
    eventType: string,
    actorId: string,
    actorType: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    await supabase.from("escrow_events").insert({
      escrow_id: escrowId,
      event_type: eventType,
      actor_id: actorId,
      actor_type: actorType,
      metadata,
    });
  }
}

export const escrowEngine = new EscrowEngine();
