import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { AuditLog, ActorType } from "@/types";
import type { IAuditService } from "./index";

export class AuditService implements IAuditService {
  async logAction(
    userId: string | null,
    actorType: ActorType,
    entity: string,
    entityId: string,
    action: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createSupabaseAdminClient();

    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      actor_type: actorType,
      entity,
      entity_id: entityId,
      action,
      metadata: metadata || null,
    });

    if (error) {
      logger.error("Failed to write audit log", { entity, entityId, action }, new Error(error.message));
    }
  }

  async getAuditTrail(entity: string, entityId: string): Promise<AuditLog[]> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity", entity)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: true });
    return (data || []) as AuditLog[];
  }

  async getAuditLogByUser(userId: string, page: number, limit: number): Promise<{ data: AuditLog[]; total: number }> {
    const supabase = await createSupabaseAdminClient();
    const offset = (page - 1) * limit;

    const { data, count } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      data: (data || []) as AuditLog[],
      total: count || 0,
    };
  }

  async exportAuditLog(from: string, to: string): Promise<AuditLog[]> {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true });
    return (data || []) as AuditLog[];
  }
}

export const auditService = new AuditService();
