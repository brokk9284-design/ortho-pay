"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
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
      <h1
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "var(--color-ink)",
          marginBottom: 8,
          fontFamily: "var(--font-display)",
        }}
      >
        404
      </h1>
      <p style={{ fontSize: 14, color: "var(--color-charcoal)", marginBottom: 24 }}>
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 24px",
          borderRadius: 8,
          backgroundColor: "var(--color-ink)",
          color: "var(--color-canvas)",
          fontSize: 14,
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        <Home size={16} />
        Back to Home
      </Link>
    </div>
  );
}
