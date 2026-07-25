import type { ActorType, EventType } from "./enums";

export interface AuditLog {
  id: string;
  user_id: string | null;
  actor_type: ActorType;
  entity: string;
  entity_id: string;
  action: string;
  ip: string | null;
  device: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action: string;
  target_entity: string;
  target_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  description: string;
  updated_at: string;
}

export interface MaintenanceWindow {
  id: string;
  start_time: string;
  end_time: string;
  description: string;
  affected_services: string[];
  created_at: string;
}

export interface AppEvent {
  id: string;
  type: EventType;
  payload: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}
