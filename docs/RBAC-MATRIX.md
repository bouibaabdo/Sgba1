# مصفوفة الصلاحيات (RBAC) — المصدر الوحيد للحقيقة

التنفيذ الكودي في `backend/src/rbac/permissions.catalog.ts` (enum + `ROLE_DEFINITIONS`) — هذا المستند شرح قابل للقراءة البشرية، والكود هو المُنفَّذ.

## الرموز

- `C` إنشاء، `R` قراءة، `U` تعديل، `D` حذف، `E` تصدير، `AS` إسناد، `AR` أرشفة
- النطاق بين قوسين: `(الكل)` = ALL، `(مسند)` = الملفات المسندة للمستخدم فقط، `(خاص)` = سجلاته فقط. الافتراضي عند غياب القوس = ALL.

## الجدول الملخص

| المورد | بارِع (Lead) | مساعد (Associate) | تلميذ (Trainee) | كاتب (Secretary) | محاسب (Accountant) |
|---|---|---|---|---|---|
| المستخدمون USERS | C · R · U | — | — | — | — |
| الأدوار ROLES | R · U | — | — | — | — |
| الملفات CASES | C · R · U · D · AS · AR | C · R(الكل) · U(مسند) | C · R(مسند) | C · R · U · AR | R(الكل) |
| الجلسات HEARINGS | C · R · U · D | C · R(الكل) · U(مسند) | R(مسند) | **C · R · U · D** | — |
| المهام TASKS | C · R · U · D · AS | C · R(الكل) · U(مسند) | R(خاص) · U(خاص) | C · R · U | — |
| الزبناء CLIENTS | C · R · U · D | C · R · U | R | C · R · U | R(الكل) |
| المتراسلون CONTACTS | C · R · U · D | C · R · U | R | C · R · U | — |
| الوثائق DOCUMENTS | C · R · U · D · E | C · R · U(مسند) · E | C · R(مسند) · U(خاص) | C · R · U · E | — |
| **المالية FINANCE** | C · R · U · E | **—** | **—** | **—** | C · R · U · E |
| التقارير REPORTS | R · E | R | — | — | R · E |
| سجل التدقيق AUDIT | R | — | — | — | — |
| الإعدادات SETTINGS | R · U | R | — | — | — |

## القواعد الصلبة (مصممة لا استثنائية)

1. **الكاتب (Secrétaire):** يدير الجلسات كاملة (إضافة/تعديل/حذف) لكن **لا يمتلك أي إذن `FINANCE`** — يرفض الـ Guard أي مسار مالي بـ `403` حتى لو وصل إليه بالـ URL مباشرة.
2. **التلميذ (Stagiaire):** يقرأ ما أُسند إليه فقط، وينشئ "مسودات" ملفات ووثائق؛ لا حذف إطلاقًا، ولا مالية، ولا تقارير.
3. **المحاسب:** مالية كاملة وتصدير، وقراءة الملفات والزبناء فقط — بلا أي تعديل قانوني.
4. **المساعد:** يقرأ كل الملفات (ثقافة المكتب الواحدة) لكن يعدّل المسندة إليه فقط.
5. **الإسناد (AS) والأرشفة (AR):** الإسناد للبارِع فقط في v1؛ الأرشفة للبارِع والكاتب (لأن الكاتب هو من يودع الملفات الورقية في الخزائن).
6. **النطاقات تراكمية:** امتلاك `ALL` يرضي متطلبًا يطلب `ASSIGNED` أو `OWN`، والعكس خطأ.

## مثال التنفيذ على مسار مالي (حماية الكاتب)

```ts
@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)   // Guard الصلاحيات بعد فك JWT
export class ProvisionController {
  @Get()
  @RequirePermissions({ resource: PermissionResource.FINANCE, action: PermissionAction.READ })
  listProvisions() { /* ... */ }   // SECRETARY / TRAINEE / ASSOCIATE → 403 INSUFFICIENT_PERMISSION
}
```

## مثال الجلسات (ما يملكه الكاتب)

```ts
@Post()
@RequirePermissions({ resource: PermissionResource.HEARINGS, action: PermissionAction.CREATE })
createHearing() { /* SECRETARY ✓ */ }
```
