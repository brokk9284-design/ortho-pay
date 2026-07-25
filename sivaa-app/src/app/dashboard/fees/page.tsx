"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import type { FeeCalculation } from "@/types";

export default function FeeCalculatorPage() {
  const [form, setForm] = useState({
    amount: "",
    currency: "USD",
    payment_rail: "ach",
    pool_type: "standard",
    requested_priority: false,
  });
  const [result, setResult] = useState<FeeCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.fees.calculate({
        amount: parseFloat(form.amount),
        currency: form.currency,
        payment_rail: form.payment_rail,
        pool_type: form.pool_type,
        requested_priority: form.requested_priority,
      });
      setResult(res.data);
    } catch {
      // Error calculating fee
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Fee Calculator</h1>
      </div>

      <form className="card" onSubmit={calculate}>
        <div className="form-row">
          <label>
            <span>Amount</span>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </label>
          <label>
            <span>Currency</span>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            <span>Payment Rail</span>
            <select value={form.payment_rail} onChange={(e) => setForm({ ...form, payment_rail: e.target.value })}>
              <option value="ach">ACH</option>
              <option value="sepa">SEPA</option>
              <option value="sepa_instant">SEPA Instant</option>
              <option value="faster_payments">Faster Payments</option>
              <option value="interac">Interac</option>
              <option value="internal">Internal</option>
            </select>
          </label>
          <label>
            <span>Pool Type</span>
            <select value={form.pool_type} onChange={(e) => setForm({ ...form, pool_type: e.target.value })}>
              <option value="instant">Instant</option>
              <option value="standard">Standard</option>
              <option value="business">Business</option>
              <option value="premium">Premium</option>
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.requested_priority} onChange={(e) => setForm({ ...form, requested_priority: e.target.checked })} />
          <span>Priority settlement (+0.5% fee)</span>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Calculating..." : "Calculate Fee"}
        </button>
      </form>

      {result && (
        <div className="card fee-result">
          <h3>Fee Breakdown</h3>
          <div className="fee-grid">
            <div className="fee-row"><span>Base Fee</span><span>{result.breakdown.base_fee}%</span></div>
            <div className="fee-row"><span>Risk Premium</span><span>+{result.breakdown.risk_premium.toFixed(2)}%</span></div>
            <div className="fee-row"><span>Loyalty Discount</span><span>-{result.breakdown.loyalty_discount.toFixed(2)}%</span></div>
            <div className="fee-row"><span>Liquidity Premium</span><span>+{result.breakdown.liquidity_premium.toFixed(2)}%</span></div>
            <div className="fee-row"><span>Urgency Premium</span><span>+{result.breakdown.urgency_premium}%</span></div>
            <div className="fee-row fee-total"><span>Total Fee</span><span>{result.fee_percentage.toFixed(2)}%</span></div>
            <div className="fee-row fee-amount"><span>Fee Amount</span><span>{result.total_fee} {result.currency}</span></div>
          </div>
          <p className="fee-explanation">{result.breakdown.explanation}</p>
        </div>
      )}
    </div>
  );
}
