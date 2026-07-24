"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Clock } from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const name = params.get("name") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeExpiry, setCodeExpiry] = useState(600);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (codeExpiry <= 0) return;
    const timer = setInterval(() => setCodeExpiry((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [codeExpiry]);

  const formatExpiry = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    setError("");
    setSuccess("");
    setVerifying(true);

    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.expired) {
          setError("Your verification code has expired. Please request a new one.");
        } else if (data.invalid) {
          setError("Invalid verification code. Double-check the 6 digits from your email and try again.");
        } else {
          setError(data.error || "Verification failed. Please try again.");
        }
        setVerifying(false);
        return;
      }

      setSuccess("Email verified! Redirecting to your dashboard...");

      // Sign in with Supabase client-side to establish session cookies
      const password = sessionStorage.getItem("reg_password");
      if (password) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError("Email verified but auto-login failed. Please sign in manually.");
          setTimeout(() => router.push("/login"), 2000);
        } else {
          sessionStorage.removeItem("reg_password");
          setTimeout(() => router.push("/dashboard"), 1500);
        }
      } else {
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResending(true);

    try {
      const res = await fetch("/api/v1/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend code. Please try again.");
      } else {
        setSuccess("A new verification code has been sent to your email.");
        setResendCooldown(60);
        setCodeExpiry(600);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setResending(false);
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
          Verify your email
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: "var(--color-charcoal)" }}>
          We sent a 6-digit code to <strong style={{ color: "var(--color-ink)" }}>{email}</strong>. Enter it below to activate your account.
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="input-label" htmlFor="code">Verification Code</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              className="input text-center text-2xl font-mono tracking-widest"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(val);
                if (val.length === 6 && !verifiedRef.current) {
                  handleVerify();
                }
              }}
              placeholder="000000"
              maxLength={6}
              required
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div className="text-sm rounded-lg p-3" style={{ color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm rounded-lg p-3" style={{ color: "var(--color-terminal-green)", backgroundColor: "rgba(34, 197, 94, 0.08)", border: "1px solid var(--color-terminal-green)" }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={verifying || code.length < 6}
          >
            {verifying ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        <div className="mt-6 text-center">
          {codeExpiry > 0 ? (
            <p className="text-xs flex items-center justify-center gap-1 mb-3" style={{ color: "var(--color-mute)" }}>
              <Clock size={12} />
              Code expires in {formatExpiry(codeExpiry)}
            </p>
          ) : (
            <p className="text-xs mb-3" style={{ color: "var(--color-error)" }}>
              Your code has expired. Please request a new one.
            </p>
          )}
          <p className="text-sm" style={{ color: "var(--color-charcoal)" }}>
            Didn&apos;t receive a code?{" "}
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="font-medium underline disabled:opacity-50 disabled:no-underline"
              style={{ color: "var(--color-ink)" }}
            >
              {resending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </p>
          <p className="text-xs mt-4" style={{ color: "var(--color-mute)" }}>
            Check your spam folder if you don&apos;t see the email within a minute.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-canvas)" }}><span style={{ color: "var(--color-charcoal)" }}>Loading...</span></div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
