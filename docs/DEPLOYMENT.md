# دليل النشر — SGBA-ERP (Monorepo)

النظام مقسّم إلى 3 مكوّنات، ولكل منها منصة النشر الصحيحة (لأن **الخلفية لا تعمل على Vercel serverless**).

## البنية
```
sgba-erp/
├── web/       # الواجهة (Next.js + Ant Design RTL)   → Vercel
├── backend/   # الخلفية (NestJS + Prisma)            → خادم دائم (Railway/Render)
└── (قاعدة PostgreSQL)                                → مدمجة مع الخادم الدائم
```

---

## 1) نشر الواجهة على Vercel (تعمل بامتياز)
في لوحة Vercel: **Add New Project ← استورد `bouibaabdo/Sgba1`**
- **Root Directory:** `web`
- **Build Command:** `npm run build` (معرّف تلقائيًا عبر `next.config.mjs`)
- **Output:** `standalone` (مضبوط في next.config)
- متغير بيئة: `NEXT_PUBLIC_API_URL` = رابط الخلفية المنشورة (مثل `https://api.sgba.up.railway.app`)
- لا حاجة لـ `vercel.json` — لكنه موجود (rootDirectory: web) كإجراء احتياطي.

## 2) نشر الخلفية على Railway (خادم دائم + قاعدة)
Railway يكتشف `railway.json` تلقائيًا:
- يبني عبر Nixpacks من `backend/`.
- `startCommand`: `npm run start:prod` (تشغيل النسخة المبنية).
- `healthcheckPath`: `/health` (نقطة الفحص الصحية).
- أضف **PostgreSQL Plugin** من Railway — يوفّر `DATABASE_URL` تلقائيًا.

**متغيرات البيئة الواجب ضبطها في Railway:**
| المتغير | القيمة |
|---|---|
| `DATABASE_URL` | (يُضبط تلقائيًا من إضافة PostgreSQL) |
| `JWT_SECRET` | سلسلة عشوائية ≥32 حرفًا |
| `JWT_REFRESH_SECRET` | سلسلة عشوائية ≥32 حرفًا |
| `CORS_ORIGINS` | `https://your-web.vercel.app` (رابط الواجهة المنشورة) |
| `SEED_ADMIN_PASSWORD` | كلمة قوية فريدة للمدير |

**بعد أول نشر:** نفّذ مرة واحدة: `npx prisma migrate deploy && npm run prisma:seed` (من Railway أو محليًا ضد قاعدة الـ Railway).

## 3) بديل: Render / خادم VPS
- `Procfile` جاهز (build/release/start) — يعمل على Render وHeroku.
- `Dockerfile` جاهز — يعمل على أي منصة حاويات (Railway، Fly، DigitalOcean، VPS).

---

## الحالة الحالية (2026-10-29)
- ✅ **محليًا**: الواجهة (3001) + الخلفية (3210) + قاعدة (Docker 5432) — كلها تعمل، الدخول ناجح.
- ✅ **GitHub**: المستودع `bouibaabdo/Sgba1` محدّث بكل الملفات (أحدث commit: ملفات النشر).
- ⚠️ **Vercel**: محاولة النشر القديمة (`backend-five-zeta-29`) لا تعمل — يجب حذفها وإعادة نشر **الواجهة** (web) بدل الخلفية.

## تنبيه أمان
`.gitignore` يستبعد `.env` و`.env.local` — لا تُرفع الأسرار إلى GitHub العام.