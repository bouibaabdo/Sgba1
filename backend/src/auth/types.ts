import { RoleCode } from '../rbac/permissions.catalog';

/** مطالبات توكن الوصول */
export interface JwtPayload {
  sub: number; // userId
  email: string;
  fullName: string;
  roleCode: RoleCode;
}

/** المستخدم المرفق بالطلب بعد التحقق */
export interface RequestUser {
  id: number;
  email: string;
  fullName: string;
  roleCode: RoleCode;
}
