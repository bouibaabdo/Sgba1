# SGBA-ERP — نظام تدبير مكاتب المحاماة (المغرب)

نسخة أصلية (Clone وظيفي، لا نسخ مواد محمية) من منظومة إدارة مكتب محاماة مغربي على غرار وظائف sgba.ma.

> **ملاحظة قانونية:** نبني وظائف ومفاهيم (غير محمية) بكود أصلي 100%. لا تُنسخ نصوص تسويقية أو صور أو أصول من الموقع الأصلي.

## حالة المراحل

| المرحلة | المحتوى | الحالة |
|---|---|---|
| 1 | البنية المعمارية + RBAC صارم + Seeder المحاكم + حقول الأرشفة المادية | **قيد التنفيذ — النواة جاهزة** |
| 2 | الواجهات كثيفة البيانات (جداول، نماذج متعددة الخطوات، بحث شامل) | بانتظار لقطات التطبيق الداخلي |
| 3 | المخطط العلائقي الكامل (Dossiers, Audiences, Contacts...) | هيكل أولي في `schema.prisma` |
| 4 | محرك سير عمل دورة حياة الملف + إسناد المهام | لاحقًا |
| 5 | DMS + مولّد "الرول" + التتبع المالي (Provisions) | لاحقًا |

## بنية المستودع (المرحلة 1)

```
sgba-erp/
├── docs/
│   ├── ARCHITECTURE.md        قرارات المكدس والبنية
│   └── RBAC-MATRIX.md         مصفوفة الصلاحيات الكاملة
├── backend/                   NestJS 12 + Express 5 + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma      Users/Roles/Permissions + Courts + Case (هيكل أولي)
│   │   └── seed.ts            أدوار + صلاحيات + مستخدم مدير + هيكلة المحاكم المغربية
│   └── src/
│       ├── auth/              JWT strategy + guard
│       └── rbac/              كتالوج الصلاحيات + Decorator + Guard صارم + Service
├── web/                       Next.js 16 + React 19 + Ant Design (واجهة RTL)
└── index.js                   مشغّل الواجهة وواجهة API محليًا
```

## الإعداد والتشغيل محليًا

يتطلب المشروع Node.js 20.11 أو أحدث.

```powershell
docker compose up -d

if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path web/.env.local)) { Copy-Item web/.env.local.example web/.env.local }

# اضبط JWT_SECRET العشوائي وSEED_ADMIN_PASSWORD في backend/.env
npm --prefix backend install
npm --prefix web install

Push-Location backend
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
Pop-Location

# يشغّل API على 3000 والواجهة على 3001
npm run dev
```

يجب أن يحتوي `JWT_SECRET` على 32 بايت عشوائية على الأقل، وأن تكون `SEED_ADMIN_PASSWORD` فريدة وبطول 12 حرفًا على الأقل. يقرأ الـAPI والـSeeder ملف `backend/.env` عند التشغيل.
