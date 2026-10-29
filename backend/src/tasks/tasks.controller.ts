import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import { CurrentUser, RequirePermissions } from '../rbac/permissions.decorator';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { PermissionAction, PermissionResource } from '../rbac/permissions.catalog';
import { CreateTaskInput, TasksService } from './tasks.service';

/**
 * وحدة المهام — الإسناد والإتمام.
 * البارِع والمساعد والكاتب ينشئون؛ التلميذ يقرأ مهامه ويتمّها؛
 * الإسناد (تعيين محامٍ على مهمة) للبارِع غالبًا.
 */
@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Post()
  @RequirePermissions({ resource: PermissionResource.TASKS, action: PermissionAction.CREATE })
  create(@Body() dto: CreateTaskInput, @CurrentUser() user: RequestUser) {
    return this.tasks.create(dto, user);
  }

  @Get()
  @RequirePermissions({ resource: PermissionResource.TASKS, action: PermissionAction.READ })
  list(@CurrentUser() user: RequestUser) {
    return this.tasks.list(user);
  }

  @Patch(':id/complete')
  @RequirePermissions({ resource: PermissionResource.TASKS, action: PermissionAction.UPDATE })
  complete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    return this.tasks.complete(id, user);
  }
}