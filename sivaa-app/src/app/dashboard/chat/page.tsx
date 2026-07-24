"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus } from "lucide-react";

interface ChatItem {
  chat_id: string;
  last_message_at: string;
  created_at: string;
  user_a: { id: string; siva_tag: string; name: string; avatar_url: string | null }[];
  user_b: { id: string; siva_tag: string; name: string; avatar_url: string | null }[];
}

interface ChatListResponse {
  chats: ChatItem[];
  unreadCounts: Record<string, number>;
}

export default function ChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [sivaTagInput, setSivaTagInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.id) setCurrentUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/chats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load chats");
      const data: ChatListResponse = await res.json();
      setChats(data.chats || []);
      setUnreadCounts(data.unreadCounts || {});
    } catch {
      setError("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleResolveTag = async () => {
    if (!sivaTagInput.trim()) return;
    setResolving(true);
    setError("");
    try {
      const res = await fetch("/api/v1/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ siva_tag: sivaTagInput.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve tag");
      }
      const data = await res.json();
      router.push(`/dashboard/chat/${data.chat_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve tag");
    } finally {
      setResolving(false);
    }
  };

  const getOtherUser = (chat: ChatItem) => {
    return chat.user_a?.[0]?.id === currentUserId ? chat.user_b?.[0] : chat.user_a?.[0];
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const days = hours / 24;
    if (days < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 lg:px-8 py-6" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 dash-item-enter">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)", marginBottom: 4 }}>
              Chats
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-charcoal)" }}>
              Message other ORTHO-PAY users
            </p>
          </div>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-on-primary)",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* New Chat Form */}
        {showNewChat && (
          <div
            className="dash-workflow-card dash-item-enter mb-4"
            style={{ padding: 20 }}
          >
            <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
              Enter ORTHO Tag
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sivaTagInput}
                onChange={(e) => setSivaTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResolveTag()}
                placeholder="$alice"
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", color: "var(--color-ink)" }}
                autoFocus
              />
              <button
                onClick={handleResolveTag}
                disabled={resolving || !sivaTagInput.trim()}
                className="btn btn-primary"
                style={{ borderRadius: 12 }}
              >
                {resolving ? "..." : "Start"}
              </button>
            </div>
            {error && (
              <p style={{ fontSize: 13, marginTop: 8, color: "var(--color-error)" }}>{error}</p>
            )}
          </div>
        )}

        {/* Chat List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span style={{ fontSize: 14, color: "var(--color-charcoal)" }}>Loading chats...</span>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 dash-item-enter">
            <div
              className="mb-4 rounded-full flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                backgroundColor: "var(--color-surface-soft)",
                border: "1px solid var(--color-hairline)",
              }}
            >
              <MessageSquare size={24} style={{ color: "var(--color-mute)" }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--color-ink)" }}>No chats yet</p>
            <p style={{ fontSize: 13, color: "var(--color-charcoal)" }}>Enter a ORTHO tag to start a conversation</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {chats.map((chat, i) => {
              const other = getOtherUser(chat);
              const unread = unreadCounts[chat.chat_id] || 0;
              return (
                <Link
                  key={chat.chat_id}
                  href={`/dashboard/chat/${chat.chat_id}`}
                  className="dash-txn-row dash-item-enter"
                  style={{ animationDelay: `${i * 40}ms`, textDecoration: "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ width: 44, height: 44, backgroundColor: "var(--color-ink)" }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-canvas)" }}>
                        {other?.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }} className="truncate">
                          {other?.name || "Unknown"}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--color-charcoal)", flexShrink: 0, marginLeft: 8 }}>
                          {formatTime(chat.last_message_at || chat.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 13, color: "var(--color-charcoal)" }}>
                          ${other?.siva_tag || "unknown"}
                        </span>
                        {unread > 0 && (
                          <span
                            className="dash-badge dash-badge-info"
                            style={{ minWidth: 20, justifyContent: "center" }}
                          >
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
