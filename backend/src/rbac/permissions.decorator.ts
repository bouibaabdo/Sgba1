import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { PermissionSpec } from './permissions.catalog';
import { RequestUser } from '../auth/types';

/** مفتاح الميتاداتا: الصلاحيات المطلوبة على المسار */
export const PERMISSIONS_KEY = 'required_permissions';
/** تخطي فحص الصلاحيات (للمسارات المحمية بالمصادقة فقط) */
export const SKIP_PERMISSIONS_KEY = 'skip_permissions';

/**
 * يُعلن الصلاحيات المطلوبة على المسار — تُقرأ وقت الطلب بواسطة PermissionsGuard.
 * المفاتيح ثابتة وقت الإقلاع، لذا يكون الفحص لاحقًا O(n) على مصفوفة صغيرة.
 *
 * مثال:
 *   @RequirePermissions({ resource: PermissionResource.FINANCE, action: PermissionAction.READ })
 */
export const RequirePermissions = (...specs: PermissionSpec[]) =>
  SetMetadata(PERMISSIONS_KEY, specs);

/** مسارات لا تحتاج فحص RBAC؛ يظل فحص المصادقة مستقلًا عن هذا الحارس */
export const SkipPermissions = () => SetMetadata(SKIP_PERMISSIONS_KEY, true);

/** يستخرج المستخدم الحالي من الطلب (يضعه JwtAuthGuard) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser =>
    ctx.switchToHttp().getRequest().user,
);
