import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Injectable,
  Module, NotFoundException, Param, Patch, Post, Query, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { deviceFingerprint } from '../../common/crypto.util';
import { CurrentUser } from '../../auth/decorators';
import { GlobalRole, ReadStatus } from '@nexus/shared';

const DAY = 86_400_000;

function scorecardAverage(raw: any): number {
  if (!raw || typeof raw !== 'object') return 0;
  const values = Object.values(raw).filter((v): v is number => typeof v === 'number');
  return values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0;
}

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  /** Satu-satunya pintu isolasi: semua data diambil dari divisi pemain + identitasnya sendiri. */
  async context(user: any) {
    if (user.globalRole !== GlobalRole.PLAYER) {
      throw new ForbiddenException('Endpoint ini khusus untuk role Player.');
    }
    const member = await this.prisma.divisionMember.findFirst({
      where: { userId: user.id, division: { orgId: user.orgId }, divisionRole: 'PLAYER' },
      include: { division: { select: { id: true, gameTitle: true, region: true, accentColor: true } } },
    });
    if (!member) throw new ForbiddenException('Pemain tidak terdaftar pada divisi aktif.');
    return {
      userId: user.id,
      orgId: user.orgId,
      divisionId: member.divisionId,
      division: member.division,
      rosterStatus: member.rosterStatus,
      divisionRole: member.divisionRole,
      primaryRole: member.primaryRole,
      secondaryRole: member.secondaryRole,
      agentPool: (member.agentPool as any[]) || [],
      jerseySize: member.jerseySize,
      travelPref: member.travelPref,
      gameAccountId: member.gameAccountId,
    };
  }

  async home(user: any, timezone: string) {
    const ctx = await this.context(user);
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + DAY);

    const [events, receipts, actions, wellnessToday, notifications] = await Promise.all([
      this.prisma.scheduleEvent.findMany({
        where: {
          divisionId: ctx.divisionId,
          startsAt: { gte: new Date(dayStart.getTime() - 3 * 3_600_000), lt: dayEnd },
        },
        include: { attendance: { where: { userId: user.id } } },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.playbookReadReceipt.findMany({
        where: { userId: user.id, status: { not: ReadStatus.ACKNOWLEDGED }, playbook: { divisionId: ctx.divisionId, isArchived: false } },
        include: { playbook: { select: { id: true, title: true, mapName: true, scenarioType: true, isMatchdayReady: true, patchVersion: true } } },
        orderBy: { playbook: { updatedAt: 'desc' } },
      }),
      this.prisma.actionItem.findMany({
        where: { assigneeId: user.id, status: { not: 'DONE' } },
        include: { match: { select: { id: true, opponentName: true, playedAt: true, vodUrl: true, mapName: true } }, creator: { select: { ign: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.wellnessLog.findFirst({ where: { userId: user.id, loggedAt: { gte: dayStart, lt: dayEnd } }, orderBy: { loggedAt: 'desc' } }),
      this.prisma.notification.findMany({ where: { userId: user.id, orgId: user.orgId, isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return {
      context: ctx,
      serverTime: new Date().toISOString(),
      timezone,
      schedule: events.map((e) => ({
        id: e.id, title: e.title, type: e.type, location: e.location,
        startsAt: e.startsAt, endsAt: e.endsAt,
        attendance: e.attendance[0] || null,
      })),
      unreadPlaybooks: receipts.map((r) => ({ ...r.playbook, status: r.status, playbookId: r.playbook.id })),
      actionItems: actions,
      wellnessToday,
      notifications,
      counts: {
        schedule: events.length,
        unreadPlaybooks: receipts.length,
        openActions: actions.length,
        unreadNotifications: notifications.length,
      },
    };
  }

  async playbooks(user: any, map?: string, scenario?: string) {
    const ctx = await this.context(user);
    const rows = await this.prisma.playbook.findMany({
      where: {
        divisionId: ctx.divisionId, isArchived: false,
        mapName: map || undefined,
        scenarioType: (scenario as any) || undefined,
      },
      include: { readReceipts: { where: { userId: user.id } } },
      orderBy: [{ isMatchdayReady: 'desc' }, { updatedAt: 'desc' }],
    });
    return rows.map((p) => {
      const receipt = p.readReceipts[0];
      return {
        id: p.id, title: p.title, mapName: p.mapName, scenarioType: p.scenarioType,
        patchVersion: p.patchVersion, version: p.version, isMatchdayReady: p.isMatchdayReady,
        updatedAt: p.updatedAt,
        myStatus: receipt?.status || ReadStatus.UNREAD,
        readDurationSeconds: receipt?.readDurationSeconds || 0,
        acknowledgedAt: receipt?.acknowledgedAt || null,
      };
    });
  }

  async playbookDetail(user: any, id: string) {
    const ctx = await this.context(user);
    const playbook = await this.prisma.playbook.findFirst({
      where: { id, divisionId: ctx.divisionId, isArchived: false },
      include: { readReceipts: { where: { userId: user.id } } },
    });
    if (!playbook) throw new NotFoundException('Playbook tidak ditemukan di divisi Anda.');
    const receipt = playbook.readReceipts[0];
    return {
      id: playbook.id, title: playbook.title, mapName: playbook.mapName,
      scenarioType: playbook.scenarioType, description: playbook.description,
      patchVersion: playbook.patchVersion, version: playbook.version,
      isMatchdayReady: playbook.isMatchdayReady, canvasData: playbook.canvasData,
      myStatus: receipt?.status || ReadStatus.UNREAD,
      readDurationSeconds: receipt?.readDurationSeconds || 0,
      acknowledgedAt: receipt?.acknowledgedAt || null,
    };
  }

  /** Membuka playbook: verifikasi device binding + tulis audit + watermark identity. */
  async openPlaybook(user: any, id: string, req: Request) {
    const detail = await this.playbookDetail(user, id);
    const derived = deviceFingerprint(req);
    const presented = (req.headers['x-device-id'] as string) || derived;

    const devices = await this.prisma.userDevice.findMany({
      where: { userId: user.id, orgId: user.orgId, revokedAt: null },
      select: { fingerprint: true },
    });
    if (devices.length && !devices.some((d) => d.fingerprint === presented)) {
      throw new ForbiddenException('Perangkat belum terdaftar. Daftarkan perangkat di halaman Profil.');
    }

    await this.prisma.userDevice.upsert({
      where: { userId_fingerprint: { userId: user.id, fingerprint: presented } },
      update: { lastSeenAt: new Date(), revokedAt: null },
      create: { userId: user.id, orgId: user.orgId, fingerprint: presented, label: `${req.headers['user-agent'] || 'Perangkat'}`.slice(0, 90) },
    });

    await this.prisma.playbookReadReceipt.upsert({
      where: { playbookId_userId: { playbookId: id, userId: user.id } },
      update: { status: ReadStatus.READING, openedAt: new Date(), deviceFingerprint: presented },
      create: { playbookId: id, userId: user.id, status: ReadStatus.READING, openedAt: new Date(), deviceFingerprint: presented },
    });

    await this.audit.log({
      orgId: user.orgId, actorUserId: user.id, actionType: 'PLAYBOOK_OPEN', targetResource: id,
      ipAddress: req.ip, deviceFingerprint: presented,
      metadata: { ign: user.ign, fullName: user.fullName, at: new Date().toISOString() },
    });

    return {
      detail,
      receipt: { status: ReadStatus.READING, deviceFingerprint: presented },
      watermark: {
        lines: [
          `${user.ign} - ${user.id} - ${req.ip} - ${new Date().toISOString()}`,
          `DEVICE: ${presented} • ${user.fullName}`,
        ],
      },
    };
  }

  async acknowledge(user: any, id: string, seconds: number) {
    const ctx = await this.context(user);
    const receipt = await this.prisma.playbookReadReceipt.findUnique({
      where: { playbookId_userId: { playbookId: id, userId: user.id } },
    });
    if (!receipt) throw new BadRequestException('Buka playbook terlebih dahulu sebelum mengonfirmasi.');
    const playbook = await this.prisma.playbook.findFirst({ where: { id, divisionId: ctx.divisionId } });
    if (!playbook) throw new NotFoundException();

    const updated = await this.prisma.playbookReadReceipt.update({
      where: { id: receipt.id },
      data: {
        status: ReadStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        readDurationSeconds: Math.max(0, Math.floor(seconds || 0)),
      },
    });
    await this.audit.log({ orgId: user.orgId, actorUserId: user.id, actionType: 'PLAYBOOK_ACK', targetResource: id, metadata: { seconds } });
    return updated;
  }

  async performance(user: any, mode?: string) {
    const ctx = await this.context(user);
    const rows = await this.prisma.playerMatchStat.findMany({
      where: {
        userId: user.id,
        match: { divisionId: ctx.divisionId, matchType: (mode as any) || undefined },
      },
      include: { match: { select: { playedAt: true, patchVersion: true, mapName: true, opponentName: true, result: true, matchType: true, vodUrl: true } } },
      orderBy: { match: { playedAt: 'asc' } }, take: 200,
    });

    const trend = rows.map((r) => ({
      id: r.id, date: r.match.playedAt, patch: r.match.patchVersion, map: r.match.mapName,
      opponent: r.match.opponentName, result: r.match.result, mode: r.match.matchType,
      kills: r.kills, deaths: r.deaths, assists: r.assists, acs: r.acsOrRating,
      kd: r.deaths ? Number((r.kills / r.deaths).toFixed(2)) : r.kills,
      firstBloods: r.firstBloods, objectiveControl: r.objectiveControl,
      scorecardAvg: scorecardAverage(r.scorecard),
    }));

    const byMode = ['RANKED', 'SCRIM', 'OFFICIAL'].map((m) => {
      const subset = trend.filter((t) => t.mode === m);
      const n = subset.length || 1;
      return {
        mode: m, matches: subset.length,
        avgAcs: subset.length ? Math.round(subset.reduce((s, t) => s + t.acs, 0) / n) : 0,
        avgKd: subset.length ? Number((subset.reduce((s, t) => s + t.kd, 0) / n).toFixed(2)) : 0,
        wins: subset.filter((t) => t.result === 'WIN').length,
      };
    });

    return { context: ctx, trend, byMode, total: trend.length };
  }

  async scorecards(user: any) {
    const ctx = await this.context(user);
    const rows = await this.prisma.playerMatchStat.findMany({
      where: { userId: user.id, match: { divisionId: ctx.divisionId }, scorecard: { not: null } },
      include: { match: { select: { playedAt: true, opponentName: true, mapName: true, patchVersion: true } } },
      orderBy: { match: { playedAt: 'desc' } },
    });
    return rows.map((r) => {
      const sc = (r.scorecard || {}) as any;
      return {
        id: r.id, ...sc, average: scorecardAverage(sc),
        date: r.match.playedAt, opponent: r.match.opponentName,
        map: r.match.mapName, patch: r.match.patchVersion,
      };
    });
  }

  async actionItems(user: any) {
    await this.context(user);
    const actions = await this.prisma.actionItem.findMany({
      where: { assigneeId: user.id },
      include: {
        match: { select: { id: true, opponentName: true, playedAt: true, vodUrl: true, mapName: true } },
        creator: { select: { ign: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });
    const matchIds = [...new Set(actions.map((a) => a.matchId))];
    const notes = await this.prisma.vodNote.findMany({
      where: { matchId: { in: matchIds } },
      include: { author: { select: { ign: true } } },
      orderBy: { timestampSeconds: 'asc' },
    });
    return {
      actions,
      vodNotes: notes.map((n) => ({ ...n, mmss: `${String(Math.floor(n.timestampSeconds / 60)).padStart(2, '0')}:${String(n.timestampSeconds % 60).padStart(2, '0')}` })),
    };
  }

  async updateActionItem(user: any, id: string, status: string) {
    await this.context(user);
    const allowed = ['OPEN', 'IN_PROGRESS', 'DONE'];
    if (!allowed.includes(status)) throw new BadRequestException('Status tidak valid.');
    const action = await this.prisma.actionItem.findFirst({ where: { id, assigneeId: user.id } });
    if (!action) throw new NotFoundException('Action item bukan milik Anda.');
    const updated = await this.prisma.actionItem.update({ where: { id }, data: { status: status as any } });
    await this.audit.log({ orgId: user.orgId, actorUserId: user.id, actionType: 'ACTION_STATUS', targetResource: id, metadata: { status } });
    return updated;
  }

  async wellness(user: any, days: number) {
    await this.context(user);
    const since = new Date(Date.now() - days * DAY);
    return this.prisma.wellnessLog.findMany({
      where: { userId: user.id, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'asc' },
    });
  }

  async createWellness(user: any, body: any) {
    await this.context(user);
    const fatigue = Number(body.fatigueLevel);
    const mental = Number(body.mentalReadiness);
    const sleep = Number(body.sleepHours);
    if ([fatigue, mental, sleep].some((n) => !Number.isFinite(n) || n < 1 || n > 10)) {
      throw new BadRequestException('Nilai tidur, kelelahan, dan mental harus berkisar 1–10.');
    }
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + DAY);
    const existing = await this.prisma.wellnessLog.findFirst({ where: { userId: user.id, loggedAt: { gte: start, lt: end } } });
    const data: any = {
      sleepHours: sleep, fatigueLevel: fatigue, mentalReadiness: mental,
      physicalIssue: body.physicalIssue || null, note: body.note || null,
    };
    if (existing) {
      return this.prisma.wellnessLog.update({ where: { id: existing.id }, data: { ...data, loggedAt: new Date() } });
    }
    return this.prisma.wellnessLog.create({ data: { userId: user.id, ...data } });
  }

  async schedule(user: any, view: string) {
    const ctx = await this.context(user);
    const now = new Date();
    const from = new Date(now);
    const to = new Date(now);
    if (view === 'week') {
      const day = now.getDay();
      from.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      to.setDate(from.getDate() + 7);
      from.setHours(0, 0, 0, 0); to.setHours(0, 0, 0, 0);
    } else {
      from.setHours(0, 0, 0, 0); to.setDate(to.getDate() + 1); to.setHours(0, 0, 0, 0);
    }
    const events = await this.prisma.scheduleEvent.findMany({
      where: { divisionId: ctx.divisionId, startsAt: { gte: from, lt: to } },
      include: { attendance: { where: { userId: user.id } } },
      orderBy: { startsAt: 'asc' },
    });
    const history = await this.prisma.attendance.findMany({
      where: { userId: user.id, event: { divisionId: ctx.divisionId } },
      include: { event: { select: { title: true, startsAt: true, type: true } } },
      orderBy: { recordedAt: 'desc' }, take: 50,
    });
    const counts: Record<string, number> = { ON_TIME: 0, LATE: 0, EXCUSED: 0, SICK: 0, ABSENT: 0 };
    history.forEach((h) => { counts[h.status] = (counts[h.status] || 0) + 1; });
    const total = history.length;
    const discipline = total ? Math.max(0, Math.round(((counts.ON_TIME + 0.5 * counts.LATE) / total) * 100)) : 0;

    return { context: ctx, events, history, counts, discipline, total };
  }

  async profile(user: any) {
    const ctx = await this.context(user);
    const [record, contract, devices] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, fullName: true, ign: true, phone: true, country: true, avatarUrl: true, createdAt: true },
      }),
      this.prisma.contract.findFirst({
        where: { userId: user.id },
        select: { id: true, status: true, startDate: true, endDate: true, clubOption: true, trialEndDate: true, prizePoolPercentage: true },
        orderBy: { endDate: 'desc' },
      }),
      this.prisma.userDevice.findMany({
        where: { userId: user.id, orgId: user.orgId },
        select: { id: true, label: true, fingerprint: true, lastSeenAt: true, revokedAt: true, createdAt: true },
        orderBy: { lastSeenAt: 'desc' },
      }),
    ]);
    return {
      ...ctx, user: record,
      contract: contract ? { ...contract, daysLeft: Math.ceil((contract.endDate.getTime() - Date.now()) / DAY) } : null,
      devices,
      // Finance fields intentionally never selected — Player cannot read salary/buyout.
      financeAccess: false,
    };
  }

  async updateProfile(user: any, body: any) {
    const ctx = await this.context(user);
    const allowedUser = ['ign'];
    const allowedMember = ['jerseySize', 'agentPool', 'travelPref', 'primaryRole'];
    const userData: any = {};
    const memberData: any = {};
    for (const key of allowedUser) if (body[key] !== undefined) userData[key] = body[key];
    for (const key of allowedMember) if (body[key] !== undefined) memberData[key] = body[key];
    const member = await this.prisma.divisionMember.findFirst({ where: { userId: user.id, divisionId: ctx.divisionId } });
    const [u] = await Promise.all([
      Object.keys(userData).length ? this.prisma.user.update({ where: { id: user.id }, data: userData, select: { id: true, ign: true } }) : Promise.resolve(null),
      Object.keys(memberData).length
        ? this.prisma.divisionMember.update({ where: { id: member.id }, data: { ...memberData, agentPool: memberData.agentPool ?? undefined } })
        : Promise.resolve(null),
    ]);
    await this.audit.log({ orgId: user.orgId, actorUserId: user.id, actionType: 'PLAYER_PROFILE_UPDATE', targetResource: user.id, metadata: body });
    return { ok: true, user: u };
  }

  async registerDevice(user: any, body: any, req: Request) {
    await this.context(user);
    const fingerprint = body.fingerprint || (req.headers['x-device-id'] as string) || deviceFingerprint(req);
    const device = await this.prisma.userDevice.upsert({
      where: { userId_fingerprint: { userId: user.id, fingerprint } },
      update: { revokedAt: null, lastSeenAt: new Date(), label: body.label || 'Perangkat pemain' },
      create: { userId: user.id, orgId: user.orgId, fingerprint, label: body.label || 'Perangkat pemain' },
    });
    await this.audit.log({ orgId: user.orgId, actorUserId: user.id, actionType: 'DEVICE_REGISTER', targetResource: device.id, metadata: { fingerprint } });
    return device;
  }

  async revokeDevice(user: any, id: string) {
    await this.context(user);
    const device = await this.prisma.userDevice.findFirst({ where: { id, userId: user.id } });
    if (!device) throw new NotFoundException();
    const updated = await this.prisma.userDevice.update({ where: { id }, data: { revokedAt: new Date() } });
    await this.audit.log({ orgId: user.orgId, actorUserId: user.id, actionType: 'DEVICE_REVOKE', targetResource: id });
    return updated;
  }
}

@Controller('player')
export class PlayerController {
  constructor(private readonly service: PlayerService) {}

  @Get('context')
  context(@CurrentUser() user: any) { return this.service.context(user); }

  @Get('home')
  home(@CurrentUser() user: any, @Query('timezone') timezone?: string) {
    return this.service.home(user, timezone || 'Asia/Jakarta');
  }

  @Get('playbooks')
  playbooks(@CurrentUser() user: any, @Query('map') map?: string, @Query('scenario') scenario?: string) {
    return this.service.playbooks(user, map, scenario);
  }

  @Get('playbooks/:id')
  playbook(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.playbookDetail(user, id);
  }

  @Post('playbooks/:id/open')
  open(@CurrentUser() user: any, @Param('id') id: string, @Req() req: Request) {
    return this.service.openPlaybook(user, id, req);
  }

  @Post('playbooks/:id/acknowledge')
  acknowledge(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { seconds?: number }) {
    return this.service.acknowledge(user, id, body?.seconds || 0);
  }

  @Get('performance')
  performance(@CurrentUser() user: any, @Query('mode') mode?: string) {
    return this.service.performance(user, mode);
  }

  @Get('scorecards')
  scorecards(@CurrentUser() user: any) { return this.service.scorecards(user); }

  @Get('action-items')
  actionItems(@CurrentUser() user: any) { return this.service.actionItems(user); }

  @Patch('action-items/:id')
  updateAction(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateActionItem(user, id, body.status);
  }

  @Get('wellness')
  wellness(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.service.wellness(user, Math.min(60, Math.max(1, Number(days) || 14)));
  }

  @Post('wellness')
  createWellness(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createWellness(user, body);
  }

  @Get('schedule')
  schedule(@CurrentUser() user: any, @Query('view') view?: string) {
    return this.service.schedule(user, view || 'day');
  }

  @Get('profile')
  profile(@CurrentUser() user: any) { return this.service.profile(user); }

  @Patch('profile')
  updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.service.updateProfile(user, body);
  }

  @Post('devices')
  registerDevice(@CurrentUser() user: any, @Body() body: any, @Req() req: Request) {
    return this.service.registerDevice(user, body, req);
  }

  @Delete('devices/:id')
  revokeDevice(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.revokeDevice(user, id);
  }
}

@Module({
  controllers: [PlayerController],
  providers: [PlayerService, PrismaService, AuditService],
  exports: [PlayerService],
})
export class PlayerModule {}
