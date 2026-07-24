"use client";

import { ReactNode, Component, ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            backgroundColor: "var(--color-canvas)",
            fontFamily: "var(--font-body)",
          }}
        >
          <AlertTriangle size={40} style={{ color: "var(--color-terminal-yellow)", marginBottom: 16 }} />
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--color-ink)",
              marginBottom: 8,
              fontFamily: "var(--font-display)",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-charcoal)", textAlign: "center", marginBottom: 20 }}>
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "var(--color-ink)",
              color: "var(--color-canvas)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
