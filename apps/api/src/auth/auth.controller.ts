import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './decorators';
import { deviceFingerprint } from '../common/crypto.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email: string; password: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body.email, body.password, {
      ip: req.ip,
      device: deviceFingerprint(req),
      deviceId: req.headers['x-device-id'] as string | undefined,
    });
    res.cookie('nexus_refresh', result.refreshToken, {
      httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000,
      path: '/api/auth',
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('register')
  async register(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(body);
    res.cookie('nexus_refresh', result.refreshToken, {
      httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000, path: '/api/auth',
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request) {
    const token = req.cookies?.['nexus_refresh'] || req.body?.refreshToken;
    return this.auth.refresh(token);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('nexus_refresh', { path: '/api/auth' });
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: any) {
    return user;
  }
}
