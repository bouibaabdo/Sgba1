import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CaseStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import {
  CurrentUser,
  RequirePermissions,
} from '../rbac/permissions.decorator';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { PermissionAction, PermissionResource } from '../rbac/permissions.catalog';
import { CasesService, CreateCaseInput } from './cases.service';

/**
 * وحدة الملفات — كل مسار مغيّر للحالة يحمل:
 *   @UseGuards(JwtAuthGuard, PermissionsGuard)   (فك JWT ثم فحص الصلاحيات)
 *   @RequirePermissions(...)                     (المورد × الفعل المطلوب)
 * الكاتب مثلاً يملك CASES:CREATE/UPDATE لكن لا CASES:DELETE → وصوله للحذف مرفوض 403.
 */
@Controller('cases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CasesController {
  constructor(private cases: CasesService) {}

  @Post()
  @RequirePermissions({ resource: PermissionResource.CASES, action: PermissionAction.CREATE })
  create(@Body() dto: CreateCaseInput, @CurrentUser() user: RequestUser) {
    return this.cases.create(dto, user);
  }

  @Get()
  @RequirePermissions({ resource: PermissionResource.CASES, action: PermissionAction.READ })
  list(@CurrentUser() user: RequestUser) {
    return this.cases.list(user);
  }

  @Get(':id')
  @RequirePermissions({ resource: PermissionResource.CASES, action: PermissionAction.READ })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser) {
    return this.cases.findOne(id, user);
  }

  @Patch(':id/status')
  @RequirePermissions({ resource: PermissionResource.CASES, action: PermissionAction.UPDATE })
  transition(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: CaseStatus },
    @CurrentUser() user: RequestUser,
  ) {
    return this.cases.transition(id, body.status, user);
  }
}