"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

const mockTransactions: Transaction[] = [
  {
    id: "txn-1",
    type: "sent",
    counterparty: "$bob",
    amount: 1200,
    fee: 12,
    status: "escrow_held",
    reference: "ORTHO-PAY-29402-ESC",
    date: "Jul 23, 2026",
  },
  {
    id: "txn-2",
    type: "received",
    counterparty: "$sarah",
    amount: 650,
    fee: 6.5,
    status: "completed",
    reference: "ORTHO-PAY-85930-ESC",
    date: "Jul 23, 2026",
  },
  {
    id: "txn-3",
    type: "sent",
    counterparty: "$james",
    amount: 35,
    fee: 1.05,
    status: "reversed",
    reference: "ORTHO-PAY-10294-ESC",
    date: "Jul 22, 2026",
  },
  {
    id: "txn-4",
    type: "received",
    counterparty: "$alice",
    amount: 250,
    fee: 2.5,
    status: "completed",
    reference: "ORTHO-PAY-79102-ESC",
    date: "Jul 21, 2026",
  },
  {
    id: "txn-5",
    type: "sent",
    counterparty: "$mike",
    amount: 800,
    fee: 8,
    status: "completed",
    reference: "ORTHO-PAY-66012-ESC",
    date: "Jul 20, 2026",
  },
  {
    id: "txn-6",
    type: "received",
    counterparty: "$bob",
    amount: 150,
    fee: 4.5,
    status: "completed",
    reference: "ORTHO-PAY-55431-ESC",
    date: "Jul 18, 2026",
  },
];

export default function UserDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [sivaTag, setSivaTag] = useState("$...");
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
  const [kycDocType, setKycDocType] = useState("passport");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycUploading, setKycUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [receiptPaymentId, setReceiptPaymentId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.user?.siva_tag) setSivaTag(`$${data.user.siva_tag}`);
        if (data?.user?.kyc_status) setKycStatus(data.user.kyc_status);
      })
      .catch(() => {});

    fetch("/api/v1/wallet/history")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.wallet) {
          setTotalSent(data.wallet.total_sent || 0);
          setTotalReceived(data.wallet.total_received || 0);
        }
      })
      .catch(() => {});

    fetch("/api/v1/payments?limit=20")
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
      .catch(() => {});

    fetch("/api/v1/payment-methods")
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

    fetch("/api/v1/kyc")
      .then((res) => res.json())
      .then((data) => {
        if (data.documents) setKycDocuments(data.documents);
      })
      .catch(() => {});
  }, []);

  const monthSent = totalSent;
  const monthReceived = totalReceived;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError("");
    setSendSuccess("");

    try {
      const res = await fetch("/api/v1/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_tag: sendTag,
          amount: parseFloat(sendAmount),
          payment_method_id: selectedMethodId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendError(data.error || "Failed to send payment");
        setSending(false);
        return;
      }

      setSendSuccess(`Payment of $${sendAmount} to $${sendTag} is now in escrow. Reference: ${data.payment?.reference || ""}`);
      setShowSendForm(false);
      setSendTag("");
      setSendAmount("");
    } catch {
      setSendError("Network error. Please try again.");
    }
    setSending(false);
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
        const refreshRes = await fetch("/api/v1/kyc");
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
        setSendSuccess("Receipt uploaded successfully. It will be reviewed by our team.");
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
      {/* Top Nav */}
      <header className="w-full" style={{ borderBottom: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
        <div className="mx-auto px-4 flex items-center justify-between" style={{ maxWidth: "480px", height: "56px" }}>
          <Link href="/" className="text-lg font-bold font-display tracking-tight" style={{ color: "var(--color-ink)" }}>
            ORTHO-PAY
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/chat" className="text-xs transition" style={{ color: "var(--color-charcoal)" }}>
              Chats
            </Link>
            <Link href="/admin" className="text-xs transition" style={{ color: "var(--color-charcoal)" }}>
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto px-4 py-6 w-full" style={{ maxWidth: "480px" }}>
        {/* Identity Card */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ opacity: 0.6 }}>
                Your SIVA Tag
              </div>
              <div className="text-2xl font-display font-bold">{sivaTag}</div>
            </div>
            <button
              className="text-xs px-3 py-1 rounded-full transition"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "var(--color-canvas)" }}
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(sivaTag);
                }
              }}
            >
              Copy
            </button>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span className="text-sm font-medium">Send</span>
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 rounded-xl transition"
            style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", color: "var(--color-ink)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
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
                    Recipient $SIVA Tag
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
                </div>
                {sendError && (
                  <div className="text-sm rounded-lg p-3" style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                    {sendError}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={sending || !selectedMethodId}
                >
                  {sending ? "Sending..." : `Send to $${sendTag || "..."}`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Success Message */}
        {sendSuccess && (
          <div className="mb-4 text-sm rounded-lg p-3" style={{ color: "var(--color-terminal-green)", backgroundColor: "rgba(34, 197, 94, 0.08)", border: "1px solid var(--color-terminal-green)" }}>
            {sendSuccess}
            <button className="ml-2 underline" onClick={() => setSendSuccess("")}>Dismiss</button>
          </div>
        )}

        {/* KYC Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--color-charcoal)" }}>
              Identity Verification (KYC)
            </h3>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                color: kycStatus === "verified" ? "var(--color-terminal-green)" : kycStatus === "pending" ? "var(--color-terminal-yellow)" : "var(--color-charcoal)",
                border: `1px solid ${kycStatus === "verified" ? "var(--color-terminal-green)" : kycStatus === "pending" ? "var(--color-terminal-yellow)" : "var(--color-hairline)"}`,
              }}
            >
              {kycStatus}
            </span>
          </div>

          {kycDocuments.length === 0 ? (
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
                      {doc.document_type.replace(/_/g, " ")}
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
          <div className="flex flex-col gap-2">
            {transactions.map((txn) => (
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-canvas)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-terminal-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
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
        </div>
      </main>
    </div>
  );
}

function PaymentMethodIcon({ iconKey, size = 24 }: { iconKey: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    crypto: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
      </svg>
    ),
    cashapp: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="4" />
        <path d="M12 7l2 2-2 2-2-2z" />
        <path d="M9 14l3 3 3-3" />
      </svg>
    ),
    paypal: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4h6a4 4 0 0 1 4 4 4 4 0 0 1-4 4H9l-2 8" />
        <path d="M9 8h4a2 2 0 0 1 0 4H9" />
      </svg>
    ),
    venmo: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l4 10 4-10" />
        <path d="M14 7v6a3 3 0 0 0 3 3 3 3 0 0 0 3-3V7" />
      </svg>
    ),
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "currentColor" }}>
      {icons[iconKey] || (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )}
    </div>
  );
}
