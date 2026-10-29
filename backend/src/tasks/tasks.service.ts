import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../auth/types';
import { PermissionAction, PermissionResource } from '../rbac/permissions.catalog';
import { RbacService } from '../rbac/rbac.service';

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  caseId?: number;
  assigneeId?: number;
}

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private rbac: RbacService,
  ) {}

  async create(dto: CreateTaskInput, user: RequestUser) {
    await this.assertPermission(user, PermissionAction.CREATE);

    const data: Prisma.TaskCreateInput = {
      title: dto.title,
      description: dto.description,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      creator: { connect: { id: user.id } },
      ...(dto.caseId ? { case: { connect: { id: dto.caseId } } } : {}),
      // إسناد: إن حُدد المعيّن، وإلا تُنسب إلى المستخدم الحالي (مهمة شخصية)
      ...(dto.assigneeId
        ? { assignee: { connect: { id: dto.assigneeId } } }
        : { assignee: { connect: { id: user.id } } }),
    };

    const created = await this.prisma.task.create({ data });
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TASK_CREATE',
        resource: 'TASKS',
        resourceId: String(created.id),
        meta: { assigneeId: dto.assigneeId ?? user.id } as Prisma.InputJsonValue,
      },
    });
    return created;
  }

  /** قائمة المهام حسب النطاق: الكل (lead/secretary) أو المسندة إليه فقط (associate/trainee) */
  async list(user: RequestUser) {
    await this.assertPermission(user, PermissionAction.READ);
    const perm = await this.rbac.getRolePermissions(user.roleCode);
    const read = perm.find(
      (p) => p.resource === PermissionResource.TASKS && p.action === PermissionAction.READ,
    );

    const where: Prisma.TaskWhereInput =
      read?.scope === 'ALL'
        ? {}
        : { OR: [{ assigneeId: user.id }, { creatorId: user.id }] };

    return this.prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        case: { select: { id: true, internalRef: true, title: true } },
        assignee: { select: { id: true, fullName: true } },
        creator: { select: { id: true, fullName: true } },
      },
    });
  }

  /** إتمام مهمة — يسمح بها المسند إليه نفسه أو من يملك TASKS:UPDATE بكل النطاقات */
  async complete(id: number, user: RequestUser) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('المهمة غير موجودة');

    const perm = await this.rbac.getRolePermissions(user.roleCode);
    const upd = perm.find(
      (p) => p.resource === PermissionResource.TASKS && p.action === PermissionAction.UPDATE,
    );
    if (!upd) throw new ForbiddenException('لا تملك صلاحية تحديث المهام');
    const isAssignee = task.assigneeId === user.id;
    if (upd.scope !== 'ALL' && !isAssignee) {
      throw new ForbiddenException('لا يمكنك إتمام مهمة لست مسندًا إليها');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: { isDone: true, doneAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TASK_COMPLETE',
        resource: 'TASKS',
        resourceId: String(id),
        meta: { completedBy: user.id } as Prisma.InputJsonValue,
      },
    });
    return updated;
  }

  private async assertPermission(user: RequestUser, action: PermissionAction) {
    const perm = await this.rbac.getRolePermissions(user.roleCode);
    const ok = perm.some((p) => p.resource === PermissionResource.TASKS && p.action === action);
    if (!ok) throw new ForbiddenException('لا تملك صلاحية المهام');
  }
}