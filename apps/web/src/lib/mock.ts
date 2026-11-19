/**
 * Rich mock dataset untuk standalone frontend demo.
 * Tidak ada koneksi ke backend/API — semua data lokal & interaktif via demoStore.
 */
import { demoState } from './demoStore';
const now = Date.now();
const D = (days: number, hour = 12) => {
  const d = new Date(now + days * 86_400_000);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const demoUser = {
  id: '00000000-0000-4000-8000-000000000101',
  orgId: '00000000-0000-4000-8000-000000000100',
  email: 'admin@nexus.gg',
  fullName: 'Raka Pratama',
  ign: 'NEXUS_Raka',
  globalRole: 'ORG_ADMIN',
};

export const mockDivisions = [
  { id: 'div-val', gameTitle: 'Valorant', region: 'APAC', accentColor: 'var(--accent-primary)', _count: { members: 9, matches: 14, playbooks: 5 } },
  { id: 'div-mlbb', gameTitle: 'Mobile Legends: Bang Bang', region: 'SEA', accentColor: 'var(--accent-secondary)', _count: { members: 6, matches: 8, playbooks: 2 } },
];

const playerNames = [
  ['FrostByte', 'Aditya Kurniawan', 'STARTING', 'Duelist'],
  ['PhantomX', 'Rizky Mahendra', 'STARTING', 'Controller'],
  ['ZeroCool', 'Yudha Saputra', 'STARTING', 'Initiator'],
  ['Vortex', 'Fajar Ramadhan', 'SUBSTITUTE', 'Sentinel'],
  ['Nova', 'Bima Arya', 'BENCH', 'Flex'],
];

export const mockMembers = [
  { id: 'm-coach', userId: 'u-coach', divisionId: 'div-val', divisionRole: 'HEAD_COACH', rosterStatus: 'BENCH', primaryRole: 'Coach', agentPool: [], user: { id: 'u-coach', ign: 'CoachVex', fullName: 'Dimas Wijaya', email: 'coach@nexus.gg', globalRole: 'HEAD_COACH', isActive: true }, division: { gameTitle: 'Valorant', accentColor: 'var(--accent-primary)' } },
  { id: 'm-mgr', userId: 'u-mgr', divisionId: 'div-val', divisionRole: 'MANAGER', rosterStatus: 'BENCH', primaryRole: 'Manager', agentPool: [], user: { id: 'u-mgr', ign: 'Mira', fullName: 'Sinta Larasati', email: 'manager@nexus.gg', globalRole: 'TEAM_MANAGER', isActive: true }, division: { gameTitle: 'Valorant', accentColor: 'var(--accent-primary)' } },
  ...playerNames.map((p, i) => ({
    id: `m-${i}`, userId: `u-${i}`, divisionId: 'div-val', divisionRole: 'PLAYER', rosterStatus: p[2], primaryRole: p[3],
    agentPool: i === 0 ? ['Jett', 'Raze', 'Neon'] : i === 1 ? ['Omen', 'Viper'] : ['Sova', 'Fade'],
    user: { id: `u-${i}`, ign: p[0], fullName: p[1], email: `player${i}@nexus.gg`, globalRole: 'PLAYER', isActive: true },
    division: { gameTitle: 'Valorant', accentColor: 'var(--accent-primary)' },
  })),
];

const opponents = ['Team Liquid', 'Sentinels', 'PRX', 'Gen.G', 'EDward Gaming'];
const maps = ['Ascent', 'Bind', 'Haven', 'Lotus', 'Split'];
const agents = ['Jett', 'Omen', 'Sova', 'Cypher', 'Raze', 'Fade'];

export const mockMatches = Array.from({ length: 14 }, (_, i) => {
  const isWin = i % 3 !== 0;
  const scoreUs = isWin ? 13 : 9 + (i % 3);
  const scoreThem = isWin ? 8 + (i % 4) : 13;
  return {
    id: `match-${i}`, divisionId: 'div-val', matchType: i % 5 === 0 ? 'OFFICIAL' : 'SCRIM',
    opponentName: opponents[i % 5], mapName: maps[i % 5], patchVersion: i < 6 ? '8.04' : '8.08',
    scoreUs, scoreThem, result: isWin ? 'WIN' : 'LOSS',
    vodUrl: `https://youtube.com/watch?v=demo${i}`, playedAt: D(-(20 - i)),
    division: { gameTitle: 'Valorant' }, _count: { vodNotes: i === 13 ? 1 : 0, actionItems: i === 13 ? 1 : 0 },
    playerStats: playerNames.map((p, k) => ({
      userId: `u-${k}`, user: { id: `u-${k}`, ign: p[0], fullName: p[1] },
      characterPlayed: agents[(i + k) % agents.length],
      kills: 12 + ((i * 3 + k * 2) % 14), deaths: 9 + ((i + k) % 10), assists: 3 + ((i + k * 2) % 9),
      acsOrRating: 180 + ((i * 7 + k * 11) % 130), firstBloods: (i + k) % 4,
      objectiveControl: 45 + ((i * 5 + k * 3) % 45),
      scorecard: { mechanics: 4, communication: 3, mapAwareness: 4, tactics: 3, mentality: 4 },
    })),
  };
});

export const mockPlaybooks = [
  { id: 'pb-1', divisionId: 'div-val', mapName: 'Ascent', scenarioType: 'ATTACK', title: 'A-Site Fast Execute', description: 'Eksekusi cepat A-site dengan smoke dan flash timing.', patchVersion: '8.08', version: 1, isArchived: false, isMatchdayReady: true, updatedAt: D(-1), _count: { readReceipts: 5 }, division: { gameTitle: 'Valorant', accentColor: 'var(--accent-primary)' } },
  { id: 'pb-2', divisionId: 'div-val', mapName: 'Ascent', scenarioType: 'DEFENSE', title: 'A-Main Hold Setup', description: 'Setup pertahanan A-main dengan crossfire.', patchVersion: '8.08', version: 1, isArchived: false, isMatchdayReady: true, updatedAt: D(-2), _count: { readReceipts: 5 }, division: { gameTitle: 'Valorant', accentColor: 'var(--accent-primary)' } },
  { id: 'pb-3', divisionId: 'div-val', mapName: 'Bind', scenarioType: 'ATTACK', title: 'B-Site TP Split', description: 'Split B-site memakai teleporter.', patchVersion: '8.08', version: 1, isArchived: false, isMatchdayReady: true, updatedAt: D(-3), _count: { readReceipts: 5 }, division: { gameTitle: 'Valorant', accentColor: 'var(--accent-primary)' } },
  { id: 'pb-4', divisionId: 'div-val', mapName: 'Haven', scenarioType: 'PISTOL', title: 'Pistol Round Rush C', description: 'Rush C-long dengan utility minimum.', patchVersion: '8.08', version: 1, isArchived: false, isMatchdayReady: false, updatedAt: D(-4), _count: { readReceipts: 5 }, division: { gameTitle: 'Valorant', accentColor: 'var(--accent-primary)' } },
  { id: 'pb-5', divisionId: 'div-val', mapName: 'Lotus', scenarioType: 'ECO', title: 'Eco Retake Setup', description: 'Retake hemat dengan ghost & classic.', patchVersion: '8.04', version: 1, isArchived: false, isMatchdayReady: false, updatedAt: D(-6), _count: { readReceipts: 5 }, division: { gameTitle: 'Valorant', accentColor: 'var(--accent-primary)' } },
];

export const mockReceipts: Record<string, any[]> = {
  'pb-1': playerNames.map((p, i) => ({ id: `r1-${i}`, userId: `u-${i}`, user: { ign: p[0], fullName: p[1] }, status: i < 4 ? 'ACKNOWLEDGED' : 'UNREAD', readDurationSeconds: 180 + i * 20, acknowledgedAt: i < 4 ? D(-1) : null })),
  'pb-2': playerNames.map((p, i) => ({ id: `r2-${i}`, userId: `u-${i}`, user: { ign: p[0], fullName: p[1] }, status: i < 3 ? 'ACKNOWLEDGED' : 'READING', readDurationSeconds: i < 3 ? 200 : 45, acknowledgedAt: i < 3 ? D(-1) : null })),
  'pb-3': playerNames.map((p, i) => ({ id: `r3-${i}`, userId: `u-${i}`, user: { ign: p[0], fullName: p[1] }, status: i < 3 ? 'ACKNOWLEDGED' : 'UNREAD', readDurationSeconds: i < 3 ? 150 : 0, acknowledgedAt: i < 3 ? D(-2) : null })),
  'pb-4': playerNames.map((p, i) => ({ id: `r4-${i}`, userId: `u-${i}`, user: { ign: p[0], fullName: p[1] }, status: 'UNREAD', readDurationSeconds: 0, acknowledgedAt: null })),
  'pb-5': playerNames.map((p, i) => ({ id: `r5-${i}`, userId: `u-${i}`, user: { ign: p[0], fullName: p[1] }, status: i < 2 ? 'ACKNOWLEDGED' : 'UNREAD', readDurationSeconds: i < 2 ? 120 : 0, acknowledgedAt: null })),
};

export const mockSchedules = [
  { id: 'ev-1', divisionId: 'div-val', type: 'PRACTICE', title: 'Team Practice — Aim & Retail', location: 'Nexus Gaming House', startsAt: D(0, 15), endsAt: D(0, 17), timezone: 'Asia/Jakarta', _count: { attendance: 5 } },
  { id: 'ev-2', divisionId: 'div-val', type: 'VOD_REVIEW', title: 'VOD Review vs PRX', location: 'Nexus Gaming House', startsAt: D(0, 19), endsAt: D(0, 21), timezone: 'Asia/Jakarta', _count: { attendance: 5 } },
  { id: 'ev-3', divisionId: 'div-val', type: 'SCRIM', title: 'Scrim Block vs Sentinels', location: 'Online', startsAt: D(1, 18), endsAt: D(1, 21), timezone: 'Asia/Jakarta', _count: { attendance: 4 } },
  { id: 'ev-4', divisionId: 'div-val', type: 'TOURNAMENT', title: 'VCT Challengers — Playoff', location: 'Jakarta Convention Center', startsAt: D(3, 13), endsAt: D(3, 18), timezone: 'Asia/Jakarta', _count: { attendance: 5 } },
  { id: 'ev-5', divisionId: 'div-val', type: 'MEDIA_DAY', title: 'Sponsor Content Shoot', location: 'Nexus Studio', startsAt: D(5, 10), endsAt: D(5, 13), timezone: 'Asia/Jakarta', _count: { attendance: 5 } },
];

export const mockContracts = [
  { id: 'c-1', userId: 'u-0', user: { ign: 'FrostByte', fullName: 'Aditya Kurniawan' }, status: 'ACTIVE', startDate: D(-180), endDate: D(96), baseSalary: '48000000', buyoutClause: '150000000', prizePoolPercentage: 14, daysLeft: 96, clubOption: true },
  { id: 'c-2', userId: 'u-1', user: { ign: 'PhantomX', fullName: 'Rizky Mahendra' }, status: 'ACTIVE', startDate: D(-180), endDate: D(58), baseSalary: '42000000', buyoutClause: '150000000', prizePoolPercentage: 12, daysLeft: 58, clubOption: true },
  { id: 'c-3', userId: 'u-2', user: { ign: 'ZeroCool', fullName: 'Yudha Saputra' }, status: 'ACTIVE', startDate: D(-180), endDate: D(27), baseSalary: '39000000', buyoutClause: '120000000', prizePoolPercentage: 12, daysLeft: 27, clubOption: false },
  { id: 'c-4', userId: 'u-3', user: { ign: 'Vortex', fullName: 'Fajar Ramadhan' }, status: 'TRIAL', startDate: D(-30), endDate: D(14), baseSalary: '18000000', buyoutClause: '-', prizePoolPercentage: 8, daysLeft: 14, clubOption: false },
  { id: 'c-5', userId: 'u-4', user: { ign: 'Nova', fullName: 'Bima Arya' }, status: 'BENCH', startDate: D(-240), endDate: D(-12), baseSalary: '30000000', buyoutClause: '90000000', prizePoolPercentage: 6, daysLeft: -12, clubOption: false },
];

export const mockRecruits = [
  { id: 'rec-1', name: 'Kevin Sanjaya', ign: 'BlazeK', role: 'Duelist', stage: 'SCOUTING', rating: 8.1, source: 'Open Trial', evaluator: { ign: 'CoachVex' } },
  { id: 'rec-2', name: 'Reza Firmansyah', ign: 'ShadowStep', role: 'Controller', stage: 'CONTACTED', rating: 7.9, source: 'Referral', evaluator: { ign: 'CoachVex' } },
  { id: 'rec-3', name: 'Alfarizi', ign: 'Astro', role: 'Initiator', stage: 'TRIAL_SCHEDULED', rating: 8.4, source: 'Open Trial', evaluator: { ign: 'CoachVex' } },
  { id: 'rec-4', name: 'Donald Wijaya', ign: 'Rift', role: 'Sentinel', stage: 'COACH_EVAL', rating: 7.5, source: 'Scouting', evaluator: { ign: 'CoachVex' } },
  { id: 'rec-5', name: 'Jason Lim', ign: 'Meteor', role: 'Flex', stage: 'OFFER', rating: 8.8, source: 'Scouting', evaluator: { ign: 'CoachVex' } },
];

export const mockNotifications = [
  { id: 'n-1', type: 'CONTRACT', title: 'Kontrak akan berakhir', body: 'Kontrak ZeroCool berakhir dalam 27 hari.', isRead: false, createdAt: D(0) },
  { id: 'n-2', type: 'CONTRACT', title: 'Trial berakhir', body: 'Masa trial Vortex berakhir dalam 14 hari.', isRead: false, createdAt: D(-1) },
  { id: 'n-3', type: 'PLAYBOOK', title: 'Playbook belum dibaca', body: '2 pemain belum mengonfirmasi Pistol Round Rush C.', isRead: false, createdAt: D(-1) },
  { id: 'n-4', type: 'ACTION_ITEM', title: 'Action item baru', body: 'Latih timing entry mid — deadline 3 hari.', isRead: true, createdAt: D(-2) },
];

export const mockAudit = [
  { id: 'a-1', actor: { ign: 'CoachVex', globalRole: 'HEAD_COACH' }, actionType: 'PLAYBOOK_OPEN', targetResource: 'A-Site Fast Execute', ipAddress: '10.0.0.12', deviceFingerprint: 'COACH-PC-01', createdAt: D(0) },
  { id: 'a-2', actor: { ign: 'FrostByte', globalRole: 'PLAYER' }, actionType: 'PLAYBOOK_ACK', targetResource: 'B-Site TP Split', ipAddress: '10.0.0.21', deviceFingerprint: 'DEMO-DEVICE-0', createdAt: D(-1) },
  { id: 'a-3', actor: { ign: 'NEXUS_Raka', globalRole: 'ORG_ADMIN' }, actionType: 'ROLE_CHANGE', targetResource: 'user:player5', createdAt: D(-2) },
  { id: 'a-4', actor: { ign: 'Ledger', globalRole: 'FINANCE' }, actionType: 'CONTRACT_VIEW', targetResource: 'contract:player2', createdAt: D(-3) },
  { id: 'a-5', actor: { ign: 'CoachVex', globalRole: 'HEAD_COACH' }, actionType: 'VOD_NOTE_CREATE', targetResource: 'match-13', createdAt: D(-4) },
];

export const mockTrends = Array.from({ length: 14 }, (_, i) => {
  const s = playerNames[i % playerNames.length];
  return {
    date: D(-(20 - i)), patch: i < 6 ? '8.04' : '8.08', map: maps[i % 5], opponent: opponents[i % 5],
    result: i % 3 === 0 ? 'LOSS' : 'WIN', ign: s[0],
    kills: 12 + ((i * 3) % 14), deaths: 9 + (i % 10), assists: 3 + ((i * 2) % 9),
    acs: 180 + ((i * 7) % 130), kd: Number(((12 + ((i * 3) % 14)) / (9 + (i % 10))).toFixed(2)),
    scorecardAvg: Number((3.2 + (i % 4) * 0.3).toFixed(2)),
  };
});

export const mockReadiness = mockPlaybooks.map((p) => {
  const r = mockReceipts[p.id] || [];
  const ack = r.filter((x) => x.status === 'ACKNOWLEDGED').length;
  return { id: p.id, title: p.title, map: p.mapName, matchdayReady: p.isMatchdayReady, total: r.length, ack, rate: r.length ? Math.round((ack / r.length) * 100) : 0 };
});

export const mockAttendance = playerNames.map((p, i) => ({ ign: p[0], total: 8, onTime: 8 - (i === 4 ? 3 : i % 2), late: i === 4 ? 3 : i % 2, rate: Math.round(((8 - (i === 4 ? 3 : i % 2)) / 8) * 100) }));

export const mockOpponents = opponents.map((name, i) => ({
  opponent: name, matches: 3 + i, wins: 1 + (i % 3), winRate: Math.round(((1 + (i % 3)) / (3 + i)) * 100),
  maps: maps.slice(0, 3), lastVod: `https://youtube.com/watch?v=opp${i}`, lastPlayed: D(-(i + 1)), lastPatch: i < 2 ? '8.04' : '8.08',
}));

export const mockWellness = playerNames.flatMap((p, pi) =>
  Array.from({ length: 5 }, (_, d) => ({
    id: `w-${pi}-${d}`, userId: `u-${pi}`, user: { ign: p[0] },
    sleepHours: 6 + ((pi + d) % 3), fatigueLevel: 2 + ((pi + d) % 4),
    mentalReadiness: 3 + ((pi + d) % 3), physicalIssue: pi === 0 && d === 2 ? 'Pergelangan tangan kiri agak nyeri' : null,
    loggedAt: D(-d),
  })),
);

export const mockActions = [
  { id: 'act-1', title: 'Latih timing entry mid', match: { opponentName: 'EDward Gaming' }, creator: { ign: 'CoachVex' }, status: 'OPEN', dueDate: D(3) },
  { id: 'act-2', title: 'Review utility lineup Ascent A', match: { opponentName: 'Team Liquid' }, creator: { ign: 'CoachVex' }, status: 'IN_PROGRESS', dueDate: D(5) },
];

export const mockPatches = [
  { id: 'pt-1', version: '8.08', releaseDate: D(-40), notes: 'Anti-cheat update, economy tuning.' },
  { id: 'pt-2', version: '8.04', releaseDate: D(-80), notes: 'Agent balance pass, map pool rotation.' },
];

export function mockDashboard() {
  return {
    role: 'ORG_ADMIN',
    divisions: mockDivisions,
    summary: { totalMatches: 14, activePlayers: 5, playbooks: 5, unreadNotifications: 3, winRate: 71 },
    focus: {
      attendance: [{ status: 'ON_TIME', _count: 31 }, { status: 'LATE', _count: 6 }, { status: 'EXCUSED', _count: 2 }, { status: 'SICK', _count: 1 }],
      contracts: mockContracts, recruits: mockRecruits.length, winRate: 71,
    },
    widgets: { matches: mockMatches.slice(0, 6), playbooks: mockPlaybooks, events: mockSchedules, notifications: mockNotifications.filter((n) => !n.isRead), patches: mockPatches },
  };
}

export function mockRequest(method: string, path: string, body?: any, _params?: any): any {
  const p = path.split('?')[0];
  const playerResult = handlePlayerRequest(method, p, body);
  if (playerResult !== undefined) return playerResult;
  const table: Record<string, any> = {
    '/core/divisions': mockDivisions,
    '/core/members': mockMembers,
    '/core/users': mockMembers.map((m) => m.user),
    '/schedules': mockSchedules,
    '/attendance': [],
    '/wellness': mockWellness,
    '/matches': mockMatches,
    '/playbooks': mockPlaybooks,
    '/contracts': mockContracts,
    '/contracts/alerts': mockContracts.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 90),
    '/recruits': mockRecruits,
    '/notifications': mockNotifications,
    '/audit-logs': mockAudit,
    '/analytics/dashboard': mockDashboard(),
    '/analytics/trends': mockTrends,
    '/analytics/attendance': mockAttendance,
    '/analytics/readiness': mockReadiness,
    '/opponents': mockOpponents,
    '/actions/me': mockActions,
  };
  if (table[p] !== undefined) return table[p];

  const readiness = p.match(/^\/playbooks\/(pb-\d+)\/readiness$/);
  if (readiness) return { rate: mockReadiness.find((r) => r.id === readiness[1])?.rate || 0, receipts: mockReceipts[readiness[1]] || [], playbook: mockPlaybooks.find((x) => x.id === readiness[1]) };

  const open = p.match(/^\/playbooks\/(pb-\d+)\/open$/);
  if (open) return {
    receipt: { status: 'READING' },
    watermark: { lines: [
      `${demoUser.ign} - ${demoUser.id} - 10.0.0.21 - ${new Date().toISOString()}`,
      `DEVICE: DEMO-DEVICE-0 • ${demoUser.fullName}`,
    ] },
  };

  if (/^\/playbooks\/(pb-\d+)\/ack$/.test(p)) return { status: 'ACKNOWLEDGED', ok: true };
  if (/^\/playbooks\/(pb-\d+)\/nudge$/.test(p)) return { nudged: 2 };

  const detail = p.match(/^\/playbooks\/(pb-\d+)$/);
  if (detail) {
    const pb = mockPlaybooks.find((x) => x.id === detail[1]);
    return { ...pb, canvasData: { markers: [
      { x: 22, y: 68, label: '1', type: 'player', color: 'var(--accent-primary)' },
      { x: 38, y: 55, label: '2', type: 'player', color: 'var(--accent-primary)' },
      { x: 55, y: 60, label: '3', type: 'player', color: 'var(--accent-primary)' },
      { x: 68, y: 45, label: 'S', type: 'smoke', color: 'var(--text-secondary)' },
      { x: 78, y: 30, label: 'F', type: 'flash', color: 'var(--semantic-warn)' },
      { x: 85, y: 18, label: 'X', type: 'enemy', color: 'var(--semantic-loss)' },
    ], paths: [{ from: { x: 22, y: 68 }, to: { x: 78, y: 30 }, color: 'var(--accent-secondary)' }] }, myReceipt: null };
  }

  const matchDetail = p.match(/^\/matches\/(match-\d+)$/);
  if (matchDetail) {
    const m = mockMatches.find((x) => x.id === matchDetail[1]);
    return { ...m, vodNotes: [{ id: 'vn-1', author: { ign: 'CoachVex' }, timestampSeconds: 742, note: 'Rotasi lambat di mid — tekan W sebelum smoke musuh turun.' }], actionItems: mockActions };
  }

  if (method === 'POST' && p === '/finance/prize-pool') {
    const b = body || {};
    const cent = (n: number) => Math.round(n * 100) / 100;
    const gross = Number(b.total) || 0;
    const net = cent(gross * (1 - (Number(b.taxPercent) || 0) / 100));
    const playerPool = cent(net * ((Number(b.players) || 70) / 100));
    const count = Number(b.playerCount) || 5;
    return {
      gross: cent(gross), tax: cent(gross - net), net, playerPool,
      staffPool: cent(net * ((Number(b.staff) || 15) / 100)),
      orgPool: cent(net * ((Number(b.org) || 15) / 100)),
      perPlayer: count ? cent(playerPool / count) : 0,
    };
  }
  return { ok: true };
}

/* ========================================================================== */
/* PLAYER WORKSPACE — demo state & responses                                  */
/* ========================================================================== */

/** Kredensial & identitas demo dibaca dari VITE_ADMIN_* / VITE_PLAYER_* di .env (UI-only). */
const env = import.meta.env;
const ADMIN_EMAIL = env.VITE_ADMIN_USERNAME || env.VITE_DEMO_ADMIN_EMAIL || 'admin@nexus.gg';
const ADMIN_PASSWORD = env.VITE_ADMIN_PASSWORD || env.VITE_DEMO_ADMIN_PASSWORD || 'nexus123';
const MANAGER_EMAIL = env.VITE_DEMO_MANAGER_EMAIL || 'manager@nexus.gg';
const PLAYER_EMAIL = env.VITE_PLAYER_USERNAME || env.VITE_DEMO_PLAYER_EMAIL || 'player@nexus.gg';
const PLAYER_PASSWORD = env.VITE_PLAYER_PASSWORD || env.VITE_DEMO_PLAYER_PASSWORD || 'nexus123';

export const demoAccounts: Record<string, any> = {
  [ADMIN_EMAIL]: { ...demoUser, email: ADMIN_EMAIL },
  'coach@nexus.gg': { ...demoUser, id: 'u-coach', email: 'coach@nexus.gg', fullName: 'Dimas Wijaya', ign: 'CoachVex', globalRole: 'HEAD_COACH' },
  [MANAGER_EMAIL]: { ...demoUser, id: 'u-mgr', email: MANAGER_EMAIL, fullName: 'Sinta Larasati', ign: 'Mira', globalRole: 'TEAM_MANAGER' },
  'analyst@nexus.gg': { ...demoUser, id: 'u-analyst', email: 'analyst@nexus.gg', fullName: 'Bagas Nugroho', ign: 'Spectre', globalRole: 'ANALYST' },
  'finance@nexus.gg': { ...demoUser, id: 'u-finance', email: 'finance@nexus.gg', fullName: 'Nadia Putri', ign: 'Ledger', globalRole: 'FINANCE' },
  [PLAYER_EMAIL]: { ...demoUser, id: 'u-0', email: PLAYER_EMAIL, fullName: 'Aditya Kurniawan', ign: 'FrostByte', globalRole: 'PLAYER' },
};

export function getDemoUser(email: string) {
  return demoAccounts[email.toLowerCase().trim()] || demoUser;
}

export const demoCredentials = {
  admin: { username: ADMIN_EMAIL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  manager: { username: MANAGER_EMAIL, email: MANAGER_EMAIL, password: ADMIN_PASSWORD },
  player: { username: PLAYER_EMAIL, email: PLAYER_EMAIL, password: PLAYER_PASSWORD },
  defaultRole: 'player' as 'admin' | 'player',
};

/** State demo persisten (Zustand + localStorage) — bukan state modul yang reset saat refresh. */
const state = demoState;

function playerContext() {
  return {
    userId: 'u-0', orgId: '00000000-0000-4000-8000-000000000100', divisionId: 'div-val',
    division: { id: 'div-val', gameTitle: 'Valorant', region: 'APAC', accentColor: 'var(--accent-primary)' },
    rosterStatus: 'STARTING', divisionRole: 'PLAYER', primaryRole: 'Duelist', secondaryRole: 'Initiator',
    agentPool: [...state().profile.agentPool], jerseySize: state().profile.jerseySize,
    travelPref: state().profile.travelPref, gameAccountId: 'NEX#PLAYER1',
  };
}

const playerStatusLabel = (s: string) => s === 'ACKNOWLEDGED' ? 'Siap Dieksekusi' : s === 'READING' ? 'Sedang Dipelajari' : 'Belum Dibaca';

function playerPlaybookList() {
  return mockPlaybooks.map((pb) => ({
    id: pb.id, title: pb.title, mapName: pb.mapName, scenarioType: pb.scenarioType,
    patchVersion: pb.patchVersion, version: pb.version, isMatchdayReady: pb.isMatchdayReady,
    updatedAt: pb.updatedAt,
    myStatus: state().receipts[pb.id] || 'UNREAD',
    statusLabel: playerStatusLabel(state().receipts[pb.id] || 'UNREAD'),
    readDurationSeconds: state().durations[pb.id] || 0,
    acknowledgedAt: state().receipts[pb.id] === 'ACKNOWLEDGED' ? D(-1) : null,
  }));
}

function playerHome() {
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = mockSchedules.filter((e) => e.startsAt.slice(0, 10) === today);
  const unread = playerPlaybookList().filter((p) => p.myStatus !== 'ACKNOWLEDGED');
  return {
    context: playerContext(),
    serverTime: new Date().toISOString(), timezone: 'Asia/Jakarta',
    schedule: todayEvents.map((e) => ({ ...e, attendance: { status: 'ON_TIME', lateMinutes: 0 } })),
    unreadPlaybooks: unread,
    actionItems: state().actions.filter((a) => a.status !== 'DONE'),
    wellnessToday: state().wellness.find((w) => w.loggedAt.slice(0, 10) === today) || null,
    notifications: mockNotifications.filter((n) => !n.isRead),
    counts: { schedule: todayEvents.length, unreadPlaybooks: unread.length, openActions: state().actions.filter((a) => a.status !== 'DONE').length, unreadNotifications: 3 },
  };
}

function playerPerformance(mode?: string) {
  const matches = mockMatches.filter((m) => !mode || mode === 'ALL' || m.matchType === mode);
  const trend = matches.map((m) => {
    const s = m.playerStats[0];
    return {
      id: `${m.id}-u0`, date: m.playedAt, patch: m.patchVersion, map: m.mapName, opponent: m.opponentName,
      result: m.result, mode: m.matchType, kills: s.kills, deaths: s.deaths, assists: s.assists,
      acs: s.acsOrRating, kd: Number((s.kills / s.deaths).toFixed(2)),
      firstBloods: s.firstBloods, objectiveControl: s.objectiveControl, scorecardAvg: 4.1,
    };
  });
  const byMode = ['RANKED', 'SCRIM', 'OFFICIAL'].map((mm) => {
    const sub = trend.filter((t) => t.mode === mm);
    return {
      mode: mm, matches: sub.length,
      avgAcs: sub.length ? Math.round(sub.reduce((s, t) => s + t.acs, 0) / sub.length) : 0,
      avgKd: sub.length ? Number((sub.reduce((s, t) => s + t.kd, 0) / sub.length).toFixed(2)) : 0,
      wins: sub.filter((t) => t.result === 'WIN').length,
    };
  });
  return { context: playerContext(), trend, byMode, total: trend.length };
}

function playerScorecards() {
  return mockMatches.slice(-7).map((m, i) => ({
    id: `sc-${i}`, mechanics: 4, communication: 3 + (i % 2), mapAwareness: 4,
    tactics: 3 + ((i + 1) % 2), mentality: 5, average: Number((4 + (i % 2) * 0.2).toFixed(2)),
    date: m.playedAt, opponent: m.opponentName, map: m.mapName, patch: m.patchVersion,
  }));
}

function handlePlayerRequest(method: string, p: string, body?: any): any {
  if (!p.startsWith('/player')) return undefined;

  if (p === '/player/context') return playerContext();
  if (p === '/player/home') return playerHome();
  if (p === '/player/playbooks') return playerPlaybookList();

  const openMatch = p.match(/^\/player\/playbooks\/(pb-\d+)\/open$/);
  if (openMatch && method === 'POST') {
    const id = openMatch[1];
    state().openPlaybook(id);
    return {
      detail: { ...mockPlaybooks.find((x) => x.id === id), canvasData: { markers: [
        { x: 22, y: 68, label: '1', type: 'player', color: 'var(--accent-primary)' },
        { x: 38, y: 55, label: '2', type: 'player', color: 'var(--accent-primary)' },
        { x: 55, y: 60, label: '3', type: 'player', color: 'var(--accent-primary)' },
        { x: 68, y: 45, label: 'S', type: 'smoke', color: 'var(--text-secondary)' },
        { x: 78, y: 30, label: 'F', type: 'flash', color: 'var(--semantic-warn)' },
        { x: 85, y: 18, label: 'X', type: 'enemy', color: 'var(--semantic-loss)' },
      ], paths: [{ from: { x: 22, y: 68 }, to: { x: 78, y: 30 }, color: 'var(--accent-secondary)' }] } },
      receipt: { status: 'READING', deviceFingerprint: 'DEMO-DEVICE-0' },
      watermark: { lines: [
        `${getDemoUser(PLAYER_EMAIL).ign} - u-0 - 10.0.0.21 - ${new Date().toISOString()}`,
        'DEVICE: DEMO-DEVICE-0 • Aditya Kurniawan',
      ] },
    };
  }

  const ackMatch = p.match(/^\/player\/playbooks\/(pb-\d+)\/acknowledge$/);
  if (ackMatch && method === 'POST') {
    state().ackPlaybook(ackMatch[1], Number(body?.seconds) || 0);
    return { status: 'ACKNOWLEDGED', ok: true };
  }

  const detailMatch = p.match(/^\/player\/playbooks\/(pb-\d+)$/);
  if (detailMatch) {
    const pb = mockPlaybooks.find((x) => x.id === detailMatch[1]);
    return { ...pb, canvasData: { markers: [
      { x: 22, y: 68, label: '1', type: 'player', color: 'var(--accent-primary)' },
      { x: 38, y: 55, label: '2', type: 'player', color: 'var(--accent-primary)' },
      { x: 55, y: 60, label: '3', type: 'player', color: 'var(--accent-primary)' },
      { x: 68, y: 45, label: 'S', type: 'smoke', color: 'var(--text-secondary)' },
      { x: 78, y: 30, label: 'F', type: 'flash', color: 'var(--semantic-warn)' },
      { x: 85, y: 18, label: 'X', type: 'enemy', color: 'var(--semantic-loss)' },
    ], paths: [{ from: { x: 22, y: 68 }, to: { x: 78, y: 30 }, color: 'var(--accent-secondary)' }] },
    myStatus: state().receipts[pb!.id] || 'UNREAD', readDurationSeconds: state().durations[pb!.id] || 0 };
  }

  if (p === '/player/performance') return playerPerformance(body?.mode);
  if (p === '/player/scorecards') return playerScorecards();

  if (p === '/player/action-items') {
    return {
      actions: state().actions,
      vodNotes: [
        { id: 'vn-1', matchId: 'match-13', author: { ign: 'CoachVex' }, timestampSeconds: 742, mmss: '12:22', note: 'Rotasi lambat di mid — tekan W sebelum smoke musuh turun.' },
        { id: 'vn-2', matchId: 'match-12', author: { ign: 'Spectre' }, timestampSeconds: 315, mmss: '05:15', note: 'Utility lineup terlambat 2 detik.' },
      ],
    };
  }
  const actionMatch = p.match(/^\/player\/action-items\/(act-\d+)$/);
  if (actionMatch && method === 'PATCH') {
    state().setActionStatus(actionMatch[1], body?.status || 'OPEN');
    return state().actions.find((x) => x.id === actionMatch[1]);
  }

  if (p === '/player/wellness') {
    if (method === 'POST') {
      const entry = { id: `pw-${Date.now()}`, userId: 'u-0', ...body, loggedAt: new Date().toISOString() };
      state().addWellness(entry as any);
      return entry;
    }
    return state().wellness;
  }

  if (p === '/player/schedule') {
    const counts = { ON_TIME: 6, LATE: 2, EXCUSED: 1, SICK: 0, ABSENT: 0 };
    return {
      context: playerContext(),
      events: mockSchedules.map((e) => ({ ...e, attendance: { status: counts.ON_TIME > 0 ? 'ON_TIME' : 'LATE', lateMinutes: 0 } })),
      history: playerNames.slice(0, 1).flatMap(() => mockSchedules.slice(0, 8).map((e, i) => ({
        id: `at-${i}`, status: i === 3 ? 'LATE' : 'ON_TIME', lateMinutes: i === 3 ? 12 : 0,
        event: { title: e.title, startsAt: e.startsAt, type: e.type },
      }))),
      counts, discipline: 88, total: 9,
    };
  }

  if (p === '/player/profile') {
    if (method === 'PATCH') {
      state().updateProfile(body || {});
      return { ok: true, user: { id: 'u-0', ign: state().profile.ign } };
    }
    return {
      ...playerContext(),
      user: { id: 'u-0', email: PLAYER_EMAIL, fullName: 'Aditya Kurniawan', ign: state().profile.ign, phone: '+62 812-3456-7890', country: 'Indonesia', createdAt: D(-400) },
      contract: { id: 'c-1', status: 'ACTIVE', startDate: D(-180), endDate: D(96), clubOption: true, trialEndDate: null, prizePoolPercentage: 14, daysLeft: 96 },
      devices: state().devices,
      financeAccess: false,
    };
  }

  if (p === '/player/devices' && method === 'POST') {
    const device = { id: `dev-${Date.now()}`, label: body?.label || 'Perangkat baru', fingerprint: body?.fingerprint || 'DEMO-DEVICE-2', lastSeenAt: new Date().toISOString(), revokedAt: null, createdAt: new Date().toISOString() };
    state().registerDevice(device);
    return device;
  }
  const deviceMatch = p.match(/^\/player\/devices\/(dev-\d+)$/);
  if (deviceMatch && method === 'DELETE') {
    state().revokeDevice(deviceMatch[1]);
    return state().devices.find((x) => x.id === deviceMatch[1]);
  }

  return { ok: true };
}
