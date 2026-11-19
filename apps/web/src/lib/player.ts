/** Helper khusus Player workspace — murni, tanpa efek samping. */

export const SCENARIO_LABELS: Record<string, string> = {
  ATTACK: 'Attack', DEFENSE: 'Defense', PISTOL: 'Pistol Round',
  ECO: 'Eco', FORCE_BUY: 'Force Buy', FULL_BUY: 'Full Buy',
};

export const SCENARIO_TONE: Record<string, 'red' | 'cyan' | 'amber' | 'violet' | 'green'> = {
  ATTACK: 'red', DEFENSE: 'cyan', PISTOL: 'amber', ECO: 'violet', FORCE_BUY: 'amber', FULL_BUY: 'green',
};

export const READ_STATUS_LABELS: Record<string, string> = {
  UNREAD: 'Belum Dibaca', READING: 'Sedang Dipelajari', ACKNOWLEDGED: 'Siap Dieksekusi',
};

export const READ_STATUS_TONE: Record<string, 'red' | 'amber' | 'green'> = {
  UNREAD: 'red', READING: 'amber', ACKNOWLEDGED: 'green',
};

export const SCHEDULE_LABELS: Record<string, string> = {
  PRACTICE: 'Practice', SCRIM: 'Scrim', VOD_REVIEW: 'VOD Review',
  TOURNAMENT: 'Turnamen', MEDIA_DAY: 'Media Day',
};

export const SCHEDULE_TONE: Record<string, 'cyan' | 'violet' | 'amber' | 'red'> = {
  PRACTICE: 'cyan', SCRIM: 'violet', VOD_REVIEW: 'cyan', TOURNAMENT: 'red', MEDIA_DAY: 'amber',
};

export const ATTENDANCE_LABELS: Record<string, string> = {
  ON_TIME: 'Tepat Waktu', LATE: 'Terlambat', EXCUSED: 'Izin', SICK: 'Sakit', ABSENT: 'Tanpa Keterangan',
};

export const MARKER_COLORS: Record<string, string> = {
  player: 'var(--accent-primary)', smoke: 'var(--text-secondary)', flash: 'var(--semantic-warn)', molly: 'var(--semantic-loss)', enemy: 'var(--semantic-loss)',
};

export const TIMEZONES = ['Asia/Jakarta', 'Asia/Singapore', 'UTC', 'America/Los_Angeles', 'Europe/Berlin'];

export function zoned(iso: string, timezone: string, withDate = false): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false,
    ...(withDate ? { day: '2-digit', month: 'short' } : {}),
  }).format(new Date(iso));
}

export interface Countdown {
  ms: number;
  label: string;
  urgent: boolean;
  live: boolean;
  done: boolean;
}

/** Hitung mundur ke H-15 menit sebelum sesi. */
export function countdownTo(iso: string, now = Date.now()): Countdown {
  const start = new Date(iso).getTime();
  const target = start - 15 * 60_000;
  const ms = target - now;
  if (now >= start) return { ms: 0, label: 'Selesai', urgent: false, live: false, done: true };
  if (ms <= 0) return { ms: 0, label: 'Berlangsung • H-15', urgent: true, live: true, done: false };
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const label = days > 0 ? `H-${days}h ${hours % 24}j` : hours > 0 ? `H-${hours}j ${minutes % 60}m` : `H-${minutes}m`;
  return { ms, label, urgent: minutes <= 60, live: false, done: false };
}

export function mmss(totalSeconds: number): string {
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export function clamp10(value: number): number {
  return Math.min(10, Math.max(1, Math.round(value)));
}

export const actionTone: Record<string, 'cyan' | 'amber' | 'green'> = {
  OPEN: 'cyan', IN_PROGRESS: 'amber', DONE: 'green',
};

export const actionLabel: Record<string, string> = {
  OPEN: 'Pending', IN_PROGRESS: 'In Progress', DONE: 'Done',
};

export const nextAction = (status: string) =>
  status === 'OPEN' ? 'IN_PROGRESS' : status === 'IN_PROGRESS' ? 'DONE' : 'DONE';
