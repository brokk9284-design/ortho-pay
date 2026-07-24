import Constants from "expo-constants";

const API_BASE_URL =
  Constants.expoConfig?.extra?.API_BASE_URL || "http://localhost:3000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ user: unknown; session: { access_token: string } }>(
        "/api/v1/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    register: (name: string, email: string, password: string, country: string) =>
      apiFetch<{ user: unknown; session: { access_token: string } }>(
        "/api/v1/auth/register",
        { method: "POST", body: JSON.stringify({ name, email, password, country }) }
      ),
    logout: () =>
      apiFetch("/api/v1/auth/logout", { method: "POST" }),
  },
  wallet: {
    get: () => apiFetch("/api/v1/wallet"),
    history: () => apiFetch("/api/v1/wallet/history"),
    send: (receiver_tag: string, amount: number, payment_method_id: string, two_factor_code: string, payment_request_id?: string) =>
      apiFetch("/api/v1/wallet", {
        method: "POST",
        body: JSON.stringify({ receiver_tag, amount, payment_method_id, two_factor_code, payment_request_id }),
      }),
  },
  payments: {
    list: (status?: string) =>
      apiFetch(`/api/v1/payments${status ? `?status=${status}` : ""}`),
    request2fa: (purpose: string) =>
      apiFetch("/api/v1/payments/2fa", {
        method: "POST",
        body: JSON.stringify({ purpose }),
      }),
    verify2fa: (code: string, purpose: string) =>
      apiFetch("/api/v1/payments/2fa", {
        method: "PUT",
        body: JSON.stringify({ code, purpose }),
      }),
  },
  paymentMethods: {
    list: () => apiFetch("/api/v1/payment-methods"),
    create: (data: { code: string; display_name: string; icon_key: string; fee_percentage?: number; fee_fixed?: number; min_amount?: number; max_amount?: number; daily_limit?: number; monthly_limit?: number; sort_order?: number }) =>
      apiFetch("/api/v1/payment-methods", { method: "POST", body: JSON.stringify(data) }),
    update: (method_id: string, updates: Record<string, unknown>) =>
      apiFetch("/api/v1/payment-methods", { method: "PATCH", body: JSON.stringify({ method_id, ...updates }) }),
    delete: (method_id: string) =>
      apiFetch(`/api/v1/payment-methods?method_id=${method_id}`, { method: "DELETE" }),
  },
  kyc: {
    list: () => apiFetch("/api/v1/kyc"),
    upload: (document_type: string, file: { uri: string; type: string; name: string }) => {
      const formData = new FormData();
      formData.append("file", file as unknown as Blob);
      formData.append("document_type", document_type);
      return apiFetch("/api/v1/kyc", { method: "POST", body: formData });
    },
  },
  receipts: {
    list: (paymentId: string) =>
      apiFetch(`/api/v1/receipts?payment_id=${paymentId}`),
    upload: (paymentId: string, file: { uri: string; type: string; name: string }) => {
      const formData = new FormData();
      formData.append("file", file as unknown as Blob);
      formData.append("payment_id", paymentId);
      return apiFetch("/api/v1/receipts", { method: "POST", body: formData });
    },
  },
  storage: {
    fileUrl: (path: string) =>
      apiFetch<{ url: string }>(`/api/v1/storage/file?path=${encodeURIComponent(path)}&redirect=false`),
  },
  paymentRequests: {
    list: (status?: string) =>
      apiFetch(`/api/v1/payment-requests${status ? `?status=${status}` : ""}`),
    create: (receiver_tag: string, amount: number, payment_method_id: string, message?: string) =>
      apiFetch("/api/v1/payment-requests", {
        method: "POST",
        body: JSON.stringify({ receiver_tag, amount, payment_method_id, message }),
      }),
    manage: (request_id: string, action: "fulfill" | "cancel" | "decline", fulfilled_payment_id?: string) =>
      apiFetch("/api/v1/payment-requests/manage", {
        method: "PATCH",
        body: JSON.stringify({ request_id, action, fulfilled_payment_id }),
      }),
  },
  chats: {
    list: () => apiFetch<{ chats: unknown[]; unreadCounts: Record<string, number> }>("/api/v1/chats"),
    resolve: (siva_tag: string) =>
      apiFetch<{ chat_id: string }>("/api/v1/chats", {
        method: "POST",
        body: JSON.stringify({ siva_tag }),
      }),
    messages: (chat_id: string, before?: string) =>
      apiFetch<{ messages: unknown[] }>(`/api/v1/chats/messages?chat_id=${chat_id}${before ? `&before=${before}` : ""}`),
    sendMessage: (chat_id: string, body: string) =>
      apiFetch("/api/v1/chats/messages", {
        method: "POST",
        body: JSON.stringify({ chat_id, body }),
      }),
    uploadFile: (chat_id: string, file: { uri: string; type: string; name: string }, payment_id?: string) => {
      const formData = new FormData();
      formData.append("file", file as unknown as Blob);
      formData.append("chat_id", chat_id);
      if (payment_id) formData.append("payment_id", payment_id);
      return apiFetch("/api/v1/chats/upload", { method: "POST", body: formData });
    },
  },
  notifications: {
    list: () => apiFetch("/api/v1/notifications"),
  },
};
