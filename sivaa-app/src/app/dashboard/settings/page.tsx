"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Bell,
  Globe,
  LogOut,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useLogout } from "@/components/DashboardShared";

interface KycDocument {
  document_id: string;
  document_type: string;
  file_url: string;
  status: string;
  created_at: string;
}

interface UserProfile {
  siva_tag: string;
  name: string;
  email: string;
  kyc_status: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const logout = useLogout();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [showKycUpload, setShowKycUpload] = useState(false);
  const [kycDocType, setKycDocType] = useState("passport");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycUploading, setKycUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) { router.push("/login"); return null; }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data?.user) {
          setProfile({
            siva_tag: data.user.siva_tag || "",
            name: data.user.name || "",
            email: data.user.email || "",
            kyc_status: data.user.kyc_status || "unverified",
          });
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

  const handleKycUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFile) {
      setError("Please select a file to upload");
      return;
    }
    setKycUploading(true);
    setError("");
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
        setError(data.error || "Failed to upload KYC document");
      }
    } catch {
      setError("Failed to upload KYC document");
    }
    setKycUploading(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const kycStatus = profile?.kyc_status || "unverified";

  const getKycIcon = (status: string) => {
    if (status === "approved" || status === "verified") return <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />;
    if (status === "pending") return <Clock size={16} style={{ color: "var(--color-warning)" }} />;
    return <XCircle size={16} style={{ color: "var(--color-error)" }} />;
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 lg:px-8 py-6" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div className="mb-6 dash-item-enter">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)", marginBottom: 4 }}>
            Settings
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-charcoal)" }}>
            Manage your account, identity verification, and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="mb-6 dash-item-enter" style={{ animationDelay: "50ms" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 12 }}>
            Profile
          </h3>
          <div className="dash-settings-section">
            <div className="dash-settings-row">
              <div className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--color-surface-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={18} style={{ color: "var(--color-canvas)" }} />
                </div>
                <div>
                  <div className="dash-settings-row-label">Name</div>
                  <div className="dash-settings-row-value">{profile?.name || "—"}</div>
                </div>
              </div>
            </div>
            <div className="dash-settings-row">
              <div className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(29,78,216,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)" }}>$</span>
                </div>
                <div>
                  <div className="dash-settings-row-label">ORTHO Tag</div>
                  <div className="dash-settings-row-value">${profile?.siva_tag || "—"}</div>
                </div>
              </div>
            </div>
            <div className="dash-settings-row">
              <div className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(29,78,216,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Globe size={18} style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <div className="dash-settings-row-label">Email</div>
                  <div className="dash-settings-row-value">{profile?.email || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Section */}
        <div className="mb-6 dash-item-enter" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)" }}>
              Identity Verification (KYC)
            </h3>
            <div className="flex items-center gap-2">
              {getKycIcon(kycStatus)}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: kycStatus === "approved" || kycStatus === "verified"
                    ? "var(--color-success)"
                    : kycStatus === "pending"
                      ? "var(--color-warning)"
                      : "var(--color-error)",
                }}
              >
                {kycStatus === "approved" || kycStatus === "verified" ? "Verified" : kycStatus === "pending" ? "Pending" : "Unverified"}
              </span>
            </div>
          </div>

          {kycStatus === "verified" || kycStatus === "approved" ? (
            <div className="dash-settings-section">
              <div className="dash-settings-row">
                <div className="flex items-center gap-3">
                  <Shield size={20} style={{ color: "var(--color-success)" }} />
                  <div>
                    <div className="dash-settings-row-label">Identity Verified</div>
                    <div className="dash-settings-row-value">You can send and receive without restrictions</div>
                  </div>
                </div>
              </div>
              {kycDocuments.length > 0 && (
                <div className="dash-settings-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-mute)", marginBottom: 8 }}>Submitted Documents</div>
                  <div className="flex flex-col gap-2 w-full">
                    {kycDocuments.map((doc) => (
                      <div key={doc.document_id} className="flex items-center justify-between w-full p-3 rounded-lg" style={{ background: "var(--color-canvas)", border: "1px solid var(--color-hairline)" }}>
                        <div className="flex items-center gap-2">
                          <FileText size={14} style={{ color: "var(--color-mute)" }} />
                          <span style={{ fontSize: 13, color: "var(--color-ink)" }}>{doc.document_type.replace(/_/g, " ")}</span>
                          <span style={{ fontSize: 11, color: "var(--color-mute)" }}>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                        {getKycIcon(doc.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="dash-settings-row">
                <button
                  onClick={() => setShowKycUpload(true)}
                  className="btn btn-secondary btn-sm"
                >
                  Submit Another Document
                </button>
              </div>
            </div>
          ) : kycDocuments.length === 0 ? (
            <div className="dash-workflow-card" style={{ padding: 24 }}>
              <div className="flex items-start gap-3 mb-4">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(217,119,6,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Shield size={20} style={{ color: "var(--color-warning)" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink)", marginBottom: 4 }}>
                    Verify your identity
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-charcoal)" }}>
                    Submit a document to verify your identity. Required for sending and receiving payments.
                  </div>
                </div>
              </div>
              <button onClick={() => setShowKycUpload(true)} className="btn btn-primary btn-lg w-full">
                <Upload size={16} style={{ marginRight: 8 }} />
                Submit Document
              </button>
            </div>
          ) : (
            <div className="dash-settings-section">
              {kycDocuments.map((doc) => (
                <div key={doc.document_id} className="dash-settings-row">
                  <div className="flex items-center gap-3">
                    <FileText size={18} style={{ color: "var(--color-mute)" }} />
                    <div>
                      <div className="dash-settings-row-label">{doc.document_type.replace(/_/g, " ")}</div>
                      <div className="dash-settings-row-value">{new Date(doc.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getKycIcon(doc.status)}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-charcoal)" }}>{doc.status}</span>
                  </div>
                </div>
              ))}
              <div className="dash-settings-row">
                <button onClick={() => setShowKycUpload(true)} className="btn btn-secondary btn-sm">
                  Submit Another Document
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="mb-6 dash-item-enter" style={{ animationDelay: "150ms" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 12 }}>
            Preferences
          </h3>
          <div className="dash-settings-section">
            <div className="dash-settings-row">
              <div className="flex items-center gap-3">
                <Bell size={18} style={{ color: "var(--color-charcoal)" }} />
                <span className="dash-settings-row-label">Notifications</span>
              </div>
              <span className="dash-settings-row-value">Enabled</span>
            </div>
            <div className="dash-settings-row">
              <div className="flex items-center gap-3">
                <Globe size={18} style={{ color: "var(--color-charcoal)" }} />
                <span className="dash-settings-row-label">Region</span>
              </div>
              <span className="dash-settings-row-value">USA & UK</span>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="mb-6 dash-item-enter" style={{ animationDelay: "200ms" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 12 }}>
            Account
          </h3>
          <div className="dash-settings-section">
            <button
              onClick={handleLogout}
              className="dash-settings-row"
              style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "none", border: "none" }}
            >
              <div className="flex items-center gap-3">
                <LogOut size={18} style={{ color: "var(--color-error)" }} />
                <span className="dash-settings-row-label" style={{ color: "var(--color-error)" }}>Sign Out</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* KYC Upload Modal */}
      {showKycUpload && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 dash-overlay"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowKycUpload(false)}
        >
          <div
            className="rounded-3xl p-6 w-full max-w-md mx-4 dash-modal-enter"
            style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-hairline)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--color-ink)" }}>Upload KYC Document</h3>
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
              {error && (
                <div style={{ fontSize: 13, borderRadius: 10, padding: 12, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={kycUploading}>
                {kycUploading ? "Uploading..." : "Submit for Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
