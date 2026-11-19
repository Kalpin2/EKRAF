import { useAuth } from './auth';
import { getDemoUser, mockRequest } from './mock';

/**
 * Standalone demo API client.
 *
 * TIDAK ada request jaringan ke backend. Semua operasi dibaca/ditulis langsung
 * ke rich mock dataset lokal yang persisten di localStorage (demoStore).
 * Ini memastikan deploy frontend murni tidak pernah menghasilkan error koneksi
 * ke localhost:4000.
 */
export const demoMode = true;

/** Dipertahankan agar komponen lama tetap kompatibel. */
export const onDemoChange = (cb: () => void) => {
  cb();
  return () => { /* no-op */ };
};

export const api = {
  async get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    return mockRequest('GET', path, params) as T;
  },
  async post<T = any>(path: string, body?: any): Promise<T> {
    return mockRequest('POST', path, body) as T;
  },
  async patch<T = any>(path: string, body?: any): Promise<T> {
    return mockRequest('PATCH', path, body) as T;
  },
  async delete<T = any>(path: string): Promise<T> {
    return mockRequest('DELETE', path) as T;
  },

  async login(usernameOrEmail: string, _password?: string) {
    const account = getDemoUser(usernameOrEmail);
    useAuth.getState().setSession('demo-token', account as any);
    return account;
  },

  async logout() {
    useAuth.getState().logout();
  },
};
