"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [country, setCountry] = useState("US");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, country }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Redirect to OTP verification page with email
      sessionStorage.setItem("reg_password", password);
      const params = new URLSearchParams({ email, name });
      router.push(`/verify-otp?${params.toString()}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ backgroundColor: "var(--color-canvas)", fontFamily: "var(--font-body)" }}>
      <div className="w-full" style={{ maxWidth: "400px" }}>
        <Link href="/" className="block text-center mb-8">
          <span className="text-2xl font-bold font-display tracking-tight" style={{ color: "var(--color-ink)" }}>
            ORTHO-PAY
          </span>
        </Link>

        <h1 className="text-xl font-display font-medium text-center mb-2" style={{ color: "var(--color-ink)" }}>
          Create your account
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: "var(--color-charcoal)" }}>
          Get a unique $ORTHO tag to send and receive
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="input-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Carter"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-mute)" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {[
                  { label: "8+ characters", check: password.length >= 8 },
                  { label: "Uppercase letter", check: /[A-Z]/.test(password) },
                  { label: "Number", check: /\d/.test(password) },
                  { label: "Special character", check: /[^A-Za-z0-9]/.test(password) },
                ].map((req) => (
                  <div key={req.label} className="flex items-center gap-1 text-[10px]" style={{ color: req.check ? "var(--color-terminal-green)" : "var(--color-mute)" }}>
                    {req.check ? <Check size={10} /> : <X size={10} />}
                    {req.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="input pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-mute)" }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <span className="text-[10px] mt-1" style={{ color: "#ef4444" }}>Passwords do not match</span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="country">Country</label>
            <select
              id="country"
              className="input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>

          {error && (
            <div className="text-sm rounded-lg p-3" style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "var(--color-charcoal)" }}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--color-ink)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
