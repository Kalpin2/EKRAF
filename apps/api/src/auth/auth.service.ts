import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, meta: { ip?: string; device?: string; deviceId?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email atau password salah.');
    }
    if (!user.isActive) throw new UnauthorizedException('Akun dinonaktifkan.');

    const payload = { sub: user.id, orgId: user.orgId, role: user.globalRole, deviceId: meta.deviceId || null };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
      expiresIn: process.env.JWT_ACCESS_TTL || '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
      expiresIn: process.env.JWT_REFRESH_TTL || '7d',
    });

    await this.audit.log({
      orgId: user.orgId, actorUserId: user.id, actionType: 'LOGIN',
      targetResource: 'auth', ipAddress: meta.ip, deviceFingerprint: meta.device || meta.deviceId,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id, orgId: user.orgId, email: user.email, fullName: user.fullName,
        ign: user.ign, globalRole: user.globalRole,
      },
    };
  }

  async refresh(token: string) {
    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret' });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new UnauthorizedException();
      const accessToken = this.jwt.sign(
        { sub: user.id, orgId: user.orgId, role: user.globalRole },
        { secret: process.env.JWT_ACCESS_SECRET || 'change-me-access-secret', expiresIn: process.env.JWT_ACCESS_TTL || '15m' },
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid.');
    }
  }

  async register(body: { orgName: string; email: string; password: string; fullName: string; ign: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
    if (exists) throw new ConflictException('Email sudah terdaftar.');

    const slug = body.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const org = await this.prisma.organization.create({
      data: { name: body.orgName, slug: `${slug}-${Date.now().toString(36)}` },
    });
    const user = await this.prisma.user.create({
      data: {
        orgId: org.id, email: body.email.toLowerCase().trim(),
        passwordHash: await bcrypt.hash(body.password, 10),
        fullName: body.fullName, ign: body.ign, globalRole: 'ORG_ADMIN',
      },
    });
    return this.login(body.email, body.password, {});
  }
}
