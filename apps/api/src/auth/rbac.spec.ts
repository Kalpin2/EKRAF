import { describe, it, expect, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PermissionsGuard } from './guards';
import { PERMISSIONS, hasPermission, GlobalRole } from '@nexus/shared';

function contextWith(user: any, permissions: any) {
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue(permissions) } as unknown as Reflector;
  const ctx: any = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
  return { guard: new PermissionsGuard(reflector), ctx };
}

describe('RBAC — PermissionsGuard', () => {
  it('mengizinkan peran yang memiliki permission', () => {
    const { guard, ctx } = contextWith({ globalRole: GlobalRole.HEAD_COACH }, [PERMISSIONS.PLAYBOOK_CREATE]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('menolak player yang mencoba membuat playbook', () => {
    const { guard, ctx } = contextWith({ globalRole: GlobalRole.PLAYER }, [PERMISSIONS.PLAYBOOK_CREATE]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('menolak akses tanpa user (belum login)', () => {
    const { guard, ctx } = contextWith(undefined, [PERMISSIONS.MATCH_READ]);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('mengizinkan semua permission untuk ORG_ADMIN', () => {
    expect(hasPermission(GlobalRole.ORG_ADMIN, PERMISSIONS.FINANCE_MANAGE)).toBe(true);
    expect(hasPermission(GlobalRole.ORG_ADMIN, PERMISSIONS.AUDIT_READ)).toBe(true);
  });

  it('memisahkan akses finance dari team manager', () => {
    expect(hasPermission(GlobalRole.TEAM_MANAGER, PERMISSIONS.FINANCE_MANAGE)).toBe(false);
    expect(hasPermission(GlobalRole.FINANCE, PERMISSIONS.FINANCE_MANAGE)).toBe(true);
  });
});
