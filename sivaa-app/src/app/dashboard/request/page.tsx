"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Check,
  MessageSquare,
  X,
  RotateCw,
  Clock,
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

interface PaymentRequest {
  request_id: string;
  amount: number;
  status: string;
  message: string | null;
  created_at: string;
  requester: { siva_tag: string; name: string };
  requested_from: { siva_tag: string; name: string };
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
  const [myRequests, setMyRequests] = useState<PaymentRequest[]>([]);
  const [cancelLoading, setCancelLoading] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);

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

    fetchMyRequests();
  }, [router]);

  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/payment-requests", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.requests) {
        setMyRequests(data.requests);
      }
    } catch {}
  }, []);

  const handleCancelRequest = async (reqId: string) => {
    setCancelLoading(reqId);
    try {
      const res = await fetch(`/api/v1/payment-requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        toast("Request cancelled", "success");
        await fetchMyRequests();
      } else {
        const data = await res.json();
        toast(data.error || "Failed to cancel", "error");
      }
    } catch {
      toast("Network error", "error");
    }
    setCancelLoading("");
  };

  const handleResendRequest = (req: PaymentRequest) => {
    setSivaTag(req.requested_from?.siva_tag || "");
    setRequestAmount(req.amount.toString());
    setRequestNote(req.message || "");
    setStep("details");
    setShowHistory(false);
    setError("");
  };

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
          receiver_tag: sivaTag,
          amount: parseFloat(requestAmount),
          message: requestNote || undefined,
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
      await fetchMyRequests();
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

        {/* Request History Toggle */}
        {step === "details" && (
          <div className="dash-item-enter" style={{ animationDelay: "75ms", marginBottom: 16 }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition"
              style={{
                backgroundColor: "var(--color-surface-soft)",
                border: "1px solid var(--color-hairline)",
                color: "var(--color-ink)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span className="flex items-center gap-2">
                <Clock size={16} style={{ color: "var(--color-charcoal)" }} />
                Request History ({myRequests.length})
              </span>
              <span style={{ fontSize: 12, color: "var(--color-charcoal)" }}>
                {showHistory ? "Hide" : "Show"}
              </span>
            </button>

            {showHistory && (
              <div className="mt-2 flex flex-col gap-2">
                {myRequests.length === 0 ? (
                  <div className="text-center py-6 text-sm" style={{ color: "var(--color-mute)" }}>
                    No payment requests yet.
                  </div>
                ) : (
                  myRequests.slice(0, 20).map((req) => {
                    const isPending = req.status === "pending";
                    const isAccepted = req.status === "accepted";
                    const canCancel = isPending || isAccepted;
                    const canResend = req.status === "cancelled" || req.status === "declined" || req.status === "fulfilled";

                    const statusColor =
                      isPending ? "var(--color-warning)" :
                      isAccepted ? "var(--color-primary)" :
                      req.status === "fulfilled" ? "var(--color-success)" :
                      "var(--color-error)";

                    return (
                      <div
                        key={req.request_id}
                        className="rounded-xl p-3 flex flex-col gap-2"
                        style={{
                          backgroundColor: "var(--color-canvas)",
                          border: "1px solid var(--color-hairline)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                              ${req.requested_from?.siva_tag || "unknown"}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--color-mute)" }}>
                              {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-ink)" }}>
                              ${req.amount.toFixed(2)}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: statusColor }}>
                              {req.status}
                            </span>
                          </div>
                        </div>

                        {req.message && (
                          <p style={{ fontSize: 12, color: "var(--color-charcoal)", fontStyle: "italic" }}>
                            "{req.message}"
                          </p>
                        )}

                        <div className="flex gap-2">
                          {canCancel && (
                            <button
                              onClick={() => handleCancelRequest(req.request_id)}
                              disabled={cancelLoading === req.request_id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                backgroundColor: "rgba(239, 68, 68, 0.08)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                color: "var(--color-error)",
                                cursor: "pointer",
                                opacity: cancelLoading === req.request_id ? 0.5 : 1,
                              }}
                            >
                              <X size={12} />
                              {cancelLoading === req.request_id ? "Cancelling..." : "Cancel"}
                            </button>
                          )}
                          {canResend && (
                            <button
                              onClick={() => handleResendRequest(req)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                backgroundColor: "var(--color-surface-soft)",
                                border: "1px solid var(--color-hairline)",
                                color: "var(--color-ink)",
                                cursor: "pointer",
                              }}
                            >
                              <RotateCw size={12} />
                              Resend
                            </button>
                          )}
                          <Link
                            href={`/dashboard/chat`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              backgroundColor: "var(--color-surface-soft)",
                              border: "1px solid var(--color-hairline)",
                              color: "var(--color-charcoal)",
                              textDecoration: "none",
                            }}
                          >
                            <MessageSquare size={12} />
                            Chat
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

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
