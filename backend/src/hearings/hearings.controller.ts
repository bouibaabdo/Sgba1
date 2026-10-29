import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import { CurrentUser, RequirePermissions } from '../rbac/permissions.decorator';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { PermissionAction, PermissionResource } from '../rbac/permissions.catalog';
import { CreateHearingInput, HearingsService } from './hearings.service';

/**
 * وحدة الجلسات. الكاتب يملك HEARINGS:CREATE/READ/UPDATE/DELETE —
 * يضيف الجلسات ويسجل المقررات، بينما لا يرى المالية إطلاقًا.
 */
@Controller('hearings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HearingsController {
  constructor(private hearings: HearingsService) {}

  @Post()
  @RequirePermissions({ resource: PermissionResource.HEARINGS, action: PermissionAction.CREATE })
  create(@Body() dto: CreateHearingInput, @CurrentUser() user: RequestUser) {
    return this.hearings.create(dto, user);
  }

  @Get()
  @RequirePermissions({ resource: PermissionResource.HEARINGS, action: PermissionAction.READ })
  list(@CurrentUser() user: RequestUser) {
    return this.hearings.list(user);
  }

  @Patch(':id/decision')
  @RequirePermissions({ resource: PermissionResource.HEARINGS, action: PermissionAction.UPDATE })
  recordDecision(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { decision?: string; nextStep?: string; status?: string },
    @CurrentUser() user: RequestUser,
  ) {
    return this.hearings.recordDecision(id, dto, user);
  }
}