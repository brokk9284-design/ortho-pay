"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type View = "overview" | "escrow" | "users" | "fees" | "payment-methods" | "kyc" | "receipts" | "audit";

interface Payment {
  payment_id: string;
  sender_id: string;
  receiver_id: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  reference: string;
  status: string;
  created_at: string;
  sender?: { siva_tag: string; name: string };
  receiver?: { siva_tag: string; name: string };
}

interface PaymentMethod {
  method_id: string;
  code: string;
  display_name: string;
  icon_key: string;
  fee_percentage: number;
  fee_fixed: number;
  min_amount: number;
  max_amount: number | null;
  daily_limit: number | null;
  monthly_limit: number | null;
  config: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
}

interface KycDocument {
  document_id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: { id: string; siva_tag: string; name: string; email: string | null; country: string; kyc_status: string };
}

interface ReceiptVerification {
  verification_id: string;
  payment_id: string;
  verification_method: string;
  receipt_url: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at?: string;
  payment?: { reference: string; gross_amount: number; sender_id: string; receiver_id: string };
}

interface UserProfile {
  id: string;
  siva_tag: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string;
  kyc_status: string;
  created_at: string;
}

interface FeeRule {
  rule_id: string;
  minimum_amount: number;
  maximum_amount: number | null;
  percentage: number;
  active: boolean;
}

interface AuditLog {
  log_id: string;
  actor_id: string;
  actor_type: string;
  action: string;
  table_name: string;
  record_id: string;
  timestamp: string;
}

interface RevenueReport {
  total_volume: number;
  total_revenue: number;
  pending_escrow: number;
  today_volume: number;
  today_revenue: number;
  total_users: number;
}

export default function AdminDashboard() {
  const [view, setView] = useState<View>("overview");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [feeRules, setFeeRules] = useState<FeeRule[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showCreateMethod, setShowCreateMethod] = useState(false);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [receipts, setReceipts] = useState<ReceiptVerification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = paymentFilter !== "all"
        ? `/api/v1/payments?status=${paymentFilter}`
        : "/api/v1/payments";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch {
      setError("Failed to load payments");
    }
    setLoading(false);
  }, [paymentFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = userSearch
        ? `/api/v1/users?search=${encodeURIComponent(userSearch)}`
        : "/api/v1/users";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError("Failed to load users");
    }
    setLoading(false);
  }, [userSearch]);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/fees");
      if (!res.ok) throw new Error("Failed to fetch fees");
      const data = await res.json();
      setFeeRules(data.fee_rules || []);
    } catch {
      setError("Failed to load fee rules");
    }
    setLoading(false);
  }, []);

  const fetchRevenue = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/reports/revenue");
      if (!res.ok) throw new Error("Failed to fetch revenue");
      const data = await res.json();
      setRevenue(data);
    } catch {
      setError("Failed to load revenue report");
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/reports/fraud");
      if (!res.ok) throw new Error("Failed to fetch audit data");
      const data = await res.json();
      setAuditLogs([]);
    } catch {
      setError("Failed to load audit logs");
    }
    setLoading(false);
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/payment-methods");
      if (!res.ok) throw new Error("Failed to fetch payment methods");
      const data = await res.json();
      setPaymentMethods(data.payment_methods || []);
    } catch {
      setError("Failed to load payment methods");
    }
    setLoading(false);
  }, []);

  const fetchKycDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = kycFilter !== "all"
        ? `/api/v1/kyc/manage?status=${kycFilter}`
        : "/api/v1/kyc/manage";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch KYC documents");
      const data = await res.json();
      setKycDocuments(data.documents || []);
    } catch {
      setError("Failed to load KYC documents");
    }
    setLoading(false);
  }, [kycFilter]);

  const handleUpdatePaymentMethod = async (methodId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/v1/payment-methods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method_id: methodId, ...updates }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update payment method");
        return;
      }
      fetchPaymentMethods();
      setEditingMethod(null);
    } catch {
      setError("Network error updating payment method");
    }
  };

  const handleCreatePaymentMethod = async (data: {
    code: string;
    display_name: string;
    icon_key: string;
    fee_percentage: number;
    fee_fixed: number;
    min_amount: number;
    max_amount: number | null;
    daily_limit: number | null;
    monthly_limit: number | null;
    config: Record<string, unknown>;
    sort_order: number;
  }) => {
    try {
      const res = await fetch("/api/v1/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Failed to create payment method");
        return;
      }
      fetchPaymentMethods();
      setShowCreateMethod(false);
    } catch {
      setError("Network error creating payment method");
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (!confirm("Are you sure you want to delete this payment method? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/v1/payment-methods?method_id=${methodId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete payment method");
        return;
      }
      fetchPaymentMethods();
    } catch {
      setError("Network error deleting payment method");
    }
  };

  const handleKycAction = async (documentId: string, status: string) => {
    try {
      const res = await fetch("/api/v1/kyc/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update KYC status");
        return;
      }
      fetchKycDocuments();
    } catch {
      setError("Network error updating KYC status");
    }
  };

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/receipts?all=true");
      if (!res.ok) throw new Error("Failed to fetch receipts");
      const data = await res.json();
      setReceipts(data.verifications || []);
    } catch {
      setError("Failed to load receipts");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (view === "overview") {
      fetchRevenue();
      fetchPayments();
    } else if (view === "escrow") {
      fetchPayments();
    } else if (view === "users") {
      fetchUsers();
    } else if (view === "fees") {
      fetchFees();
    } else if (view === "payment-methods") {
      fetchPaymentMethods();
    } else if (view === "kyc") {
      fetchKycDocuments();
    } else if (view === "receipts") {
      fetchReceipts();
    } else if (view === "audit") {
      fetchAuditLogs();
    }
  }, [view, paymentFilter, userSearch, kycFilter, fetchPayments, fetchUsers, fetchFees, fetchPaymentMethods, fetchKycDocuments, fetchReceipts, fetchRevenue, fetchAuditLogs]);

  const handleApprove = async (paymentId: string) => {
    try {
      const res = await fetch("/api/v1/payments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to approve");
        return;
      }
      fetchPayments();
      fetchRevenue();
    } catch {
      setError("Network error approving payment");
    }
  };

  const handleReject = async (paymentId: string) => {
    try {
      const res = await fetch("/api/v1/payments/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to reject");
        return;
      }
      fetchPayments();
      fetchRevenue();
    } catch {
      setError("Network error rejecting payment");
    }
  };

  const handleUpdateKyc = async (userId: string, kycStatus: string) => {
    try {
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kyc_status: kycStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update user");
        return;
      }
      fetchUsers();
    } catch {
      setError("Network error updating user");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return formatDate(iso);
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "var(--color-terminal-green)";
    if (status === "escrow_held" || status === "pending" || status === "under_review") return "var(--color-terminal-yellow)";
    return "var(--color-terminal-red)";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      under_review: "Under Review",
      escrow_held: "In Escrow",
      completed: "Completed",
      reversed: "Reversed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const navItems: { key: View; label: string; icon: React.ReactNode }[] = [
    {
      key: "overview",
      label: "Overview",
      icon: (
        <svg className="sidebar-nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      key: "escrow",
      label: "Escrow Queue",
      icon: (
        <svg className="sidebar-nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      key: "users",
      label: "Users",
      icon: (
        <svg className="sidebar-nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: "fees",
      label: "Fee Rules",
      icon: (
        <svg className="sidebar-nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      key: "payment-methods",
      label: "Payment Methods",
      icon: (
        <svg className="sidebar-nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
    {
      key: "kyc",
      label: "KYC Review",
      icon: (
        <svg className="sidebar-nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      key: "receipts",
      label: "Receipts",
      icon: (
        <svg className="sidebar-nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </svg>
      ),
    },
    {
      key: "audit",
      label: "Audit Logs",
      icon: (
        <svg className="sidebar-nav-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
  ];

  const escrowTabs = ["all", "pending", "escrow_held", "under_review", "completed", "reversed"];

  return (
    <div className="min-h-screen flex" data-theme="dark" style={{ backgroundColor: "var(--color-canvas)", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link href="/" className="text-xl font-bold font-display tracking-tight" style={{ color: "var(--color-ink)" }}>
            ORTHO-PAY
          </Link>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-section-label">Admin</div>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`sidebar-nav-item ${view === item.key ? "sidebar-nav-item-active" : ""}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="flex items-center gap-4">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", color: "var(--color-charcoal)" }}>
              Escrow Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs transition" style={{ color: "var(--color-charcoal)" }}>
              User View
            </Link>
            <Link href="/" className="text-xs transition" style={{ color: "var(--color-charcoal)" }}>
              Exit
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-auto dashboard-main">
          {error && (
            <div className="mb-4 text-sm rounded-lg p-3" style={{ color: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
              {error}
              <button className="ml-2 underline" onClick={() => setError("")}>Dismiss</button>
            </div>
          )}

          {/* Overview View */}
          {view === "overview" && (
            <div>
              <h2 className="text-2xl font-display font-medium mb-6" style={{ color: "var(--color-ink)" }}>Overview</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Pending Escrow" value={revenue?.pending_escrow?.toString() || "—"} color="var(--color-terminal-yellow)" />
                <StatCard label="Total Volume" value={revenue ? `$${revenue.total_volume.toLocaleString()}` : "—"} color="var(--color-ink)" />
                <StatCard label="Total Revenue" value={revenue ? `$${revenue.total_revenue.toLocaleString()}` : "—"} color="var(--color-ink)" />
                <StatCard label="Total Users" value={revenue?.total_users?.toString() || "—"} color="var(--color-ink)" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <StatCard label="Today's Volume" value={revenue ? `$${revenue.today_volume.toLocaleString()}` : "—"} color="var(--color-ink)" />
                <StatCard label="Today's Revenue" value={revenue ? `$${revenue.today_revenue.toLocaleString()}` : "—"} color="var(--color-ink)" />
              </div>

              <h3 className="font-display font-medium text-sm mb-3" style={{ color: "var(--color-ink)" }}>Recent Payments</h3>
              <PaymentTable
                payments={payments.slice(0, 10)}
                onApprove={handleApprove}
                onReject={handleReject}
                formatTime={formatTime}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            </div>
          )}

          {/* Escrow Queue View */}
          {view === "escrow" && (
            <div>
              <h2 className="text-2xl font-display font-medium mb-6" style={{ color: "var(--color-ink)" }}>Escrow Queue</h2>

              <div className="flex gap-2 mb-6 flex-wrap">
                {escrowTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPaymentFilter(tab)}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: paymentFilter === tab ? "var(--color-ink)" : "var(--color-surface-soft)",
                      color: paymentFilter === tab ? "var(--color-canvas)" : "var(--color-charcoal)",
                      border: `1px solid ${paymentFilter === tab ? "var(--color-ink)" : "var(--color-hairline)"}`,
                    }}
                  >
                    {tab === "all" ? "All" : getStatusLabel(tab)}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-sm" style={{ color: "var(--color-charcoal)" }}>Loading payments...</div>
              ) : (
                <PaymentTable
                  payments={payments}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              )}
            </div>
          )}

          {/* Users View */}
          {view === "users" && (
            <div>
              <h2 className="text-2xl font-display font-medium mb-6" style={{ color: "var(--color-ink)" }}>Users</h2>

              <div className="mb-4" style={{ maxWidth: "400px" }}>
                <div className="search-pill">
                  <svg className="search-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    className="search-pill-input"
                    type="text"
                    placeholder="Search by $SIVA tag, name, or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-hairline)", color: "var(--color-body)" }}>
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium">$SIVA Tag</th>
                          <th className="p-4 font-medium">KYC</th>
                          <th className="p-4 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={4} className="p-4" style={{ color: "var(--color-charcoal)" }}>Loading...</td></tr>
                        ) : users.length === 0 ? (
                          <tr><td colSpan={4} className="p-4" style={{ color: "var(--color-charcoal)" }}>No users found</td></tr>
                        ) : (
                          users.map((u) => (
                            <tr
                              key={u.id}
                              className="transition cursor-pointer"
                              style={{
                                borderBottom: "1px solid var(--color-hairline)",
                                backgroundColor: selectedUser?.id === u.id ? "var(--color-surface-dark)" : "transparent",
                              }}
                              onClick={() => setSelectedUser(u)}
                            >
                              <td className="p-4">
                                <div className="font-medium" style={{ color: "var(--color-ink)" }}>{u.name}</div>
                                <div className="text-[10px]" style={{ color: "var(--color-mute)" }}>{u.email}</div>
                              </td>
                              <td className="p-4 font-mono" style={{ color: "var(--color-charcoal)" }}>${u.siva_tag}</td>
                              <td className="p-4">
                                <span
                                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                  style={{
                                    color: u.kyc_status === "verified" ? "var(--color-terminal-green)" : u.kyc_status === "pending" ? "var(--color-terminal-yellow)" : "var(--color-charcoal)",
                                    border: `1px solid ${u.kyc_status === "verified" ? "var(--color-terminal-green)" : u.kyc_status === "pending" ? "var(--color-terminal-yellow)" : "var(--color-hairline)"}`,
                                  }}
                                >
                                  {u.kyc_status}
                                </span>
                              </td>
                              <td className="p-4 text-[10px]" style={{ color: "var(--color-mute)" }}>{formatDate(u.created_at)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedUser && (
                  <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
                    <h3 className="font-display font-medium text-sm mb-4" style={{ color: "var(--color-ink)" }}>User Details</h3>
                    <div className="flex flex-col gap-3 text-sm">
                      <DetailRow label="Name" value={selectedUser.name} />
                      <DetailRow label="$SIVA Tag" value={`$${selectedUser.siva_tag}`} />
                      <DetailRow label="Email" value={selectedUser.email || "—"} />
                      <DetailRow label="Phone" value={selectedUser.phone || "—"} />
                      <DetailRow label="Country" value={selectedUser.country} />
                      <DetailRow label="KYC Status" value={selectedUser.kyc_status} />
                      <DetailRow label="Joined" value={formatDate(selectedUser.created_at)} />
                    </div>

                    <div className="mt-6">
                      <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--color-charcoal)" }}>Update KYC Status</h4>
                      <div className="flex gap-2 flex-wrap">
                        {["unverified", "pending", "verified", "rejected"].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleUpdateKyc(selectedUser.id, status)}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: selectedUser.kyc_status === status ? "var(--color-ink)" : "var(--color-surface-dark)",
                              color: selectedUser.kyc_status === status ? "var(--color-canvas)" : "var(--color-charcoal)",
                              border: `1px solid ${selectedUser.kyc_status === status ? "var(--color-ink)" : "var(--color-hairline)"}`,
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fee Rules View */}
          {view === "fees" && (
            <div>
              <h2 className="text-2xl font-display font-medium mb-6" style={{ color: "var(--color-ink)" }}>Fee Rules</h2>

              {loading ? (
                <div className="text-sm" style={{ color: "var(--color-charcoal)" }}>Loading fee rules...</div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-hairline)", color: "var(--color-body)" }}>
                        <th className="p-4 font-medium">Min Amount</th>
                        <th className="p-4 font-medium">Max Amount</th>
                        <th className="p-4 font-medium">Percentage</th>
                        <th className="p-4 font-medium">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeRules.length === 0 ? (
                        <tr><td colSpan={4} className="p-4" style={{ color: "var(--color-charcoal)" }}>No fee rules found</td></tr>
                      ) : (
                        feeRules.map((rule) => (
                          <tr key={rule.rule_id} style={{ borderBottom: "1px solid var(--color-hairline)" }}>
                            <td className="p-4 font-mono" style={{ color: "var(--color-ink)" }}>${rule.minimum_amount.toFixed(2)}</td>
                            <td className="p-4 font-mono" style={{ color: "var(--color-ink)" }}>{rule.maximum_amount ? `$${rule.maximum_amount.toFixed(2)}` : "No limit"}</td>
                            <td className="p-4 font-mono font-semibold" style={{ color: "var(--color-ink)" }}>{rule.percentage.toFixed(2)}%</td>
                            <td className="p-4">
                              <span
                                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                style={{
                                  color: rule.active ? "var(--color-terminal-green)" : "var(--color-charcoal)",
                                  border: `1px solid ${rule.active ? "var(--color-terminal-green)" : "var(--color-hairline)"}`,
                                }}
                              >
                                {rule.active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payment Methods View */}
          {view === "payment-methods" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-medium" style={{ color: "var(--color-ink)" }}>Payment Methods</h2>
                  <p className="text-sm mt-1" style={{ color: "var(--color-charcoal)" }}>
                    Configure fee structures, limits, and payment details for each method.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateMethod(true)}
                  className="btn btn-primary btn-sm"
                >
                  + Add Method
                </button>
              </div>

              {loading ? (
                <div className="text-sm" style={{ color: "var(--color-charcoal)" }}>Loading payment methods...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div key={method.method_id} className="rounded-xl p-6" style={{ border: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <PaymentMethodIcon iconKey={method.icon_key} size={32} />
                          <div>
                            <div className="font-display font-medium text-sm" style={{ color: "var(--color-ink)" }}>{method.display_name}</div>
                            <div className="text-[10px] font-mono uppercase" style={{ color: "var(--color-mute)" }}>{method.code}</div>
                          </div>
                        </div>
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            color: method.is_active ? "var(--color-terminal-green)" : "var(--color-charcoal)",
                            border: `1px solid ${method.is_active ? "var(--color-terminal-green)" : "var(--color-hairline)"}`,
                          }}
                        >
                          {method.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                        <div>
                          <div className="uppercase tracking-wider mb-0.5" style={{ color: "var(--color-charcoal)" }}>Fee %</div>
                          <div className="font-mono font-medium" style={{ color: "var(--color-ink)" }}>{method.fee_percentage.toFixed(2)}%</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wider mb-0.5" style={{ color: "var(--color-charcoal)" }}>Fixed Fee</div>
                          <div className="font-mono font-medium" style={{ color: "var(--color-ink)" }}>${method.fee_fixed.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wider mb-0.5" style={{ color: "var(--color-charcoal)" }}>Min</div>
                          <div className="font-mono" style={{ color: "var(--color-ink)" }}>${method.min_amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wider mb-0.5" style={{ color: "var(--color-charcoal)" }}>Max</div>
                          <div className="font-mono" style={{ color: "var(--color-ink)" }}>{method.max_amount ? `$${method.max_amount.toFixed(2)}` : "No limit"}</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wider mb-0.5" style={{ color: "var(--color-charcoal)" }}>Daily Limit</div>
                          <div className="font-mono" style={{ color: "var(--color-ink)" }}>{method.daily_limit ? `$${method.daily_limit.toLocaleString()}` : "—"}</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wider mb-0.5" style={{ color: "var(--color-charcoal)" }}>Monthly Limit</div>
                          <div className="font-mono" style={{ color: "var(--color-ink)" }}>{method.monthly_limit ? `$${method.monthly_limit.toLocaleString()}` : "—"}</div>
                        </div>
                      </div>

                      {method.config && Object.keys(method.config).length > 0 && (
                        <div className="mb-4">
                          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--color-charcoal)" }}>Config</div>
                          <pre className="text-[10px] font-mono p-2 rounded-lg overflow-x-auto" style={{ backgroundColor: "var(--color-surface-dark)", color: "var(--color-body)" }}>
                            {JSON.stringify(method.config, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingMethod(method)}
                          className="btn btn-secondary btn-sm flex-1"
                        >
                          Edit Configuration
                        </button>
                        <button
                          onClick={() => handleDeletePaymentMethod(method.method_id)}
                          className="btn btn-sm"
                          style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--color-terminal-red)", border: "1px solid rgba(239,68,68,0.3)" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editingMethod && (
                <PaymentMethodEditModal
                  method={editingMethod}
                  onSave={(updates) => handleUpdatePaymentMethod(editingMethod.method_id, updates)}
                  onClose={() => setEditingMethod(null)}
                />
              )}

              {showCreateMethod && (
                <PaymentMethodCreateModal
                  onSave={handleCreatePaymentMethod}
                  onClose={() => setShowCreateMethod(false)}
                />
              )}
            </div>
          )}

          {/* KYC Review View */}
          {view === "kyc" && (
            <div>
              <h2 className="text-2xl font-display font-medium mb-6" style={{ color: "var(--color-ink)" }}>KYC Review</h2>

              <div className="flex gap-2 mb-6 flex-wrap">
                {["all", "pending", "approved", "rejected"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setKycFilter(tab)}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: kycFilter === tab ? "var(--color-ink)" : "var(--color-surface-soft)",
                      color: kycFilter === tab ? "var(--color-canvas)" : "var(--color-charcoal)",
                      border: `1px solid ${kycFilter === tab ? "var(--color-ink)" : "var(--color-hairline)"}`,
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-sm" style={{ color: "var(--color-charcoal)" }}>Loading KYC documents...</div>
              ) : kycDocuments.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
                  <p className="text-sm" style={{ color: "var(--color-charcoal)" }}>No KYC documents found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {kycDocuments.map((doc) => (
                    <div key={doc.document_id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium text-sm" style={{ color: "var(--color-ink)" }}>
                            {doc.user?.name || "Unknown"} <span className="font-mono text-xs" style={{ color: "var(--color-mute)" }}>${doc.user?.siva_tag || "—"}</span>
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--color-body)" }}>
                            {doc.document_type.replace(/_/g, " ")} · {formatTime(doc.created_at)}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: "var(--color-mute)" }}>
                            {doc.user?.country} · KYC: {doc.user?.kyc_status}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={`/api/v1/storage/file?path=${encodeURIComponent(doc.file_url)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          View
                        </a>
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            color: doc.status === "approved" ? "var(--color-terminal-green)" : doc.status === "pending" ? "var(--color-terminal-yellow)" : "var(--color-terminal-red)",
                            border: `1px solid ${doc.status === "approved" ? "var(--color-terminal-green)" : doc.status === "pending" ? "var(--color-terminal-yellow)" : "var(--color-terminal-red)"}`,
                          }}
                        >
                          {doc.status}
                        </span>
                        {doc.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleKycAction(doc.document_id, "approved")}
                              className="btn btn-sm"
                              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleKycAction(doc.document_id, "rejected")}
                              className="btn btn-secondary btn-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Receipts View */}
          {view === "receipts" && (
            <div>
              <h2 className="text-2xl font-display font-medium mb-6" style={{ color: "var(--color-ink)" }}>Payment Receipts</h2>
              <p className="text-sm mb-4" style={{ color: "var(--color-charcoal)" }}>
                Receipts uploaded by users for payment verification.
              </p>

              {loading ? (
                <div className="text-sm" style={{ color: "var(--color-charcoal)" }}>Loading receipts...</div>
              ) : receipts.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
                  <p className="text-sm" style={{ color: "var(--color-charcoal)" }}>No receipts uploaded yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.verification_id}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-xl flex items-center justify-center shrink-0"
                          style={{ width: 40, height: 40, backgroundColor: "var(--color-surface-dark)" }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-canvas)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>
                            {receipt.payment?.reference || receipt.payment_id.slice(0, 8)}
                          </div>
                          <div className="text-xs" style={{ color: "var(--color-mute)" }}>
                            {receipt.verification_method === "manual_receipt" ? "Manual receipt" : receipt.verification_method}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            color: receipt.verified ? "var(--color-terminal-green)" : "var(--color-terminal-yellow)",
                            border: `1px solid ${receipt.verified ? "var(--color-terminal-green)" : "var(--color-terminal-yellow)"}`,
                          }}
                        >
                          {receipt.verified ? "Verified" : "Pending"}
                        </span>
                        {receipt.receipt_url && (
                          <a
                            href={`/api/v1/storage/file?path=${encodeURIComponent(receipt.receipt_url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            View Receipt
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audit Logs View */}
          {view === "audit" && (
            <div>
              <h2 className="text-2xl font-display font-medium mb-6" style={{ color: "var(--color-ink)" }}>Audit Logs</h2>
              <p className="text-sm mb-4" style={{ color: "var(--color-charcoal)" }}>
                Immutable record of all admin and system actions. Logs are insert-only and cannot be modified.
              </p>
              {loading ? (
                <div className="text-sm" style={{ color: "var(--color-charcoal)" }}>Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
                  <p className="text-sm" style={{ color: "var(--color-charcoal)" }}>No audit logs available. Logs will appear here as admin actions are performed.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {auditLogs.map((log) => (
                    <div key={log.log_id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--color-ink)" }}>{log.action}</div>
                        <div className="text-xs" style={{ color: "var(--color-mute)" }}>{log.table_name} · {log.actor_type}</div>
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-mute)" }}>{formatTime(log.timestamp)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
      <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-charcoal)" }}>
        {label}
      </div>
      <div className="text-2xl font-mono font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-charcoal)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--color-ink)" }}>{value}</span>
    </div>
  );
}

function PaymentTable({
  payments,
  onApprove,
  onReject,
  formatTime,
  getStatusColor,
  getStatusLabel,
}: {
  payments: Payment[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  formatTime: (iso: string) => string;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
        <p className="text-sm" style={{ color: "var(--color-charcoal)" }}>No payments found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-hairline)", backgroundColor: "var(--color-surface-soft)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-hairline)", color: "var(--color-body)" }}>
              <th className="p-4 font-medium">Reference</th>
              <th className="p-4 font-medium">Sender</th>
              <th className="p-4 font-medium">Receiver</th>
              <th className="p-4 font-medium">Gross</th>
              <th className="p-4 font-medium">Fee</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.payment_id} style={{ borderBottom: "1px solid var(--color-hairline)" }}>
                <td className="p-4 font-mono" style={{ color: "var(--color-charcoal)" }}>
                  {p.reference}
                  <div className="text-[10px]" style={{ color: "var(--color-mute)" }}>{formatTime(p.created_at)}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium" style={{ color: "var(--color-ink)" }}>{p.sender?.name || "—"}</div>
                  <div className="text-[10px]" style={{ color: "var(--color-body)" }}>${p.sender?.siva_tag || "—"}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium" style={{ color: "var(--color-ink)" }}>{p.receiver?.name || "—"}</div>
                  <div className="text-[10px]" style={{ color: "var(--color-body)" }}>${p.receiver?.siva_tag || "—"}</div>
                </td>
                <td className="p-4 font-mono font-medium" style={{ color: "var(--color-ink)" }}>
                  ${p.gross_amount.toLocaleString()}
                </td>
                <td className="p-4 font-mono" style={{ color: "var(--color-body)" }}>
                  ${p.fee_amount.toLocaleString()}
                </td>
                <td className="p-4">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{
                      color: getStatusColor(p.status),
                      border: `1px solid ${getStatusColor(p.status)}`,
                    }}
                  >
                    {getStatusLabel(p.status)}
                  </span>
                </td>
                <td className="p-4">
                  {(p.status === "escrow_held" || p.status === "under_review" || p.status === "pending") ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onApprove(p.payment_id)}
                        className="btn btn-sm"
                        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(p.payment_id)}
                        className="btn btn-secondary btn-sm"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px]" style={{ color: "var(--color-mute)" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    <div style={{ color: "var(--color-ink)" }}>
      {icons[iconKey] || (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )}
    </div>
  );
}

function PaymentMethodEditModal({
  method,
  onSave,
  onClose,
}: {
  method: PaymentMethod;
  onSave: (updates: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [feePercentage, setFeePercentage] = useState(method.fee_percentage.toString());
  const [feeFixed, setFeeFixed] = useState(method.fee_fixed.toString());
  const [minAmount, setMinAmount] = useState(method.min_amount.toString());
  const [maxAmount, setMaxAmount] = useState(method.max_amount?.toString() || "");
  const [dailyLimit, setDailyLimit] = useState(method.daily_limit?.toString() || "");
  const [monthlyLimit, setMonthlyLimit] = useState(method.monthly_limit?.toString() || "");
  const [isActive, setIsActive] = useState(method.is_active);
  const [configStr, setConfigStr] = useState(JSON.stringify(method.config, null, 2));

  const handleSave = () => {
    const updates: Record<string, unknown> = {
      fee_percentage: parseFloat(feePercentage) || 0,
      fee_fixed: parseFloat(feeFixed) || 0,
      min_amount: parseFloat(minAmount) || 0,
      max_amount: maxAmount ? parseFloat(maxAmount) : null,
      daily_limit: dailyLimit ? parseFloat(dailyLimit) : null,
      monthly_limit: monthlyLimit ? parseFloat(monthlyLimit) : null,
      is_active: isActive,
    };

    try {
      updates.config = JSON.parse(configStr);
    } catch {
      updates.config = method.config;
    }

    onSave(updates);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl p-6 max-h-[90vh] overflow-auto"
        style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)", maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PaymentMethodIcon iconKey={method.icon_key} size={28} />
            <h3 className="font-display font-medium text-base" style={{ color: "var(--color-ink)" }}>
              Edit {method.display_name}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Fee Percentage (%)</label>
              <input className="input" type="number" step="0.01" value={feePercentage} onChange={(e) => setFeePercentage(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Fixed Fee ($)</label>
              <input className="input" type="number" step="0.01" value={feeFixed} onChange={(e) => setFeeFixed(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Min Amount ($)</label>
              <input className="input" type="number" step="0.01" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Max Amount ($)</label>
              <input className="input" type="number" step="0.01" placeholder="No limit" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Daily Limit ($)</label>
              <input className="input" type="number" step="0.01" placeholder="No limit" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Monthly Limit ($)</label>
              <input className="input" type="number" step="0.01" placeholder="No limit" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Config (JSON)</label>
            <textarea
              className="textarea"
              rows={5}
              value={configStr}
              onChange={(e) => setConfigStr(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: "11px" }}
            />
            <span className="input-hint">Edit wallet addresses, handles, instructions, etc.</span>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              className="toggle-input"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="toggle-track" />
            <span>Active</span>
          </label>

          <div className="flex gap-3 mt-2">
            <button onClick={handleSave} className="btn btn-primary btn-full">
              Save Changes
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodCreateModal({
  onSave,
  onClose,
}: {
  onSave: (data: {
    code: string;
    display_name: string;
    icon_key: string;
    fee_percentage: number;
    fee_fixed: number;
    min_amount: number;
    max_amount: number | null;
    daily_limit: number | null;
    monthly_limit: number | null;
    config: Record<string, unknown>;
    sort_order: number;
  }) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [iconKey, setIconKey] = useState("");
  const [feePercentage, setFeePercentage] = useState("0");
  const [feeFixed, setFeeFixed] = useState("0");
  const [minAmount, setMinAmount] = useState("1");
  const [maxAmount, setMaxAmount] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [configStr, setConfigStr] = useState("{}");

  const handleSave = () => {
    if (!code || !displayName || !iconKey) return;
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(configStr);
    } catch {
      config = {};
    }
    onSave({
      code: code.toLowerCase().replace(/\s/g, "_"),
      display_name: displayName,
      icon_key: iconKey.toLowerCase().replace(/\s/g, "_"),
      fee_percentage: parseFloat(feePercentage) || 0,
      fee_fixed: parseFloat(feeFixed) || 0,
      min_amount: parseFloat(minAmount) || 0,
      max_amount: maxAmount ? parseFloat(maxAmount) : null,
      daily_limit: dailyLimit ? parseFloat(dailyLimit) : null,
      monthly_limit: monthlyLimit ? parseFloat(monthlyLimit) : null,
      config,
      sort_order: parseInt(sortOrder) || 0,
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl p-6 max-h-[90vh] overflow-auto"
        style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)", maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-medium text-base" style={{ color: "var(--color-ink)" }}>
            Create Payment Method
          </h3>
          <button onClick={onClose} className="btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Code *</label>
              <input className="input" type="text" placeholder="e.g. bank_transfer" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Display Name *</label>
              <input className="input" type="text" placeholder="e.g. Bank Transfer" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Icon Key *</label>
            <input className="input" type="text" placeholder="e.g. bank, crypto, card" value={iconKey} onChange={(e) => setIconKey(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Fee Percentage (%)</label>
              <input className="input" type="number" step="0.01" value={feePercentage} onChange={(e) => setFeePercentage(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Fixed Fee ($)</label>
              <input className="input" type="number" step="0.01" value={feeFixed} onChange={(e) => setFeeFixed(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Min Amount ($)</label>
              <input className="input" type="number" step="0.01" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Max Amount ($)</label>
              <input className="input" type="number" step="0.01" placeholder="No limit" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="input-group">
              <label className="input-label">Daily Limit ($)</label>
              <input className="input" type="number" step="0.01" placeholder="No limit" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Monthly Limit ($)</label>
              <input className="input" type="number" step="0.01" placeholder="No limit" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Sort Order</label>
            <input className="input" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Config (JSON)</label>
            <textarea
              className="textarea"
              rows={5}
              value={configStr}
              onChange={(e) => setConfigStr(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: "11px" }}
            />
            <span className="input-hint">Add wallet addresses, handles, instructions, etc.</span>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={handleSave}
              className="btn btn-primary btn-full"
              disabled={!code || !displayName || !iconKey}
            >
              Create Method
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
