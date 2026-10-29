# مرحلة 3 — المخطط العلائقي + الوحدات الخلفية

## ما أُنجز

### المخطط (schema.prisma) — أُضيف لموديلات المرحلة 1
- **Hearing** (الجلسات): التاريخ/الوقت، القاعة، محكمة الجلسة، الغرض، **المقرر (decision)**، الخطوة الموالية، الحالة، المحامي المكلف. فهارس على `scheduledAt` و`status`.
- **Contact** (المتراسلون): الأطراف المقابلة، الزملاء المحامون (Confrères)، القضاة — مع رقم القيد بالهيئة.
- **CaseContact**: ربط أطراف الدعوى بملف معيّن (دور الطرف في هذا الملف).
- علاقة جديدة في `User` و`Court` لإكمال الجانب المقابل.

### وحدات خلفية كاملة (NestJS)
| الوحدة | المسارات | أبرز المنطق |
|---|---|---|
| `cases` | `POST /cases`، `GET /cases`، `GET /cases/:id`، `PATCH /cases/:id/status` | **دورة الحالة** بالحالات الانتقالية المسموحة (مصفوفة `ALLOWED_TRANSITIONS`)؛ إنشاء الزبون مع فتح الملف؛ نطاق الصلاحيات (ALL/ASSIGNED) على مستوى الصف؛ سجل تدقيق |
| `hearings` | `POST /hearings`، `GET /hearings`، `PATCH /hearings/:id/decision` | تسجيل مقرر الجلسة والخطوة الموالية؛ الكاتب يعمل بكامل صلاحية الجلسات |
| `clients` | `POST /clients`، `GET /clients`، `GET /clients/:id` | البحث بالاسم، عدد ملفات كل زبون، تفاصيل الزبون مع ملفاته ومحاكمها |

### الأمان
- كل مسار مغيّر للحالة: `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions(resource, action)`.
- فحص النطاق في الـ services (الملف خارج صلاحيتك = 403) + سجل تدقيق لكل عملية.

## التحقق
- `npx prisma validate` → **صالح**
- `npx prisma generate` → **تم**
- `npx tsc --noEmit` → **0 أخطاء** (أصلحت 3 أخطاء نوع ظهرت)

## التنبيه (غير منفَّذ حتى الآن)
`migrate dev` + `seed` الفعليان لم يُنفَّذا — لا PostgreSQL في هذه البيئة (لا Docker، ولا خدمة). عند تشغيلها:
```bash
cd sgba-erp && docker compose up -d
cd backend && npx prisma migrate dev --name phase3 && npm run prisma:seed && npm run start:dev
```