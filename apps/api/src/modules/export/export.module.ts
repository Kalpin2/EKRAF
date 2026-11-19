import { Controller, Get, Header, Injectable, Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser, PlayerRestricted } from '../../auth/decorators';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  private csv(rows: Record<string, any>[]): string {
    if (!rows.length) return '';
    const keys = Object.keys(rows[0]);
    const esc = (v: any) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\r\n');
  }

  async attendance(orgId: string) {
    const rows = await this.prisma.attendance.findMany({
      where: { event: { division: { orgId } }, user: { orgId } },
      include: { user: { select: { ign: true, fullName: true } }, event: { select: { title: true, startsAt: true } } },
      orderBy: { recordedAt: 'desc' },
    });
    return this.csv(rows.map((r) => ({
      Tanggal: r.recordedAt.toISOString().slice(0, 10), Sesi: r.event.title, Pemain: r.user.ign,
      Status: r.status, TerlambatMenit: r.lateMinutes, Catatan: r.note || '',
    })));
  }

  async performance(orgId: string) {
    const rows = await this.prisma.playerMatchStat.findMany({
      where: { user: { orgId }, match: { division: { orgId } } },
      include: { user: { select: { ign: true } }, match: { select: { playedAt: true, opponentName: true, patchVersion: true, result: true } } },
      orderBy: { match: { playedAt: 'desc' } },
    });
    return this.csv(rows.map((r) => ({
      Tanggal: r.match.playedAt.toISOString().slice(0, 10), Pemain: r.user.ign, Lawan: r.match.opponentName,
      Patch: r.match.patchVersion, Hasil: r.match.result, K: r.kills, D: r.deaths, A: r.assists, ACS: r.acsOrRating,
    })));
  }
}

@Controller('export')
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Get('attendance.csv')
  @PlayerRestricted()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="nexus-attendance.csv"')
  attendance(@CurrentUser() user: any) {
    return this.service.attendance(user.orgId);
  }

  @Get('performance.csv')
  @PlayerRestricted()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="nexus-performance.csv"')
  performance(@CurrentUser() user: any) {
    return this.service.performance(user.orgId);
  }
}

@Module({
  controllers: [ExportController],
  providers: [ExportService, PrismaService],
  exports: [ExportService],
})
export class ExportModule {}
