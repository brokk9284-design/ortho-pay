"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    return chat.user_a?.[0]?.id === getCurrentUserId() ? chat.user_b?.[0] : chat.user_a?.[0];
  };

  const getCurrentUserId = () => {
    return "";
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-canvas)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
      <header className="w-full" style={{ borderBottom: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
        <div className="mx-auto px-4 flex items-center justify-between" style={{ maxWidth: "480px", height: "56px" }}>
          <Link href="/dashboard" className="text-sm transition" style={{ color: "var(--color-charcoal)" }}>
            ← Back
          </Link>
          <span className="text-lg font-bold font-display tracking-tight" style={{ color: "var(--color-ink)" }}>
            Chats
          </span>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="text-xs px-3 py-1 rounded-full transition"
            style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
          >
            New
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto px-4 py-4 w-full" style={{ maxWidth: "480px" }}>
        {showNewChat && (
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: "var(--color-charcoal)" }}>
              Enter ORTHO Tag
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sivaTagInput}
                onChange={(e) => setSivaTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResolveTag()}
                placeholder="$alice"
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)", color: "var(--color-ink)" }}
              />
              <button
                onClick={handleResolveTag}
                disabled={resolving || !sivaTagInput.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
              >
                {resolving ? "..." : "Start"}
              </button>
            </div>
            {error && <p className="text-xs mt-2" style={{ color: "var(--color-terminal-red)" }}>{error}</p>}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-sm" style={{ color: "var(--color-charcoal)" }}>Loading chats...</span>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 rounded-full flex items-center justify-center" style={{ width: 64, height: 64, backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm mb-1" style={{ color: "var(--color-ink)" }}>No chats yet</p>
            <p className="text-xs" style={{ color: "var(--color-charcoal)" }}>Enter a ORTHO tag to start a conversation</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {chats.map((chat) => {
              const other = getOtherUser(chat);
              const unread = unreadCounts[chat.chat_id] || 0;
              return (
                <Link
                  key={chat.chat_id}
                  href={`/dashboard/chat/${chat.chat_id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition hover:opacity-80"
                  style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}
                >
                  <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, backgroundColor: "var(--color-ink)" }}>
                    <span className="text-sm font-bold" style={{ color: "var(--color-canvas)" }}>
                      {other?.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--color-ink)" }}>
                        {other?.name || "Unknown"}
                      </span>
                      <span className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--color-charcoal)" }}>
                        {formatTime(chat.last_message_at || chat.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "var(--color-charcoal)" }}>
                        ${other?.siva_tag || "unknown"}
                      </span>
                      {unread > 0 && (
                        <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}>
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
