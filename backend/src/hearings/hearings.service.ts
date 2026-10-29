import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../auth/types';
import { PermissionAction, PermissionResource } from '../rbac/permissions.catalog';
import { RbacService } from '../rbac/rbac.service';

export interface CreateHearingInput {
  caseId: number;
  scheduledAt: string; // ISO
  room?: string;
  courtId?: number;
  purpose?: string;
  lawyerId?: number;
}

@Injectable()
export class HearingsService {
  constructor(
    private prisma: PrismaService,
    private rbac: RbacService,
  ) {}

  async create(dto: CreateHearingInput, user: RequestUser) {
    await this.assertPermission(user, PermissionAction.CREATE);

    const data: Prisma.HearingCreateInput = {
      scheduledAt: new Date(dto.scheduledAt),
      room: dto.room,
      purpose: dto.purpose,
      case: { connect: { id: dto.caseId } },
      ...(dto.courtId ? { court: { connect: { id: dto.courtId } } } : {}),
      ...(dto.lawyerId
        ? { lawyer: { connect: { id: dto.lawyerId } } }
        : { lawyer: { connect: { id: user.id } } }),
    };

    const created = await this.prisma.hearing.create({ data });
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'HEARING_CREATE',
        resource: 'HEARINGS',
        resourceId: String(created.id),
        meta: { caseId: dto.caseId, scheduledAt: dto.scheduledAt } as Prisma.InputJsonValue,
      },
    });
    return created;
  }

  /** جلسات نطاق المستخدم (قادمة أو كلها) */
  async list(user: RequestUser) {
    await this.assertPermission(user, PermissionAction.READ);
    return this.prisma.hearing.findMany({
      orderBy: { scheduledAt: 'asc' },
      include: {
        case: { select: { id: true, internalRef: true, title: true } },
        court: true,
        lawyer: { select: { id: true, fullName: true } },
      },
    });
  }

  /** تسجيل مقرر الجلسة والخطوة الموالية — خاص بالكاتب والبارِع غالبًا */
  async recordDecision(
    id: number,
    dto: { decision?: string; nextStep?: string; status?: string },
    user: RequestUser,
  ) {
    await this.assertPermission(user, PermissionAction.UPDATE);
    const updated = await this.prisma.hearing.update({
      where: { id },
      data: {
        decision: dto.decision,
        nextStep: dto.nextStep,
        status: dto.status,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'HEARING_DECISION',
        resource: 'HEARINGS',
        resourceId: String(id),
        meta: { status: dto.status } as Prisma.InputJsonValue,
      },
    });
    return updated;
  }

  private async assertPermission(user: RequestUser, action: PermissionAction) {
    const perm = await this.rbac.getRolePermissions(user.roleCode);
    const ok = perm.some((p) => p.resource === PermissionResource.HEARINGS && p.action === action);
    if (!ok) throw new ForbiddenException('لا تملك صلاحية الجلسات');
  }
}