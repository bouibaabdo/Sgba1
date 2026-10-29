import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestUser } from '../auth/types';
import {
  PermissionScope,
  PermissionSpec,
  SCOPE_RANK,
} from './permissions.catalog';
import { PERMISSIONS_KEY, SKIP_PERMISSIONS_KEY } from './permissions.decorator';
import { RbacService } from './rbac.service';

/**
 * خط الدفاع الثاني (بعد فك JWT): يرفض أي طلب لا يملك مستخدمه كل الصلاحيات
 * المعلنة على المسار. يفشل مغلوقًا (403) — لا مسارات صامتة.
 *
 * منطق النطاق: الصلاحية المملوكة تُرضي المطلوبة إذا كان نطاقها >= النطاق المطلوب
 * (ALL=3 يرضي ASSIGNED=2 يرضي OWN=1). الفلترة الفعلية للصفوف (ماذا يرى فقط) تتم
 * في الـ services عبر RbacService.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSIONS_KEY, targets)) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<PermissionSpec[] | undefined>(
      PERMISSIONS_KEY,
      targets,
    );
    if (!required || required.length === 0) {
      throw new ForbiddenException({
        code: 'PERMISSION_POLICY_MISSING',
        message: 'لم تُحدد صلاحيات هذا المسار',
      });
    }

    const request = context.switchToHttp().getRequest();
    const user: RequestUser | undefined = request.user;
    if (!user) {
      throw new ForbiddenException('غير مصادق');
    }

    const owned = await this.rbac.getRolePermissions(user.roleCode);

    const missing = required.filter(
      (req) =>
        !owned.some(
          (o) =>
            o.resource === req.resource &&
            o.action === req.action &&
            SCOPE_RANK[o.scope ?? PermissionScope.OWN] >=
            SCOPE_RANK[req.scope ?? PermissionScope.ALL],
        ),
    );

    if (missing.length > 0) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSION',
        message: 'لا تملك الصلاحية اللازمة لهذه العملية',
        missing: missing.map(
          (m) => `${m.resource}:${m.action}:${m.scope ?? PermissionScope.ALL}`,
        ),
      });
    }
    return true;
  }
}
