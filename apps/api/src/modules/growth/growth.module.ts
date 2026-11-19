import { Body, Controller, Get, Module, Param, Patch, Post, Query, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { RequirePermissions, CurrentUser, PlayerRestricted } from '../../auth/decorators';
import { PERMISSIONS } from '@nexus/shared';

@Injectable()
export class GrowthService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  recruits(orgId: string, divisionId?: string) {
    return this.prisma.recruitCandidate.findMany({
      where: { division: { orgId }, divisionId: divisionId || undefined },
      include: { evaluator: { select: { ign: true, fullName: true } }, division: { select: { gameTitle: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createRecruit(orgId: string, body: any, actor: any) {
    const division = await this.prisma.division.findFirst({ where: { id: body.divisionId, orgId } });
    if (!division) throw new Error('Divisi tidak ditemukan.');
    const recruit = await this.prisma.recruitCandidate.create({
      data: {
        divisionId: body.divisionId, name: body.name, ign: body.ign, role: body.role,
        source: body.source, stage: body.stage || 'SCOUTING', rating: body.rating,
        notes: body.notes, evaluatorId: actor.id,
      },
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'RECRUIT_CREATE', targetResource: recruit.id });
    return recruit;
  }

  async moveRecruit(orgId: string, id: string, body: any, actor: any) {
    const recruit = await this.prisma.recruitCandidate.findFirst({ where: { id, division: { orgId } } });
    if (!recruit) throw new Error('Kandidat tidak ditemukan.');
    const updated = await this.prisma.recruitCandidate.update({ where: { id }, data: body });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'RECRUIT_STAGE', targetResource: id, metadata: { from: recruit.stage, to: body.stage } });
    return updated;
  }

  notifications(orgId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { orgId, userId }, orderBy: { createdAt: 'desc' }, take: 50,
    });
  }

  markRead(orgId: string, id: string) {
    return this.prisma.notification.updateMany({ where: { id, orgId }, data: { isRead: true } });
  }

  auditLogs(orgId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { orgId }, include: { actor: { select: { ign: true, fullName: true, globalRole: true } } },
      orderBy: { createdAt: 'desc' }, take: limit,
    });
  }

  /** Opponent scouting aggregated from historical matches (no external publisher API). */
  async opponents(orgId: string, divisionId?: string) {
    const matches = await this.prisma.match.findMany({
      where: { division: { orgId }, divisionId: divisionId || undefined, matchType: { in: ['SCRIM', 'OFFICIAL'] } },
      select: { opponentName: true, mapName: true, result: true, vodUrl: true, playedAt: true, patchVersion: true },
      orderBy: { playedAt: 'desc' },
    });
    const map = new Map<string, any>();
    for (const m of matches) {
      const row = map.get(m.opponentName) || { opponent: m.opponentName, matches: 0, wins: 0, maps: new Set<string>(), lastVod: null, lastPlayed: null, lastPatch: null };
      row.matches += 1;
      if (m.result === 'WIN') row.wins += 1;
      if (m.mapName) row.maps.add(m.mapName);
      if (!row.lastVod) { row.lastVod = m.vodUrl; row.lastPlayed = m.playedAt; row.lastPatch = m.patchVersion; }
      map.set(m.opponentName, row);
    }
    return [...map.values()].map((r) => ({
      opponent: r.opponent, matches: r.matches, wins: r.wins,
      winRate: r.matches ? Math.round((r.wins / r.matches) * 100) : 0,
      maps: [...r.maps], lastVod: r.lastVod, lastPlayed: r.lastPlayed, lastPatch: r.lastPatch,
    }));
  }
}

@Controller()
export class GrowthController {
  constructor(private readonly service: GrowthService) {}

  @Get('recruits')
  @PlayerRestricted()
  recruits(@CurrentUser() user: any, @Query('divisionId') divisionId?: string) {
    return this.service.recruits(user.orgId, divisionId);
  }

  @Post('recruits')
  @RequirePermissions(PERMISSIONS.RECRUIT_MANAGE)
  createRecruit(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createRecruit(user.orgId, body, user);
  }

  @Patch('recruits/:id')
  @RequirePermissions(PERMISSIONS.RECRUIT_MANAGE)
  moveRecruit(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.moveRecruit(user.orgId, id, body, user);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: any) {
    return this.service.notifications(user.orgId, user.id);
  }

  @Patch('notifications/:id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.markRead(user.orgId, id);
  }

  @Get('audit-logs')
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  auditLogs(@CurrentUser() user: any) {
    return this.service.auditLogs(user.orgId);
  }

  @Get('opponents')
  @PlayerRestricted()
  opponents(@CurrentUser() user: any, @Query('divisionId') divisionId?: string) {
    return this.service.opponents(user.orgId, divisionId);
  }
}

@Module({
  controllers: [GrowthController],
  providers: [GrowthService, PrismaService, AuditService],
  exports: [GrowthService],
})
export class GrowthModule {}
