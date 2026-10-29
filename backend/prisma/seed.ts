/**
 * Seeder المرحلة 1: الأدوار والصلاحيات + مستخدم المدير + هيكلة المحاكم المغربية.
 * التشغيل: npm run prisma:seed (idempotent — آمن للتكرار).
 *
 * ملاحظة حول بيانات المحاكم: الأعداد المعتمدة أدناه من المصادر العمومية
 * (21 محكمة استئناف عادية، 7 محاكم إدارية، محكما استئناف إداريتان بالرباط ومراكش،
 * محكمة النقض بالرباط). الترقيم الهرمي (أي محكمة ابتدائية تتبع أي استئناف) قابل
 * للتعديل من مصفوفة COURTS — كود كل محكمة يلي مكانها.
 */
import 'dotenv/config';
import { CourtType, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  PermissionSpec,
  PermissionScope,
  ROLE_DEFINITIONS,
  ROLE_NAMES,
  RoleCode,
  SCOPE_RANK,
} from '../src/rbac/permissions.catalog';

const prisma = new PrismaClient();

// ═══════════════════════ 1) الأدوار والصلاحيات ═══════════════════════

async function seedRbac(): Promise<void> {
  for (const code of Object.values(RoleCode)) {
    await prisma.role.upsert({
      where: { code },
      update: { nameAr: ROLE_NAMES[code].ar, nameFr: ROLE_NAMES[code].fr },
      create: { code, nameAr: ROLE_NAMES[code].ar, nameFr: ROLE_NAMES[code].fr, isSystem: true },
    });
  }

  for (const [roleCodeRaw, specs] of Object.entries(ROLE_DEFINITIONS)) {
    const roleCode = roleCodeRaw as RoleCode;
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
    const permissionIds: number[] = [];

    for (const spec of specs as PermissionSpec[]) {
      const scope = spec.scope ?? PermissionScope.ALL;
      const permission = await prisma.permission.upsert({
        where: {
          resource_action_scope: { resource: spec.resource, action: spec.action, scope },
        },
        update: { scopeLevel: SCOPE_RANK[scope] },
        create: {
          resource: spec.resource,
          action: spec.action,
          scope,
          scopeLevel: SCOPE_RANK[scope],
        },
      });
      permissionIds.push(permission.id);
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }

    // أزل الصلاحيات التي حُذفت من الكتالوج حتى لا تبقى منح قديمة في قاعدة البيانات.
    if (permissionIds.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: { notIn: permissionIds } },
      });
    } else {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    }
  }

  const counts = await prisma.permission.count();
  console.log(`✅ الأدوار والصلاحيات: ${Object.keys(ROLE_DEFINITIONS).length} أدوار، ${counts} صلاحيات فريدة`);
}

// ═══════════════════════ 2) مستخدم المدير ═══════════════════════

async function seedAdmin(): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@cabinet.ma').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME || 'المحامي المدير';

  if (!password || password.length < 12 || password === 'ChangeMe!2026') {
    throw new Error('Set a unique SEED_ADMIN_PASSWORD of at least 12 characters in backend/.env.');
  }

  const leadRole = await prisma.role.findUniqueOrThrow({ where: { code: RoleCode.LEAD_LAWYER } });

  await prisma.user.upsert({
    where: { email },
    update: {}, // لا نلمس كلمة السر إن وُجد الحساب
    create: {
      email,
      fullName,
      passwordHash: await bcrypt.hash(password, 12),
      roleId: leadRole.id,
      isLawyer: true,
    },
  });

  console.log(`✅ مستخدم المدير جاهز: ${email} (غيّر كلمة السر فور أول دخول)`);
}

// ═══════════════════════ 3) المحاكم المغربية ═══════════════════════

interface CourtSeed {
  code: string;
  nameAr: string;
  nameFr: string;
  type: CourtType;
  cityAr: string;
  cityFr: string;
  parentCode?: string;
}

// [مفتاح المدينة، التسمية العربية، التسمية الفرنسية]
type CityTuple = [string, string, string];

const appeal = (key: string, city: CityTuple): CourtSeed => ({
  code: `APPEAL_${key}`,
  nameAr: `محكمة الاستئناف ب${city[1]}`,
  nameFr: `Cour d'appel de ${city[2]}`,
  type: CourtType.APPEAL,
  cityAr: city[1],
  cityFr: city[2],
  parentCode: 'CASSATION',
});

// المحاكم الابتدائية: [مفتاح، عربية، فرنسية، مفتاح محكمة الاستئناف التابع لها]
const tpi = (key: string, ar: string, fr: string, appealKey: string): CourtSeed => ({
  code: `TPI_${key}`,
  nameAr: `المحكمة الابتدائية ب${ar}`,
  nameFr: `Tribunal de première instance de ${fr}`,
  type: CourtType.FIRST_INSTANCE,
  cityAr: ar,
  cityFr: fr,
  parentCode: `APPEAL_${appealKey}`,
});

const CITIES: Record<string, CityTuple> = {
  RABAT: ['RABAT', 'الرباط', 'Rabat'],
  CASABLANCA: ['CASABLANCA', 'الدار البيضاء', 'Casablanca'],
  KENITRA: ['KENITRA', 'القنيطرة', 'Kénitra'],
  SALE: ['SALE', 'سلا', 'Salé'],
  EL_JADIDA: ['EL_JADIDA', 'الجديدة', 'El Jadida'],
  SAFE: ['SAFE', 'آسفي', 'Safi'],
  BENI_MELLAL: ['BENI_MELLAL', 'بني ملال', 'Béni Mellal'],
  BERRECHID: ['BERRECHID', 'برشيد', 'Berrechid'],
  FES: ['FES', 'فاس', 'Fès'],
  TAZA: ['TAZA', 'تازة', 'Taza'],
  MEKNES: ['MEKNES', 'مكناس', 'Meknès'],
  MARRAKECH: ['MARRAKECH', 'مراكش', 'Marrakech'],
  OUARZAZATE: ['OUARZAZATE', 'ورزازات', 'Ouarzazate'],
  ERRACHIDIA: ['ERRACHIDIA', 'الرشيدية', 'Errachidia'],
  TANGER: ['TANGER', 'طنجة', 'Tanger'],
  TETOUAN: ['TETOUAN', 'تطوان', 'Tétouan'],
  NADOR: ['NADOR', 'الناظور', 'Nador'],
  AGADIR: ['AGADIR', 'أكادير', 'Agadir'],
  OUJDA: ['OUJDA', 'وجدة', 'Oujda'],
  LAAYOUNE: ['LAAYOUNE', 'العيون', 'Laâyoune'],
};

const COURT_HIERARCHY: CourtSeed[] = [
  // درجة النقض — أعلى سلطة قضائية عادية، مقرها الرباط
  {
    code: 'CASSATION',
    nameAr: 'محكمة النقض',
    nameFr: 'Cour de cassation',
    type: CourtType.CASSATION,
    cityAr: 'الرباط',
    cityFr: 'Rabat',
  },

  // محاكم الاستئناف العادية (21)
  appeal('RABAT', CITIES.RABAT),
  appeal('CASABLANCA', CITIES.CASABLANCA),
  appeal('KENITRA', CITIES.KENITRA),
  appeal('SALE', CITIES.SALE),
  appeal('EL_JADIDA', CITIES.EL_JADIDA),
  appeal('SAFE', CITIES.SAFE),
  appeal('BENI_MELLAL', CITIES.BENI_MELLAL),
  appeal('KOURIBGA', ['KOURIBGA', 'خريبكة', 'Khouribga']),
  appeal('BERRECHID', CITIES.BERRECHID),
  appeal('FES', CITIES.FES),
  appeal('TAZA', CITIES.TAZA),
  appeal('MEKNES', CITIES.MEKNES),
  appeal('MARRAKECH', CITIES.MARRAKECH),
  appeal('OUARZAZATE', CITIES.OUARZAZATE),
  appeal('ERRACHIDIA', CITIES.ERRACHIDIA),
  appeal('TANGER', CITIES.TANGER),
  appeal('TETOUAN', CITIES.TETOUAN),
  appeal('NADOR', CITIES.NADOR),
  appeal('AGADIR', CITIES.AGADIR),
  appeal('OUJDA', CITIES.OUJDA),
  appeal('LAAYOUNE', CITIES.LAAYOUNE),

  // محاكم الاستئناف التجارية (المصادر تختلف بين 3 و5 — نزرع الخمسة الأشيع، قابلة للتعديل)
  {
    code: 'COMMERCIAL_APPEAL_CASABLANCA',
    nameAr: 'محكمة الاستئناف التجارية بالدار البيضاء',
    nameFr: "Cour d'appel de commerce de Casablanca",
    type: CourtType.COMMERCIAL_APPEAL,
    cityAr: 'الدار البيضاء',
    cityFr: 'Casablanca',
    parentCode: 'CASSATION',
  },
  {
    code: 'COMMERCIAL_APPEAL_FES',
    nameAr: 'محكمة الاستئناف التجارية بفاس',
    nameFr: "Cour d'appel de commerce de Fès",
    type: CourtType.COMMERCIAL_APPEAL,
    cityAr: 'فاس',
    cityFr: 'Fès',
    parentCode: 'CASSATION',
  },
  {
    code: 'COMMERCIAL_APPEAL_MARRAKECH',
    nameAr: 'محكمة الاستئناف التجارية بمراكش',
    nameFr: "Cour d'appel de commerce de Marrakech",
    type: CourtType.COMMERCIAL_APPEAL,
    cityAr: 'مراكش',
    cityFr: 'Marrakech',
    parentCode: 'CASSATION',
  },
  {
    code: 'COMMERCIAL_APPEAL_TANGER',
    nameAr: 'محكمة الاستئناف التجارية بطنجة',
    nameFr: "Cour d'appel de commerce de Tanger",
    type: CourtType.COMMERCIAL_APPEAL,
    cityAr: 'طنجة',
    cityFr: 'Tanger',
    parentCode: 'CASSATION',
  },
  {
    code: 'COMMERCIAL_APPEAL_AGADIR',
    nameAr: 'محكمة الاستئناف التجارية بأكادير',
    nameFr: "Cour d'appel de commerce d'Agadir",
    type: CourtType.COMMERCIAL_APPEAL,
    cityAr: 'أكادير',
    cityFr: 'Agadir',
    parentCode: 'CASSATION',
  },

  // محاكم الاستئناف الإدارية (2)
  {
    code: 'ADMIN_APPEAL_RABAT',
    nameAr: 'محكمة الاستئناف الإدارية بالرباط',
    nameFr: "Cour d'appel administrative de Rabat",
    type: CourtType.ADMINISTRATIVE_APPEAL,
    cityAr: 'الرباط',
    cityFr: 'Rabat',
    parentCode: 'CASSATION',
  },
  {
    code: 'ADMIN_APPEAL_MARRAKECH',
    nameAr: 'محكمة الاستئناف الإدارية بمراكش',
    nameFr: "Cour d'appel administrative de Marrakech",
    type: CourtType.ADMINISTRATIVE_APPEAL,
    cityAr: 'مراكش',
    cityFr: 'Marrakech',
    parentCode: 'CASSATION',
  },

  // المحاكم الإدارية الابتدائية (7)
  {
    code: 'ADMIN_RABAT',
    nameAr: 'المحكمة الإدارية بالرباط',
    nameFr: 'Tribunal administratif de Rabat',
    type: CourtType.ADMINISTRATIVE,
    cityAr: 'الرباط',
    cityFr: 'Rabat',
    parentCode: 'ADMIN_APPEAL_RABAT',
  },
  {
    code: 'ADMIN_CASABLANCA',
    nameAr: 'المحكمة الإدارية بالدار البيضاء',
    nameFr: 'Tribunal administratif de Casablanca',
    type: CourtType.ADMINISTRATIVE,
    cityAr: 'الدار البيضاء',
    cityFr: 'Casablanca',
    parentCode: 'ADMIN_APPEAL_RABAT',
  },
  {
    code: 'ADMIN_MARRAKECH',
    nameAr: 'المحكمة الإدارية بمراكش',
    nameFr: 'Tribunal administratif de Marrakech',
    type: CourtType.ADMINISTRATIVE,
    cityAr: 'مراكش',
    cityFr: 'Marrakech',
    parentCode: 'ADMIN_APPEAL_MARRAKECH',
  },
  {
    code: 'ADMIN_AGADIR',
    nameAr: 'المحكمة الإدارية بأكادير',
    nameFr: "Tribunal administratif d'Agadir",
    type: CourtType.ADMINISTRATIVE,
    cityAr: 'أكادير',
    cityFr: 'Agadir',
    parentCode: 'ADMIN_APPEAL_MARRAKECH',
  },
  {
    code: 'ADMIN_FES',
    nameAr: 'المحكمة الإدارية بفاس',
    nameFr: 'Tribunal administratif de Fès',
    type: CourtType.ADMINISTRATIVE,
    cityAr: 'فاس',
    cityFr: 'Fès',
    parentCode: 'ADMIN_APPEAL_RABAT',
  },
  {
    code: 'ADMIN_MEKNES',
    nameAr: 'المحكمة الإدارية بمكناس',
    nameFr: 'Tribunal administratif de Meknès',
    type: CourtType.ADMINISTRATIVE,
    cityAr: 'مكناس',
    cityFr: 'Meknès',
    parentCode: 'ADMIN_APPEAL_RABAT',
  },
  {
    code: 'ADMIN_OUJDA',
    nameAr: 'المحكمة الإدارية بوجدة',
    nameFr: 'Tribunal administratif d\'Oujda',
    type: CourtType.ADMINISTRATIVE,
    cityAr: 'وجدة',
    cityFr: 'Oujda',
    parentCode: 'ADMIN_APPEAL_RABAT',
  },

  // المحاكم التجارية الابتدائية (9)
  ...(
    [
      ['CASABLANCA', 'الدار البيضاء', 'Casablanca', 'CASABLANCA'],
      ['RABAT', 'الرباط', 'Rabat', 'CASABLANCA'],
      ['FES', 'فاس', 'Fès', 'FES'],
      ['TANGER', 'طنجة', 'Tanger', 'TANGER'],
      ['MARRAKECH', 'مراكش', 'Marrakech', 'MARRAKECH'],
      ['AGADIR', 'أكادير', 'Agadir', 'AGADIR'],
      ['OUJDA', 'وجدة', 'Oujda', 'FES'],
      ['MEKNES', 'مكناس', 'Meknès', 'FES'],
      ['KENITRA', 'القنيطرة', 'Kénitra', 'CASABLANCA'],
    ] as [string, string, string, string][]
  ).map(([key, ar, fr, caKey]): CourtSeed => ({
    code: `COMMERCIAL_${key}`,
    nameAr: `المحكمة التجارية ب${ar}`,
    nameFr: `Tribunal de commerce de ${fr}`,
    type: CourtType.COMMERCIAL_FIRST,
    cityAr: ar,
    cityFr: fr,
    parentCode: `COMMERCIAL_APPEAL_${caKey}`,
  })),

  // المحاكم الابتدائية العادية (قائمة موسعة ~55 من أصل 66 — تُضاف البقية بنفس النمط)
  // الربط الهرمي حسب الدوائر القضائية الشائع ارتكازها؛ عدّل parentCode حسب واقع مكتبك.
  tpi('CASABLANCA_AIN_SEBAA', 'الدار البيضاء عين السبع', 'Casablanca Aïn Sebaâ', 'CASABLANCA'),
  tpi('CASABLANCA_ANFA', 'الدار البيضاء أنفا', 'Casablanca Anfa', 'CASABLANCA'),
  tpi('CASABLANCA_MOULAY_RACHID', 'الدار البيضاء مولاي رشيد', 'Casablanca Moulay Rachid', 'CASABLANCA'),
  tpi('MOHAMMEDIA', 'المحمدية', 'Mohammédia', 'CASABLANCA'),
  tpi('BENSLIMANE', 'بنسليمان', 'Benslimane', 'CASABLANCA'),
  tpi('BERRECHID', 'برشيد', 'Berrechid', 'BERRECHID'),
  tpi('SETTAT', 'سطات', 'Settat', 'BERRECHID'),
  tpi('RABAT', 'الرباط', 'Rabat', 'RABAT'),
  tpi('SALE', 'سلا', 'Salé', 'SALE'),
  tpi('TEMARA', 'تمارة', 'Témara', 'SALE'),
  tpi('SKHIRAT', 'الصخيرات', 'Skhirat', 'RABAT'),
  tpi('KENITRA', 'القنيطرة', 'Kénitra', 'KENITRA'),
  tpi('SIDI_KACEM', 'سيدي قاسم', 'Sidi Kacem', 'KENITRA'),
  tpi('SIDI_SLIMANE', 'سيدي سليمان', 'Sidi Slimane', 'KENITRA'),
  tpi('SIDI_YAHYA', 'سيدي يحيى الغرب', 'Sidi Yahya', 'KENITRA'),
  tpi('EL_JADIDA', 'الجديدة', 'El Jadida', 'EL_JADIDA'),
  tpi('SIDI_BENNOUR', 'سيدي بنور', 'Sidi Bennour', 'EL_JADIDA'),
  tpi('AZEMMOUR', 'أزمور', 'Azemmour', 'EL_JADIDA'),
  tpi('SAFE', 'آسفي', 'Safi', 'SAFE'),
  tpi('YOUSSOUFIA', 'اليوسفية', 'Youssoufia', 'SAFE'),
  tpi('BENGUERIR', 'بنجرير', 'Benguérir', 'MARRAKECH'),
  tpi('BENI_MELLAL', 'بني ملال', 'Béni Mellal', 'BENI_MELLAL'),
  tpi('FQUIH_BEN_SALEH', 'الفقيه بن صالح', 'Fquih Ben Salah', 'BENI_MELLAL'),
  tpi('KHENIFRA', 'خنيفرة', 'Khenifra', 'BENI_MELLAL'),
  tpi('KOURIBGA', 'خريبكة', 'Khouribga', 'KOURIBGA'),
  tpi('OUED_ZEM', 'وادي زم', 'Oued Zem', 'KOURIBGA'),
  tpi('MARRAKECH', 'مراكش', 'Marrakech', 'MARRAKECH'),
  tpi('KELAA_SERAGHNA', 'قلعة السراغنة', 'Kelaat Es-Sraghna', 'MARRAKECH'),
  tpi('ESSAOUIRA', 'الصويرة', 'Essaouira', 'MARRAKECH'),
  tpi('CHICHAOUA', 'شيشاوة', 'Chichaoua', 'MARRAKECH'),
  tpi('AL_HAOUZ', 'الحوز', 'Al Haouz', 'MARRAKECH'),
  tpi('EL_HAJEB', 'الحاجب', 'El Hajeb', 'MEKNES'),
  tpi('MEKNES', 'مكناس', 'Meknès', 'MEKNES'),
  tpi('IFRANE', 'إفران', 'Ifrane', 'MEKNES'),
  tpi('FES', 'فاس', 'Fès', 'FES'),
  tpi('MOULAY_YACOUB', 'مولاي يعقوب', 'Moulay Yacoub', 'FES'),
  tpi('SEFROU', 'صفرو', 'Sefrou', 'FES'),
  tpi('TAZA', 'تازة', 'Taza', 'TAZA'),
  tpi('TAOUNATE', 'تاونات', 'Taounate', 'TAZA'),
  tpi('TETOUAN', 'تطوان', 'Tétouan', 'TETOUAN'),
  tpi('CHEFCHAOUEN', 'شفشاون', 'Chefchaouen', 'TETOUAN'),
  tpi('OUEZZANE', 'وزان', 'Ouazzane', 'TETOUAN'),
  tpi('TANGER', 'طنجة', 'Tanger', 'TANGER'),
  tpi('LARACHE', 'العرائش', 'Larache', 'TANGER'),
  tpi('KSAR_EL_KEBIR', 'القصر الكبير', 'Ksar El Kébir', 'TANGER'),
  tpi('FNIDEQ', 'الفنيدق', 'Fnideq', 'TANGER'),
  tpi('NADOR', 'الناظور', 'Nador', 'NADOR'),
  tpi('DRIOUCH', 'الدريوش', 'Driouch', 'NADOR'),
  tpi('AL_HOCEIMA', 'الحسيمة', 'Al Hoceïma', 'NADOR'),
  tpi('OUJDA', 'وجدة', 'Oujda', 'OUJDA'),
  tpi('BERKANE', 'بركان', 'Berkane', 'OUJDA'),
  tpi('TAOURIRT', 'تاوريرت', 'Taourirt', 'OUJDA'),
  tpi('FIGUIG', 'فكيك', 'Figuig', 'OUJDA'),
  tpi('AGADIR', 'أكادير', 'Agadir', 'AGADIR'),
  tpi('INEZGANE', 'إنزكان', 'Inezgane', 'AGADIR'),
  tpi('TIZNIT', 'تيزنيت', 'Tiznit', 'AGADIR'),
  tpi('TAROUDANT', 'تارودانت', 'Taroudant', 'AGADIR'),
  tpi('BIOUGRA', 'بيوكرة', 'Biougra', 'AGADIR'),
  tpi('GUELMIM', 'كلميم', 'Guelmim', 'AGADIR'),
  tpi('TAN_TAN', 'طانطان', 'Tan-Tan', 'AGADIR'),
  tpi('OUARZAZATE', 'ورزازات', 'Ouarzazate', 'OUARZAZATE'),
  tpi('ZAGORA', 'زاكورة', 'Zagora', 'OUARZAZATE'),
  tpi('TINGHIR', 'تنغير', 'Tinghir', 'ERRACHIDIA'),
  tpi('ERRACHIDIA', 'الرشيدية', 'Errachidia', 'ERRACHIDIA'),
  tpi('MIDELT', 'ميدلت', 'Midelt', 'ERRACHIDIA'),
  tpi('LAAYOUNE', 'العيون', 'Laâyoune', 'LAAYOUNE'),
  tpi('SMARA', 'السمارة', 'Es-Smara', 'LAAYOUNE'),
  tpi('DAKHLA', 'الداخلة', 'Dakhla', 'LAAYOUNE'),
  tpi('BOUJDOUR', 'بوجدور', 'Boujdour', 'LAAYOUNE'),
];

async function seedCourts(): Promise<void> {
  // المرحلة أ: الإدخال بلا آباء (تجنب مشاكل الترتيب)
  for (const c of COURT_HIERARCHY) {
    await prisma.court.upsert({
      where: { code: c.code },
      update: {
        nameAr: c.nameAr,
        nameFr: c.nameFr,
        type: c.type,
        cityAr: c.cityAr,
        cityFr: c.cityFr,
      },
      create: {
        code: c.code,
        nameAr: c.nameAr,
        nameFr: c.nameFr,
        type: c.type,
        cityAr: c.cityAr,
        cityFr: c.cityFr,
      },
    });
  }

  // المرحلة ب: ربط الهرمية
  for (const c of COURT_HIERARCHY) {
    if (!c.parentCode) continue;
    const parent = await prisma.court.findUnique({ where: { code: c.parentCode } });
    if (!parent) {
      console.warn(`⚠️  أب غير موجود للمحكمة ${c.code} → ${c.parentCode}`);
      continue;
    }
    await prisma.court.update({ where: { code: c.code }, data: { parentId: parent.id } });
  }

  const byType = await prisma.court.groupBy({ by: ['type'], _count: true });
  const summary = byType.map((g) => `${g.type}: ${g._count}`).join(' | ');
  console.log(`✅ المحاكم المغربية: ${COURT_HIERARCHY.length} مقعدًا قضائيًا — ${summary}`);
}

// ═══════════════════════ التشغيل ═══════════════════════

async function main(): Promise<void> {
  console.log('🌱 بدء تهيئة قاعدة بيانات SGBA-ERP...');
  await seedRbac();
  await seedAdmin();
  await seedCourts();
  console.log('🎉 انتهت التهيئة بنجاح.');
}

main()
  .catch((e) => {
    console.error('❌ فشل الـ Seeder:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
