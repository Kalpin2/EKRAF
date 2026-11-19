import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export const fmtDate = (value?: string | Date | null, pattern = 'dd MMM yyyy') =>
  value ? format(new Date(value), pattern, { locale: idLocale }) : '—';

export const fmtDateTime = (value?: string | Date | null) =>
  value ? format(new Date(value), 'dd MMM yyyy • HH:mm', { locale: idLocale }) : '—';

export const fmtTime = (value?: string | Date | null) =>
  value ? format(new Date(value), 'HH:mm', { locale: idLocale }) : '—';

export const timeAgo = (value?: string | Date | null) =>
  value ? formatDistanceToNow(new Date(value), { addSuffix: true, locale: idLocale }) : '—';

export const fmtMoney = (value?: number | string | null) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `Rp ${n.toLocaleString('id-ID')}`;
};

export const mmss = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export const initials = (name: string) =>
  name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

export const roleLabel = (role: string) => ({
  ORG_ADMIN: 'Org Admin',
  TEAM_MANAGER: 'Team Manager',
  HEAD_COACH: 'Head Coach',
  ANALYST: 'Analyst',
  PLAYER: 'Player',
  FINANCE: 'Finance',
}[role] || role);

export const roleColor = (role: string) => ({
  ORG_ADMIN: 'text-violetx bg-violetx/10 border-violetx/30',
  HEAD_COACH: 'text-cyanx bg-cyanx/10 border-cyanx/30',
  ANALYST: 'text-cyanx bg-cyanx/10 border-cyanx/30',
  TEAM_MANAGER: 'text-caution bg-caution/10 border-caution/30',
  PLAYER: 'text-victory bg-victory/10 border-victory/30',
  FINANCE: 'text-caution bg-caution/10 border-caution/30',
}[role] || 'text-muted bg-grid/40 border-grid');
