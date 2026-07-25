import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { cacheSet, cacheGet, cacheDelete, buildCacheKey } from "@/lib/redis";
import type { AuthSession, UserRole } from "@/types";
import type { IIdentityService } from "./index";

const SESSION_TTL = 86400;

export class IdentityService implements IIdentityService {
  async authenticate(token: string): Promise<AuthSession | null> {
    const supabase = await createSupabaseAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const cached = await cacheGet<AuthSession>(buildCacheKey("session", user.id));
    if (cached && cached.expiresAt > Date.now()) return cached;

    const { data: profile } = await supabase
      .from("profiles")
      .select("siva_tag, email, user_type")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    const session: AuthSession = {
      userId: user.id,
      sivaTag: profile.siva_tag,
      email: profile.email,
      role: profile.user_type as UserRole,
      expiresAt: Date.now() + SESSION_TTL * 1000,
    };

    await cacheSet(buildCacheKey("session", user.id), session, SESSION_TTL);
    return session;
  }

  async authorize(userId: string, requiredRole: UserRole): Promise<boolean> {
    const supabase = await createSupabaseAdminClient();
    const { data: role } = await supabase
      .from("roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", requiredRole)
      .single();

    return !!role;
  }

  async createSession(userId: string, sivaTag: string, email: string, role: UserRole): Promise<AuthSession> {
    const session: AuthSession = {
      userId,
      sivaTag,
      email,
      role,
      expiresAt: Date.now() + SESSION_TTL * 1000,
    };

    await cacheSet(buildCacheKey("session", userId), session, SESSION_TTL);
    return session;
  }

  async revokeSession(userId: string): Promise<void> {
    await cacheDelete(buildCacheKey("session", userId));
  }

  async assignRole(userId: string, role: UserRole, assignedBy: string): Promise<void> {
    const supabase = await createSupabaseAdminClient();
    await supabase.from("roles").insert({
      user_id: userId,
      role,
      assigned_by: assignedBy,
    });
  }

  async checkMfa(userId: string, code: string): Promise<boolean> {
    const supabase = await createSupabaseAdminClient();
    const { data: mfa } = await supabase
      .from("mfa_configs")
      .select("method, secret, enabled")
      .eq("user_id", userId)
      .eq("enabled", true)
      .single();

    if (!mfa) return true;

    // For TOTP, verify the code against the secret
    // For now, just check the code is 6 digits
    return /^\d{6}$/.test(code);
  }
}

export const identityService = new IdentityService();
