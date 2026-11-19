import { create } from 'zustand';

export interface AuthUser {
  id: string;
  orgId: string;
  email: string;
  fullName: string;
  ign: string;
  globalRole: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

const stored = (() => {
  try {
    return JSON.parse(localStorage.getItem('nexus-auth') || '{}');
  } catch {
    return {};
  }
})();

export const useAuth = create<AuthState>((set) => ({
  token: stored.token || null,
  user: stored.user || null,
  setSession: (token, user) => {
    localStorage.setItem('nexus-auth', JSON.stringify({ token, user }));
    set({ token, user });
  },
  setToken: (token) => {
    const user = JSON.parse(localStorage.getItem('nexus-auth') || '{}').user;
    localStorage.setItem('nexus-auth', JSON.stringify({ token, user }));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('nexus-auth');
    set({ token: null, user: null });
  },
}));
