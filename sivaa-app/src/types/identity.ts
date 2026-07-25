import type {
  UserRole,
  VerificationLevel,
  KycStatus,
  Currency,
  PaymentRail,
  WalletStatus,
} from "./enums";

export interface Profile {
  id: string;
  siva_tag: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  avatar_url: string | null;
  user_type: UserRole;
  kyc_status: KycStatus;
  verification_level: VerificationLevel;
  trust_score: number;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_by: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  role: UserRole;
  permission: string;
  created_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  device_fingerprint: string;
  user_agent: string | null;
  last_seen: string;
  created_at: string;
}

export interface MfaConfig {
  id: string;
  user_id: string;
  method: "totp" | "sms" | "email";
  secret: string | null;
  enabled: boolean;
  created_at: string;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  type: "kyc" | "aml" | "sanctions";
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserLimits {
  user_id: string;
  daily_transaction_limit: number;
  single_transaction_limit: number;
  monthly_volume_limit: number;
  currency: Currency;
  updated_at: string;
}

export interface AuthSession {
  userId: string;
  sivaTag: string;
  email: string;
  role: UserRole;
  expiresAt: number;
}
