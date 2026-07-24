import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api, setAuthToken } from "./api";

interface User {
  id: string;
  siva_tag: string;
  name: string;
  email: string;
  country: string;
  kyc_status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, country: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  initialized: false,

  init: async () => {
    try {
      const token = await SecureStore.getItemAsync("orthopay_token");
      const userStr = await SecureStore.getItemAsync("orthopay_user");
      if (token && userStr) {
        setAuthToken(token);
        set({ token, user: JSON.parse(userStr), initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.auth.login(email, password);
      const token = data.session?.access_token;
      const user = data.user as User;
      if (token) {
        await SecureStore.setItemAsync("orthopay_token", token);
        await SecureStore.setItemAsync("orthopay_user", JSON.stringify(user));
        setAuthToken(token);
      }
      set({ user, token, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  register: async (name, email, password, country) => {
    set({ loading: true, error: null });
    try {
      const data = await api.auth.register(name, email, password, country);
      const token = data.session?.access_token;
      const user = data.user as User;
      if (token) {
        await SecureStore.setItemAsync("orthopay_token", token);
        await SecureStore.setItemAsync("orthopay_user", JSON.stringify(user));
        setAuthToken(token);
      }
      set({ user, token, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
    }
    await SecureStore.deleteItemAsync("orthopay_token");
    await SecureStore.deleteItemAsync("orthopay_user");
    setAuthToken(null);
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
