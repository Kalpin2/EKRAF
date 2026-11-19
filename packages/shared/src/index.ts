/**
 * NexusEsports OS — shared domain constants, RBAC matrix and design tokens.
 * Consumed by both the NestJS API and the React web app.
 */

export enum GlobalRole {
  ORG_ADMIN = 'ORG_ADMIN',
  TEAM_MANAGER = 'TEAM_MANAGER',
  HEAD_COACH = 'HEAD_COACH',
  ANALYST = 'ANALYST',
  PLAYER = 'PLAYER',
  FINANCE = 'FINANCE',
}

export enum DivisionRole {
  HEAD_COACH = 'HEAD_COACH',
  ANALYST = 'ANALYST',
  MANAGER = 'MANAGER',
  PLAYER = 'PLAYER',
}

export enum RosterStatus {
  STARTING = 'STARTING',
  SUBSTITUTE = 'SUBSTITUTE',
  BENCH = 'BENCH',
  TRIAL = 'TRIAL',
  INACTIVE = 'INACTIVE',
}

export enum MatchType {
  SCRIM = 'SCRIM',
  OFFICIAL = 'OFFICIAL',
  RANKED = 'RANKED',
}

export enum MatchResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
  DRAW = 'DRAW',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  LOAN = 'LOAN',
  BENCH = 'BENCH',
  EXPIRED = 'EXPIRED',
}

export enum AttendanceStatus {
  ON_TIME = 'ON_TIME',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  SICK = 'SICK',
  ABSENT = 'ABSENT',
}

export enum ReadStatus {
  UNREAD = 'UNREAD',
  READING = 'READING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export enum RecruitStage {
  SCOUTING = 'SCOUTING',
  CONTACTED = 'CONTACTED',
  TRIAL_SCHEDULED = 'TRIAL_SCHEDULED',
  COACH_EVAL = 'COACH_EVAL',
  OFFER = 'OFFER',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export const ROLE_LABELS: Record<GlobalRole, string> = {
  ORG_ADMIN: 'Org Admin',
  TEAM_MANAGER: 'Team Manager',
  HEAD_COACH: 'Head Coach',
  ANALYST: 'Analyst',
  PLAYER: 'Player',
  FINANCE: 'Finance',
};

export const ROSTER_LABELS: Record<RosterStatus, string> = {
  STARTING: 'Starting',
  SUBSTITUTE: 'Substitute',
  BENCH: 'Bench',
  TRIAL: 'Trial',
  INACTIVE: 'Inactive',
};

/** Fine-grained permission keys used by @RequirePermissions and the UI. */
export const PERMISSIONS = {
  ORG_MANAGE: 'org:manage',
  DIVISION_MANAGE: 'division:manage',
  USER_MANAGE: 'user:manage',
  ROSTER_MANAGE: 'roster:manage',
  SCHEDULE_MANAGE: 'schedule:manage',
  ATTENDANCE_MANAGE: 'attendance:manage',
  MATCH_CREATE: 'match:create',
  MATCH_READ: 'match:read',
  SCORECARD_WRITE: 'scorecard:write',
  PLAYBOOK_CREATE: 'playbook:create',
  PLAYBOOK_READ: 'playbook:read',
  PLAYBOOK_ACK: 'playbook:ack',
  ANALYTICS_READ: 'analytics:read',
  CONTRACT_MANAGE: 'contract:manage',
  CONTRACT_READ: 'contract:read',
  FINANCE_MANAGE: 'finance:manage',
  RECRUIT_MANAGE: 'recruit:manage',
  WELLNESS_WRITE: 'wellness:write',
  WELLNESS_READ: 'wellness:read',
  AUDIT_READ: 'audit:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Default permission sets per global role. */
export const ROLE_PERMISSIONS: Record<GlobalRole, Permission[]> = {
  ORG_ADMIN: Object.values(PERMISSIONS),
  TEAM_MANAGER: [
    PERMISSIONS.ROSTER_MANAGE,
    PERMISSIONS.SCHEDULE_MANAGE,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.MATCH_READ,
    PERMISSIONS.CONTRACT_READ,
    PERMISSIONS.PLAYBOOK_READ,
    PERMISSIONS.WELLNESS_READ,
    PERMISSIONS.RECRUIT_MANAGE,
  ],
  HEAD_COACH: [
    PERMISSIONS.MATCH_CREATE,
    PERMISSIONS.MATCH_READ,
    PERMISSIONS.SCORECARD_WRITE,
    PERMISSIONS.PLAYBOOK_CREATE,
    PERMISSIONS.PLAYBOOK_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.WELLNESS_READ,
    PERMISSIONS.RECRUIT_MANAGE,
    PERMISSIONS.SCHEDULE_MANAGE,
  ],
  ANALYST: [
    PERMISSIONS.MATCH_CREATE,
    PERMISSIONS.MATCH_READ,
    PERMISSIONS.SCORECARD_WRITE,
    PERMISSIONS.PLAYBOOK_CREATE,
    PERMISSIONS.PLAYBOOK_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.WELLNESS_READ,
  ],
  PLAYER: [
    PERMISSIONS.MATCH_READ,
    PERMISSIONS.PLAYBOOK_READ,
    PERMISSIONS.PLAYBOOK_ACK,
    PERMISSIONS.WELLNESS_WRITE,
  ],
  FINANCE: [
    PERMISSIONS.CONTRACT_MANAGE,
    PERMISSIONS.CONTRACT_READ,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.AUDIT_READ,
  ],
};

export function hasPermission(role: GlobalRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Sage Olive & Warm Clay design tokens — mirrors SPEC §1.1 (dual theme). */
export const DESIGN_TOKENS = {
  /** Default: Deep Moss Charcoal & Muted Sage. */
  color: {
    bgCanvas: '#141614',
    bgSurface: '#1C1F1C',
    bgElevated: '#252925',
    borderSubtle: '#2F342F',
    textPrimary: '#F2F3F0',
    textSecondary: '#9CA19B',
    accentPrimary: '#6B8E78',
    accentSecondary: '#B8A48A',
    semanticWin: '#558B6E',
    semanticLoss: '#B85D58',
    semanticWarn: '#C4934B',
  },
  themes: {
    dark: {
      bgCanvas: '#141614', bgSurface: '#1C1F1C', bgElevated: '#252925', borderSubtle: '#2F342F',
      textPrimary: '#F2F3F0', textSecondary: '#9CA19B', accentPrimary: '#6B8E78',
      accentSecondary: '#B8A48A', semanticWin: '#558B6E', semanticLoss: '#B85D58', semanticWarn: '#C4934B',
      accentContrast: '#F4F5F4', accentHover: '#5B7A67',
      watermark: 'rgba(242, 243, 240, 0.14)',
    },
    light: {
      bgCanvas: '#F5F5F2', bgSurface: '#EAECE6', bgElevated: '#FFFFFF', borderSubtle: '#D8DBD3',
      textPrimary: '#1C1F1C', textSecondary: '#626861', accentPrimary: '#4A6B56',
      accentSecondary: '#7D6B56', semanticWin: '#3B7356', semanticLoss: '#A34843', semanticWarn: '#A6762E',
      accentContrast: '#FFFFFF', accentHover: '#3D5947',
      watermark: 'rgba(28, 31, 28, 0.12)',
    },
  },
  font: {
    ui: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    display: "'Space Grotesk', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
} as const;

export const GAME_TITLES = ['Valorant', 'Mobile Legends: Bang Bang', 'Counter-Strike 2', 'Dota 2', 'PUBG Mobile', 'Free Fire'] as const;

export function daysUntil(date: string | Date): number {
  const target = new Date(date).getTime();
  return Math.ceil((target - Date.now()) / 86_400_000);
}

/** Contract reminder tiers from PRD/approved decision D4. */
export const CONTRACT_REMINDER_TIERS = [90, 60, 30, 14] as const;

export function prizePoolSplit(
  total: number,
  taxPercent: number,
  shares: { players: number; staff: number; org: number; playerCount: number },
) {
  const cent = (n: number) => Math.round(n * 100) / 100;
  const net = cent(total * (1 - taxPercent / 100));
  const playerPool = cent(net * (shares.players / 100));
  const staffPool = cent(net * (shares.staff / 100));
  const orgPool = cent(net * (shares.org / 100));
  return {
    gross: cent(total),
    tax: cent(total - net),
    net,
    playerPool,
    staffPool,
    orgPool,
    perPlayer: shares.playerCount > 0 ? cent(playerPool / shares.playerCount) : 0,
  };
}
