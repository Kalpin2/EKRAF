import { Body, Controller, Get, Module, Param, Patch, Post, Query, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { RequirePermissions, CurrentUser, PlayerRestricted } from '../../auth/decorators';
import { PERMISSIONS } from '@nexus/shared';

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private async assertDivision(orgId: string, divisionId: string) {
    const division = await this.prisma.division.findFirst({ where: { id: divisionId, orgId } });
    if (!division) throw new NotFoundException('Divisi tidak ditemukan.');
    return division;
  }

  // ---- Schedules & attendance ---------------------------------------------
  async schedules(orgId: string, divisionId?: string, from?: string, to?: string) {
    return this.prisma.scheduleEvent.findMany({
      where: {
        division: { orgId },
        divisionId: divisionId || undefined,
        startsAt: from || to ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } : undefined,
      },
      include: { division: { select: { gameTitle: true, accentColor: true } }, _count: { select: { attendance: true } } },
      orderBy: { startsAt: 'asc' },
    });
  }

  async createSchedule(orgId: string, body: any, actor: any) {
    await this.assertDivision(orgId, body.divisionId);
    const event = await this.prisma.scheduleEvent.create({
      data: {
        divisionId: body.divisionId, type: body.type || 'PRACTICE', title: body.title,
        description: body.description, location: body.location,
        startsAt: new Date(body.startsAt), endsAt: new Date(body.endsAt),
        timezone: body.timezone || 'Asia/Jakarta', createdBy: actor.id,
      },
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'SCHEDULE_CREATE', targetResource: event.id });
    return event;
  }

  async attendance(orgId: string, divisionId?: string) {
    return this.prisma.attendance.findMany({
      where: { event: { division: { orgId }, divisionId: divisionId || undefined } },
      include: { user: { select: { id: true, ign: true, fullName: true } }, event: { select: { id: true, title: true, startsAt: true } } },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async recordAttendance(orgId: string, body: any, actor: any) {
    const event = await this.prisma.scheduleEvent.findFirst({ where: { id: body.eventId, division: { orgId } } });
    if (!event) throw new NotFoundException();
    const row = await this.prisma.attendance.upsert({
      where: { eventId_userId: { eventId: body.eventId, userId: body.userId } },
      update: { status: body.status, lateMinutes: body.lateMinutes || 0, note: body.note },
      create: { eventId: body.eventId, userId: body.userId, status: body.status, lateMinutes: body.lateMinutes || 0, note: body.note },
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'ATTENDANCE_SET', targetResource: row.id, metadata: body });
    return row;
  }

  // ---- Wellness -----------------------------------------------------------
  async wellness(orgId: string, userId?: string, limit = 30) {
    return this.prisma.wellnessLog.findMany({
      where: { user: { orgId }, userId: userId || undefined },
      include: { user: { select: { id: true, ign: true, fullName: true } } },
      orderBy: { loggedAt: 'desc' }, take: limit,
    });
  }

  createWellness(userId: string, body: any) {
    return this.prisma.wellnessLog.create({
      data: {
        userId, sleepHours: Number(body.sleepHours), fatigueLevel: Number(body.fatigueLevel),
        mentalReadiness: Number(body.mentalReadiness), physicalIssue: body.physicalIssue, note: body.note,
      },
    });
  }

  // ---- Matches, VOD & action items ---------------------------------------
  async matches(orgId: string, divisionId?: string, type?: string, limit = 50) {
    return this.prisma.match.findMany({
      where: { division: { orgId }, divisionId: divisionId || undefined, matchType: type as any || undefined },
      include: {
        division: { select: { gameTitle: true } },
        playerStats: { include: { user: { select: { id: true, ign: true, fullName: true } } } },
        _count: { select: { vodNotes: true, actionItems: true } },
      },
      orderBy: { playedAt: 'desc' }, take: limit,
    });
  }

  async matchDetail(orgId: string, id: string) {
    const match = await this.prisma.match.findFirst({
      where: { id, division: { orgId } },
      include: {
        playerStats: { include: { user: { select: { id: true, ign: true, fullName: true } } } },
        vodNotes: { include: { author: { select: { ign: true } } }, orderBy: { timestampSeconds: 'asc' } },
        actionItems: { include: { assignee: { select: { id: true, ign: true } } } },
      },
    });
    if (!match) throw new NotFoundException();
    return match;
  }

  async createMatch(orgId: string, body: any, actor: any) {
    await this.assertDivision(orgId, body.divisionId);
    const result = body.scoreUs > body.scoreThem ? 'WIN' : body.scoreUs < body.scoreThem ? 'LOSS' : 'DRAW';
    const match = await this.prisma.match.create({
      data: {
        divisionId: body.divisionId, matchType: body.matchType || 'SCRIM', opponentName: body.opponentName,
        mapName: body.mapName, patchVersion: body.patchVersion, scoreUs: Number(body.scoreUs),
        scoreThem: Number(body.scoreThem), result: result as any, vodUrl: body.vodUrl,
        notes: body.notes, playedAt: body.playedAt ? new Date(body.playedAt) : new Date(),
      },
    });
    for (const stat of body.stats || []) {
      const valid = await this.prisma.user.findFirst({ where: { id: stat.userId, orgId } });
      if (!valid) throw new BadRequestException('Statistik merujuk pemain di luar organisasi.');
      await this.prisma.playerMatchStat.create({
        data: {
          matchId: match.id, userId: stat.userId, characterPlayed: stat.characterPlayed,
          kills: Number(stat.kills) || 0, deaths: Number(stat.deaths) || 0, assists: Number(stat.assists) || 0,
          acsOrRating: Number(stat.acsOrRating) || 0, firstBloods: Number(stat.firstBloods) || 0,
          objectiveControl: Number(stat.objectiveControl) || 0, scorecard: stat.scorecard || undefined,
        },
      });
    }
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'MATCH_CREATE', targetResource: match.id });
    return match;
  }

  async addVodNote(orgId: string, matchId: string, body: any, actor: any) {
    await this.matchDetail(orgId, matchId);
    const note = await this.prisma.vodNote.create({
      data: { matchId, authorId: actor.id, timestampSeconds: Number(body.timestampSeconds), note: body.note },
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'VOD_NOTE_CREATE', targetResource: note.id });
    return note;
  }

  async addAction(orgId: string, matchId: string, body: any, actor: any) {
    await this.matchDetail(orgId, matchId);
    const action = await this.prisma.actionItem.create({
      data: {
        matchId, assigneeId: body.assigneeId, creatorId: actor.id, title: body.title,
        description: body.description, dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    });
    const assignee = await this.prisma.user.findFirst({ where: { id: body.assigneeId, orgId }, select: { orgId: true } });
    if (!assignee) throw new BadRequestException('Penerima action item tidak ditemukan di organisasi ini.');
    await this.prisma.notification.create({
      data: { orgId, userId: body.assigneeId, type: 'ACTION_ITEM', title: 'Action item baru', body: body.title },
    });
    return action;
  }

  async myActions(orgId: string, userId: string) {
    return this.prisma.actionItem.findMany({
      where: { assignee: { orgId }, assigneeId: userId },
      include: { match: { select: { id: true, opponentName: true, playedAt: true } }, creator: { select: { ign: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAction(orgId: string, id: string, status: string, actor: any) {
    const action = await this.prisma.actionItem.findFirst({ where: { id, assignee: { orgId } } });
    if (!action) throw new NotFoundException();
    const updated = await this.prisma.actionItem.update({ where: { id }, data: { status: status as any } });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'ACTION_STATUS', targetResource: id, metadata: { status } });
    return updated;
  }
}

@Controller()
export class OperationsController {
  constructor(private readonly service: OperationsService) {}

  @Get('schedules')
  @PlayerRestricted()
  schedules(@CurrentUser() user: any, @Query('divisionId') divisionId?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.schedules(user.orgId, divisionId, from, to);
  }

  @Post('schedules')
  @RequirePermissions(PERMISSIONS.SCHEDULE_MANAGE)
  createSchedule(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createSchedule(user.orgId, body, user);
  }

  @Get('attendance')
  @PlayerRestricted()
  attendance(@CurrentUser() user: any, @Query('divisionId') divisionId?: string) {
    return this.service.attendance(user.orgId, divisionId);
  }

  @Post('attendance')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_MANAGE)
  recordAttendance(@CurrentUser() user: any, @Body() body: any) {
    return this.service.recordAttendance(user.orgId, body, user);
  }

  @Get('wellness')
  @PlayerRestricted()
  wellness(@CurrentUser() user: any, @Query('userId') userId?: string) {
    return this.service.wellness(user.orgId, userId);
  }

  @Post('wellness')
  @RequirePermissions(PERMISSIONS.WELLNESS_WRITE)
  createWellness(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createWellness(user.id, body);
  }

  @Get('matches')
  @PlayerRestricted()
  @RequirePermissions(PERMISSIONS.MATCH_READ)
  matches(@CurrentUser() user: any, @Query('divisionId') divisionId?: string, @Query('type') type?: string) {
    return this.service.matches(user.orgId, divisionId, type);
  }

  @Get('matches/:id')
  @PlayerRestricted()
  @RequirePermissions(PERMISSIONS.MATCH_READ)
  matchDetail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.matchDetail(user.orgId, id);
  }

  @Post('matches')
  @RequirePermissions(PERMISSIONS.MATCH_CREATE)
  createMatch(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createMatch(user.orgId, body, user);
  }

  @Post('matches/:id/vod-notes')
  @RequirePermissions(PERMISSIONS.MATCH_CREATE)
  addVodNote(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.addVodNote(user.orgId, id, body, user);
  }

  @Post('matches/:id/actions')
  @RequirePermissions(PERMISSIONS.MATCH_CREATE)
  addAction(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.addAction(user.orgId, id, body, user);
  }

  @Get('actions/me')
  myActions(@CurrentUser() user: any) {
    return this.service.myActions(user.orgId, user.id);
  }

  @Patch('actions/:id')
  @PlayerRestricted()
  updateAction(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateAction(user.orgId, id, body.status, user);
  }
}

@Module({
  controllers: [OperationsController],
  providers: [OperationsService, PrismaService, AuditService],
  exports: [OperationsService],
})
export class OperationsModule {}
