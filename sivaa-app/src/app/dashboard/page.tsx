"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Upload,
  CreditCard,
  Bitcoin,
  DollarSign,
  Wallet,
  Search,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { EmptyState, LoadingState } from "@/components/DashboardShared";
import { useToast } from "@/components/Toast";

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

interface Transaction {
  id: string;
  type: "sent" | "received";
  counterparty: string;
  amount: number;
  fee: number;
  status: "escrow_held" | "completed" | "reversed";
  reference: string;
  date: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sivaTag, setSivaTag] = useState("...");
  const [totalSent, setTotalSent] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendTag, setSendTag] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [show2fa, setShow2fa] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [txnFilter, setTxnFilter] = useState<string>("all");
  const [txnSearch, setTxnSearch] = useState("");
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [resending2fa, setResending2fa] = useState(false);
  const [sendStep, setSendStep] = useState<"details" | "review" | "confirm">("details");

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) { router.push("/login"); return null; }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data?.user?.siva_tag) setSivaTag(data.user.siva_tag);
      })
      .catch(() => {});

    fetch("/api/v1/wallet/history", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.wallet) {
          setTotalSent(data.wallet.total_sent || 0);
          setTotalReceived(data.wallet.total_received || 0);
          setWalletBalance((data.wallet.total_received || 0) - (data.wallet.total_sent || 0));
        }
      })
      .catch(() => {});

    fetch("/api/v1/payments?limit=20", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.payments) {
          const mapped: Transaction[] = data.payments.map((p: {
            payment_id: string;
            sender?: { siva_tag: string };
            receiver?: { siva_tag: string };
            gross_amount: number;
            fee_amount: number;
            status: string;
            reference: string;
            created_at: string;
            sender_id: string;
          }) => ({
            id: p.payment_id,
            type: p.sender_id ? "sent" : "received",
            counterparty: p.sender_id ? `$${p.receiver?.siva_tag || "unknown"}` : `$${p.sender?.siva_tag || "unknown"}`,
            amount: p.gross_amount,
            fee: p.fee_amount,
            status: p.status,
            reference: p.reference,
            date: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          }));
          setTransactions(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTxns(false));

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

  const filteredTxns = useMemo(() => {
    return transactions.filter((t) => {
      if (txnFilter !== "all" && t.status !== txnFilter) return false;
      if (txnSearch && !t.counterparty.toLowerCase().includes(txnSearch.toLowerCase()) && !t.reference.toLowerCase().includes(txnSearch.toLowerCase())) return false;
      return true;
    });
  }, [transactions, txnFilter, txnSearch]);

  const feePreview = useMemo(() => {
    const amt = parseFloat(sendAmount);
    if (!amt || amt <= 0) return null;
    const method = paymentMethods.find((m) => m.method_id === selectedMethodId);
    if (!method) return null;
    const fee = amt * (method.fee_percentage / 100) + method.fee_fixed;
    return { fee, total: amt + fee, method };
  }, [sendAmount, selectedMethodId, paymentMethods]);

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError("");

    if (!sendTag || !sendAmount || !selectedMethodId) {
      setSendError("Please fill in all fields");
      return;
    }

    const amt = parseFloat(sendAmount);
    if (isNaN(amt) || amt <= 0) {
      setSendError("Amount must be a positive number");
      return;
    }

    const method = paymentMethods.find((m) => m.method_id === selectedMethodId);
    if (method) {
      if (amt < method.min_amount) {
        setSendError(`Minimum amount for ${method.display_name} is $${method.min_amount}`);
        return;
      }
      if (method.max_amount && amt > method.max_amount) {
        setSendError(`Maximum amount for ${method.display_name} is $${method.max_amount}`);
        return;
      }
    }

    setSendStep("review");
  };

  const handleRequest2fa = async () => {
    setRequestingCode(true);
    setSendError("");
    try {
      const res = await fetch("/api/v1/payments/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "payment_send" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error || "Failed to send verification code");
        setRequestingCode(false);
        return;
      }
      setShow2fa(true);
      setSendStep("confirm");
      toast("Verification code sent to your email", "info");
    } catch {
      setSendError("Network error requesting verification code");
    }
    setRequestingCode(false);
  };

  const handleConfirmSend = async () => {
    setSending(true);
    setSendError("");

    try {
      const res = await fetch("/api/v1/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_tag: sendTag,
          amount: parseFloat(sendAmount),
          payment_method_id: selectedMethodId,
          two_factor_code: twoFactorCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendError(data.error || "Failed to send payment");
        setSending(false);
        return;
      }

      toast(`Payment of $${sendAmount} to $${sendTag} is now in escrow`, "success");
      setShowSendForm(false);
      setShow2fa(false);
      setSendStep("details");
      setSendTag("");
      setSendAmount("");
      setTwoFactorCode("");
    } catch {
      setSendError("Network error. Please try again.");
    }
    setSending(false);
  };

  const handleResend2fa = async () => {
    setResending2fa(true);
    setSendError("");
    try {
      const res = await fetch("/api/v1/payments/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "payment_send" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error || "Failed to resend code");
      } else {
        toast("New verification code sent", "info");
      }
    } catch {
      setSendError("Network error. Please try again.");
    }
    setResending2fa(false);
  };

  const handleReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setSendError("Please select a receipt file to upload");
      return;
    }
    if (!receiptPaymentId) {
      setSendError("Please enter the payment ID");
      return;
    }
    setReceiptUploading(true);
    setSendError("");
    try {
      const formData = new FormData();
      formData.append("file", receiptFile);
      formData.append("payment_id", receiptPaymentId);

      const res = await fetch("/api/v1/receipts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowReceiptUpload(false);
        setReceiptFile(null);
        setReceiptPaymentId("");
        toast("Receipt uploaded successfully", "success");
      } else {
        const data = await res.json();
        setSendError(data.error || "Failed to upload receipt");
      }
    } catch {
      setSendError("Failed to upload receipt");
    }
    setReceiptUploading(false);
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === "sent" ? "-" : "+";
    return `${sign}$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    if (status === "completed") return <span className="dash-badge dash-badge-success">Completed</span>;
    if (status === "escrow_held") return <span className="dash-badge dash-badge-warning">In Escrow</span>;
    return <span className="dash-badge dash-badge-error">Reversed</span>;
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 lg:px-8 py-6" style={{ maxWidth: "1100px" }}>
        {/* Balance Card */}
        <div className="dash-balance-card dash-item-enter mb-6">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8, fontWeight: 500 }}>
              Available Balance
            </div>
            <div className="dash-number-animate" style={{ fontSize: 40, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-1px" }}>
              ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>
              ${sivaTag} · USD
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6 dash-item-enter" style={{ animationDelay: "50ms" }}>
          <button
            onClick={() => { setShowSendForm(true); setSendStep("details"); }}
            className="dash-action-btn dash-action-btn-primary"
          >
            <div className="dash-action-btn-icon" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Send size={20} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Send</span>
          </button>
          <Link href="/dashboard/request" className="dash-action-btn dash-action-btn-secondary">
            <div className="dash-action-btn-icon" style={{ background: "rgba(29,78,216,0.1)" }}>
              <Download size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Request</span>
          </Link>
          <button className="dash-action-btn dash-action-btn-secondary">
            <div className="dash-action-btn-icon" style={{ background: "rgba(29,78,216,0.1)" }}>
              <Upload size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Deposit</span>
          </button>
          <button className="dash-action-btn dash-action-btn-secondary">
            <div className="dash-action-btn-icon" style={{ background: "rgba(29,78,216,0.1)" }}>
              <CreditCard size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Withdraw</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6 dash-item-enter" style={{ animationDelay: "100ms" }}>
          <div className="dash-stat-card">
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 6 }}>
              Total Sent
            </div>
            <div className="dash-number-animate" style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-ink)" }}>
              ${totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="dash-stat-card">
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 6 }}>
              Total Received
            </div>
            <div className="dash-number-animate" style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-success)" }}>
              ${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="dash-stat-card hidden lg:block">
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 6 }}>
              Transactions
            </div>
            <div className="dash-number-animate" style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-ink)" }}>
              {transactions.length}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="dash-item-enter" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
              Recent Activity
            </h3>
            <Link
              href="/dashboard/portfolio"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}
            >
              View all →
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "escrow_held", label: "In Escrow" },
              { key: "completed", label: "Completed" },
              { key: "reversed", label: "Reversed" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setTxnFilter(f.key)}
                className={`dash-filter-pill${txnFilter === f.key ? " dash-filter-pill-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="dash-search mb-4">
            <Search size={16} style={{ color: "var(--color-mute)" }} />
            <input
              type="text"
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
              placeholder="Search by tag or reference..."
              className="flex-1 bg-transparent py-2.5 outline-none text-sm"
              style={{ color: "var(--color-ink)" }}
            />
          </div>

          {loadingTxns ? (
            <LoadingState message="Loading transactions..." />
          ) : filteredTxns.length === 0 ? (
            <EmptyState
              icon={<Receipt size={24} style={{ color: "var(--color-mute)" }} />}
              title={transactions.length === 0 ? "No transactions yet" : "No matching transactions"}
              message={transactions.length === 0 ? "Your payment history will appear here once you start sending or receiving." : "Try adjusting your filters or search."}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredTxns.slice(0, 8).map((txn, i) => (
                <div
                  key={txn.id}
                  className="dash-txn-row dash-item-enter"
                  style={{ animationDelay: `${200 + i * 40}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`dash-txn-avatar ${txn.type === "received" ? "dash-txn-avatar-received" : "dash-txn-avatar-sent"}`}>
                      {txn.type === "sent" ? (
                        <ArrowUpRight size={18} style={{ color: "var(--color-canvas)" }} />
                      ) : (
                        <ArrowDownLeft size={18} style={{ color: "var(--color-success)" }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                        {txn.counterparty}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-mute)" }}>
                        {txn.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: txn.type === "received" ? "var(--color-success)" : "var(--color-ink)",
                      }}
                    >
                      {formatAmount(txn.amount, txn.type)}
                    </div>
                    <div className="mt-1">
                      {getStatusBadge(txn.status)}
                    </div>
                    {txn.status === "escrow_held" && (
                      <button
                        style={{
                          fontSize: 11,
                          marginTop: 4,
                          color: "var(--color-primary)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        onClick={() => {
                          setReceiptPaymentId(txn.id);
                          setShowReceiptUpload(true);
                        }}
                      >
                        Upload Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Money Modal — Branched Workflow */}
      {showSendForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center dash-overlay"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => { setShowSendForm(false); setSendStep("details"); }}
        >
          <div
            className="w-full rounded-t-3xl sm:rounded-3xl p-6 dash-modal-enter"
            style={{
              backgroundColor: "var(--color-canvas)",
              maxWidth: "460px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Stepper */}
            <div className="dash-stepper">
              <div className="dash-stepper-step">
                <div className={`dash-stepper-circle ${sendStep === "details" ? "dash-stepper-circle-active" : "dash-stepper-circle-done"}`}>
                  {sendStep !== "details" ? <CheckCircle2 size={16} /> : "1"}
                </div>
                <span className={`dash-stepper-label ${sendStep === "details" ? "dash-stepper-label-active" : ""}`}>Details</span>
              </div>
              <div className={`dash-stepper-line ${sendStep !== "details" ? "dash-stepper-line-done" : ""}`} />
              <div className="dash-stepper-step">
                <div className={`dash-stepper-circle ${sendStep === "review" ? "dash-stepper-circle-active" : sendStep === "confirm" ? "dash-stepper-circle-done" : "dash-stepper-circle-pending"}`}>
                  {sendStep === "confirm" ? <CheckCircle2 size={16} /> : "2"}
                </div>
                <span className={`dash-stepper-label ${sendStep === "review" ? "dash-stepper-label-active" : ""}`}>Review</span>
              </div>
              <div className={`dash-stepper-line ${sendStep === "confirm" ? "dash-stepper-line-done" : ""}`} />
              <div className="dash-stepper-step">
                <div className={`dash-stepper-circle ${sendStep === "confirm" ? "dash-stepper-circle-active" : "dash-stepper-circle-pending"}`}>
                  3
                </div>
                <span className={`dash-stepper-label ${sendStep === "confirm" ? "dash-stepper-label-active" : ""}`}>Confirm</span>
              </div>
            </div>

            {sendStep === "details" && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--color-ink)" }}>Send Money</h3>
                <form onSubmit={handleSendSubmit} className="flex flex-col gap-4">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                      Recipient $ORTHO Tag
                    </label>
                    <div className="dash-search" style={{ padding: "0 16px" }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-charcoal)" }}>$</span>
                      <input
                        type="text"
                        value={sendTag}
                        onChange={(e) => setSendTag(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        placeholder="bob"
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
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="0.00"
                        className="dash-amount-input-field"
                        required
                      />
                    </div>
                    <p style={{ fontSize: 12, marginTop: 8, color: "var(--color-mute)" }}>
                      Funds held in escrow until admin approval.
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                      Payment Method
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
                          <PaymentMethodIcon iconKey={method.icon_key} size={16} />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{method.display_name}</span>
                        </button>
                      ))}
                    </div>
                    {selectedMethodId && (() => {
                      const m = paymentMethods.find((p) => p.method_id === selectedMethodId);
                      if (!m) return null;
                      return (
                        <p style={{ fontSize: 12, marginTop: 8, color: "var(--color-mute)" }}>
                          Fee: {m.fee_percentage}%{m.fee_fixed > 0 ? ` + $${m.fee_fixed}` : ""} · Min: ${m.min_amount} · Max: {m.max_amount ? `$${m.max_amount}` : "No limit"}
                        </p>
                      );
                    })()}
                  </div>

                  {sendError && (
                    <div style={{ fontSize: 13, borderRadius: 10, padding: 12, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                      {sendError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowSendForm(false); setSendStep("details"); }}
                      className="btn btn-secondary btn-lg flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg flex-1">
                      Review →
                    </button>
                  </div>
                </form>
              </>
            )}

            {sendStep === "review" && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--color-ink)" }}>Review Payment</h3>
                <div className="dash-workflow-card mb-4" style={{ padding: 20 }}>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontSize: 13, color: "var(--color-charcoal)" }}>To</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink)" }}>${sendTag}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontSize: 13, color: "var(--color-charcoal)" }}>Amount</span>
                    <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-ink)" }}>
                      ${parseFloat(sendAmount).toFixed(2)}
                    </span>
                  </div>
                  {feePreview && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span style={{ fontSize: 13, color: "var(--color-charcoal)" }}>Fee</span>
                        <span style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--color-ink)" }}>
                          ${feePreview.fee.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ borderTop: "1px solid var(--color-hairline)", paddingTop: 12 }}>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>Total</span>
                          <span style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--color-primary)" }}>
                            ${feePreview.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {sendError && (
                  <div style={{ fontSize: 13, borderRadius: 10, padding: 12, marginBottom: 16, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                    {sendError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSendStep("details")}
                    className="btn btn-secondary btn-lg flex-1"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleRequest2fa}
                    disabled={requestingCode}
                    className="btn btn-primary btn-lg flex-1"
                  >
                    {requestingCode ? "Sending code..." : "Continue →"}
                  </button>
                </div>
              </>
            )}

            {sendStep === "confirm" && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--color-ink)" }}>Verify Payment</h3>
                <p style={{ fontSize: 14, color: "var(--color-charcoal)", marginBottom: 20 }}>
                  We sent a 6-digit code to your email. Enter it below to confirm your payment of ${sendAmount} to ${sendTag}.
                </p>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && twoFactorCode.length >= 6 && handleConfirmSend()}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center font-mono tracking-widest py-3 rounded-xl outline-none mb-4"
                  style={{
                    backgroundColor: "var(--color-surface-soft)",
                    border: "1px solid var(--color-hairline)",
                    color: "var(--color-ink)",
                    fontSize: 28,
                  }}
                  autoFocus
                />
                {sendError && (
                  <div style={{ fontSize: 13, borderRadius: 10, padding: 12, marginBottom: 16, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                    {sendError}
                  </div>
                )}
                <button
                  onClick={handleConfirmSend}
                  className="btn btn-primary btn-lg w-full"
                  disabled={sending || twoFactorCode.length < 6}
                >
                  {sending ? "Confirming..." : "Confirm Payment"}
                </button>
                <button
                  onClick={handleResend2fa}
                  disabled={resending2fa}
                  className="w-full text-xs mt-3 transition disabled:opacity-50"
                  style={{ color: "var(--color-charcoal)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {resending2fa ? "Sending new code..." : "Resend code"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {showReceiptUpload && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 dash-overlay"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowReceiptUpload(false)}
        >
          <div
            className="rounded-3xl p-6 w-full max-w-md mx-4 dash-modal-enter"
            style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--color-ink)" }}>Upload Receipt</h3>
            <form onSubmit={handleReceiptUpload} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Payment ID</label>
                <input
                  className="input"
                  type="text"
                  value={receiptPaymentId}
                  onChange={(e) => setReceiptPaymentId(e.target.value)}
                  placeholder="Payment ID"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Receipt File</label>
                <input
                  className="input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.webp"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              {sendError && (
                <div style={{ fontSize: 13, borderRadius: 10, padding: 12, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                  {sendError}
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={receiptUploading}>
                {receiptUploading ? "Uploading..." : "Upload Receipt"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentMethodIcon({ iconKey, size = 24 }: { iconKey: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    crypto: <Bitcoin size={size} />,
    cashapp: <DollarSign size={size} />,
    paypal: <CreditCard size={size} />,
    venmo: <Wallet size={size} />,
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "currentColor" }}>
      {icons[iconKey] || <CreditCard size={size} />}
    </div>
  );
}
