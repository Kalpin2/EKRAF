import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { hasPermission, GlobalRole, Permission } from '@nexus/shared';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) throw new UnauthorizedException('Sesi tidak valid atau sudah berakhir.');
    return user;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (!user) throw new UnauthorizedException();

    const role = user.globalRole as GlobalRole;
    const targets = [context.getHandler(), context.getClass()];

    const restricted = this.reflector.getAllAndOverride<boolean>('playerRestricted', targets);
    if (restricted && role === GlobalRole.PLAYER) {
      throw new ForbiddenException('Akses workspace admin tidak tersedia untuk role Player.');
    }

    const required = this.reflector.getAllAndOverride<Permission[]>('permissions', targets);
    if (!required || required.length === 0) return true;

    const allowed = required.every((permission) => hasPermission(role, permission));
    if (!allowed) throw new ForbiddenException('Anda tidak memiliki izin untuk aksi ini.');
    return true;
  }
}
