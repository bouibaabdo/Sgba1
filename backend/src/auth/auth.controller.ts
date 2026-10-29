import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, SkipPermissions } from '../rbac/permissions.decorator';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequestUser } from './types';

type AuthRequestBody =
  | { email?: unknown; password?: unknown; refreshToken?: unknown }
  | null
  | undefined;

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @SkipPermissions()
  @HttpCode(HttpStatus.OK)
  login(@Body() body: AuthRequestBody) {
    return this.auth.login(body?.email, body?.password);
  }

  @Post('refresh')
  @SkipPermissions()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: AuthRequestBody) {
    return this.auth.refresh(body?.refreshToken);
  }

  @Post('logout')
  @SkipPermissions()
  @HttpCode(HttpStatus.OK)
  logout(@Body() body: AuthRequestBody) {
    return this.auth.logout(body?.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @SkipPermissions()
  me(@CurrentUser() user: RequestUser) {
    return this.auth.me(user);
  }
}
