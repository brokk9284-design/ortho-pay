import type { AuditLog, ActorType } from "@/types";

export interface IAuditService {
  logAction(userId: string | null, actorType: ActorType, entity: string, entityId: string, action: string, metadata?: Record<string, unknown>): Promise<void>;
  getAuditTrail(entity: string, entityId: string): Promise<AuditLog[]>;
  getAuditLogByUser(userId: string, page: number, limit: number): Promise<{ data: AuditLog[]; total: number }>;
  exportAuditLog(from: string, to: string): Promise<AuditLog[]>;
}
