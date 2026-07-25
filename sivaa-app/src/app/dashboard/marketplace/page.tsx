"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import type { MarketplaceOrder } from "@/types";

export default function MarketplacePage() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    side: "buy" as "buy" | "sell",
    amount: "",
    currency: "USD",
    payment_rail: "ach",
    pool_type: "standard",
    description: "",
  });

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const res = await api.marketplace.listOrders({ limit: 20 });
      setOrders(res.data || []);
    } catch {
      // Error loading orders
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.marketplace.createOrder({
        side: form.side,
        amount: parseFloat(form.amount),
        currency: form.currency,
        payment_rail: form.payment_rail,
        pool_type: form.pool_type,
        description: form.description || undefined,
      });
      setShowCreate(false);
      setForm({ side: "buy", amount: "", currency: "USD", payment_rail: "ach", pool_type: "standard", description: "" });
      loadOrders();
    } catch {
      // Error creating order
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Marketplace</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Order"}
        </button>
      </div>

      {showCreate && (
        <form className="card create-form" onSubmit={handleCreate}>
          <div className="form-row">
            <label>
              <span>Side</span>
              <select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value as "buy" | "sell" })}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </label>
            <label>
              <span>Amount</span>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </label>
          </div>
          <div className="form-row">
            <label>
              <span>Currency</span>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option>
              </select>
            </label>
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
          </div>
          <div className="form-row">
            <label>
              <span>Pool Type</span>
              <select value={form.pool_type} onChange={(e) => setForm({ ...form, pool_type: e.target.value })}>
                <option value="instant">Instant</option>
                <option value="standard">Standard</option>
                <option value="business">Business</option>
                <option value="merchant">Merchant</option>
                <option value="premium">Premium</option>
                <option value="institutional">Institutional</option>
              </select>
            </label>
          </div>
          <label>
            <span>Description (optional)</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </label>
          <button type="submit" className="btn btn-primary">Submit Order</button>
        </form>
      )}

      {loading ? (
        <p className="loading-text">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="empty-text">No open orders. Create one to get started.</p>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="card order-card">
              <div className="order-header">
                <span className={`badge badge-${order.side}`}>{order.side.toUpperCase()}</span>
                <span className="order-amount">{order.amount} {order.currency}</span>
              </div>
              <div className="order-meta">
                <span>Rail: {order.payment_rail}</span>
                <span>Pool: {order.pool_type}</span>
                <span>Status: {order.status}</span>
              </div>
              {order.description && <p className="order-desc">{order.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
