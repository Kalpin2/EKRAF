import { PrismaClient, GlobalRole, DivisionRole, RosterStatus, MatchType, MatchResult, ScenarioType, ContractStatus, ScheduleType, AttendanceStatus, ReadStatus, RecruitStage, ActionStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
// Kredensial demo diambil dari .env (lihat .env.example).
const PASSWORD = process.env.DEMO_PASSWORD || 'nexus123';
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@nexus.gg';
const MANAGER_EMAIL = process.env.DEMO_MANAGER_EMAIL || 'manager@nexus.gg';
const PLAYER_EMAIL = process.env.DEMO_PLAYER_EMAIL || 'player@nexus.gg';

async function main() {
  console.log('Seeding NexusEsports OS...');
  const hash = await bcrypt.hash(PASSWORD, 10);

  const org = await prisma.organization.upsert({
    where: { slug: 'nexus-esports' },
    update: {},
    create: { name: 'Nexus Esports', slug: 'nexus-esports', tier: 'PRO' },
  });

  const valorant = await prisma.division.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: { id: '00000000-0000-4000-8000-000000000001', orgId: org.id, gameTitle: 'Valorant', region: 'APAC', accentColor: '#6B8E78' },
  });
  const mlbb = await prisma.division.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: { id: '00000000-0000-4000-8000-000000000002', orgId: org.id, gameTitle: 'Mobile Legends: Bang Bang', region: 'SEA', accentColor: '#B8A48A' },
  });

  const userSeeds = [
    { key: 'admin', email: ADMIN_EMAIL, fullName: 'Raka Pratama', ign: 'NEXUS_Raka', role: GlobalRole.ORG_ADMIN, ignRole: 'Duelist' },
    { key: 'coach', email: 'coach@nexus.gg', fullName: 'Dimas Wijaya', ign: 'CoachVex', role: GlobalRole.HEAD_COACH, ignRole: 'Controller' },
    { key: 'manager', email: MANAGER_EMAIL, fullName: 'Sinta Larasati', ign: 'Mira', role: GlobalRole.TEAM_MANAGER, ignRole: 'Initiator' },
    { key: 'analyst', email: 'analyst@nexus.gg', fullName: 'Bagas Nugroho', ign: 'Spectre', role: GlobalRole.ANALYST, ignRole: 'Sentinel' },
    { key: 'finance', email: 'finance@nexus.gg', fullName: 'Nadia Putri', ign: 'Ledger', role: GlobalRole.FINANCE, ignRole: 'Support' },
    { key: 'player1', email: PLAYER_EMAIL, fullName: 'Aditya Kurniawan', ign: 'FrostByte', role: GlobalRole.PLAYER, ignRole: 'Duelist' },
    { key: 'player2', email: 'player2@nexus.gg', fullName: 'Rizky Mahendra', ign: 'PhantomX', role: GlobalRole.PLAYER, ignRole: 'Controller' },
    { key: 'player3', email: 'player3@nexus.gg', fullName: 'Yudha Saputra', ign: 'ZeroCool', role: GlobalRole.PLAYER, ignRole: 'Initiator' },
    { key: 'player4', email: 'player4@nexus.gg', fullName: 'Fajar Ramadhan', ign: 'Vortex', role: GlobalRole.PLAYER, ignRole: 'Sentinel' },
    { key: 'player5', email: 'player5@nexus.gg', fullName: 'Bima Arya', ign: 'Nova', role: GlobalRole.PLAYER, ignRole: 'Flex' },
  ] as const;

  const users: Record<string, { id: string }> = {};
  for (const u of userSeeds) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: { globalRole: u.role, fullName: u.fullName, isActive: true },
      create: {
        orgId: org.id, email: u.email, passwordHash: hash, fullName: u.fullName,
        ign: u.ign, globalRole: u.role, country: 'Indonesia', isActive: true,
      },
    });
    users[u.key] = row;
  }

  const memberSeeds: Array<{ key: string; divisionId: string; divisionRole: DivisionRole; roster: RosterStatus; primary: string; agentPool: string[] }> = [
    { key: 'admin', divisionId: valorant.id, divisionRole: DivisionRole.MANAGER, roster: RosterStatus.BENCH, primary: 'Owner', agentPool: [] },
    { key: 'coach', divisionId: valorant.id, divisionRole: DivisionRole.HEAD_COACH, roster: RosterStatus.BENCH, primary: 'Coach', agentPool: [] },
    { key: 'manager', divisionId: valorant.id, divisionRole: DivisionRole.MANAGER, roster: RosterStatus.BENCH, primary: 'Manager', agentPool: [] },
    { key: 'analyst', divisionId: valorant.id, divisionRole: DivisionRole.ANALYST, roster: RosterStatus.BENCH, primary: 'Analyst', agentPool: [] },
    { key: 'player1', divisionId: valorant.id, divisionRole: DivisionRole.PLAYER, roster: RosterStatus.STARTING, primary: 'Duelist', agentPool: ['Jett', 'Raze', 'Neon'] },
    { key: 'player2', divisionId: valorant.id, divisionRole: DivisionRole.PLAYER, roster: RosterStatus.STARTING, primary: 'Controller', agentPool: ['Omen', 'Viper', 'Astra'] },
    { key: 'player3', divisionId: valorant.id, divisionRole: DivisionRole.PLAYER, roster: RosterStatus.STARTING, primary: 'Initiator', agentPool: ['Sova', 'Fade', 'Breach'] },
    { key: 'player4', divisionId: valorant.id, divisionRole: DivisionRole.PLAYER, roster: RosterStatus.SUBSTITUTE, primary: 'Sentinel', agentPool: ['Cypher', 'Killjoy'] },
    { key: 'player5', divisionId: valorant.id, divisionRole: DivisionRole.PLAYER, roster: RosterStatus.BENCH, primary: 'Flex', agentPool: ['Chamber', 'Skye'] },
  ];

  for (const m of memberSeeds) {
    await prisma.divisionMember.upsert({
      where: { userId_divisionId: { userId: users[m.key].id, divisionId: m.divisionId } },
      update: { rosterStatus: m.roster, divisionRole: m.divisionRole },
      create: {
        userId: users[m.key].id, divisionId: m.divisionId, divisionRole: m.divisionRole,
        rosterStatus: m.roster, primaryRole: m.primary, agentPool: m.agentPool,
        jerseySize: 'L', gameAccountId: `NEX#${m.key.toUpperCase()}`,
      },
    });
  }

  await prisma.gamePatch.upsert({
    where: { id: '00000000-0000-4000-8000-000000000011' },
    update: {},
    create: { id: '00000000-0000-4000-8000-000000000011', divisionId: valorant.id, version: '8.04', releaseDate: new Date('2026-01-14'), notes: 'Agent balance pass, map pool rotation.' },
  });
  await prisma.gamePatch.upsert({
    where: { id: '00000000-0000-4000-8000-000000000012' },
    update: {},
    create: { id: '00000000-0000-4000-8000-000000000012', divisionId: valorant.id, version: '8.08', releaseDate: new Date('2026-02-18'), notes: 'Anti-cheat update, economy tuning.' },
  });

  const playerKeys = ['player1', 'player2', 'player3', 'player4', 'player5'];
  const opponents = ['Team Liquid', 'Sentinels', 'PRX', 'Gen.G', 'EDward Gaming'];
  const maps = ['Ascent', 'Bind', 'Haven', 'Lotus', 'Split'];
  const agents = ['Jett', 'Omen', 'Sova', 'Cypher', 'Raze', 'Fade', 'Viper', 'Killjoy'];

  for (let i = 0; i < 14; i++) {
    const date = new Date(Date.now() - (20 - i) * 86_400_000);
    const isWin = i % 3 !== 0;
    const scoreUs = isWin ? 13 : 9 + (i % 3);
    const scoreThem = isWin ? 8 + (i % 4) : 13;
    const match = await prisma.match.create({
      data: {
        divisionId: valorant.id,
        matchType: i % 5 === 0 ? MatchType.OFFICIAL : MatchType.SCRIM,
        opponentName: opponents[i % opponents.length],
        mapName: maps[i % maps.length],
        patchVersion: i < 6 ? '8.04' : '8.08',
        scoreUs, scoreThem,
        result: isWin ? MatchResult.WIN : MatchResult.LOSS,
        vodUrl: `https://www.youtube.com/watch?v=demo${i}`,
        playedAt: date,
        notes: `Scrim block #${i + 1} — focus on mid control.`,
      },
    });
    for (let p = 0; p < playerKeys.length; p++) {
      const kills = 12 + ((i * 3 + p * 2) % 14);
      const deaths = 9 + ((i + p) % 10);
      await prisma.playerMatchStat.create({
        data: {
          matchId: match.id, userId: users[playerKeys[p]].id,
          characterPlayed: agents[(i + p) % agents.length],
          kills, deaths, assists: 3 + ((i + p * 2) % 9),
          acsOrRating: 180 + ((i * 7 + p * 11) % 130),
          firstBloods: (i + p) % 4,
          objectiveControl: 45 + ((i * 5 + p * 3) % 45),
          scorecard: { mechanics: 3 + ((i + p) % 3), communication: 3 + ((i + p + 1) % 3), mapAwareness: 3 + ((i + p + 2) % 3), tactics: 3 + ((i + p) % 4), mentality: 4 },
        },
      });
    }
    if (i === 13) {
      await prisma.vodNote.create({
        data: { matchId: match.id, authorId: users.coach.id, timestampSeconds: 742, note: 'Rotasi lambat di mid — tekan W sebelum smoke musuh turun.' },
      });
      await prisma.actionItem.create({
        data: { matchId: match.id, assigneeId: users.player1.id, creatorId: users.coach.id, title: 'Latih timing entry mid', description: 'Review VOD menit 12:22 dan ulangi 20x di scrim berikutnya.', dueDate: new Date(Date.now() + 3 * 86_400_000), status: ActionStatus.OPEN },
      });
    }
  }

  const playbookTitles = [
    { map: 'Ascent', scenario: ScenarioType.ATTACK, title: 'A-Site Fast Execute', ready: true },
    { map: 'Ascent', scenario: ScenarioType.DEFENSE, title: 'A-Main Hold Setup', ready: true },
    { map: 'Bind', scenario: ScenarioType.ATTACK, title: 'B-Site TP Split', ready: true },
    { map: 'Haven', scenario: ScenarioType.PISTOL, title: 'Pistol Round Rush C', ready: false },
    { map: 'Lotus', scenario: ScenarioType.ECO, title: 'Eco Retake Setup', ready: false },
  ];
  for (let i = 0; i < playbookTitles.length; i++) {
    const p = playbookTitles[i];
    const pb = await prisma.playbook.create({
      data: {
        divisionId: valorant.id, mapName: p.map, scenarioType: p.scenario, title: p.title,
        description: 'Strategi taktis tim — jangan dibagikan ke pihak eksternal.',
        patchVersion: '8.08', version: 1, isMatchdayReady: p.ready, createdBy: users.coach.id,
        canvasData: {
          markers: [
            { x: 22, y: 68, label: '1', type: 'player', color: '#6B8E78' },
            { x: 38, y: 55, label: '2', type: 'player', color: '#6B8E78' },
            { x: 55, y: 60, label: '3', type: 'player', color: '#6B8E78' },
            { x: 70, y: 42, label: 'S', type: 'smoke', color: '#9CA19B' },
            { x: 78, y: 30, label: 'F', type: 'flash', color: '#C4934B' },
          ],
          paths: [{ from: { x: 22, y: 68 }, to: { x: 70, y: 42 }, color: '#B8A48A' }],
        },
      },
    });
    for (let k = 0; k < playerKeys.length; k++) {
      const acknowledged = k < 3 && i < 3;
      await prisma.playbookReadReceipt.create({
        data: {
          playbookId: pb.id, userId: users[playerKeys[k]].id,
          status: acknowledged ? ReadStatus.ACKNOWLEDGED : (k === 3 ? ReadStatus.READING : ReadStatus.UNREAD),
          readDurationSeconds: acknowledged ? 180 + k * 20 : (k === 3 ? 45 : 0),
          deviceFingerprint: `DEMO-DEVICE-${k}`,
          openedAt: acknowledged ? new Date(Date.now() - 2 * 86_400_000) : null,
          acknowledgedAt: acknowledged ? new Date(Date.now() - 2 * 86_400_000) : null,
        },
      });
    }
  }

  const events: Array<{ type: ScheduleType; title: string; dayOffset: number; hour: number }> = [
    { type: ScheduleType.PRACTICE, title: 'Team Practice — Aim & Retail', dayOffset: 0, hour: 15 },
    { type: ScheduleType.VOD_REVIEW, title: 'VOD Review vs PRX', dayOffset: 0, hour: 19 },
    { type: ScheduleType.SCRIM, title: 'Scrim Block vs Sentinels', dayOffset: 1, hour: 18 },
    { type: ScheduleType.TOURNAMENT, title: 'VCT Challengers — Playoff', dayOffset: 3, hour: 13 },
    { type: ScheduleType.MEDIA_DAY, title: 'Sponsor Content Shoot', dayOffset: 5, hour: 10 },
  ];
  for (const e of events) {
    const start = new Date(Date.now() + e.dayOffset * 86_400_000);
    start.setHours(e.hour, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 3_600_000);
    const event = await prisma.scheduleEvent.create({
      data: { divisionId: valorant.id, type: e.type, title: e.title, location: e.type === 'TOURNAMENT' ? 'Jakarta Convention Center' : 'Nexus Gaming House', startsAt: start, endsAt: end, createdBy: users.manager.id },
    });
    for (let k = 0; k < playerKeys.length; k++) {
      await prisma.attendance.create({
        data: { eventId: event.id, userId: users[playerKeys[k]].id, status: k === 4 ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME, lateMinutes: k === 4 ? 12 : 0 },
      });
    }
  }

  for (let k = 0; k < playerKeys.length; k++) {
    for (let d = 0; d < 5; d++) {
      await prisma.wellnessLog.create({
        data: {
          userId: users[playerKeys[k]].id,
          sleepHours: 6 + ((k + d) % 3),
          fatigueLevel: 2 + ((k + d) % 4),
          mentalReadiness: 3 + ((k + d) % 3),
          physicalIssue: k === 0 && d === 2 ? 'Pergelangan tangan kiri agak nyeri' : null,
          loggedAt: new Date(Date.now() - d * 86_400_000),
        },
      });
    }
  }

  const contractData = [
    { key: 'player1', status: ContractStatus.ACTIVE, endDays: 96, salary: '48000000' },
    { key: 'player2', status: ContractStatus.ACTIVE, endDays: 58, salary: '42000000' },
    { key: 'player3', status: ContractStatus.ACTIVE, endDays: 27, salary: '39000000' },
    { key: 'player4', status: ContractStatus.TRIAL, endDays: 14, salary: '18000000' },
    { key: 'player5', status: ContractStatus.BENCH, endDays: -12, salary: '30000000' },
  ];
  for (const c of contractData) {
    await prisma.contract.create({
      data: {
        userId: users[c.key].id, status: c.status,
        startDate: new Date(Date.now() - 180 * 86_400_000),
        endDate: new Date(Date.now() + c.endDays * 86_400_000),
        baseSalaryEncrypted: `enc:${c.salary}`, buyoutClauseEncrypted: 'enc:150000000',
        prizePoolPercentage: c.key === 'player1' ? 14 : 12,
        clubOption: true, trialEndDate: c.status === ContractStatus.TRIAL ? new Date(Date.now() + 14 * 86_400_000) : null,
      },
    });
  }

  const recruitSeeds = [
    { name: 'Kevin Sanjaya', ign: 'BlazeK', role: 'Duelist', stage: RecruitStage.SCOUTING, rating: 8.1 },
    { name: 'Reza Firmansyah', ign: 'ShadowStep', role: 'Controller', stage: RecruitStage.CONTACTED, rating: 7.9 },
    { name: 'Alfarizi', ign: 'Astro', role: 'Initiator', stage: RecruitStage.TRIAL_SCHEDULED, rating: 8.4 },
    { name: 'Donald Wijaya', ign: 'Rift', role: 'Sentinel', stage: RecruitStage.COACH_EVAL, rating: 7.5 },
    { name: 'Jason Lim', ign: 'Meteor', role: 'Flex', stage: RecruitStage.OFFER, rating: 8.8 },
  ];
  for (const r of recruitSeeds) {
    await prisma.recruitCandidate.create({
      data: { divisionId: valorant.id, name: r.name, ign: r.ign, role: r.role, stage: r.stage, rating: r.rating, source: 'Open Trial', evaluatorId: users.coach.id, notes: 'Potensi tinggi, perlu evaluasi komunikasi.' },
    });
  }

  await prisma.notification.createMany({
    data: [
      { orgId: org.id, userId: users.admin.id, type: NotificationType.CONTRACT, title: 'Kontrak akan berakhir', body: 'Kontrak ZeroCool berakhir dalam 27 hari.' },
      { orgId: org.id, userId: users.admin.id, type: NotificationType.CONTRACT, title: 'Trial berakhir', body: 'Masa trial Vortex berakhir dalam 14 hari.' },
      { orgId: org.id, userId: users.coach.id, type: NotificationType.PLAYBOOK, title: 'Playbook belum dibaca', body: '2 pemain belum mengonfirmasi Pistol Round Rush C.' },
      { orgId: org.id, userId: users.player1.id, type: NotificationType.ACTION_ITEM, title: 'Action item baru', body: 'Latih timing entry mid — deadline 3 hari.' },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { orgId: org.id, actorUserId: users.coach.id, actionType: 'PLAYBOOK_OPEN', targetResource: 'A-Site Fast Execute', ipAddress: '10.0.0.12', deviceFingerprint: 'COACH-PC-01' },
      { orgId: org.id, actorUserId: users.player1.id, actionType: 'PLAYBOOK_ACK', targetResource: 'B-Site TP Split', ipAddress: '10.0.0.21', deviceFingerprint: 'DEMO-DEVICE-0' },
      { orgId: org.id, actorUserId: users.admin.id, actionType: 'ROLE_CHANGE', targetResource: 'user:player5', metadata: { from: 'PLAYER', to: 'PLAYER' } },
      { orgId: org.id, actorUserId: users.finance.id, actionType: 'CONTRACT_VIEW', targetResource: 'contract:player2' },
    ],
  });

  console.log(`Seed selesai. Login: ${ADMIN_EMAIL} / ${PASSWORD} (lihat .env untuk akun lain).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
