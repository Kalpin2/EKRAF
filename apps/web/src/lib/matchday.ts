import { create } from 'zustand';

export const useMatchday = create<{ active: boolean; toggle: () => void; exit: () => void }>((set) => ({
  active: false,
  toggle: () => set((s) => ({ active: !s.active })),
  exit: () => set({ active: false }),
}));
