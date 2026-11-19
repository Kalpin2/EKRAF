import { Body, Controller, Get, Module, Param, Patch, Post, Query, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { RequirePermissions, CurrentUser } from '../../auth/decorators';
import { PERMISSIONS, CONTRACT_REMINDER_TIERS, GlobalRole, prizePoolSplit, daysUntil } from '@nexus/shared';
import { encrypt, decrypt } from '../../common/crypto.util';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private canSeeSalary(role: string) {
    return role === GlobalRole.ORG_ADMIN || role === GlobalRole.FINANCE;
  }

  /** Seal a sensitive value as enc:<cipher>:<iv>:<authTag> using AES-256-GCM. */
  private seal(value: string | number): string {
    const e = encrypt(String(value));
    return `enc:${e.encrypted}:${e.iv}:${e.authTag}`;
  }

  private unseal(token: string): string {
    if (!token?.startsWith('enc:')) return token;
    const [, encrypted, iv, authTag] = token.split(':');
    try { return decrypt(encrypted, iv, authTag); } catch { return '[terenkripsi]'; }
  }

  async contracts(orgId: string, role: string) {
    const rows = await this.prisma.contract.findMany({
      where: { user: { orgId } },
      include: { user: { select: { id: true, ign: true, fullName: true, email: true } } },
      orderBy: { endDate: 'asc' },
    });
    const showSalary = this.canSeeSalary(role);
    return rows.map((c) => ({
      ...c,
      baseSalary: showSalary && c.baseSalaryEncrypted ? this.unseal(c.baseSalaryEncrypted) : null,
      buyoutClause: showSalary && c.buyoutClauseEncrypted ? this.unseal(c.buyoutClauseEncrypted) : null,
      baseSalaryEncrypted: showSalary ? c.baseSalaryEncrypted : undefined,
      buyoutClauseEncrypted: showSalary ? c.buyoutClauseEncrypted : undefined,
      daysLeft: daysUntil(c.endDate),
    }));
  }

  alerts(contracts: any[]) {
    return contracts.filter((c) => {
      const d = c.daysLeft;
      return d >= 0 && CONTRACT_REMINDER_TIERS.some((tier) => d <= tier);
    }).map((c) => ({
      ...c,
      tier: CONTRACT_REMINDER_TIERS.find((tier) => c.daysLeft <= tier),
    }));
  }

  async create(orgId: string, body: any, actor: any) {
    const user = await this.prisma.user.findFirst({ where: { id: body.userId, orgId } });
    if (!user) throw new NotFoundException();
    const contract = await this.prisma.contract.create({
      data: {
        userId: body.userId, status: body.status || 'ACTIVE',
        startDate: new Date(body.startDate), endDate: new Date(body.endDate),
        baseSalaryEncrypted: body.baseSalary ? this.seal(body.baseSalary) : null,
        buyoutClauseEncrypted: body.buyoutClause ? this.seal(body.buyoutClause) : null,
        performanceBonus: body.performanceBonus, prizePoolPercentage: Number(body.prizePoolPercentage) || 0,
        clubOption: body.clubOption || false,
        trialEndDate: body.trialEndDate ? new Date(body.trialEndDate) : null,
        notes: body.notes,
      },
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'CONTRACT_CREATE', targetResource: contract.id });
    return contract;
  }

  async update(orgId: string, id: string, body: any, actor: any) {
    const existing = await this.prisma.contract.findFirst({ where: { id, user: { orgId } } });
    if (!existing) throw new NotFoundException();
    const data: any = { ...body };
    delete data.baseSalary; delete data.buyoutClause;
    if (body.startDate) data.startDate = new Date(body.startDate);
    if (body.endDate) data.endDate = new Date(body.endDate);
    if (body.baseSalary !== undefined) data.baseSalaryEncrypted = this.seal(body.baseSalary);
    if (body.buyoutClause !== undefined) data.buyoutClauseEncrypted = this.seal(body.buyoutClause);
    const updated = await this.prisma.contract.update({ where: { id }, data });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'CONTRACT_UPDATE', targetResource: id, metadata: body });
    return updated;
  }

  calculatePrizePool(body: any) {
    return prizePoolSplit(Number(body.total) || 0, Number(body.taxPercent) || 0, {
      players: Number(body.players) || 70,
      staff: Number(body.staff) || 15,
      org: Number(body.org) || 15,
      playerCount: Number(body.playerCount) || 5,
    });
  }

  async legalDocuments(orgId: string, userId?: string) {
    return this.prisma.legalDocument.findMany({
      where: { orgId, userId: userId || undefined },
      select: { id: true, userId: true, docType: true, fileName: true, mimeType: true, createdAt: true, user: { select: { ign: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadLegal(orgId: string, body: any, actor: any) {
    const user = await this.prisma.user.findFirst({ where: { id: body.userId, orgId } });
    if (!user) throw new NotFoundException();
    const encrypted = encrypt(body.content || '');
    const doc = await this.prisma.legalDocument.create({
      data: {
        userId: body.userId, orgId, docType: body.docType, fileName: body.fileName,
        mimeType: body.mimeType || 'application/octet-stream',
        encryptedData: encrypted.encrypted, iv: encrypted.iv, authTag: encrypted.authTag, uploadedBy: actor.id,
      },
    });
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'LEGAL_DOC_UPLOAD', targetResource: doc.id, metadata: { docType: body.docType, fileName: body.fileName } });
    return { id: doc.id, docType: doc.docType, fileName: doc.fileName };
  }

  async downloadLegal(orgId: string, id: string, actor: any) {
    const doc = await this.prisma.legalDocument.findFirst({ where: { id, orgId } });
    if (!doc) throw new NotFoundException();
    if (!this.canSeeSalary(actor.globalRole) && actor.globalRole !== GlobalRole.TEAM_MANAGER) {
      throw new ForbiddenException('Akses dokumen legal tidak diizinkan untuk peran ini.');
    }
    await this.audit.log({ orgId, actorUserId: actor.id, actionType: 'LEGAL_DOC_DOWNLOAD', targetResource: id });
    return { content: decrypt(doc.encryptedData, doc.iv, doc.authTag), fileName: doc.fileName, mimeType: doc.mimeType };
  }
}

@Controller()
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('contracts')
  @RequirePermissions(PERMISSIONS.CONTRACT_READ)
  contracts(@CurrentUser() user: any) {
    return this.service.contracts(user.orgId, user.globalRole);
  }

  @Get('contracts/alerts')
  @RequirePermissions(PERMISSIONS.CONTRACT_READ)
  async alerts(@CurrentUser() user: any) {
    const contracts = await this.service.contracts(user.orgId, user.globalRole);
    return this.service.alerts(contracts);
  }

  @Post('contracts')
  @RequirePermissions(PERMISSIONS.CONTRACT_MANAGE)
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.service.create(user.orgId, body, user);
  }

  @Patch('contracts/:id')
  @RequirePermissions(PERMISSIONS.CONTRACT_MANAGE)
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.update(user.orgId, id, body, user);
  }

  @Post('finance/prize-pool')
  @RequirePermissions(PERMISSIONS.FINANCE_MANAGE)
  prizePool(@Body() body: any) {
    return this.service.calculatePrizePool(body);
  }

  @Get('legal-documents')
  @RequirePermissions(PERMISSIONS.CONTRACT_READ)
  legalDocs(@CurrentUser() user: any, @Query('userId') userId?: string) {
    return this.service.legalDocuments(user.orgId, userId);
  }

  @Post('legal-documents')
  @RequirePermissions(PERMISSIONS.CONTRACT_MANAGE)
  uploadLegal(@CurrentUser() user: any, @Body() body: any) {
    return this.service.uploadLegal(user.orgId, body, user);
  }

  @Get('legal-documents/:id')
  @RequirePermissions(PERMISSIONS.CONTRACT_READ)
  downloadLegal(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.downloadLegal(user.orgId, id, user);
  }
}

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, PrismaService, AuditService],
  exports: [FinanceService],
})
export class FinanceModule {}
