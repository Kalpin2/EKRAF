import { Body, Controller, Get, Module, Param, Patch, Post, Query, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { RequirePermissions, CurrentUser, PlayerRestricted } from '../../auth/decorators';
import { PERMISSIONS, GlobalRole } from '@nexus/shared';

@Injectable()
export class CoreService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  divisions(orgId: string) {
    return this.prisma.division.findMany({
      where: { orgId },
      include: { _count: { select: { members: true, matches: true, playbooks: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createDivision(orgId: string, body: any, actor: any) {
    const division = await this.prisma.division.create({
      data: { orgId, gameTitle: body.gameTitle, region: body.region || 'Global', accentColor: body.accentColor || '#6B8E78' },
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'DIVISION_CREATE', targetResource: division.id });
    return division;
  }

  async members(orgId: string, divisionId?: string) {
    return this.prisma.divisionMember.findMany({
      where: { divisionId: divisionId || undefined, user: { orgId } },
      include: {
        user: { select: { id: true, email: true, fullName: true, ign: true, globalRole: true, avatarUrl: true, isActive: true } },
        division: { select: { id: true, gameTitle: true, accentColor: true } },
      },
      orderBy: [{ rosterStatus: 'asc' }, { user: { ign: 'asc' } }],
    });
  }

  async addMember(orgId: string, body: any, actor: any) {
    const user = await this.prisma.user.findFirst({ where: { id: body.userId, orgId } });
    if (!user) throw new NotFoundException('User tidak ditemukan di organisasi ini.');
    const member = await this.prisma.divisionMember.upsert({
      where: { userId_divisionId: { userId: body.userId, divisionId: body.divisionId } },
      update: { divisionRole: body.divisionRole || 'PLAYER', rosterStatus: body.rosterStatus || 'BENCH', primaryRole: body.primaryRole },
      create: {
        userId: body.userId, divisionId: body.divisionId,
        divisionRole: body.divisionRole || 'PLAYER', rosterStatus: body.rosterStatus || 'BENCH',
        primaryRole: body.primaryRole, agentPool: body.agentPool || [], jerseySize: body.jerseySize,
      },
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'ROSTER_CHANGE', targetResource: member.id, metadata: body });
    return member;
  }

  async updateMember(orgId: string, id: string, body: any, actor: any) {
    const member = await this.prisma.divisionMember.findFirst({ where: { id, user: { orgId } } });
    if (!member) throw new NotFoundException();
    const updated = await this.prisma.divisionMember.update({ where: { id }, data: body });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'ROSTER_CHANGE', targetResource: id, metadata: body });
    return updated;
  }

  users(orgId: string) {
    return this.prisma.user.findMany({
      where: { orgId },
      select: { id: true, email: true, fullName: true, ign: true, globalRole: true, isActive: true, createdAt: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async inviteUser(orgId: string, body: any, actor: any) {
    const bcrypt = await import('bcryptjs');
    const user = await this.prisma.user.create({
      data: {
        orgId, email: body.email.toLowerCase().trim(),
        passwordHash: await bcrypt.hash(body.password || 'nexus123', 10),
        fullName: body.fullName, ign: body.ign || body.fullName,
        globalRole: body.globalRole || GlobalRole.PLAYER,
      },
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'USER_CREATE', targetResource: user.id });
    return { id: user.id, email: user.email, fullName: user.fullName, ign: user.ign, globalRole: user.globalRole };
  }

  async setUserActive(orgId: string, id: string, isActive: boolean, actor: any) {
    const user = await this.prisma.user.updateMany({ where: { id, orgId }, data: { isActive } });
    if (!user.count) throw new NotFoundException();
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: isActive ? 'ACCESS_GRANT' : 'ACCESS_REVOKE', targetResource: id });
    return { ok: true };
  }
}

@Controller('core')
export class CoreController {
  constructor(private readonly service: CoreService) {}

  @Get('divisions')
  @PlayerRestricted()
  divisions(@CurrentUser() user: any) {
    return this.service.divisions(user.orgId);
  }

  @Post('divisions')
  @RequirePermissions(PERMISSIONS.DIVISION_MANAGE)
  createDivision(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createDivision(user.orgId, body, user);
  }

  @Get('members')
  @PlayerRestricted()
  members(@CurrentUser() user: any, @Query('divisionId') divisionId?: string) {
    return this.service.members(user.orgId, divisionId);
  }

  @Post('members')
  @RequirePermissions(PERMISSIONS.ROSTER_MANAGE)
  addMember(@CurrentUser() user: any, @Body() body: any) {
    return this.service.addMember(user.orgId, body, user);
  }

  @Patch('members/:id')
  @RequirePermissions(PERMISSIONS.ROSTER_MANAGE)
  updateMember(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.updateMember(user.orgId, id, body, user);
  }

  @Get('users')
  @PlayerRestricted()
  users(@CurrentUser() user: any) {
    return this.service.users(user.orgId);
  }

  @Post('users')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  inviteUser(@CurrentUser() user: any, @Body() body: any) {
    return this.service.inviteUser(user.orgId, body, user);
  }

  @Patch('users/:id/active')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  setActive(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.service.setUserActive(user.orgId, id, body.isActive, user);
  }
}

@Module({
  controllers: [CoreController],
  providers: [CoreService, PrismaService, AuditService],
  exports: [CoreService],
})
export class CoreModule {}
