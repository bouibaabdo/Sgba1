/**
 * وضع تجريبي (In-memory) للخلفية — يعمل بلا PostgreSQL ليُتاح رؤية النظام حيًا.
 * يحاكي واجهات الـ API الأساسية للمصادقة والملفات والجلسات والمهام.
 * يُستبدل بـ NestJS + Prisma عند تشغيل قاعدة البيانات.
 *
 * التشغيل: node mock-server.mjs  → يستمع على PORT أو 3006
 */
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 3006);

// مخزن في الذاكرة (يُصفَّر عند إعادة التشغيل)
const state = {
  users: new Map(),
  sessions: new Map(), // token -> user
  cases: new Map(),
  hearings: new Map(),
  tasks: new Map(),
  seq: { user: 1, case: 1, hearing: 1, task: 1 },
};

// المستخدم الافتراضي (مدير)
const ADMIN = {
  id: state.seq.user++,
  email: 'admin@cabinet.ma',
  password: 'ChangeMe!2026',
  fullName: 'المحامي المدير',
  roleCode: 'LEAD_LAWYER',
};
state.users.set(ADMIN.id, ADMIN);

// صلاحيات افتراضية لمدير (واسعة للاستعراض)
const LEAD_PERMISSIONS = [
  { resource: 'CASES', action: 'CREATE' },
  { resource: 'CASES', action: 'READ' },
  { resource: 'CASES', action: 'UPDATE' },
  { resource: 'CASES', action: 'DELETE' },
  { resource: 'HEARINGS', action: 'CREATE' },
  { resource: 'HEARINGS', action: 'READ' },
  { resource: 'HEARINGS', action: 'UPDATE' },
  { resource: 'TASKS', action: 'CREATE' },
  { resource: 'TASKS', action: 'READ' },
  { resource: 'TASKS', action: 'UPDATE' },
  { resource: 'CLIENTS', action: 'CREATE' },
  { resource: 'CLIENTS', action: 'READ' },
  { resource: 'FINANCE', action: 'READ' },
];

const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' });
  res.end(JSON.stringify(body));
};

const getToken = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
};

const authUser = (req) => {
  const token = getToken(req);
  return token ? state.sessions.get(token) || null : null;
};

const requireAuth = (req, res) => {
  const user = authUser(req);
  if (!user) {
    json(res, 401, { message: 'غير مصادق' });
    return null;
  }
  return user;
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' });
    return res.end();
  }

  try {
    // ── المصادقة ──
    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = await readBody(req);
      const user = [...state.users.values()].find((u) => u.email === email && u.password === password);
      if (!user) return json(res, 401, { message: 'بيانات الدخول غير صحيحة' });
      const token = randomUUID();
      state.sessions.set(token, user);
      return json(res, 200, {
        accessToken: token,
        refreshToken: randomUUID(),
        user: { id: user.id, email: user.email, fullName: user.fullName, roleCode: user.roleCode },
      });
    }

    if (method === 'GET' && path === '/auth/me') {
      const user = requireAuth(req, res);
      if (!user) return;
      return json(res, 200, { user, permissions: LEAD_PERMISSIONS });
    }

    if (method === 'POST' && path === '/auth/logout') {
      const token = getToken(req);
      if (token) state.sessions.delete(token);
      return json(res, 200, { ok: true });
    }

    // ── الملفات ──
    if (method === 'GET' && path === '/cases') {
      const user = requireAuth(req, res);
      if (!user) return;
      const list = [...state.cases.values()];
      return json(res, 200, list);
    }

    if (method === 'POST' && path === '/cases') {
      const user = requireAuth(req, res);
      if (!user) return;
      const body = await readBody(req);
      const id = state.seq.case++;
      const court = { nameAr: body.court ? body.court : '—' };
      const created = {
        id,
        internalRef: body.internalRef,
        courtRef: body.courtRef || null,
        title: body.title,
        type: body.type || 'CIVIL',
        status: 'OPEN',
        client: { fullNameAr: body.client?.fullNameAr },
        court,
        leadLawyer: { fullName: user.fullName },
        archiveCabinet: body.archive?.cabinet,
        archiveShelf: body.archive?.shelf,
        archiveBox: body.archive?.box,
        updatedAt: new Date().toISOString(),
      };
      state.cases.set(id, created);
      return json(res, 201, created);
    }

    if (method === 'PATCH' && path.startsWith('/cases/')) {
      const user = requireAuth(req, res);
      if (!user) return;
      const id = Number(path.split('/')[2]);
      const body = await readBody(req);
      const c = state.cases.get(id);
      if (!c) return json(res, 404, { message: 'الملف غير موجود' });
      c.status = body.status;
      c.updatedAt = new Date().toISOString();
      return json(res, 200, c);
    }

    // ── الجلسات ──
    if (method === 'GET' && path === '/hearings') {
      const user = requireAuth(req, res);
      if (!user) return;
      return json(res, 200, [...state.hearings.values()]);
    }

    if (method === 'POST' && path === '/hearings') {
      const user = requireAuth(req, res);
      if (!user) return;
      const body = await readBody(req);
      const id = state.seq.hearing++;
      const h = {
        id,
        scheduledAt: body.scheduledAt,
        room: body.room || null,
        purpose: body.purpose || null,
        case: { id: body.caseId, internalRef: body.caseRef || '—' },
        court: { nameAr: body.court || '—' },
        lawyer: { fullName: user.fullName },
        status: 'SCHEDULED',
      };
      state.hearings.set(id, h);
      return json(res, 201, h);
    }

    // ── المهام ──
    if (method === 'GET' && path === '/tasks') {
      const user = requireAuth(req, res);
      if (!user) return;
      return json(res, 200, [...state.tasks.values()]);
    }

    if (method === 'POST' && path === '/tasks') {
      const user = requireAuth(req, res);
      if (!user) return;
      const body = await readBody(req);
      const id = state.seq.task++;
      const t = {
        id,
        title: body.title,
        description: body.description || null,
        dueDate: body.dueDate || null,
        isDone: false,
        case: body.caseId ? { id: body.caseId } : null,
        assignee: { fullName: user.fullName },
        creator: { fullName: user.fullName },
      };
      state.tasks.set(id, t);
      return json(res, 201, t);
    }

    if (method === 'PATCH' && path.endsWith('/complete')) {
      const user = requireAuth(req, res);
      if (!user) return;
      const id = Number(path.split('/')[2]);
      const t = state.tasks.get(id);
      if (!t) return json(res, 404, { message: 'المهمة غير موجودة' });
      t.isDone = true;
      return json(res, 200, t);
    }

    return json(res, 404, { message: 'غير موجود' });
  } catch (e) {
    json(res, 500, { message: 'خطأ داخلي' });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`✅ SGBA-API (وضع تجريبي) يعمل على http://localhost:${PORT}`);
  console.log(`   حساب الدخول: admin@cabinet.ma / ChangeMe!2026`);
});