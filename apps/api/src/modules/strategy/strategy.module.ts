import { Body, Controller, Get, Module, Param, Post, Query, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { RequirePermissions, CurrentUser, PlayerRestricted } from '../../auth/decorators';
import { PERMISSIONS, ReadStatus } from '@nexus/shared';
import { deviceFingerprint } from '../../common/crypto.util';
import { Request } from 'express';
import { Req } from '@nestjs/common';

@Injectable()
export class StrategyService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async playbooks(orgId: string, divisionId?: string, archived = false) {
    return this.prisma.playbook.findMany({
      where: { division: { orgId }, divisionId: divisionId || undefined, isArchived: archived },
      include: {
        division: { select: { gameTitle: true, accentColor: true } },
        _count: { select: { readReceipts: true } },
      },
      orderBy: [{ isMatchdayReady: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async detail(orgId: string, id: string, userId: string) {
    const playbook = await this.prisma.playbook.findFirst({
      where: { id, division: { orgId } },
      include: { division: { select: { gameTitle: true } } },
    });
    if (!playbook) throw new NotFoundException();
    const receipt = await this.prisma.playbookReadReceipt.findUnique({
      where: { playbookId_userId: { playbookId: id, userId } },
    });
    return { ...playbook, myReceipt: receipt || null };
  }

  async create(orgId: string, body: any, actor: any) {
    const division = await this.prisma.division.findFirst({ where: { id: body.divisionId, orgId } });
    if (!division) throw new NotFoundException('Divisi tidak ditemukan.');
    const playbook = await this.prisma.playbook.create({
      data: {
        divisionId: body.divisionId, mapName: body.mapName, scenarioType: body.scenarioType || 'ATTACK',
        title: body.title, description: body.description, canvasData: body.canvasData || {},
        patchVersion: body.patchVersion, isMatchdayReady: body.isMatchdayReady || false, createdBy: actor.id,
      },
    });
    const members = await this.prisma.divisionMember.findMany({
      where: { divisionId: body.divisionId, divisionRole: 'PLAYER' },
      select: { userId: true },
    });
    await this.prisma.playbookReadReceipt.createMany({
      data: members.map((m) => ({ playbookId: playbook.id, userId: m.userId })),
      skipDuplicates: true,
    });
    await this.prisma.notification.createMany({
      data: members.map((m) => ({
        orgId, userId: m.userId, type: 'PLAYBOOK' as const,
        title: 'Playbook baru', body: `${playbook.title} — ${playbook.mapName}`,
      })),
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'PLAYBOOK_CREATE', targetResource: playbook.id });
    return playbook;
  }

  /** Records an open event. Writes immutable audit trail with identity + device for watermarking (SPEC §2.3). */
  async open(orgId: string, id: string, user: any, req: Request) {
    const playbook = await this.prisma.playbook.findFirst({ where: { id, division: { orgId } } });
    if (!playbook) throw new NotFoundException();
    const derived = deviceFingerprint(req);
    const presented = (req.headers['x-device-id'] as string) || derived;

    // Session & device binding: a device once registered for this user may access playbooks.
    const known = await this.prisma.playbookReadReceipt.findMany({
      where: { userId: user.id, deviceFingerprint: { not: null } },
      select: { deviceFingerprint: true },
      distinct: ['deviceFingerprint'],
    });
    if (known.length && !known.some((r) => r.deviceFingerprint === presented)) {
      throw new ForbiddenException('Perangkat tidak terdaftar untuk akun ini. Hubungi Org Admin.');
    }

    const receipt = await this.prisma.playbookReadReceipt.upsert({
      where: { playbookId_userId: { playbookId: id, userId: user.id } },
      update: { status: ReadStatus.READING, openedAt: new Date(), deviceFingerprint: presented },
      create: { playbookId: id, userId: user.id, status: ReadStatus.READING, openedAt: new Date(), deviceFingerprint: presented },
    });
    await this.audit.log({
      orgId, actorUserId: user.id, actionType: 'PLAYBOOK_OPEN', targetResource: id,
      ipAddress: req.ip, deviceFingerprint: presented,
      metadata: { ign: user.ign, fullName: user.fullName, at: new Date().toISOString() },
    });
    return {
      receipt,
      watermark: {
        lines: [
          `${user.ign} - ${user.id} - ${req.ip} - ${new Date().toISOString()}`,
          `DEVICE: ${presented} • ${user.fullName}`,
        ],
      },
    };
  }

  async acknowledge(orgId: string, id: string, user: any, seconds: number) {
    const receipt = await this.prisma.playbookReadReceipt.findUnique({
      where: { playbookId_userId: { playbookId: id, userId: user.id } },
    });
    if (!receipt) throw new NotFoundException('Buka playbook terlebih dahulu.');
    const updated = await this.prisma.playbookReadReceipt.update({
      where: { id: receipt.id },
      data: { status: ReadStatus.ACKNOWLEDGED, acknowledgedAt: new Date(), readDurationSeconds: Math.max(seconds || 0, receipt.readDurationSeconds) },
    });
    await this.audit.log({ orgId, actorUserId: user.id, actionType: 'PLAYBOOK_ACK', targetResource: id });
    return updated;
  }

  async readiness(orgId: string, id: string) {
    const playbook = await this.prisma.playbook.findFirst({ where: { id, division: { orgId } } });
    if (!playbook) throw new NotFoundException();
    const receipts = await this.prisma.playbookReadReceipt.findMany({
      where: { playbookId: id },
      include: { user: { select: { id: true, ign: true, fullName: true } } },
      orderBy: { status: 'asc' },
    });
    const total = receipts.length;
    const acknowledged = receipts.filter((r) => r.status === ReadStatus.ACKNOWLEDGED).length;
    return { playbook, rate: total ? Math.round((acknowledged / total) * 100) : 0, receipts };
  }

  async nudge(orgId: string, id: string, actor: any) {
    const readiness = await this.readiness(orgId, id);
    const unread = readiness.receipts.filter((r) => r.status !== ReadStatus.ACKNOWLEDGED);
    await this.prisma.notification.createMany({
      data: unread.map((r) => ({
        orgId, userId: r.userId, type: 'PLAYBOOK' as const,
        title: 'Pengingat playbook', body: `Segera konfirmasi: ${readiness.playbook.title}`,
      })),
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'PLAYBOOK_NUDGE', targetResource: id, metadata: { count: unread.length } });
    return { nudged: unread.length };
  }
}

@Controller()
export class StrategyController {
  constructor(private readonly service: StrategyService) {}

  @Get('playbooks')
  @PlayerRestricted()
  playbooks(@CurrentUser() user: any, @Query('divisionId') divisionId?: string) {
    return this.service.playbooks(user.orgId, divisionId);
  }

  @Post('playbooks')
  @RequirePermissions(PERMISSIONS.PLAYBOOK_CREATE)
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create(user.orgId, body, user);
  }

  @Get('playbooks/:id')
  @PlayerRestricted()
  @RequirePermissions(PERMISSIONS.PLAYBOOK_READ)
  detail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.detail(user.orgId, id, user.id);
  }

  @Post('playbooks/:id/open')
  @PlayerRestricted()
  @RequirePermissions(PERMISSIONS.PLAYBOOK_READ)
  open(@CurrentUser() user: any, @Param('id') id: string, @Req() req: Request) {
    return this.service.open(user.orgId, id, user, req);
  }

  @Post('playbooks/:id/ack')
  @PlayerRestricted()
  @RequirePermissions(PERMISSIONS.PLAYBOOK_ACK)
  acknowledge(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { seconds?: number }) {
    return this.service.acknowledge(user.orgId, id, user, body.seconds || 0);
  }

  @Get('playbooks/:id/readiness')
  @RequirePermissions(PERMISSIONS.PLAYBOOK_CREATE)
  readiness(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.readiness(user.orgId, id);
  }

  @Post('playbooks/:id/nudge')
  @RequirePermissions(PERMISSIONS.PLAYBOOK_CREATE)
  nudge(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.nudge(user.orgId, id, user);
  }
}

@Module({
  controllers: [StrategyController],
  providers: [StrategyService, PrismaService, AuditService],
  exports: [StrategyService],
})
export class StrategyModule {}
