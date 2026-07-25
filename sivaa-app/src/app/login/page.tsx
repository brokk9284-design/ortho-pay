"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      if (data.is_admin) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#0a0a0a", fontFamily: "var(--font-body)" }}>
      <div className="w-full" style={{ maxWidth: "400px" }}>
        <Link href="/" className="block text-center mb-8">
          <span className="font-display text-2xl font-extrabold tracking-tight" style={{ color: "#ffffff" }}>
            ORTHO-PAY
          </span>
        </Link>

        <h1 className="text-xl font-medium text-center mb-2" style={{ color: "#ffffff" }}>
          Welcome back
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
          Sign in to your ORTHO-PAY account
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

          <div className="input-group">
            <label className="input-label" htmlFor="password" style={{ color: "#ffffff" }}>Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input pr-10"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626", color: "#ffffff" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs transition"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="text-sm rounded-lg p-3" style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)", color: "#0a0a0a" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium" style={{ color: "var(--color-primary)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
