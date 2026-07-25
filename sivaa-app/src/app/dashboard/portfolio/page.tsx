"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { EmptyState, LoadingState } from "@/components/DashboardShared";

interface Transaction {
  id: string;
  type: "sent" | "received" | "deposit" | "withdrawal" | "adjustment_in" | "adjustment_out";
  counterparty: string;
  amount: number;
  fee: number;
  status: "escrow_held" | "completed" | "reversed" | "pending" | "approved" | "rejected";
  reference: string;
  date: string;
  created_at: string;
}

export default function PortfolioPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSent, setTotalSent] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [txnFilter, setTxnFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) { router.push("/login"); return null; }
        return res.ok ? res.json() : null;
      })
      .catch(() => {});

    fetch("/api/v1/wallet/history", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.wallet) {
          setTotalSent(data.wallet.total_sent || 0);
          setTotalReceived(data.wallet.total_received || 0);
        }
        if (data?.transactions) {
          const adjustTxns: Transaction[] = data.transactions
            .filter((t: { type: string }) => t.type === "adjust_in" || t.type === "adjust_out")
            .map((t: {
              transaction_id: string;
              amount: number;
              type: string;
              description: string;
              created_at: string;
            }) => ({
              id: t.transaction_id,
              type: (t.type === "adjust_in" ? "adjustment_in" : "adjustment_out") as Transaction["type"],
              counterparty: t.description || "Admin adjustment",
              amount: Math.abs(t.amount),
              fee: 0,
              status: "completed" as const,
              reference: t.description || "",
              date: new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              created_at: t.created_at,
            }));
          if (adjustTxns.length > 0) {
            setTransactions((prev) => [...prev, ...adjustTxns].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          }
        }
      })
      .catch(() => {});

    fetch("/api/v1/payments?limit=100", { credentials: "include" })
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
            created_at: p.created_at,
          }));
          setTransactions(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/v1/deposits", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.deposits) {
          const depositTxns: Transaction[] = data.deposits.map((d: {
            deposit_id: string;
            amount: number;
            reference: string;
            status: string;
            created_at: string;
          }) => ({
            id: d.deposit_id,
            type: "deposit" as const,
            counterparty: "Deposit",
            amount: d.amount,
            fee: 0,
            status: d.status === "approved" ? "completed" : d.status === "rejected" ? "reversed" : "pending",
            reference: d.reference,
            date: new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            created_at: d.created_at,
          }));
          setTransactions((prev) => [...prev, ...depositTxns].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
      })
      .catch(() => {});

    fetch("/api/v1/withdrawals", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.withdrawals) {
          const withdrawalTxns: Transaction[] = data.withdrawals.map((w: {
            withdrawal_id: string;
            amount: number;
            reference: string;
            status: string;
            withdrawal_type: string;
            created_at: string;
          }) => ({
            id: w.withdrawal_id,
            type: "withdrawal" as const,
            counterparty: `${w.withdrawal_type} Withdrawal`,
            amount: w.amount,
            fee: 0,
            status: w.status === "approved" ? "completed" : w.status === "rejected" ? "reversed" : "pending",
            reference: w.reference,
            date: new Date(w.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            created_at: w.created_at,
          }));
          setTransactions((prev) => [...prev, ...withdrawalTxns].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        }
      })
      .catch(() => {});
  }, [router]);

  const netFlow = totalReceived - totalSent;
  const completedCount = transactions.filter((t) => t.status === "completed").length;
  const escrowCount = transactions.filter((t) => t.status === "escrow_held").length;
  const reversedCount = transactions.filter((t) => t.status === "reversed").length;

  // Build chart data — last 7 days
  const chartData = useMemo(() => {
    const days: { label: string; sent: number; received: number; key: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        sent: 0,
        received: 0,
        key,
      });
    }

    transactions.forEach((t) => {
      const key = new Date(t.created_at).toISOString().slice(0, 10);
      const day = days.find((d) => d.key === key);
      if (day) {
        if (t.type === "sent" || t.type === "withdrawal" || t.type === "adjustment_out") day.sent += t.amount;
        else day.received += t.amount;
      }
    });

    return days;
  }, [transactions]);

  const maxChartValue = Math.max(...chartData.flatMap((d) => [d.sent, d.received]), 1);

  const filteredTxns = useMemo(() => {
    return transactions.filter((t) => {
      if (txnFilter !== "all" && t.status !== txnFilter) return false;
      return true;
    });
  }, [transactions, txnFilter]);

  const formatAmount = (amount: number, type: string) => {
    const sign = type === "sent" || type === "withdrawal" || type === "adjustment_out" ? "-" : "+";
    return `${sign}$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    if (status === "completed" || status === "approved") return <span className="dash-badge dash-badge-success">Completed</span>;
    if (status === "escrow_held") return <span className="dash-badge dash-badge-warning">In Escrow</span>;
    if (status === "pending") return <span className="dash-badge dash-badge-warning">Pending</span>;
    if (status === "rejected") return <span className="dash-badge dash-badge-error">Rejected</span>;
    return <span className="dash-badge dash-badge-error">Reversed</span>;
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 lg:px-8 py-6" style={{ maxWidth: "1100px" }}>
        {/* Header */}
        <div className="mb-6 dash-item-enter">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)", marginBottom: 4 }}>
            Portfolio
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-charcoal)" }}>
            Track your transaction history and financial activity
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="dash-stat-card dash-item-enter" style={{ animationDelay: "50ms" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} style={{ color: "var(--color-error)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)" }}>
                Total Sent
              </span>
            </div>
            <div className="dash-number-animate" style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-ink)" }}>
              ${totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="dash-stat-card dash-item-enter" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} style={{ color: "var(--color-success)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)" }}>
                Total Received
              </span>
            </div>
            <div className="dash-number-animate" style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-success)" }}>
              ${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="dash-stat-card dash-item-enter" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center gap-2 mb-2">
              <Receipt size={16} style={{ color: "var(--color-primary)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)" }}>
                Net Flow
              </span>
            </div>
            <div className="dash-number-animate" style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: netFlow >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
              ${netFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="dash-stat-card dash-item-enter" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} style={{ color: "var(--color-primary)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)" }}>
                Completed
              </span>
            </div>
            <div className="dash-number-animate" style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-ink)" }}>
              {completedCount}
            </div>
          </div>
        </div>

        {/* 7-Day Chart */}
        <div className="dash-workflow-card dash-item-enter mb-6" style={{ animationDelay: "250ms" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--color-ink)" }}>
            Last 7 Days
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, paddingBottom: 28, position: "relative" }}>
            {chartData.map((day, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: "100%" }}>
                  <div
                    className="dash-chart-bar"
                    style={{
                      width: 16,
                      height: `${(day.sent / maxChartValue) * 100}%`,
                      background: "var(--color-error)",
                      opacity: 0.7,
                      animationDelay: `${i * 60}ms`,
                    }}
                    title={`Sent: $${day.sent.toFixed(2)}`}
                  />
                  <div
                    className="dash-chart-bar"
                    style={{
                      width: 16,
                      height: `${(day.received / maxChartValue) * 100}%`,
                      animationDelay: `${i * 60 + 30}ms`,
                    }}
                    title={`Received: $${day.received.toFixed(2)}`}
                  />
                </div>
                <span style={{ fontSize: 11, color: "var(--color-mute)", fontWeight: 600 }}>
                  {day.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: 4, background: "var(--color-primary)" }} />
              <span style={{ fontSize: 12, color: "var(--color-charcoal)" }}>Received</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 12, height: 12, borderRadius: 4, background: "var(--color-error)", opacity: 0.7 }} />
              <span style={{ fontSize: 12, color: "var(--color-charcoal)" }}>Sent</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-6 dash-item-enter" style={{ animationDelay: "300ms" }}>
          <div className="dash-stat-card" style={{ textAlign: "center" }}>
            <div className="dash-badge dash-badge-success" style={{ marginBottom: 8 }}>Completed</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)" }}>{completedCount}</div>
          </div>
          <div className="dash-stat-card" style={{ textAlign: "center" }}>
            <div className="dash-badge dash-badge-warning" style={{ marginBottom: 8 }}>In Escrow</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)" }}>{escrowCount}</div>
          </div>
          <div className="dash-stat-card" style={{ textAlign: "center" }}>
            <div className="dash-badge dash-badge-error" style={{ marginBottom: 8 }}>Reversed</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)" }}>{reversedCount}</div>
          </div>
        </div>

        {/* Full Transaction List */}
        <div className="dash-item-enter" style={{ animationDelay: "350ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-ink)" }}>
              All Transactions
            </h3>
          </div>

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

          {loading ? (
            <LoadingState message="Loading transactions..." />
          ) : filteredTxns.length === 0 ? (
            <EmptyState
              icon={<Receipt size={24} style={{ color: "var(--color-mute)" }} />}
              title="No transactions"
              message="Your full transaction history will appear here."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredTxns.map((txn, i) => (
                <div
                  key={txn.id}
                  className="dash-txn-row dash-item-enter"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`dash-txn-avatar ${txn.type === "received" || txn.type === "deposit" || txn.type === "adjustment_in" ? "dash-txn-avatar-received" : "dash-txn-avatar-sent"}`}>
                      {txn.type === "sent" || txn.type === "adjustment_out" ? (
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
                        {txn.date} · {txn.reference.slice(0, 12)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: txn.type === "received" || txn.type === "deposit" || txn.type === "adjustment_in" ? "var(--color-success)" : "var(--color-ink)",
                      }}
                    >
                      {formatAmount(txn.amount, txn.type)}
                    </div>
                    <div className="mt-1">{getStatusBadge(txn.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
