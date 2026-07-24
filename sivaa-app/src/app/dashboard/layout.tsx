"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  PieChart,
  Send,
  Download,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLogout } from "@/components/DashboardShared";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/dashboard/request", label: "Request", icon: Download },
  { href: "/dashboard/chat", label: "Chats", icon: MessageSquare },
  { href: "/dashboard/notifications", label: "Alerts", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sivaTag, setSivaTag] = useState("...");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const logout = useLogout();

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.siva_tag) setSivaTag(data.user.siva_tag);
      })
      .catch(() => {});

    fetch("/api/v1/notifications", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.notifications) {
          setUnreadNotifications(data.notifications.filter((n: { read: boolean }) => !n.read).length);
        }
      })
      .catch(() => {});

    fetch("/api/v1/chats", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.unreadCounts) {
          const total = Object.values(data.unreadCounts).reduce(
            (a: number, b: unknown) => a + (b as number),
            0
          );
          setUnreadChats(total as number);
        }
      })
      .catch(() => {});
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--color-canvas)", color: "var(--color-ink)" }}
    >
      {/* Desktop Sidebar */}
      <aside
        className="dash-sidebar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          zIndex: 200,
          backgroundColor: "var(--color-surface-soft)",
          borderRight: "1px solid var(--color-hairline)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 250ms cubic-bezier(0, 0, 0.2, 1)",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <Link
            href="/dashboard"
            className="text-xl font-bold font-display tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            ORTHO-PAY
          </Link>
        </div>

        {/* User Tag */}
        <div
          style={{
            margin: "0 16px 24px",
            padding: "12px 16px",
            borderRadius: 12,
            backgroundColor: "var(--color-canvas)",
            border: "1px solid var(--color-hairline)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--color-mute)",
              marginBottom: 2,
            }}
          >
            Your Tag
          </div>
          <div className="font-display font-bold" style={{ color: "var(--color-ink)" }}>
            ${sivaTag}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-2 px-3 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const badge =
              item.href === "/dashboard/chat"
                ? unreadChats
                : item.href === "/dashboard/notifications"
                  ? unreadNotifications
                  : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="dash-nav-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                  backgroundColor: active ? "var(--color-primary)" : "transparent",
                  color: active ? "var(--color-on-primary)" : "var(--color-body)",
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
                {badge > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: active ? "rgba(255,255,255,0.25)" : "var(--color-error)",
                      color: active ? "#fff" : "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 5px",
                    }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-hairline)" }}>
          <div className="flex items-center justify-between mb-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="transition"
              style={{
                color: "var(--color-charcoal)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 150,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: 0 }}
      >
        <style>{`
          @media (min-width: 1024px) {
            .dash-sidebar {
              transform: translateX(0) !important;
            }
            .dash-content {
              margin-left: 260px;
            }
            .dash-mobile-header {
              display: none !important;
            }
            .dash-bottom-nav {
              display: none !important;
            }
          }
        `}</style>

        {/* Mobile Header */}
        <header
          className="dash-mobile-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            height: 56,
            backgroundColor: "var(--color-surface-soft)",
            borderBottom: "1px solid var(--color-hairline)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-ink)" }}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link
            href="/dashboard"
            className="text-lg font-bold font-display tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            ORTHO-PAY
          </Link>
          <ThemeToggle />
        </header>

        {/* Page Content */}
        <div
          key={pathname}
          className="dash-content route-transition flex-1"
          style={{ paddingBottom: 72 }}
        >
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav
          className="dash-bottom-nav"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            height: 64,
            backgroundColor: "var(--color-surface-soft)",
            borderTop: "1px solid var(--color-hairline)",
            paddingBottom: "env(safe-area-inset-bottom, 0)",
          }}
        >
          {NAV_ITEMS.filter((_, i) => [0, 2, 3, 4, 5].includes(i)).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const badge =
              item.href === "/dashboard/chat"
                ? unreadChats
                : item.href === "/dashboard/notifications"
                  ? unreadNotifications
                  : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  flex: 1,
                  textDecoration: "none",
                  position: "relative",
                  transition: "color 150ms ease",
                  color: active ? "var(--color-primary)" : "var(--color-mute)",
                }}
              >
                <Icon size={22} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
                {badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      right: "50%",
                      transform: "translateX(16px)",
                      fontSize: 9,
                      fontWeight: 700,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: "var(--color-error)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
