import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CaseStatus, CaseType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../auth/types';
import { PermissionAction, PermissionResource, PermissionScope } from '../rbac/permissions.catalog';
import { RbacService } from '../rbac/rbac.service';

export interface CreateCaseInput {
  internalRef: string;
  courtRef?: string;
  title: string;
  type: CaseType;
  courtId?: number;
  leadLawyerId?: number;
  client: {
    kind?: string;
    fullNameAr: string;
    fullNameFr?: string;
    phone?: string;
    email?: string;
    cin?: string;
  };
  archive?: {
    cabinet?: string;
    shelf?: string;
    box?: string;
    notes?: string;
  };
}

/**
 * دورة حياة الملف — الحالات الانتقالية المسموحة. التدفق خطي عام مع
 * إمكانية إعادة فتح ملف مغلق. تُتحقَّق في transitionCase.
 */
const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN: ['IN_PROGRESS', 'ARCHIVED'],
  IN_PROGRESS: ['DELIBERATION', 'CLOSED', 'OPEN'],
  DELIBERATION: ['JUDGMENT_RENDERED', 'IN_PROGRESS'],
  JUDGMENT_RENDERED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['ARCHIVED', 'OPEN'],
  ARCHIVED: ['OPEN'], // إعادة فتح ملف مؤرشف
};

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private rbac: RbacService,
  ) {}

  async create(dto: CreateCaseInput, user: RequestUser) {
    await this.assertPermission(user, PermissionAction.CREATE);

    const existing = await this.prisma.case.findUnique({
      where: { internalRef: dto.internalRef },
    });
    if (existing) {
      throw new BadRequestException(`المرجع الداخلي ${dto.internalRef} مستعمل بالفعل`);
    }

    // الزبون: نبحث عنه بالاسم، وإلا ننشئه (إنشاء الزبون جزء من فتح الملف)
    const existingClient = await this.prisma.client.findFirst({
      where: { fullNameAr: dto.client.fullNameAr },
    });
    const client = existingClient ?? (await this.prisma.client.create({
      data: {
        kind: dto.client.kind ?? 'PERSON',
        fullNameAr: dto.client.fullNameAr,
        fullNameFr: dto.client.fullNameFr,
        phone: dto.client.phone,
        email: dto.client.email,
        cin: dto.client.cin,
      },
    }));

    const data: Prisma.CaseCreateInput = {
      internalRef: dto.internalRef,
      courtRef: dto.courtRef,
      title: dto.title,
      type: dto.type,
      status: CaseStatus.OPEN,
      client: { connect: { id: client.id } },
      ...(dto.courtId ? { court: { connect: { id: dto.courtId } } } : {}),
      ...(dto.leadLawyerId
        ? { leadLawyer: { connect: { id: dto.leadLawyerId } } }
        : { leadLawyer: { connect: { id: user.id } } }),
      archiveCabinet: dto.archive?.cabinet,
      archiveShelf: dto.archive?.shelf,
      archiveBox: dto.archive?.box,
      archiveNotes: dto.archive?.notes,
    };

    const created = await this.prisma.case.create({ data });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CASE_CREATE',
        resource: 'CASES',
        resourceId: String(created.id),
        meta: { internalRef: created.internalRef } as Prisma.InputJsonValue,
      },
    });

    return created;
  }

  /** قائمة الملفات مع فلترة النطاق وفق صلاحية القارئ */
  async list(user: RequestUser) {
    const perm = await this.rbac.getRolePermissions(user.roleCode);
    const read = perm.find(
      (p) => p.resource === PermissionResource.CASES && p.action === PermissionAction.READ,
    );

    // بلا صلاحية قراءة الملفات = لا شيء (403 يُرمى في الـ controller عبر الفحص المسبق،
    // لكن هنا حماية إضافية عند الاستدعاء المباشر)
    if (!read) throw new ForbiddenException('لا تملك صلاحية قراءة الملفات');

    const where: Prisma.CaseWhereInput =
      read.scope === PermissionScope.ALL
        ? {}
        : { leadLawyerId: user.id };

    return this.prisma.case.findMany({
      where,
      orderBy: { internalRef: 'desc' },
      include: { client: true, court: true, leadLawyer: { select: { id: true, fullName: true } } },
    });
  }

  async findOne(id: number, user: RequestUser) {
    const c = await this.prisma.case.findUnique({
      where: { id },
      include: { client: true, court: true, leadLawyer: { select: { id: true, fullName: true } } },
    });
    if (!c) throw new NotFoundException('الملف غير موجود');
    await this.assertReadScope(c, user);
    return c;
  }

  /** انتقال الحالة — يتحقق من مسموحية المسار ومن نطاق التعديل */
  async transition(id: number, to: CaseStatus, user: RequestUser) {
    await this.assertPermission(user, PermissionAction.UPDATE);
    const c = await this.prisma.case.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('الملف غير موجود');
    await this.assertWriteScope(c, user);

    const allowed = ALLOWED_TRANSITIONS[c.status] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `لا يمكن الانتقال من ${c.status} إلى ${to} مباشرة. المسارات المسموحة: ${allowed.join(', ')}`,
      );
    }

    const updated = await this.prisma.case.update({
      where: { id },
      data: {
        status: to,
        ...(to === CaseStatus.CLOSED ? { closedAt: new Date() } : {}),
        ...(to === CaseStatus.ARCHIVED ? { archivedAt: new Date() } : {}),
        ...(to === CaseStatus.OPEN ? { closedAt: null, archivedAt: null } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CASE_STATUS_CHANGE',
        resource: 'CASES',
        resourceId: String(id),
        meta: { from: c.status, to } as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  private async assertReadScope(c: { leadLawyerId: number | null }, user: RequestUser) {
    const perm = await this.rbac.getRolePermissions(user.roleCode);
    const read = perm.find(
      (p) => p.resource === PermissionResource.CASES && p.action === PermissionAction.READ,
    );
    if (!read || read.scope === PermissionScope.ALL) return;
    if (c.leadLawyerId !== user.id) {
      throw new ForbiddenException('هذا الملف خارج نطاق صلاحيتك');
    }
  }

  private async assertWriteScope(c: { leadLawyerId: number | null }, user: RequestUser) {
    const perm = await this.rbac.getRolePermissions(user.roleCode);
    const upd = perm.find(
      (p) => p.resource === PermissionResource.CASES && p.action === PermissionAction.UPDATE,
    );
    if (!upd) throw new ForbiddenException('لا تملك صلاحية تعديل الملفات');
    if (upd.scope !== PermissionScope.ALL && c.leadLawyerId !== user.id) {
      throw new ForbiddenException('هذا الملف خارج نطاق صلاحيتك');
    }
  }

  private async assertPermission(user: RequestUser, action: PermissionAction) {
    const perm = await this.rbac.getRolePermissions(user.roleCode);
    const ok = perm.some(
      (p) => p.resource === PermissionResource.CASES && p.action === action,
    );
    if (!ok) throw new ForbiddenException(`لا تملك صلاحية ${action} على الملفات`);
  }
}