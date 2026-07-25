import type { AuthSession, UserRole } from "@/types";

export interface IIdentityService {
  authenticate(token: string): Promise<AuthSession | null>;
  authorize(userId: string, requiredRole: UserRole): Promise<boolean>;
  createSession(userId: string, sivaTag: string, email: string, role: UserRole): Promise<AuthSession>;
  revokeSession(userId: string): Promise<void>;
  assignRole(userId: string, role: UserRole, assignedBy: string): Promise<void>;
  checkMfa(userId: string, code: string): Promise<boolean>;
}
