# مرحلة 1 — بنية المؤسسة والصلاحيات الصارمة (RBAC)

## ما تم إنجازه

| الملف | الدور |
|---|---|
| `docs/ARCHITECTURE.md` | قرارات المكدس (Next.js + AntD / NestJS + Prisma + PostgreSQL) |
| `docs/RBAC-MATRIX.md` | مصفوفة الصلاحيات الكاملة بالعربية |
| `backend/prisma/schema.prisma` | Roles / Permissions / Users / Courts / Case (بأرشفة مادية) / Tasks / AuditLog |
| `backend/prisma/seed.ts` | الأدوار + الصلاحيات + المدير + **هيكلة المحاكم المغربية** (النقض، 21 استئنافًا، تجارية، إدارية، +55 ابتدائية) |
| `backend/src/rbac/permissions.catalog.ts` | المصدر الوحيد للحقيقة: الموارد × الأفعال × النطاقات + تعريف الأدوار الخمسة |
| `backend/src/rbac/permissions.guard.ts` | **Guard صارم**: يفحص كل مسار ويرفض بـ `403 INSUFFICIENT_PERMISSION` مع ذكر المفقود |
| `backend/src/rbac/rbac.service.ts` | جلب الصلاحيات (كاش) + شرط النطاق على الصفوف (OWN/ASSIGNED/ALL) |
| `backend/src/auth/*` | JWT (access 15د + refresh 7أيام بتدوير وsha256) + `/auth/login` `/refresh` `/logout` `/me` |

## القاعدة الذهبية المطبقة

الكاتب يضيف الجلسات (`HEARINGS:CREATE` عنده ✓) لكن **لا يوجد إذن `FINANCE:*` في تعريفه أصلًا** — أي مسار مالي يردّه الـ Guard بـ 403 حتى لو ناداه مباشرة بالـ URL. حماية بالتصميم لا بالاستثناء.

## خطوات التشغيل

```bash
cd backend
cp .env.example .env      # عدّل الأسرار
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

ثم: `POST /auth/login` بمستخدم المدير ← خذ `accessToken` ← `GET /auth/me` سيعيدك بروفايلك **وصلاحيات دورك** (تبني منها الواجهة قوائمها).

## قيد المراجعة / انتظار قرارك

1. ربط المحاكم الابتدائية بالاستئنافات (parentCode) مبني على الدوائر الشائعة — راجعها حسب واقع منطقة مكتبك.
2. اختلاف المصادر حول عدد محاكم الاستئناف التجارية (3 أو 5) — زرعنا 5.
3. هل نضيف دور "محامٍ خارجي (Confrère collaborateur)" بقراءة فقط؟

## التالي (المرحلة 2)

أرسل لقطات شاشة من التطبيق الداخلي (Dashboard، قائمة الملفات، تقويم الجلسات) لأبدأ واجهات Ant Design RTL كثيفة البيانات.
