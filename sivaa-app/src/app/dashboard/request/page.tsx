"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface PaymentMethod {
  method_id: string;
  code: string;
  display_name: string;
  icon_key: string;
  fee_percentage: number;
  fee_fixed: number;
}

export default function RequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"details" | "review" | "confirm">("details");
  const [sivaTag, setSivaTag] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [myTag, setMyTag] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) { router.push("/login"); return null; }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data?.user?.siva_tag) setMyTag(data.user.siva_tag);
      })
      .catch(() => {});

    fetch("/api/v1/payment-methods", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.payment_methods) {
          setPaymentMethods(data.payment_methods);
          if (data.payment_methods.length > 0) {
            setSelectedMethodId(data.payment_methods[0].method_id);
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!sivaTag || !requestAmount) {
      setError("Please fill in all fields");
      return;
    }

    const amt = parseFloat(requestAmount);
    if (isNaN(amt) || amt <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    setStep("review");
  };

  const handleSubmitRequest = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          from_tag: sivaTag,
          amount: parseFloat(requestAmount),
          note: requestNote || undefined,
          payment_method_id: selectedMethodId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create request");
        setSubmitting(false);
        return;
      }

      setRequestId(data.request_id || data.id || "");
      setStep("confirm");
      toast("Payment request sent", "success");
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  const copyTag = () => {
    navigator.clipboard.writeText(`$${myTag}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setStep("details");
    setSivaTag("");
    setRequestAmount("");
    setRequestNote("");
    setError("");
    setRequestId("");
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 lg:px-8 py-6" style={{ maxWidth: "600px" }}>
        {/* Header */}
        <div className="mb-6 dash-item-enter">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)", marginBottom: 4 }}>
            Request Money
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-charcoal)" }}>
            Send a payment request to any ORTHO-PAY user
          </p>
        </div>

        {/* Stepper */}
        <div className="dash-stepper dash-item-enter" style={{ animationDelay: "50ms" }}>
          <div className="dash-stepper-step">
            <div className={`dash-stepper-circle ${step === "details" ? "dash-stepper-circle-active" : "dash-stepper-circle-done"}`}>
              {step !== "details" ? <CheckCircle2 size={16} /> : "1"}
            </div>
            <span className={`dash-stepper-label ${step === "details" ? "dash-stepper-label-active" : ""}`}>Details</span>
          </div>
          <div className={`dash-stepper-line ${step !== "details" ? "dash-stepper-line-done" : ""}`} />
          <div className="dash-stepper-step">
            <div className={`dash-stepper-circle ${step === "review" ? "dash-stepper-circle-active" : step === "confirm" ? "dash-stepper-circle-done" : "dash-stepper-circle-pending"}`}>
              {step === "confirm" ? <CheckCircle2 size={16} /> : "2"}
            </div>
            <span className={`dash-stepper-label ${step === "review" ? "dash-stepper-label-active" : ""}`}>Review</span>
          </div>
          <div className={`dash-stepper-line ${step === "confirm" ? "dash-stepper-line-done" : ""}`} />
          <div className="dash-stepper-step">
            <div className={`dash-stepper-circle ${step === "confirm" ? "dash-stepper-circle-active" : "dash-stepper-circle-pending"}`}>
              3
            </div>
            <span className={`dash-stepper-label ${step === "confirm" ? "dash-stepper-label-active" : ""}`}>Done</span>
          </div>
        </div>

        {/* Step: Details */}
        {step === "details" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms" }}>
            <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-5">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                  Request From ($ORTHO Tag)
                </label>
                <div className="dash-search" style={{ padding: "0 16px" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-charcoal)" }}>$</span>
                  <input
                    type="text"
                    value={sivaTag}
                    onChange={(e) => setSivaTag(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="alice"
                    className="flex-1 bg-transparent py-3 outline-none text-base"
                    style={{ color: "var(--color-ink)" }}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                  Amount (USD)
                </label>
                <div className="dash-amount-input">
                  <span className="dash-amount-input-currency">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="0.00"
                    className="dash-amount-input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                  Note (Optional)
                </label>
                <textarea
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="What's this request for?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
                  style={{
                    backgroundColor: "var(--color-surface-soft)",
                    border: "1px solid var(--color-hairline)",
                    color: "var(--color-ink)",
                  }}
                />
              </div>

              {paymentMethods.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                    Preferred Payment Method
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.method_id}
                        type="button"
                        onClick={() => setSelectedMethodId(method.method_id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl transition"
                        style={{
                          backgroundColor: selectedMethodId === method.method_id ? "var(--color-primary)" : "var(--color-surface-soft)",
                          border: `1px solid ${selectedMethodId === method.method_id ? "var(--color-primary)" : "var(--color-hairline)"}`,
                          color: selectedMethodId === method.method_id ? "var(--color-on-primary)" : "var(--color-ink)",
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{method.display_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ fontSize: 13, borderRadius: 10, padding: 12, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/dashboard" className="btn btn-secondary btn-lg flex-1 text-center">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary btn-lg flex-1">
                  Review →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--color-ink)" }}>Review Request</h3>

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, color: "var(--color-charcoal)" }}>Requesting from</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink)" }}>${sivaTag}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, color: "var(--color-charcoal)" }}>Amount</span>
                <span style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--color-primary)" }}>
                  ${parseFloat(requestAmount).toFixed(2)}
                </span>
              </div>
              {requestNote && (
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: "var(--color-charcoal)" }}>Note</span>
                  <span style={{ fontSize: 14, color: "var(--color-ink)", maxWidth: 200, textAlign: "right" }}>{requestNote}</span>
                </div>
              )}
              {selectedMethodId && (
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 13, color: "var(--color-charcoal)" }}>Method</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                    {paymentMethods.find((m) => m.method_id === selectedMethodId)?.display_name || "Any"}
                  </span>
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, color: "var(--color-mute)", marginBottom: 20, padding: 12, borderRadius: 10, background: "var(--color-surface-soft)" }}>
              The recipient will receive a notification and a chat will be created to discuss the payment.
            </div>

            {error && (
              <div style={{ fontSize: 13, borderRadius: 10, padding: 12, marginBottom: 16, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("details")}
                className="btn btn-secondary btn-lg flex-1"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="btn btn-primary btn-lg flex-1"
              >
                {submitting ? "Sending..." : "Send Request →"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms", textAlign: "center" }}>
            <div className="dash-confirm-check">
              <CheckCircle2 size={36} style={{ color: "#fff" }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "var(--color-ink)" }}>
              Request Sent!
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-charcoal)", marginBottom: 24 }}>
              Your request for ${parseFloat(requestAmount).toFixed(2)} from ${sivaTag} has been sent.
            </p>

            {/* Share your tag */}
            <div style={{ padding: 16, borderRadius: 14, background: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 8 }}>
                Your ORTHO Tag
              </div>
              <button
                onClick={copyTag}
                className="flex items-center gap-2 mx-auto"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-ink)" }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)" }}>${myTag}</span>
                {copied ? <Check size={16} style={{ color: "var(--color-success)" }} /> : <Copy size={16} style={{ color: "var(--color-mute)" }} />}
              </button>
            </div>

            <div className="flex gap-3">
              <Link href="/dashboard/chat" className="btn btn-secondary btn-lg flex-1 text-center flex items-center justify-center gap-2">
                <MessageSquare size={16} />
                Open Chat
              </Link>
              <button onClick={resetForm} className="btn btn-primary btn-lg flex-1">
                New Request
              </button>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 mt-4 text-sm transition"
              style={{ color: "var(--color-charcoal)", textDecoration: "none" }}
            >
              <ArrowLeft size={14} />
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
