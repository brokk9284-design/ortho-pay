"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Paperclip, ArrowLeft } from "lucide-react";

interface Message {
  message_id: string;
  sender_id: string;
  message_type: "user" | "system" | "file";
  body: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  payment_id: string | null;
  payment_request_id: string | null;
  event_type: string | null;
  read_by_a: boolean;
  read_by_b: boolean;
  created_at: string;
}

export default function ChatConversationPage() {
  const params = useParams();
  const chatId = params.chat_id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserTag, setOtherUserTag] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/chats/messages?chat_id=${chatId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user?.id) setCurrentUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/v1/chats`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.chats) {
          const chat = data.chats.find((c: { chat_id: string }) => c.chat_id === chatId);
          if (chat) {
            const isUserA = chat.user_a?.[0]?.id === currentUserId;
            const other = isUserA ? chat.user_b?.[0] : chat.user_a?.[0];
            if (other) {
              setOtherUserName(other.name || "User");
              setOtherUserTag(other.siva_tag || "unknown");
            }
          }
        }
      })
      .catch(() => {});
  }, [chatId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/v1/chats/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chat_id: chatId, body: input.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setInput("");
      await fetchMessages();
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chat_id", chatId);
    try {
      const res = await fetch("/api/v1/chats/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      await fetchMessages();
    } catch {
      setError("Failed to upload file");
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const isMyMessage = (msg: Message) => msg.sender_id === currentUserId;
  const isSystem = (msg: Message) => msg.message_type === "system";
  const isFile = (msg: Message) => msg.message_type === "file";

  let lastDate = "";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-canvas)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
      <header className="w-full" style={{ borderBottom: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
        <div className="mx-auto px-4 flex items-center justify-between" style={{ maxWidth: "480px", height: "56px" }}>
          <Link href="/dashboard/chat" className="text-sm transition" style={{ color: "var(--color-charcoal)" }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="text-center">
            <div className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>{otherUserName}</div>
            <div className="text-xs" style={{ color: "var(--color-charcoal)" }}>${otherUserTag}</div>
          </div>
          <div style={{ width: 48 }} />
        </div>
      </header>

      <main className="flex-1 mx-auto w-full flex flex-col" style={{ maxWidth: "480px" }}>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2" style={{ minHeight: "calc(100vh - 120px)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-sm" style={{ color: "var(--color-charcoal)" }}>Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm" style={{ color: "var(--color-charcoal)" }}>No messages yet. Start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const msgDate = formatDate(msg.created_at);
              const showDateDivider = msgDate !== lastDate;
              lastDate = msgDate;

              if (isSystem(msg)) {
                return (
                  <div key={msg.message_id}>
                    {showDateDivider && (
                      <div className="flex items-center justify-center my-3">
                        <span className="text-xs px-3 py-1 rounded-full" style={{ color: "var(--color-charcoal)", backgroundColor: "var(--color-surface-soft)" }}>
                          {msgDate}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-center my-1">
                      <div className="rounded-lg px-3 py-2 text-xs text-center max-w-[85%]" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", color: "var(--color-charcoal)" }}>
                        {msg.body}
                        {msg.event_type && (
                          <span className="block mt-1 text-[10px] uppercase tracking-wider opacity-60">{msg.event_type.replace(/_/g, " ")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              const mine = isMyMessage(msg);

              return (
                <div key={msg.message_id}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-3">
                      <span className="text-xs px-3 py-1 rounded-full" style={{ color: "var(--color-charcoal)", backgroundColor: "var(--color-surface-soft)" }}>
                        {msgDate}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className="rounded-2xl px-3 py-2 max-w-[75%]"
                      style={{
                        backgroundColor: mine ? "var(--color-ink)" : "var(--color-surface-soft)",
                        color: mine ? "var(--color-canvas)" : "var(--color-ink)",
                        border: mine ? "none" : "1px solid var(--color-hairline)",
                      }}
                    >
                      {isFile(msg) ? (
                        <div className="flex items-center gap-2">
                          <Paperclip size={16} />
                          <div>
                            <div className="text-sm font-medium">{msg.file_name || "File"}</div>
                            {msg.file_size && (
                              <div className="text-xs opacity-60">{(msg.file_size / 1024).toFixed(1)} KB</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap break-words">{msg.body}</div>
                      )}
                      <div className={`text-[10px] mt-1 ${mine ? "opacity-50" : "opacity-40"}`}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {error && (
            <div className="flex justify-center my-2">
              <span className="text-xs" style={{ color: "var(--color-terminal-red)" }}>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-full p-2 transition" style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)" }}>
              <Paperclip size={16} style={{ color: "var(--color-charcoal)" }} />
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-full text-sm outline-none"
              style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)", color: "var(--color-ink)" }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
