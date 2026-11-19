import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * State interaktif demo yang bertahan selama sesi (localStorage).
 * Dipakai mock service agar aksi Player (centang action item, check-in wellness,
 * konfirmasi baca playbook, edit profil, device binding) tidak hilang saat refresh.
 */

const day = 86_400_000;
const D = (offset: number) => new Date(Date.now() - offset * day).toISOString();

export interface DemoAction {
  id: string;
  title: string;
  match: { opponentName: string };
  creator: { ign: string };
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  dueDate: string;
}

export interface DemoWellness {
  id: string;
  userId: string;
  sleepHours: number;
  fatigueLevel: number;
  mentalReadiness: number;
  physicalIssue: string | null;
  note?: string | null;
  loggedAt: string;
}

export interface DemoDevice {
  id: string;
  label: string;
  fingerprint: string;
  lastSeenAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface DemoProfile {
  ign: string;
  jerseySize: string;
  travelPref: string;
  agentPool: string[];
}

interface DemoState {
  receipts: Record<string, string>;
  durations: Record<string, number>;
  actions: DemoAction[];
  wellness: DemoWellness[];
  devices: DemoDevice[];
  profile: DemoProfile;
  openPlaybook: (id: string) => void;
  ackPlaybook: (id: string, seconds: number) => void;
  setActionStatus: (id: string, status: DemoAction['status']) => void;
  addWellness: (entry: DemoWellness) => void;
  registerDevice: (device: DemoDevice) => void;
  revokeDevice: (id: string) => void;
  updateProfile: (patch: Partial<DemoProfile>) => void;
  reset: () => void;
}

const initial = {
  receipts: { 'pb-1': 'UNREAD', 'pb-2': 'UNREAD', 'pb-3': 'READING', 'pb-4': 'UNREAD', 'pb-5': 'UNREAD' } as Record<string, string>,
  durations: { 'pb-1': 0, 'pb-2': 0, 'pb-3': 45, 'pb-4': 0, 'pb-5': 0 } as Record<string, number>,
  actions: [
    { id: 'act-1', title: 'Latih timing entry mid', match: { opponentName: 'EDward Gaming' }, creator: { ign: 'CoachVex' }, status: 'OPEN' as const, dueDate: D(-3) },
    { id: 'act-2', title: 'Review utility lineup Ascent A', match: { opponentName: 'Team Liquid' }, creator: { ign: 'CoachVex' }, status: 'IN_PROGRESS' as const, dueDate: D(-5) },
  ],
  wellness: Array.from({ length: 14 }, (_, i) => ({
    id: `pw-${i}`,
    userId: 'u-0',
    sleepHours: 6 + (i % 4),
    fatigueLevel: 3 + ((i * 2) % 6),
    mentalReadiness: 5 + ((i + 1) % 5),
    physicalIssue: i === 3 ? 'Pergelangan tangan kiri agak nyeri' : null,
    note: null as string | null,
    loggedAt: D(i),
  })),
  devices: [
    { id: 'dev-1', label: 'MacBook Pro • Chrome', fingerprint: 'DEMO-DEVICE-0', lastSeenAt: D(0), revokedAt: null, createdAt: D(-30) },
    { id: 'dev-2', label: 'iPhone 15 • Safari', fingerprint: 'DEMO-DEVICE-1', lastSeenAt: D(-2), revokedAt: null, createdAt: D(-20) },
  ],
  profile: { ign: 'FrostByte', jerseySize: 'L', travelPref: 'Aisle seat', agentPool: ['Jett', 'Raze', 'Neon'] },
};

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      ...initial,
      openPlaybook: (id) => set((s) => ({ receipts: { ...s.receipts, [id]: s.receipts[id] === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : 'READING' } })),
      ackPlaybook: (id, seconds) => set((s) => ({
        receipts: { ...s.receipts, [id]: 'ACKNOWLEDGED' },
        durations: { ...s.durations, [id]: Math.max(s.durations[id] || 0, seconds) },
      })),
      setActionStatus: (id, status) => set((s) => ({ actions: s.actions.map((a) => a.id === id ? { ...a, status } : a) })),
      addWellness: (entry) => set((s) => ({ wellness: [entry, ...s.wellness].slice(0, 60) })),
      registerDevice: (device) => set((s) => ({ devices: [device, ...s.devices] })),
      revokeDevice: (id) => set((s) => ({ devices: s.devices.map((d) => d.id === id ? { ...d, revokedAt: new Date().toISOString() } : d) })),
      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      reset: () => set({ ...initial }),
    }),
    { name: 'nexus-demo-state', version: 1 },
  ),
);

/** Akses non-React untuk mock service. */
export const demoState = () => useDemoStore.getState();
