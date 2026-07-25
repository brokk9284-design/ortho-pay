"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
        setLoading(false);
        return;
      }

      setSuccess("If an account exists with that email, a password reset link has been sent.");
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#0a0a0a", fontFamily: "var(--font-body)" }}>
      <div className="w-full" style={{ maxWidth: "400px" }}>
        <Link href="/" className="block text-center mb-8">
          <span className="text-2xl font-bold font-display tracking-tight" style={{ color: "#ffffff" }}>
            ORTHO-PAY
          </span>
        </Link>

        <div className="flex justify-center mb-6">
          <div className="rounded-full flex items-center justify-center" style={{ width: 48, height: 48, backgroundColor: "#1a1a1a", border: "1px solid #262626" }}>
            <Mail size={20} style={{ color: "rgba(255,255,255,0.5)" }} />
          </div>
        </div>

        <h1 className="text-xl font-display font-medium text-center mb-2" style={{ color: "#ffffff" }}>
          Reset your password
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="input-label" htmlFor="email" style={{ color: "#ffffff" }}>Email</label>
            <input
              id="email"
              type="email"
              className="input"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626", color: "#ffffff" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm rounded-lg p-3" style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm rounded-lg p-3" style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid #22c55e" }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full h-12 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)", color: "#0a0a0a" }}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          Remember your password?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--color-primary)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
