"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  X,
  Upload,
  CreditCard,
  Bitcoin,
  DollarSign,
  Wallet,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Receipt,
} from "lucide-react";
import { DashboardHeader, EmptyState, LoadingState } from "@/components/DashboardShared";
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

interface KycDocument {
  document_id: string;
  document_type: string;
  file_url: string;
  status: string;
  created_at: string;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [totalSent, setTotalSent] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendTag, setSendTag] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [kycStatus, setKycStatus] = useState<string>("unverified");
  const [showKycUpload, setShowKycUpload] = useState(false);
  const [showKycDetails, setShowKycDetails] = useState(false);
  const [kycDocType, setKycDocType] = useState("passport");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycUploading, setKycUploading] = useState(false);
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

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) { router.push("/login"); return null; }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data?.user?.siva_tag) setSivaTag(data.user.siva_tag);
        if (data?.user?.kyc_status) setKycStatus(data.user.kyc_status);
        if (data?.is_admin) setIsAdmin(true);
      })
      .catch(() => {});

    fetch("/api/v1/notifications", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.notifications) {
          setUnreadNotifications(data.notifications.filter((n: { read: boolean }) => !n.read).length);
        }
      })
      .catch(() => {});

    fetch("/api/v1/chats", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.unreadCounts) {
          const total = Object.values(data.unreadCounts).reduce((a: number, b: unknown) => a + (b as number), 0);
          setUnreadChats(total as number);
        }
      })
      .catch(() => {});

    fetch("/api/v1/wallet/history", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.wallet) {
          setTotalSent(data.wallet.total_sent || 0);
          setTotalReceived(data.wallet.total_received || 0);
        }
      })
      .catch(() => {});

    fetch("/api/v1/payments?limit=20", { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
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
            type: p.sender?.siva_tag ? "sent" : "received",
            counterparty: p.sender?.siva_tag ? `$${p.receiver?.siva_tag || "unknown"}` : `$${p.sender?.siva_tag || "unknown"}`,
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

    fetch("/api/v1/kyc", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.documents) setKycDocuments(data.documents);
      })
      .catch(() => {});
  }, [router]);

  const monthSent = totalSent;
  const monthReceived = totalReceived;

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

  const handleSend = async (e: React.FormEvent) => {
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

    // Request 2FA code first
    setRequestingCode(true);
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

  const handleKycUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFile) {
      setSendError("Please select a file to upload");
      return;
    }
    setKycUploading(true);
    setSendError("");
    try {
      const formData = new FormData();
      formData.append("file", kycFile);
      formData.append("document_type", kycDocType);

      const res = await fetch("/api/v1/kyc", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowKycUpload(false);
        setKycFile(null);
        toast("KYC document submitted for review", "success");
        const refreshRes = await fetch("/api/v1/kyc", { credentials: "include" });
        const refreshData = await refreshRes.json();
        if (refreshData.documents) setKycDocuments(refreshData.documents);
      } else {
        const data = await res.json();
        setSendError(data.error || "Failed to upload KYC document");
      }
    } catch {
      setSendError("Failed to upload KYC document");
    }
    setKycUploading(false);
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

  const getStatusColor = (status: string) => {
    if (status === "completed") return "var(--color-terminal-green)";
    if (status === "escrow_held") return "var(--color-terminal-yellow)";
    return "var(--color-terminal-red)";
  };

  const getStatusLabel = (status: string) => {
    if (status === "completed") return "Completed";
    if (status === "escrow_held") return "In Escrow";
    return "Reversed";
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-canvas)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
      <DashboardHeader
        sivaTag={sivaTag}
        unreadNotifications={unreadNotifications}
        unreadChats={unreadChats}
        isAdmin={isAdmin}
      />

      {/* Main Content */}
      <main className="flex-1 mx-auto px-4 py-6 w-full" style={{ maxWidth: "480px" }}>
        {/* Identity Card */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ opacity: 0.6 }}>
                Your ORTHO Tag
              </div>
              <div className="text-2xl font-display font-bold">${sivaTag}</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
            <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-charcoal)" }}>
              Total Sent
            </div>
            <div className="text-xl font-mono font-semibold" style={{ color: "var(--color-ink)" }}>
              ${totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
            <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-charcoal)" }}>
              Total Received
            </div>
            <div className="text-xl font-mono font-semibold" style={{ color: "var(--color-terminal-green)" }}>
              ${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
            <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-charcoal)" }}>
              This Month — Sent
            </div>
            <div className="text-xl font-mono font-semibold" style={{ color: "var(--color-ink)" }}>
              ${monthSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
            <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-charcoal)" }}>
              This Month — Received
            </div>
            <div className="text-xl font-mono font-semibold" style={{ color: "var(--color-terminal-green)" }}>
              ${monthReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setShowSendForm(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl transition"
            style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
          >
            <Send size={18} />
            <span className="text-sm font-medium">Send</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 rounded-xl transition"
            style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", color: "var(--color-ink)" }}
          >
            <Download size={18} />
            <span className="text-sm font-medium">Request</span>
          </button>
        </div>

        {/* Send Form Modal */}
        {showSendForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowSendForm(false)}>
            <div
              className="w-full rounded-t-2xl sm:rounded-2xl p-6"
              style={{ backgroundColor: "var(--color-canvas)", maxWidth: "480px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-medium" style={{ color: "var(--color-ink)" }}>Send Money</h3>
                <button onClick={() => setShowSendForm(false)} className="text-sm" style={{ color: "var(--color-charcoal)" }}>Cancel</button>
              </div>
              <form onSubmit={handleSend} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: "var(--color-charcoal)" }}>
                    Recipient $ORTHO Tag
                  </label>
                  <div className="flex items-center rounded-xl px-4" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                    <span className="text-lg font-display font-semibold" style={{ color: "var(--color-charcoal)" }}>$</span>
                    <input
                      type="text"
                      value={sendTag}
                      onChange={(e) => setSendTag(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="bob"
                      className="flex-1 bg-transparent py-3 px-2 outline-none text-base"
                      style={{ color: "var(--color-ink)" }}
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: "var(--color-charcoal)" }}>
                    Amount (USD)
                  </label>
                  <div className="flex items-center rounded-xl px-4" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                    <span className="text-lg font-display font-semibold" style={{ color: "var(--color-charcoal)" }}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent py-3 px-2 outline-none text-base font-mono"
                      style={{ color: "var(--color-ink)" }}
                      required
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--color-mute)" }}>
                    Funds will be held in escrow until admin approval.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: "var(--color-charcoal)" }}>
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
                          backgroundColor: selectedMethodId === method.method_id ? "var(--color-ink)" : "var(--color-surface-soft)",
                          border: `1px solid ${selectedMethodId === method.method_id ? "var(--color-ink)" : "var(--color-hairline)"}`,
                          color: selectedMethodId === method.method_id ? "var(--color-canvas)" : "var(--color-ink)",
                        }}
                      >
                        <PaymentMethodIcon iconKey={method.icon_key} size={18} />
                        <span className="text-xs font-medium">{method.display_name}</span>
                      </button>
                    ))}
                  </div>
                  {selectedMethodId && (() => {
                    const m = paymentMethods.find((p) => p.method_id === selectedMethodId);
                    if (!m) return null;
                    return (
                      <p className="text-xs mt-2" style={{ color: "var(--color-mute)" }}>
                        Fee: {m.fee_percentage}%{m.fee_fixed > 0 ? ` + $${m.fee_fixed}` : ""} · Min: ${m.min_amount} · Max: {m.max_amount ? `$${m.max_amount}` : "No limit"}
                      </p>
                    );
                  })()}
                  {feePreview && (
                    <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--color-charcoal)" }}>Payment amount</span>
                        <span className="font-mono" style={{ color: "var(--color-ink)" }}>${parseFloat(sendAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--color-charcoal)" }}>Transaction fee</span>
                        <span className="font-mono" style={{ color: "var(--color-ink)" }}>${feePreview.fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold pt-1" style={{ borderTop: "1px solid var(--color-hairline)" }}>
                        <span style={{ color: "var(--color-ink)" }}>You pay</span>
                        <span className="font-mono" style={{ color: "var(--color-ink)" }}>${feePreview.total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
                {sendError && (
                  <div className="text-sm rounded-lg p-3" style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                    {sendError}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={requestingCode || !selectedMethodId}
                >
                  {requestingCode ? "Sending code..." : `Send to $${sendTag || "..."}`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2FA Verification Modal */}
        {show2fa && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShow2fa(false)}>
            <div
              className="w-full rounded-t-2xl sm:rounded-2xl p-6"
              style={{ backgroundColor: "var(--color-canvas)", maxWidth: "400px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-medium" style={{ color: "var(--color-ink)" }}>Verify Payment</h3>
                <button onClick={() => setShow2fa(false)} className="text-sm" style={{ color: "var(--color-charcoal)" }}>Cancel</button>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--color-charcoal)" }}>
                We sent a 6-digit code to your email. Enter it below to confirm your payment of ${sendAmount} to ${sendTag}.
              </p>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && twoFactorCode.length >= 6 && handleConfirmSend()}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center text-2xl font-mono tracking-widest py-3 rounded-xl outline-none mb-4"
                style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", color: "var(--color-ink)" }}
                autoFocus
              />
              {sendError && (
                <div className="text-sm rounded-lg p-3 mb-4" style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
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
            </div>
          </div>
        )}

        {/* KYC Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--color-charcoal)" }}>
              Identity Verification (KYC)
            </h3>
            {kycStatus === "verified" && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ color: "var(--color-terminal-green)", border: "1px solid var(--color-terminal-green)" }}
              >
                verified
              </span>
            )}
          </div>

          {kycStatus === "verified" ? (
            <div className="rounded-xl" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
              <button
                onClick={() => setShowKycDetails(!showKycDetails)}
                className="w-full flex items-center justify-between p-4"
              >
                <span className="text-sm font-medium" style={{ color: "var(--color-terminal-green)" }}>
                  KYC verification complete
                </span>
                <span className="text-xs" style={{ color: "var(--color-charcoal)" }}>
                  {showKycDetails ? "Hide" : "Show"}
                </span>
              </button>
              {showKycDetails && (
                <div className="px-4 pb-4">
                  <p className="text-xs mb-2" style={{ color: "var(--color-charcoal)" }}>
                    Your identity has been verified. You can send and receive payments without restrictions.
                  </p>
                  {kycDocuments.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {kycDocuments.map((doc) => (
                        <div key={doc.document_id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: "var(--color-canvas)" }}>
                          <span className="text-[10px]" style={{ color: "var(--color-mute)" }}>
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ color: "var(--color-terminal-green)", border: "1px solid var(--color-terminal-green)" }}
                          >
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : kycDocuments.length === 0 ? (
            <div className="rounded-xl p-4" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
              <p className="text-xs mb-3" style={{ color: "var(--color-charcoal)" }}>
                No KYC documents submitted yet. Verify your identity to send and receive payments.
              </p>
              <button onClick={() => setShowKycUpload(true)} className="btn btn-primary btn-sm">
                Submit Document
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {kycDocuments.map((doc) => (
                <div key={doc.document_id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                      KYC Document
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--color-mute)" }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      color: doc.status === "approved" ? "var(--color-terminal-green)" : doc.status === "pending" ? "var(--color-terminal-yellow)" : "var(--color-terminal-red)",
                      border: `1px solid ${doc.status === "approved" ? "var(--color-terminal-green)" : doc.status === "pending" ? "var(--color-terminal-yellow)" : "var(--color-terminal-red)"}`,
                    }}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
              <button onClick={() => setShowKycUpload(true)} className="btn btn-secondary btn-sm mt-2">
                Submit Another Document
              </button>
            </div>
          )}
        </div>

        {/* KYC Upload Modal */}
        {showKycUpload && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowKycUpload(false)}>
            <div
              className="w-full rounded-t-2xl sm:rounded-2xl p-6"
              style={{ backgroundColor: "var(--color-canvas)", maxWidth: "480px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-medium" style={{ color: "var(--color-ink)" }}>Upload KYC Document</h3>
                <button onClick={() => setShowKycUpload(false)} className="text-sm" style={{ color: "var(--color-charcoal)" }}>Cancel</button>
              </div>
              <form onSubmit={handleKycUpload} className="flex flex-col gap-4">
                <div className="input-group">
                  <label className="input-label">Document Type</label>
                  <select className="input" value={kycDocType} onChange={(e) => setKycDocType(e.target.value)}>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver&apos;s License</option>
                    <option value="utility_bill">Utility Bill</option>
                    <option value="bank_statement">Bank Statement</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Document File</label>
                  <input
                    className="input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.webp"
                    onChange={(e) => setKycFile(e.target.files?.[0] || null)}
                    required
                  />
                  <span className="input-hint">Accepted: JPG, PNG, PDF, WebP. Max 10MB.</span>
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={kycUploading}>
                  {kycUploading ? "Uploading..." : "Submit for Review"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Receipt Upload Modal */}
        {showReceiptUpload && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowReceiptUpload(false)}
          >
            <div
              className="rounded-2xl p-6 w-full max-w-md mx-4"
              style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-medium" style={{ color: "var(--color-ink)" }}>Upload Payment Receipt</h3>
                <button onClick={() => setShowReceiptUpload(false)} className="text-sm" style={{ color: "var(--color-charcoal)" }}>Cancel</button>
              </div>
              <form onSubmit={handleReceiptUpload} className="flex flex-col gap-4">
                <div className="input-group">
                  <label className="input-label">Payment ID</label>
                  <input
                    className="input"
                    type="text"
                    value={receiptPaymentId}
                    onChange={(e) => setReceiptPaymentId(e.target.value)}
                    placeholder="Payment ID from your transaction"
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
                  <span className="input-hint">Upload a screenshot or photo of your payment receipt. Accepted: JPG, PNG, PDF, WebP. Max 10MB.</span>
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={receiptUploading}>
                  {receiptUploading ? "Uploading..." : "Upload Receipt"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: "var(--color-charcoal)" }}>
            Transaction History
          </h3>

          {/* Filter + Search */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {["all", "escrow_held", "completed", "reversed"].map((f) => (
              <button
                key={f}
                onClick={() => setTxnFilter(f)}
                className="text-xs px-3 py-1 rounded-full transition"
                style={{
                  backgroundColor: txnFilter === f ? "var(--color-ink)" : "var(--color-surface-soft)",
                  color: txnFilter === f ? "var(--color-canvas)" : "var(--color-charcoal)",
                  border: `1px solid ${txnFilter === f ? "var(--color-ink)" : "var(--color-hairline)"}`,
                }}
              >
                {f === "all" ? "All" : f === "escrow_held" ? "In Escrow" : f === "completed" ? "Completed" : "Reversed"}
              </button>
            ))}
          </div>
          <div className="mb-3">
            <div className="flex items-center rounded-xl px-3" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
              <Search size={14} style={{ color: "var(--color-mute)" }} />
              <input
                type="text"
                value={txnSearch}
                onChange={(e) => setTxnSearch(e.target.value)}
                placeholder="Search by tag or reference..."
                className="flex-1 bg-transparent py-2 px-2 outline-none text-xs"
                style={{ color: "var(--color-ink)" }}
              />
            </div>
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
              {filteredTxns.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: txn.type === "received" ? "var(--color-surface-dark)" : "var(--color-ink)",
                      }}
                    >
                      {txn.type === "sent" ? (
                        <ArrowUpRight size={16} style={{ color: "var(--color-canvas)" }} />
                      ) : (
                        <ArrowDownLeft size={16} style={{ color: "var(--color-terminal-green)" }} />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                        {txn.counterparty}
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-mute)" }}>
                        {txn.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-sm font-mono font-semibold"
                      style={{
                        color: txn.type === "received" ? "var(--color-terminal-green)" : "var(--color-ink)",
                      }}
                    >
                      {formatAmount(txn.amount, txn.type)}
                    </div>
                    <div
                      className="text-[10px] font-medium mt-0.5"
                      style={{ color: getStatusColor(txn.status) }}
                    >
                      {getStatusLabel(txn.status)}
                    </div>
                    {txn.status === "escrow_held" && (
                      <button
                        className="text-[10px] mt-1 underline"
                        style={{ color: "var(--color-charcoal)" }}
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
      </main>
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
