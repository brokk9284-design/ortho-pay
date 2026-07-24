"use client";

import { createContext, useContext, useCallback, useState, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

const colors: Record<ToastType, string> = {
  success: "var(--color-terminal-green)",
  error: "#ef4444",
  warning: "var(--color-terminal-yellow)",
  info: "var(--color-charcoal)",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 380,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 10,
              backgroundColor: "var(--color-surface-soft)",
              border: `1px solid ${colors[t.type]}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              animation: "toastSlideIn 0.2s ease-out",
            }}
          >
            <span style={{ color: colors[t.type], flexShrink: 0, marginTop: 1 }}>
              {icons[t.type]}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--color-ink)",
                fontFamily: "var(--font-body)",
              }}
            >
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "var(--color-mute)",
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <style>{`
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </ToastContext.Provider>
  );
}
