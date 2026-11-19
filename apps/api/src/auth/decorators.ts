import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Permission } from '@nexus/shared';

export const Public = () => SetMetadata('isPublic', true);
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata('permissions', permissions);

/**
 * Menandai endpoint workspace/admin agar tidak bisa diakses role PLAYER.
 * Player memakai endpoint khusus di /api/player yang sudah di-scope ke divisi + dirinya sendiri.
 */
export const PlayerRestricted = () => SetMetadata('playerRestricted', true);

export interface CurrentUserData {
  id: string;
  orgId: string;
  email: string;
  fullName: string;
  ign: string;
  globalRole: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
