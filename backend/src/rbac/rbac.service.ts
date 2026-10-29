import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PermissionAction,
  PermissionResource,
  PermissionScope,
  PermissionSpec,
  RoleCode,
} from './permissions.catalog';

/**
 * يجلب صلاحيات دورٍ ما من قاعدة البيانات (مع كاش بالذاكرة).
 * الكاش ضروري لأن Guard يُستدعى في كل طلب؛ استدعِ clearCache() بعد أي تعديل أدوار.
 */
@Injectable()
export class RbacService {
  private cache = new Map<RoleCode, PermissionSpec[]>();

  constructor(private prisma: PrismaService) {}

  async getRolePermissions(code: RoleCode): Promise<PermissionSpec[]> {
    const hit = this.cache.get(code);
    if (hit) return hit;

    const role = await this.prisma.role.findUnique({
      where: { code },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role || !role.isActive) return [];

    const specs = role.permissions.map((rp) => ({
      resource: rp.permission.resource as PermissionResource,
      action: rp.permission.action as PermissionAction,
      scope: rp.permission.scope as PermissionScope,
    }));

    this.cache.set(code, specs);
    return specs;
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * شرط النطاق على مستوى الصفوف — يستخدمه الـ services لفلترة استعلامات Prisma.
   * مثال: قائمة ملفات المساعد = CASES التي leadLawyerId = هو أو ضمن فريقه (حسب النطاق).
   */
  scopeFilter(
    scope: PermissionScope,
    userId: number,
  ): { leadLawyerId: number } | Record<string, never> {
    if (scope === PermissionScope.ALL) return {};
    if (scope === PermissionScope.ASSIGNED) return { leadLawyerId: userId };
    return { leadLawyerId: userId }; // OWN: يُخصص لاحقًا بـ createdById عندما تُضاف حقول التتبع
  }
}
