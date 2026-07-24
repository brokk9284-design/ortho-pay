"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, ArrowLeft, Check } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/DashboardShared";

interface Notification {
  notification_id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/notifications", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.notifications) setNotifications(data.notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await fetch("/api/v1/notifications/mark-all-read", { method: "POST", credentials: "include" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-canvas)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
      <header className="w-full" style={{ borderBottom: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
        <div className="mx-auto px-4 flex items-center justify-between" style={{ maxWidth: "480px", height: "56px" }}>
          <Link href="/dashboard" className="text-sm transition flex items-center gap-1" style={{ color: "var(--color-charcoal)" }}>
            <ArrowLeft size={16} />
            Back
          </Link>
          <span className="text-lg font-bold font-display tracking-tight" style={{ color: "var(--color-ink)" }}>
            Notifications
          </span>
          {notifications.some((n) => !n.read) ? (
            <button
              onClick={markAllRead}
              className="text-xs transition flex items-center gap-1"
              style={{ color: "var(--color-charcoal)", background: "none", border: "none", cursor: "pointer" }}
            >
              <Check size={12} />
              Mark all
            </button>
          ) : (
            <div style={{ width: 48 }} />
          )}
        </div>
      </header>

      <main className="flex-1 mx-auto px-4 py-4 w-full" style={{ maxWidth: "480px" }}>
        {loading ? (
          <LoadingState message="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={24} style={{ color: "var(--color-mute)" }} />}
            title="No notifications"
            message="You'll see payment updates, KYC status changes, and other alerts here."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div
                key={n.notification_id}
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: n.read ? "var(--color-surface-soft)" : "var(--color-surface-dark)",
                  border: `1px solid ${n.read ? "var(--color-hairline)" : "var(--color-ink)"}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1" style={{ color: "var(--color-ink)" }}>
                      {n.title}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-charcoal)" }}>
                      {n.body}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-terminal-green)", flexShrink: 0, marginTop: 6 }} />
                  )}
                </div>
                <div className="text-[10px] mt-2" style={{ color: "var(--color-mute)" }}>
                  {formatTime(n.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
