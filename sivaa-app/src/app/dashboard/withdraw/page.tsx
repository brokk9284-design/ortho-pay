"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bitcoin,
  DollarSign,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/components/Toast";

const CRYPTO_OPTIONS = [
  { code: "btc", name: "Bitcoin", network: "BTC" },
  { code: "eth", name: "Ethereum", network: "ERC-20" },
  { code: "usdt", name: "USDT (Tether)", network: "TRC-20 / ERC-20" },
  { code: "usdc", name: "USDC", network: "ERC-20" },
  { code: "sol", name: "Solana", network: "SOL" },
  { code: "bnb", name: "BNB", network: "BEP-20" },
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "IE", name: "Ireland" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "PT", name: "Portugal" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "LT", name: "Lithuania" },
  { code: "LV", name: "Latvia" },
  { code: "EE", name: "Estonia" },
  { code: "IS", name: "Iceland" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "CY", name: "Cyprus" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "VN", name: "Vietnam" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "JO", name: "Jordan" },
  { code: "IL", name: "Israel" },
  { code: "TR", name: "Turkey" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "GH", name: "Ghana" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "UY", name: "Uruguay" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panama" },
  { code: "DO", name: "Dominican Republic" },
  { code: "JM", name: "Jamaica" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "BS", name: "Bahamas" },
  { code: "BB", name: "Barbados" },
];

interface Withdrawal {
  withdrawal_id: string;
  reference: string;
  amount: number;
  withdrawal_type: string;
  status: string;
  created_at: string;
}

export default function WithdrawPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"type" | "details" | "otp" | "confirm">("type");
  const [withdrawType, setWithdrawType] = useState<"crypto" | "cash" | "">("");
  const [amount, setAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [withdrawalRef, setWithdrawalRef] = useState("");
  const [availableBalance, setAvailableBalance] = useState(0);
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);

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
          setAvailableBalance(
            (data.wallet.total_received || 0) - (data.wallet.total_sent || 0)
          );
        }
      })
      .catch(() => {});

    fetch("/api/v1/withdrawals", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.withdrawals) setRecentWithdrawals(data.withdrawals.slice(0, 5));
      })
      .catch(() => {});
  }, [router]);

  const handleRequestOtp = async () => {
    setRequestingOtp(true);
    setError("");
    try {
      const res = await fetch("/api/v1/payments/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "withdrawal" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send verification code");
        setRequestingOtp(false);
        return;
      }
      setStep("otp");
      toast("Verification code sent to your email", "info");
    } catch {
      setError("Network error requesting verification code");
    }
    setRequestingOtp(false);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    if (amt > availableBalance) {
      setError(`Insufficient balance. Available: $${availableBalance.toFixed(2)}`);
      return;
    }

    if (withdrawType === "crypto" && !walletAddress.trim()) {
      setError("Wallet address is required");
      return;
    }

    if (withdrawType === "cash") {
      if (!accountName.trim() || !accountNumber.trim()) {
        setError("Account name and number are required");
        return;
      }
      if (selectedCountry === "GB" && !sortCode.trim()) {
        setError("Sort code is required for UK bank accounts");
        return;
      }
    }

    handleRequestOtp();
  };

  const handleSubmitWithdrawal = async () => {
    setSubmitting(true);
    setError("");

    const details =
      withdrawType === "crypto"
        ? {
            crypto_currency: selectedCrypto.code,
            crypto_name: selectedCrypto.name,
            network: selectedCrypto.network,
            wallet_address: walletAddress,
          }
        : {
            country: selectedCountry,
            account_name: accountName,
            account_number: accountNumber,
            sort_code: sortCode || undefined,
            bank_name: bankName || undefined,
          };

    try {
      const res = await fetch("/api/v1/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          withdrawal_type: withdrawType,
          amount: parseFloat(amount),
          two_factor_code: otpCode,
          details,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit withdrawal");
        setSubmitting(false);
        return;
      }

      setWithdrawalRef(data.withdrawal.reference);
      setStep("confirm");
      toast("Withdrawal request submitted", "success");
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setStep("type");
    setWithdrawType("");
    setAmount("");
    setWalletAddress("");
    setAccountName("");
    setAccountNumber("");
    setSortCode("");
    setBankName("");
    setOtpCode("");
    setError("");
    setWithdrawalRef("");
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 lg:px-8 py-6" style={{ maxWidth: "600px" }}>
        {/* Header */}
        <div className="mb-6 dash-item-enter">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-ink)", marginBottom: 4 }}>
            Withdraw
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-charcoal)" }}>
            Available: ${availableBalance.toFixed(2)}
          </p>
        </div>

        {/* Stepper */}
        <div className="dash-stepper dash-item-enter" style={{ animationDelay: "50ms" }}>
          <div className="dash-stepper-step">
            <div className={`dash-stepper-circle ${step === "type" ? "dash-stepper-circle-active" : "dash-stepper-circle-done"}`}>
              {step !== "type" ? <CheckCircle2 size={16} /> : "1"}
            </div>
            <span className={`dash-stepper-label ${step === "type" ? "dash-stepper-label-active" : ""}`}>Type</span>
          </div>
          <div className={`dash-stepper-line ${step !== "type" ? "dash-stepper-line-done" : ""}`} />
          <div className="dash-stepper-step">
            <div className={`dash-stepper-circle ${step === "details" ? "dash-stepper-circle-active" : step === "otp" || step === "confirm" ? "dash-stepper-circle-done" : "dash-stepper-circle-pending"}`}>
              {step === "otp" || step === "confirm" ? <CheckCircle2 size={16} /> : "2"}
            </div>
            <span className={`dash-stepper-label ${step === "details" ? "dash-stepper-label-active" : ""}`}>Details</span>
          </div>
          <div className={`dash-stepper-line ${step === "confirm" ? "dash-stepper-line-done" : ""}`} />
          <div className="dash-stepper-step">
            <div className={`dash-stepper-circle ${step === "otp" || step === "confirm" ? "dash-stepper-circle-active" : "dash-stepper-circle-pending"}`}>
              {step === "confirm" ? <CheckCircle2 size={16} /> : "3"}
            </div>
            <span className={`dash-stepper-label ${step === "otp" || step === "confirm" ? "dash-stepper-label-active" : ""}`}>Verify</span>
          </div>
        </div>

        {/* Step: Type Selection */}
        {step === "type" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-ink)" }}>
              Withdraw To
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setWithdrawType("crypto"); setStep("details"); }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl transition"
                style={{
                  backgroundColor: "var(--color-surface-soft)",
                  border: "1px solid var(--color-hairline)",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(29,78,216,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                  <Bitcoin size={24} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>Crypto</span>
                <span style={{ fontSize: 11, color: "var(--color-mute)" }}>BTC, ETH, USDT & more</span>
              </button>
              <button
                onClick={() => { setWithdrawType("cash"); setStep("details"); }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl transition"
                style={{
                  backgroundColor: "var(--color-surface-soft)",
                  border: "1px solid var(--color-hairline)",
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(22,163,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-success)" }}>
                  <DollarSign size={24} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>Cash / Bank</span>
                <span style={{ fontSize: 11, color: "var(--color-mute)" }}>US or UK bank transfer</span>
              </button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--color-ink)" }}>
              {withdrawType === "crypto" ? "Crypto Withdrawal" : "Bank Withdrawal"}
            </h3>
            <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
              {/* Amount */}
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
                    max={availableBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="dash-amount-input-field"
                    autoFocus
                    required
                  />
                </div>
                <p style={{ fontSize: 12, marginTop: 8, color: "var(--color-mute)" }}>
                  Available: ${availableBalance.toFixed(2)}
                </p>
              </div>

              {/* Crypto fields */}
              {withdrawType === "crypto" && (
                <>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                      Cryptocurrency
                    </label>
                    <select
                      className="input"
                      value={selectedCrypto.code}
                      onChange={(e) => setSelectedCrypto(CRYPTO_OPTIONS.find((c) => c.code === e.target.value) || CRYPTO_OPTIONS[0])}
                    >
                      {CRYPTO_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>{c.name} ({c.network})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder={`Your ${selectedCrypto.name} address`}
                      className="input"
                      style={{ fontFamily: "var(--font-mono, monospace)" }}
                      required
                    />
                    <p style={{ fontSize: 12, marginTop: 8, color: "var(--color-mute)" }}>
                      Network: {selectedCrypto.network} — Double-check your address!
                    </p>
                  </div>
                </>
              )}

              {/* Cash fields */}
              {withdrawType === "cash" && (
                <>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                      Country
                    </label>
                    <select
                      className="input"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="John Doe"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="000123456789"
                      className="input"
                      required
                    />
                  </div>
                  {selectedCountry === "GB" && (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                        Sort Code
                      </label>
                      <input
                        type="text"
                        value={sortCode}
                        onChange={(e) => setSortCode(e.target.value)}
                        placeholder="12-34-56"
                        className="input"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-charcoal)", marginBottom: 8, display: "block" }}>
                      Bank Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Chase / Barclays"
                      className="input"
                    />
                  </div>
                </>
              )}

              {error && (
                <div style={{ fontSize: 13, borderRadius: 10, padding: 12, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("type")} className="btn btn-secondary btn-lg flex-1">
                  ← Back
                </button>
                <button type="submit" disabled={requestingOtp} className="btn btn-primary btn-lg flex-1">
                  {requestingOtp ? "Sending OTP..." : "Continue →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step: OTP */}
        {step === "otp" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--color-ink)" }}>
              Verify Withdrawal
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-charcoal)", marginBottom: 20 }}>
              We sent a 6-digit code to your email. Enter it to confirm your withdrawal of ${parseFloat(amount).toFixed(2)}.
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && otpCode.length >= 6 && handleSubmitWithdrawal()}
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
            {error && (
              <div style={{ fontSize: 13, borderRadius: 10, padding: 12, marginBottom: 16, color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                {error}
              </div>
            )}
            <button
              onClick={handleSubmitWithdrawal}
              disabled={submitting || otpCode.length < 6}
              className="btn btn-primary btn-lg w-full"
            >
              {submitting ? "Submitting..." : "Confirm Withdrawal"}
            </button>
            <button
              onClick={handleRequestOtp}
              disabled={requestingOtp}
              className="w-full text-xs mt-3 transition disabled:opacity-50"
              style={{ color: "var(--color-charcoal)", background: "none", border: "none", cursor: "pointer" }}
            >
              {requestingOtp ? "Sending new code..." : "Resend code"}
            </button>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === "confirm" && (
          <div className="dash-workflow-card dash-item-enter" style={{ animationDelay: "100ms", textAlign: "center" }}>
            <div className="dash-confirm-check">
              <CheckCircle2 size={36} style={{ color: "#fff" }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: "var(--color-ink)" }}>
              Withdrawal Submitted
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-charcoal)", marginBottom: 20 }}>
              Your withdrawal of ${parseFloat(amount).toFixed(2)} is pending admin approval.
            </p>

            <div style={{ padding: 16, borderRadius: 14, background: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 8 }}>
                Reference
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono, monospace)", color: "var(--color-ink)" }}>
                {withdrawalRef}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6" style={{ fontSize: 13, color: "var(--color-warning)" }}>
              <Clock size={14} />
              <span>Waiting for admin approval</span>
            </div>

            <div className="flex gap-3">
              <button onClick={resetForm} className="btn btn-primary btn-lg flex-1">
                New Withdrawal
              </button>
              <Link href="/dashboard" className="btn btn-secondary btn-lg flex-1 text-center">
                Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Recent Withdrawals */}
        {recentWithdrawals.length > 0 && step === "type" && (
          <div className="mt-8 dash-item-enter" style={{ animationDelay: "150ms" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-mute)", marginBottom: 12 }}>
              Recent Withdrawals
            </h3>
            <div className="flex flex-col gap-2">
              {recentWithdrawals.map((wd, i) => (
                <div key={wd.withdrawal_id} className="dash-txn-row dash-item-enter" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="dash-txn-avatar dash-txn-avatar-sent">
                      {wd.withdrawal_type === "crypto" ? <Bitcoin size={16} style={{ color: "var(--color-canvas)" }} /> : <DollarSign size={16} style={{ color: "var(--color-canvas)" }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)" }}>
                        ${wd.amount.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-mute)", textTransform: "capitalize" }}>
                        {wd.withdrawal_type} · {wd.reference}
                      </div>
                    </div>
                  </div>
                  <div>
                    {wd.status === "approved" && <span className="dash-badge dash-badge-success">Approved</span>}
                    {wd.status === "pending" && <span className="dash-badge dash-badge-warning">Pending</span>}
                    {wd.status === "rejected" && <span className="dash-badge dash-badge-error">Rejected</span>}
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
