"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Bell, MessageSquare, Shield, Copy, Check } from "lucide-react";

interface UserProfile {
  id: string;
  siva_tag: string;
  name: string;
  is_admin: boolean;
}

export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser({
            id: data.user.id,
            siva_tag: data.user.siva_tag || "",
            name: data.user.name || "",
            is_admin: !!data.is_admin,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

export function useLogout() {
  const router = useRouter();
  return async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
    } catch {
    }
    router.push("/login");
  };
}

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  };
  return { copied, copy };
}

interface DashboardHeaderProps {
  sivaTag?: string;
  unreadNotifications?: number;
  unreadChats?: number;
  isAdmin?: boolean;
}

export function DashboardHeader({ sivaTag, unreadNotifications = 0, unreadChats = 0, isAdmin = false }: DashboardHeaderProps) {
  const router = useRouter();
  const logout = useLogout();
  const { copied, copy } = useCopyToClipboard();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className="w-full"
      style={{ borderBottom: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}
    >
      <div
        className="mx-auto px-4 flex items-center justify-between"
        style={{ maxWidth: "480px", height: "56px" }}
      >
        <Link
          href="/dashboard"
          className="text-lg font-bold font-display tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          ORTHO-PAY
        </Link>

        <div className="flex items-center gap-4">
          {sivaTag && (
            <button
              onClick={() => copy(`$${sivaTag}`)}
              className="flex items-center gap-1 text-xs transition"
              style={{ color: "var(--color-charcoal)" }}
              title="Copy your ORTHO tag"
            >
              <span style={{ fontFamily: "var(--font-mono, monospace)" }}>{`$${sivaTag}`}</span>
              {copied ? <Check size={12} style={{ color: "var(--color-terminal-green)" }} /> : <Copy size={12} />}
            </button>
          )}

          <Link
            href="/dashboard/notifications"
            className="relative transition"
            style={{ color: "var(--color-charcoal)" }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  fontSize: 9,
                  fontWeight: 700,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: "var(--color-terminal-red)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/chat"
            className="relative transition"
            style={{ color: "var(--color-charcoal)" }}
            title="Chats"
          >
            <MessageSquare size={18} />
            {unreadChats > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  fontSize: 9,
                  fontWeight: 700,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: "var(--color-terminal-red)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {unreadChats > 99 ? "99+" : unreadChats}
              </span>
            )}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="transition"
              style={{ color: "var(--color-charcoal)" }}
              title="Admin Panel"
            >
              <Shield size={18} />
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="transition"
            style={{ color: "var(--color-charcoal)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function EmptyState({ icon, title, message }: { icon: ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="mb-4 rounded-full flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          backgroundColor: "var(--color-surface-soft)",
          border: "1px solid var(--color-hairline)",
        }}
      >
        {icon}
      </div>
      <p className="text-sm mb-1 font-medium" style={{ color: "var(--color-ink)" }}>
        {title}
      </p>
      <p className="text-xs" style={{ color: "var(--color-charcoal)" }}>
        {message}
      </p>
    </div>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <span className="text-sm" style={{ color: "var(--color-charcoal)" }}>
        {message}
      </span>
    </div>
  );
}
