"use client";

import { useState, useEffect } from "react";
import { Check, Bell } from "lucide-react";
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
      .then((res) => (res.ok ? res.json() : null))
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
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 lg:px-8 py-6" style={{ maxWidth: "800px" }}>
        <div className="flex items-center justify-between mb-6 dash-item-enter">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)", marginBottom: 4 }}>
              Notifications
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-charcoal)" }}>
              Payment updates, KYC status, and alerts
            </p>
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl transition dash-filter-pill"
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
        </div>

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
            {notifications.map((n, i) => (
              <div
                key={n.notification_id}
                className="dash-txn-row dash-item-enter"
                style={{
                  animationDelay: `${i * 40}ms`,
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                  borderColor: n.read ? "var(--color-hairline)" : "var(--color-primary-subdued)",
                }}
              >
                <div className="flex items-start justify-between w-full gap-3">
                  <div className="flex-1">
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--color-ink)" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--color-charcoal)" }}>
                      {n.body}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-primary)", flexShrink: 0, marginTop: 6 }} />
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-mute)" }}>
                  {formatTime(n.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
