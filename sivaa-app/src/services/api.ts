import type {
  MarketplaceOrder,
  ProviderOffer,
  Escrow,
  EscrowEvent,
  EscrowMilestone,
  EscrowDocument,
  Dispute,
  DisputeMessage,
  DisputeEvidence,
  Settlement,
  Wallet,
  LedgerEntry,
  FeeCalculation,
  TrustScore,
  LiquidityScore,
  Notification,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

const API_BASE = "/api/v1";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: "Request failed" } }));
    throw new Error(error.error?.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

interface EscrowDetail extends Escrow {
  events: EscrowEvent[];
  milestones: EscrowMilestone[];
  documents: EscrowDocument[];
}

interface DisputeDetail extends Dispute {
  messages: DisputeMessage[];
  evidence: DisputeEvidence[];
}

interface OrderDetail extends MarketplaceOrder {
  offers?: ProviderOffer[];
}

export const api = {
  // Marketplace
  marketplace: {
    listOrders: (params?: { status?: string; pool_type?: string; currency?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
      }
      return fetchApi<PaginatedResponse<MarketplaceOrder>>(`/marketplace/orders?${query}`);
    },
    createOrder: (data: { side: string; amount: number; currency: string; payment_rail: string; pool_type?: string; description?: string }) =>
      fetchApi<ApiResponse<MarketplaceOrder>>("/marketplace/orders", { method: "POST", body: JSON.stringify(data) }),
    getOrder: (id: string) => fetchApi<ApiResponse<OrderDetail>>(`/marketplace/orders/${id}`),
    cancelOrder: (id: string) => fetchApi<ApiResponse<{ cancelled: boolean }>>(`/marketplace/orders/${id}`, { method: "DELETE" }),
    createOffer: (data: { order_id: string; fee_percentage: number; fee_fixed?: number; settlement_time_hours: number; amount_offered: number; message?: string }) =>
      fetchApi<ApiResponse<ProviderOffer>>("/marketplace/offers", { method: "POST", body: JSON.stringify(data) }),
    acceptOffer: (id: string) => fetchApi<ApiResponse<{ escrow: Escrow; offer_id: string; order_id: string }>>(`/marketplace/offers/${id}/accept`, { method: "POST" }),
  },

  // Escrows
  escrows: {
    list: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
      }
      return fetchApi<PaginatedResponse<Escrow>>(`/escrows?${query}`);
    },
    get: (id: string) => fetchApi<ApiResponse<EscrowDetail>>(`/escrows/${id}`),
    create: (data: { provider_id?: string; type?: string; gross_amount: number; fee_amount?: number; currency: string; payment_rail: string }) =>
      fetchApi<ApiResponse<Escrow>>("/escrows", { method: "POST", body: JSON.stringify(data) }),
    action: (id: string, action: "release" | "refund" | "fund") =>
      fetchApi<ApiResponse<{ released?: boolean; refunded?: boolean; funded?: boolean }>>(`/escrows/${id}`, { method: "POST", body: JSON.stringify({ action }) }),
  },

  // Disputes
  disputes: {
    list: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
      }
      return fetchApi<PaginatedResponse<Dispute>>(`/disputes?${query}`);
    },
    get: (id: string) => fetchApi<ApiResponse<DisputeDetail>>(`/disputes/${id}`),
    create: (data: { escrow_id: string; reason: string; description: string; initiated_by?: string }) =>
      fetchApi<ApiResponse<Dispute>>("/disputes", { method: "POST", body: JSON.stringify(data) }),
    message: (id: string, message: string) =>
      fetchApi<ApiResponse<DisputeMessage>>(`/disputes/${id}`, { method: "POST", body: JSON.stringify({ action: "message", message }) }),
    evidence: (id: string, data: { file_url: string; file_type: string; description?: string }) =>
      fetchApi<ApiResponse<DisputeEvidence>>(`/disputes/${id}`, { method: "POST", body: JSON.stringify({ action: "evidence", ...data }) }),
  },

  // Reputation
  reputation: {
    get: (userId: string) => fetchApi<ApiResponse<{ trust: TrustScore; liquidity: LiquidityScore }>>(`/reputation/${userId}`),
  },

  // Fees
  fees: {
    calculate: (data: { amount: number; currency: string; payment_rail: string; pool_type?: string; requested_priority?: boolean }) =>
      fetchApi<ApiResponse<FeeCalculation>>("/fees/calculate", { method: "POST", body: JSON.stringify(data) }),
  },

  // Settlements
  settlements: {
    list: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
      }
      return fetchApi<PaginatedResponse<Settlement>>(`/settlements?${query}`);
    },
    get: (id: string) => fetchApi<ApiResponse<Settlement>>(`/settlements/${id}`),
  },

  // Wallet
  wallet: {
    get: () => fetchApi<ApiResponse<Wallet>>("/wallet"),
    history: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
      }
      return fetchApi<PaginatedResponse<LedgerEntry>>(`/wallet/history?${query}`);
    },
  },

  // Auth
  auth: {
    me: () => fetchApi<ApiResponse<{ id: string; email: string; siva_tag: string }>>("/auth/me"),
    login: (data: { email: string; password: string }) =>
      fetchApi<ApiResponse<{ id: string; email: string; siva_tag: string }>>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: Record<string, unknown>) =>
      fetchApi<ApiResponse<{ id: string; email: string }>>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    logout: () => fetchApi<{ success: boolean }>("/auth/logout", { method: "POST" }),
  },

  // Notifications
  notifications: {
    list: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => v && query.set(k, String(v)));
      }
      return fetchApi<PaginatedResponse<Notification>>(`/notifications?${query}`);
    },
    markAllRead: () => fetchApi<{ success: boolean }>("/notifications/mark-all-read", { method: "POST" }),
  },
};
