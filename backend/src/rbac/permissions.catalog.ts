/**
 * كتالوج الصلاحيات — المصدر الوحيد للحقيقة (Single Source of Truth).
 * يُستهلك في: Guards (الخادم) + قوائم الواجهة (لاحقًا عبر /auth/me) + الـ Seeder.
 * التوثيق البشري: docs/RBAC-MATRIX.md
 */

export enum PermissionResource {
  USERS = 'USERS', // إدارة المستخدمين
  ROLES = 'ROLES', // الأدوار
  CASES = 'CASES', // الملفات
  HEARINGS = 'HEARINGS', // الجلسات
  TASKS = 'TASKS', // المهام
  CLIENTS = 'CLIENTS', // الزبناء
  CONTACTS = 'CONTACTS', // المتراسلون (أطراف أخرى / زملاء محامون / القضاة)
  DOCUMENTS = 'DOCUMENTS', // الوثائق (DMS — المرحلة 5)
  FINANCE = 'FINANCE', // المالية (Provisions / الأتعاب)
  REPORTS = 'REPORTS', // التقارير
  AUDIT = 'AUDIT', // سجل التدقيق
  SETTINGS = 'SETTINGS', // إعدادات المكتب
}

export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  ASSIGN = 'ASSIGN', // إسناد ملف/مهمة لمستخدم آخر
  ARCHIVE = 'ARCHIVE', // أرشفة (رقمية أو تحديث موقع الأرشفة المادية)
}

/** النطاق تراكمي: ما يسمح به الأضيق يسمح به الأوسع */
export enum PermissionScope {
  OWN = 'OWN', // سجلاته هو فقط
  ASSIGNED = 'ASSIGNED', // الملفات المسندة إليه
  ALL = 'ALL', // كل سجلات المكتب
}

export const SCOPE_RANK: Record<PermissionScope, number> = {
  [PermissionScope.OWN]: 1,
  [PermissionScope.ASSIGNED]: 2,
  [PermissionScope.ALL]: 3,
};

export enum RoleCode {
  LEAD_LAWYER = 'LEAD_LAWYER', // المحامي البارِع (صاحب المكتب)
  ASSOCIATE = 'ASSOCIATE', // محامٍ مساعد
  TRAINEE = 'TRAINEE', // محامي متدرب (تلميذ)
  SECRETARY = 'SECRETARY', // كاتب(ة) المكتب
  ACCOUNTANT = 'ACCOUNTANT', // محاسب(ة) المكتب
}

export const ROLE_NAMES: Record<RoleCode, { ar: string; fr: string }> = {
  [RoleCode.LEAD_LAWYER]: { ar: 'المحامي البارِع', fr: 'Avocat principal' },
  [RoleCode.ASSOCIATE]: { ar: 'محامٍ مساعد', fr: 'Avocat associé' },
  [RoleCode.TRAINEE]: { ar: 'محامي متدرب (تلميذ)', fr: 'Avocat stagiaire' },
  [RoleCode.SECRETARY]: { ar: 'كاتب(ة) المكتب', fr: 'Secrétaire' },
  [RoleCode.ACCOUNTANT]: { ar: 'محاسب(ة) المكتب', fr: 'Comptable' },
};

export interface PermissionSpec {
  resource: PermissionResource;
  action: PermissionAction;
  scope?: PermissionScope; // الافتراضي ALL
}

const p = (
  resource: PermissionResource,
  action: PermissionAction,
  scope: PermissionScope = PermissionScope.ALL,
): PermissionSpec => ({ resource, action, scope });

export const ROLE_DEFINITIONS: Record<RoleCode, PermissionSpec[]> = {
  // ─── البارِع: كل شيء ───
  [RoleCode.LEAD_LAWYER]: [
    p(PermissionResource.USERS, PermissionAction.CREATE),
    p(PermissionResource.USERS, PermissionAction.READ),
    p(PermissionResource.USERS, PermissionAction.UPDATE),
    p(PermissionResource.ROLES, PermissionAction.READ),
    p(PermissionResource.ROLES, PermissionAction.UPDATE),
    p(PermissionResource.CASES, PermissionAction.CREATE),
    p(PermissionResource.CASES, PermissionAction.READ),
    p(PermissionResource.CASES, PermissionAction.UPDATE),
    p(PermissionResource.CASES, PermissionAction.DELETE),
    p(PermissionResource.CASES, PermissionAction.ASSIGN),
    p(PermissionResource.CASES, PermissionAction.ARCHIVE),
    p(PermissionResource.HEARINGS, PermissionAction.CREATE),
    p(PermissionResource.HEARINGS, PermissionAction.READ),
    p(PermissionResource.HEARINGS, PermissionAction.UPDATE),
    p(PermissionResource.HEARINGS, PermissionAction.DELETE),
    p(PermissionResource.TASKS, PermissionAction.CREATE),
    p(PermissionResource.TASKS, PermissionAction.READ),
    p(PermissionResource.TASKS, PermissionAction.UPDATE),
    p(PermissionResource.TASKS, PermissionAction.DELETE),
    p(PermissionResource.TASKS, PermissionAction.ASSIGN),
    p(PermissionResource.CLIENTS, PermissionAction.CREATE),
    p(PermissionResource.CLIENTS, PermissionAction.READ),
    p(PermissionResource.CLIENTS, PermissionAction.UPDATE),
    p(PermissionResource.CLIENTS, PermissionAction.DELETE),
    p(PermissionResource.CONTACTS, PermissionAction.CREATE),
    p(PermissionResource.CONTACTS, PermissionAction.READ),
    p(PermissionResource.CONTACTS, PermissionAction.UPDATE),
    p(PermissionResource.CONTACTS, PermissionAction.DELETE),
    p(PermissionResource.DOCUMENTS, PermissionAction.CREATE),
    p(PermissionResource.DOCUMENTS, PermissionAction.READ),
    p(PermissionResource.DOCUMENTS, PermissionAction.UPDATE),
    p(PermissionResource.DOCUMENTS, PermissionAction.DELETE),
    p(PermissionResource.DOCUMENTS, PermissionAction.EXPORT),
    p(PermissionResource.FINANCE, PermissionAction.CREATE),
    p(PermissionResource.FINANCE, PermissionAction.READ),
    p(PermissionResource.FINANCE, PermissionAction.UPDATE),
    p(PermissionResource.FINANCE, PermissionAction.EXPORT),
    p(PermissionResource.REPORTS, PermissionAction.READ),
    p(PermissionResource.REPORTS, PermissionAction.EXPORT),
    p(PermissionResource.AUDIT, PermissionAction.READ),
    p(PermissionResource.SETTINGS, PermissionAction.READ),
    p(PermissionResource.SETTINGS, PermissionAction.UPDATE),
  ],

  // ─── المساعد: يقرأ كل الملفات، يعدّل المسندة إليه، بلا مالية ولا مستخدمين ───
  [RoleCode.ASSOCIATE]: [
    p(PermissionResource.CASES, PermissionAction.CREATE),
    p(PermissionResource.CASES, PermissionAction.READ),
    p(PermissionResource.CASES, PermissionAction.UPDATE, PermissionScope.ASSIGNED),
    p(PermissionResource.HEARINGS, PermissionAction.CREATE),
    p(PermissionResource.HEARINGS, PermissionAction.READ),
    p(PermissionResource.HEARINGS, PermissionAction.UPDATE, PermissionScope.ASSIGNED),
    p(PermissionResource.TASKS, PermissionAction.CREATE),
    p(PermissionResource.TASKS, PermissionAction.READ),
    p(PermissionResource.TASKS, PermissionAction.UPDATE, PermissionScope.ASSIGNED),
    p(PermissionResource.CLIENTS, PermissionAction.CREATE),
    p(PermissionResource.CLIENTS, PermissionAction.READ),
    p(PermissionResource.CLIENTS, PermissionAction.UPDATE),
    p(PermissionResource.CONTACTS, PermissionAction.CREATE),
    p(PermissionResource.CONTACTS, PermissionAction.READ),
    p(PermissionResource.CONTACTS, PermissionAction.UPDATE),
    p(PermissionResource.DOCUMENTS, PermissionAction.CREATE),
    p(PermissionResource.DOCUMENTS, PermissionAction.READ),
    p(PermissionResource.DOCUMENTS, PermissionAction.UPDATE, PermissionScope.ASSIGNED),
    p(PermissionResource.DOCUMENTS, PermissionAction.EXPORT),
  ],

  // ─── التلميذ: قراءة المسند إليه + إنشاء مسودات، بلا حذف ولا مالية ───
  [RoleCode.TRAINEE]: [
    p(PermissionResource.CASES, PermissionAction.CREATE),
    p(PermissionResource.CASES, PermissionAction.READ, PermissionScope.ASSIGNED),
    p(PermissionResource.HEARINGS, PermissionAction.READ, PermissionScope.ASSIGNED),
    p(PermissionResource.TASKS, PermissionAction.READ, PermissionScope.OWN),
    p(PermissionResource.TASKS, PermissionAction.UPDATE, PermissionScope.OWN),
    p(PermissionResource.CLIENTS, PermissionAction.READ),
    p(PermissionResource.CONTACTS, PermissionAction.READ),
    p(PermissionResource.DOCUMENTS, PermissionAction.CREATE, PermissionScope.OWN),
    p(PermissionResource.DOCUMENTS, PermissionAction.READ, PermissionScope.ASSIGNED),
    p(PermissionResource.DOCUMENTS, PermissionAction.UPDATE, PermissionScope.OWN),
  ],

  // ─── الكاتب: إدخال وتحديث كامل للملفات والجلسات والزبناء — ولا إذن FINANCE إطلاقًا ───
  [RoleCode.SECRETARY]: [
    p(PermissionResource.CASES, PermissionAction.CREATE),
    p(PermissionResource.CASES, PermissionAction.READ),
    p(PermissionResource.CASES, PermissionAction.UPDATE),
    p(PermissionResource.CASES, PermissionAction.ARCHIVE), // يودع الملفات الورقية في الخزائن
    p(PermissionResource.HEARINGS, PermissionAction.CREATE),
    p(PermissionResource.HEARINGS, PermissionAction.READ),
    p(PermissionResource.HEARINGS, PermissionAction.UPDATE),
    p(PermissionResource.HEARINGS, PermissionAction.DELETE),
    p(PermissionResource.TASKS, PermissionAction.CREATE),
    p(PermissionResource.TASKS, PermissionAction.READ),
    p(PermissionResource.TASKS, PermissionAction.UPDATE),
    p(PermissionResource.CLIENTS, PermissionAction.CREATE),
    p(PermissionResource.CLIENTS, PermissionAction.READ),
    p(PermissionResource.CLIENTS, PermissionAction.UPDATE),
    p(PermissionResource.CONTACTS, PermissionAction.CREATE),
    p(PermissionResource.CONTACTS, PermissionAction.READ),
    p(PermissionResource.CONTACTS, PermissionAction.UPDATE),
    p(PermissionResource.DOCUMENTS, PermissionAction.CREATE),
    p(PermissionResource.DOCUMENTS, PermissionAction.READ),
    p(PermissionResource.DOCUMENTS, PermissionAction.UPDATE),
    p(PermissionResource.DOCUMENTS, PermissionAction.EXPORT),
  ],

  // ─── المحاسب: المالية كاملة + قراءة الملفات والزبناء فقط ───
  [RoleCode.ACCOUNTANT]: [
    p(PermissionResource.FINANCE, PermissionAction.CREATE),
    p(PermissionResource.FINANCE, PermissionAction.READ),
    p(PermissionResource.FINANCE, PermissionAction.UPDATE),
    p(PermissionResource.FINANCE, PermissionAction.EXPORT),
    p(PermissionResource.CASES, PermissionAction.READ),
    p(PermissionResource.CLIENTS, PermissionAction.READ),
    p(PermissionResource.REPORTS, PermissionAction.READ),
    p(PermissionResource.REPORTS, PermissionAction.EXPORT),
  ],
};
