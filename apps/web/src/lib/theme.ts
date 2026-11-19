import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      setMode: (mode) => set({ mode }),
      toggle: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'nexus-theme', version: 1 },
  ),
);

/** Terapkan tema ke root dokumen. Dipanggil saat boot & setiap perubahan state. */
export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
}

/** Warna grafik mengikuti token tema (SVG mewarisi CSS variable). */
export const CHART = {
  primary: 'var(--accent-primary)',
  secondary: 'var(--accent-secondary)',
  win: 'var(--semantic-win)',
  loss: 'var(--semantic-loss)',
  warn: 'var(--semantic-warn)',
  grid: 'var(--border-subtle)',
  text: 'var(--text-secondary)',
  surface: 'var(--bg-elevated)',
  ink: 'var(--text-primary)',
} as const;
