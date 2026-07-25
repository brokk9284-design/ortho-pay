"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { BrandIcon } from "@/components/BrandIcon";

interface PaymentMethod {
  method_id: string;
  code: string;
  display_name: string;
  icon_key: string;
  fee_percentage: number;
  fee_fixed: number;
  min_amount: number;
  max_amount: number | null;
  config: Record<string, unknown>;
}

interface Deposit {
  deposit_id: string;
  reference: string;
  amount: number;
  status: string;
  created_at: string;
}

const MethodIcon = ({ iconKey, size = 20 }: { iconKey: string; size?: number }) => (
  <BrandIcon iconKey={iconKey} size={size} />
);

export default function DepositPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"method" | "amount" | "instructions" | "confirm">("method");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [depositRef, setDepositRef] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState<Record<string, unknown>>({});
  const [methodName, setMethodName] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) { router.push("/login"); return null; }
        return res.ok ? res.json() : null;
      })
      .catch(() => {});

    fetch("/api/v1/payment-methods", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.payment_methods) setPaymentMethods(data.payment_methods);
      })
      .catch(() => {});

    fetch("/api/v1/deposits", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.deposits) setRecentDeposits(data.deposits.slice(0, 5));
      })
      .catch(() => {});
  }, [router]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep("amount");
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    if (selectedMethod && amt < selectedMethod.min_amount) {
      setError(`Minimum amount for ${selectedMethod.display_name} is $${selectedMethod.min_amount}`);
      return;
    }
    if (selectedMethod?.max_amount && amt > selectedMethod.max_amount) {
      setError(`Maximum amount for ${selectedMethod.display_name} is $${selectedMethod.max_amount}`);
      return;
    }
    setStep("instructions");
  };

  const handleSubmitDeposit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/v1/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          payment_method_id: selectedMethod?.method_id,
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create deposit");
        setSubmitting(false);
        return;
      }

      setDepositRef(data.deposit.reference);
      setPaymentInstructions(data.payment_instructions || {});
      setMethodName(data.method_name || selectedMethod?.display_name || "");
      setStep("confirm");
      toast("Deposit request submitted", "success");
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const resetForm = () => {
    setStep("method");
    setSelectedMethod(null);
    setAmount("");
    setError("");
    setDepositRef("");
    setPaymentInstructions({});
  };

  const getInstructionFields = () => {
    if (!paymentInstructions || typeof paymentInstructions !== "object") return [];
    return Object.entries(paymentInstructions).filter(([key]) =>
      ["address", "handle", "email", "account", "tag", "memo", "network", "link", "url", "qr"].some((k) => key.toLowerCase().includes(k))
    );
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 lg:px-8 py-6" style={{ maxWidth: "600px" }}>
        {/* Header */}
        <div className="mb-6 dash-item-enter">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)", marginBottom: 4 }}>
            Deposit
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-charcoal)" }}>
            Add funds to your ORTHO-PAY account
          </p>
        </div>

        {/* Stepper */}
        <div className="dash-stepper dash-item-enter" style={{ animationDelay: "50ms" }}>
          <div className="dash-stepper-step">
            <div className={`dash-stepper-circle ${step === "method" ? "dash-stepper-circle-active" : "dash-stepper-circle-done"}`}>
              {step !== "method" ? <CheckCircle2 size={16} /> : "1"}
            </div>
            <span className={`dash-stepper-label ${step === "method" ? "dash-stepper-label-active" : ""}`}>Method</span>
          </div>
          <div className={`dash-stepper-line ${step !== "method" ? "dash-stepper-line-done" : ""}`} />
          <div className="dash-stepper-step">
            <div className={`dash-stepper-circle ${step === "amount" ? "dash-stepper-circle-active" : step === "instructions" || step === "confirm" ? "dash-stepper-circle-done" : "dash-stepper-circle-pending"}`}>
              {step === "instructions" || step === "confirm" ? <CheckCircle2 size={16} /> : "2"}
            </div>
            <span className={`dash-stepper-label ${step === "amount" ? "dash-stepper-label-active" : ""}`}>Amount</span>
          </div>
          <div className={`dash-stepper-line ${step === "confirm" ? "dash-stepper-line-done" : ""}`} />
          <div className="dash-stepper-step">
            <div className={`dash-stepper-circle ${step === "instructions" || step === "confirm" ? "dash-stepper-circle-active" : "dash-stepper-circle-pending"}`}>
              {step === "confirm" ? <CheckCircle2 size={16} /> : "3"}
            </div>
            <span className={`dash-stepper-label ${step === "instructions" || step === "confirm" ? "dash-stepper-label-active" : ""}`}>Pay & Confirm</span>
          </div>
        </div>

        {/* Step: Method Selection */}
        {step === "method" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-ink)" }}>
              Choose Payment Method
            </h3>
            <div className="flex flex-col gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.method_id}
                  onClick={() => handleMethodSelect(method)}
                  className="flex items-center gap-3 p-4 rounded-xl transition"
                  style={{
                    backgroundColor: "var(--color-surface-soft)",
                    border: "1px solid var(--color-hairline)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(29,78,216,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-primary)",
                      flexShrink: 0,
                    }}
                  >
                    <MethodIcon iconKey={method.icon_key} size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                      {method.display_name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-mute)" }}>
                      Fee: {method.fee_percentage}%{method.fee_fixed > 0 ? ` + $${method.fee_fixed}` : ""} · Min: ${method.min_amount}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Amount */}
        {step === "amount" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-ink)" }}>
              Enter Amount
            </h3>
            <div className="flex items-center gap-2 mb-6">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(29,78,216,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary)",
                }}
              >
                <MethodIcon iconKey={selectedMethod?.icon_key || ""} size={18} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                {selectedMethod?.display_name}
              </span>
            </div>
            <form onSubmit={handleAmountSubmit}>
              <div className="dash-amount-input mb-4">
                <span className="dash-amount-input-currency">$</span>
                <input
                  type="number"
                  step="0.01"
                  min={selectedMethod?.min_amount || 1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="dash-amount-input-field"
                  autoFocus
                  required
                />
              </div>
              {selectedMethod && (
                <p style={{ fontSize: 12, color: "var(--color-mute)", marginBottom: 16 }}>
                  Min: ${selectedMethod.min_amount}
                  {selectedMethod.max_amount ? ` · Max: $${selectedMethod.max_amount}` : ""}
                  {" · Fee: "}{selectedMethod.fee_percentage}%
                  {selectedMethod.fee_fixed > 0 ? ` + $${selectedMethod.fee_fixed}` : ""}
                </p>
              )}
              {error && (
                <div style={{ fontSize: 13, borderRadius: 10, padding: 12, marginBottom: 16, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("method")} className="btn btn-secondary btn-lg flex-1">
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary btn-lg flex-1">
                  Continue →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step: Instructions */}
        {step === "instructions" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--color-ink)" }}>
              Payment Instructions
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-charcoal)", marginBottom: 20 }}>
              Send ${parseFloat(amount).toFixed(2)} using the details below, then click &quot;I have made payment&quot;.
            </p>

            <div style={{ borderRadius: 14, padding: 20, background: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 12 }}>
                {selectedMethod?.display_name} Details
              </div>
              {getInstructionFields().length > 0 ? (
                <div className="flex flex-col gap-3">
                  {getInstructionFields().map(([key, value]) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, color: "var(--color-mute)", marginBottom: 4, textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            flex: 1,
                            padding: "10px 14px",
                            borderRadius: 10,
                            background: "var(--color-canvas)",
                            border: "1px solid var(--color-hairline)",
                            fontSize: 14,
                            fontFamily: "var(--font-mono, monospace)",
                            color: "var(--color-ink)",
                            wordBreak: "break-all",
                          }}
                        >
                          {String(value)}
                        </div>
                        <button
                          onClick={() => copyToClipboard(String(value), key)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            border: "1px solid var(--color-hairline)",
                            background: "var(--color-canvas)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-charcoal)",
                            flexShrink: 0,
                          }}
                        >
                          {copiedField === key ? <Check size={16} style={{ color: "var(--color-success)" }} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: "var(--color-charcoal)" }}>
                  Please contact support for payment instructions for this method.
                </div>
              )}
            </div>

            {error && (
              <div style={{ fontSize: 13, borderRadius: 10, padding: 12, marginBottom: 16, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("amount")} className="btn btn-secondary btn-lg flex-1">
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmitDeposit}
                disabled={submitting}
                className="btn btn-primary btn-lg flex-1"
              >
                {submitting ? "Submitting..." : "I Have Made Payment"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === "confirm" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms", textAlign: "center" }}>
            <div className="dash-confirm-check">
              <CheckCircle2 size={36} style={{ color: "#fff" }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "var(--color-ink)" }}>
              Deposit Submitted
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-charcoal)", marginBottom: 20 }}>
              Your deposit of ${parseFloat(amount).toFixed(2)} via {methodName} is pending admin approval.
            </p>

            <div style={{ padding: 16, borderRadius: 14, background: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 8 }}>
                Reference
              </div>
              <div className="flex items-center gap-2 justify-center">
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono, monospace)", color: "var(--color-ink)" }}>
                  {depositRef}
                </span>
                <button
                  onClick={() => copyToClipboard(depositRef, "ref")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-charcoal)" }}
                >
                  {copiedField === "ref" ? <Check size={14} style={{ color: "var(--color-success)" }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6" style={{ fontSize: 13, color: "var(--color-warning)" }}>
              <Clock size={14} />
              <span>Waiting for admin approval</span>
            </div>

            <div className="flex gap-3">
              <button onClick={resetForm} className="btn btn-primary btn-lg flex-1">
                New Deposit
              </button>
              <Link href="/dashboard" className="btn btn-secondary btn-lg flex-1 text-center">
                Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Recent Deposits */}
        {recentDeposits.length > 0 && step === "method" && (
          <div className="mt-8 dash-item-enter" style={{ animationDelay: "150ms" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 12 }}>
              Recent Deposits
            </h3>
            <div className="flex flex-col gap-2">
              {recentDeposits.map((dep, i) => (
                <div key={dep.deposit_id} className="dash-txn-row dash-item-enter" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="dash-txn-avatar dash-txn-avatar-received">
                      <Upload size={16} style={{ color: "var(--color-success)" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                        ${dep.amount.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-mute)" }}>
                        {dep.reference}
                      </div>
                    </div>
                  </div>
                  <div>
                    {dep.status === "approved" && <span className="dash-badge dash-badge-success">Approved</span>}
                    {dep.status === "pending" && <span className="dash-badge dash-badge-warning">Pending</span>}
                    {dep.status === "rejected" && <span className="dash-badge dash-badge-error">Rejected</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
