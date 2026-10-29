import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import { CurrentUser, RequirePermissions } from '../rbac/permissions.decorator';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { PermissionAction, PermissionResource } from '../rbac/permissions.catalog';
import { ClientsService, CreateClientInput } from './clients.service';

/**
 * وحدة الزبناء. الكاتب والمساعد والبارِع ينشئون ويحدّثون؛ المحاسب يقرأ فقط.
 */
@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private clients: ClientsService) {}

  @Post()
  @RequirePermissions({ resource: PermissionResource.CLIENTS, action: PermissionAction.CREATE })
  create(@Body() dto: CreateClientInput) {
    return this.clients.create(dto);
  }

  @Get()
  @RequirePermissions({ resource: PermissionResource.CLIENTS, action: PermissionAction.READ })
  list() {
    return this.clients.list();
  }

  @Get(':id')
  @RequirePermissions({ resource: PermissionResource.CLIENTS, action: PermissionAction.READ })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clients.findOne(id);
  }
}