import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  orgId: string;
  actorUserId?: string;
  actionType: string;
  targetResource: string;
  metadata?: any;
  ipAddress?: string;
  deviceFingerprint?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry) {
    return this.prisma.auditLog.create({ data: { ...entry, metadata: entry.metadata ?? undefined } });
  }
}
