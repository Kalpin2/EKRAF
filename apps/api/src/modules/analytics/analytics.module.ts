import { Controller, Get, Module, Query, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions, CurrentUser, PlayerRestricted } from '../../auth/decorators';
import { PERMISSIONS, GlobalRole } from '@nexus/shared';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(user: any) {
    const divisions = await this.prisma.division.findMany({
      where: { orgId: user.orgId }, select: { id: true, gameTitle: true, accentColor: true },
    });
    const divisionIds = divisions.map((d) => d.id);
    const role = user.globalRole as GlobalRole;

    const [matches, playbooks, events, notifications, contracts, recruits, patches, wellness] = await Promise.all([
      this.prisma.match.findMany({ where: { divisionId: { in: divisionIds } }, orderBy: { playedAt: 'desc' }, take: 8, select: { id: true, opponentName: true, result: true, scoreUs: true, scoreThem: true, mapName: true, patchVersion: true, playedAt: true } }),
      this.prisma.playbook.findMany({ where: { divisionId: { in: divisionIds }, isArchived: false }, include: { _count: { select: { readReceipts: true } } }, orderBy: { updatedAt: 'desc' }, take: 6 }),
      this.prisma.scheduleEvent.findMany({ where: { divisionId: { in: divisionIds } }, orderBy: { startsAt: 'asc' }, take: 6 }),
      this.prisma.notification.findMany({ where: { userId: user.id, isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
      this.prisma.contract.findMany({ where: { user: { orgId: user.orgId } }, include: { user: { select: { ign: true, fullName: true } } }, orderBy: { endDate: 'asc' }, take: 6 }),
      this.prisma.recruitCandidate.count({ where: { division: { orgId: user.orgId } } }),
      this.prisma.gamePatch.findMany({ where: { divisionId: { in: divisionIds } }, orderBy: { releaseDate: 'desc' }, take: 5 }),
      this.prisma.wellnessLog.findMany({ where: { user: { orgId: user.orgId } }, include: { user: { select: { ign: true } } }, orderBy: { loggedAt: 'desc' }, take: 10 }),
    ]);

    const wins = matches.filter((m) => m.result === 'WIN').length;
    const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0;

    let focus: any = {};
    if (role === GlobalRole.PLAYER) {
      const [myActions, receipts, lastWellness] = await Promise.all([
        this.prisma.actionItem.findMany({ where: { assigneeId: user.id, status: { not: 'DONE' } }, include: { match: { select: { opponentName: true } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
        this.prisma.playbookReadReceipt.findMany({ where: { userId: user.id, status: { not: 'ACKNOWLEDGED' } }, include: { playbook: { select: { id: true, title: true, mapName: true } } } }),
        this.prisma.wellnessLog.findFirst({ where: { userId: user.id }, orderBy: { loggedAt: 'desc' } }),
      ]);
      focus = { myActions, unreadPlaybooks: receipts, lastWellness, winRate };
    } else if (role === GlobalRole.HEAD_COACH || role === GlobalRole.ANALYST) {
      const readiness = await this.prisma.playbookReadReceipt.groupBy({
        by: ['status'], where: { playbook: { divisionId: { in: divisionIds } } }, _count: true,
      });
      focus = { readiness, recentMatches: matches, patches, winRate, wellness };
    } else {
      const attendance = await this.prisma.attendance.groupBy({
        by: ['status'], where: { event: { divisionId: { in: divisionIds } } }, _count: true,
      });
      focus = { attendance, contracts, recruits, winRate };
    }

    return {
      role, divisions, focus,
      summary: {
        totalMatches: await this.prisma.match.count({ where: { divisionId: { in: divisionIds } } }),
        activePlayers: await this.prisma.divisionMember.count({ where: { divisionId: { in: divisionIds }, divisionRole: 'PLAYER' } }),
        playbooks: playbooks.length,
        unreadNotifications: notifications.length,
        winRate,
      },
      widgets: { matches, playbooks, events, notifications, patches },
    };
  }

  async trends(orgId: string, divisionId?: string, userId?: string) {
    const rows = await this.prisma.playerMatchStat.findMany({
      where: {
        user: { orgId },
        match: divisionId ? { divisionId, division: { orgId } } : { division: { orgId } },
        userId: userId || undefined,
      },
      include: { match: { select: { playedAt: true, patchVersion: true, mapName: true, opponentName: true, result: true } }, user: { select: { ign: true } } },
      orderBy: { match: { playedAt: 'asc' } }, take: 200,
    });
    return rows.map((r) => {
      const sc = r.scorecard as any;
      const scores = sc ? Object.values(sc).filter((v): v is number => typeof v === 'number') : [];
      const scorecardAvg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return {
        date: r.match.playedAt, patch: r.match.patchVersion, map: r.match.mapName,
        opponent: r.match.opponentName, result: r.match.result, ign: r.user.ign,
        kills: r.kills, deaths: r.deaths, assists: r.assists, acs: r.acsOrRating,
        kd: r.deaths ? Number((r.kills / r.deaths).toFixed(2)) : r.kills,
        scorecardAvg: Number(scorecardAvg.toFixed(2)),
      };
    });
  }

  async attendanceReport(orgId: string, divisionId?: string) {
    const rows = await this.prisma.attendance.findMany({
      where: { event: { division: { orgId }, divisionId: divisionId || undefined }, user: { orgId } },
      include: { user: { select: { ign: true, fullName: true } }, event: { select: { title: true, startsAt: true } } },
      orderBy: { recordedAt: 'desc' }, take: 200,
    });
    const perUser = new Map<string, { ign: string; total: number; onTime: number; late: number; rate: number }>();
    for (const r of rows) {
      const row = perUser.get(r.userId) || { ign: r.user.ign, total: 0, onTime: 0, late: 0, rate: 0 };
      row.total += 1;
      if (r.status === 'ON_TIME') row.onTime += 1;
      if (r.status === 'LATE') row.late += 1;
      perUser.set(r.userId, row);
    }
    return [...perUser.values()].map((r) => ({ ...r, rate: r.total ? Math.round((r.onTime / r.total) * 100) : 0 }));
  }

  async readinessOverview(orgId: string, divisionId?: string) {
    const playbooks = await this.prisma.playbook.findMany({
      where: { division: { orgId }, divisionId: divisionId || undefined, isArchived: false },
      include: { readReceipts: true }, orderBy: { updatedAt: 'desc' },
    });
    return playbooks.map((p) => {
      const total = p.readReceipts.length;
      const ack = p.readReceipts.filter((r) => r.status === 'ACKNOWLEDGED').length;
      return { id: p.id, title: p.title, map: p.mapName, matchdayReady: p.isMatchdayReady, total, ack, rate: total ? Math.round((ack / total) * 100) : 0 };
    });
  }
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  @PlayerRestricted()
  dashboard(@CurrentUser() user: any) {
    return this.service.dashboard(user);
  }

  @Get('trends')
  @RequirePermissions(PERMISSIONS.ANALYTICS_READ)
  trends(@CurrentUser() user: any, @Query('divisionId') divisionId?: string, @Query('userId') userId?: string) {
    return this.service.trends(user.orgId, divisionId, userId);
  }

  @Get('attendance')
  @PlayerRestricted()
  attendance(@CurrentUser() user: any, @Query('divisionId') divisionId?: string) {
    return this.service.attendanceReport(user.orgId, divisionId);
  }

  @Get('readiness')
  @RequirePermissions(PERMISSIONS.ANALYTICS_READ)
  readiness(@CurrentUser() user: any, @Query('divisionId') divisionId?: string) {
    return this.service.readinessOverview(user.orgId, divisionId);
  }
}

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
