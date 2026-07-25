"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import type { Escrow } from "@/types";

export default function EscrowsPage() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadEscrows();
  }, [filter]);

  async function loadEscrows() {
    try {
      const params = filter !== "all" ? { status: filter } : undefined;
      const res = await api.escrows.list(params);
      setEscrows(res.data || []);
    } catch {
      // Error loading escrows
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "release" | "refund" | "fund") {
    try {
      await api.escrows.action(id, action);
      loadEscrows();
    } catch {
      // Error performing action
    }
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Escrows</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="all">All</option>
          <option value="created">Created</option>
          <option value="funded">Funded</option>
          <option value="held">Held</option>
          <option value="released">Released</option>
          <option value="reversed">Reversed</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>

      {loading ? (
        <p className="loading-text">Loading escrows...</p>
      ) : escrows.length === 0 ? (
        <p className="empty-text">No escrows found.</p>
      ) : (
        <div className="escrows-list">
          {escrows.map((escrow) => (
            <div key={escrow.id} className="card escrow-card">
              <div className="escrow-header">
                <span className={`status-badge status-${escrow.status}`}>{escrow.status}</span>
                <span className="escrow-amount">{escrow.gross_amount} {escrow.currency}</span>
              </div>
              <div className="escrow-meta">
                <span>Type: {escrow.type}</span>
                <span>Rail: {escrow.payment_rail}</span>
                <span>Fee: {escrow.fee_amount}</span>
                <span>Net: {escrow.net_amount}</span>
              </div>
              <div className="escrow-actions">
                {escrow.status === "created" && (
                  <button className="btn btn-sm btn-primary" onClick={() => handleAction(escrow.id, "fund")}>Fund</button>
                )}
                {escrow.status === "funded" && (
                  <button className="btn btn-sm btn-success" onClick={() => handleAction(escrow.id, "release")}>Release</button>
                )}
                {(escrow.status === "funded" || escrow.status === "held") && (
                  <button className="btn btn-sm btn-danger" onClick={() => handleAction(escrow.id, "refund")}>Refund</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
