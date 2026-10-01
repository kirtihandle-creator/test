'use strict';
// Smoke test: boots isolated in-memory app instances, logs in as each role, exercises key endpoints,
// and proves every seeded defect flag changes the specified behavior when ON (and not when OFF).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { todayIso } = require('../src/db');

const ACCOUNTS = {
  admin: { email: 'admin@demo.local', password: 'Admin123!' },
  staff: { email: 'staff@demo.local', password: 'Staff123!' },
  viewer: { email: 'viewer@demo.local', password: 'Viewer123!' },
};

// Start an app on a random port with the given defect env; returns helpers bound to it.
async function startServer(defects = {}) {
  const env = { NODE_ENV: 'test', ...defects };
  const app = createApp({ dbPath: ':memory:', env });
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;

  async function call(method, path, { body, cookie, form, redirect = 'manual' } = {}) {
    const headers = {};
    if (cookie) headers.cookie = cookie;
    let payload;
    if (form) { headers['content-type'] = 'application/x-www-form-urlencoded'; payload = new URLSearchParams(form).toString(); }
    else if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
    const res = await fetch(base + path, { method, headers, body: payload, redirect });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) { /* not JSON */ }
    return { status: res.status, headers: res.headers, text, json };
  }
  async function loginApi(role) {
    const r = await call('POST', '/api/v1/auth/login', { body: ACCOUNTS[role] });
    assert.equal(r.status, 200, `API login as ${role}`);
    const cookie = r.headers.get('set-cookie').split(';')[0];
    return { cookie, user: r.json.user };
  }
  async function loginUi(role) {
    const r = await call('POST', '/login', { form: ACCOUNTS[role] });
    return { status: r.status, location: r.headers.get('location'), cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  }
  return { app, server, base, call, loginApi, loginUi, close: () => new Promise((r) => server.close(r)) };
}

const firstPatientId = async (s, cookie) => (await s.call('GET', '/api/v1/patients?size=1', { cookie })).json.items[0].id;
const openTaskFor = async (s, cookie, patientId) => (await s.call('GET', `/api/v1/tasks?status=open&patientId=${patientId}`, { cookie })).json.items[0];
const validTask = (patientId, assigneeId) => ({ title: 'Smoke task', dueDate: todayIso(3), priority: 'high', patientId, assigneeId, estimatedMinutes: 30, urgent: true });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// ---------------------------------------------------------------- baseline (all flags OFF)
let s;
before(async () => { s = await startServer(); });
after(async () => { await s.close(); });

test('health and flags endpoints are public; all flags OFF by default', async () => {
  assert.deepEqual((await s.call('GET', '/api/v1/health')).json, { status: 'ok' });
  const flags = (await s.call('GET', '/api/v1/_debug/flags')).json;
  assert.equal(Object.keys(flags).length, 6);
  assert.ok(Object.values(flags).every((v) => v === false));
  const spec = (await s.call('GET', '/api/v1/openapi.json')).json;
  assert.equal(spec.openapi, '3.0.3');
  assert.ok(spec.paths['/tasks/{id}/status']);
  assert.equal((await s.call('GET', '/api/docs/')).status, 200);
});

test('unauthenticated: pages redirect to /login, API returns 401', async () => {
  const page = await s.call('GET', '/patients');
  assert.equal(page.status, 302);
  assert.match(page.headers.get('location'), /^\/login/);
  assert.equal((await s.call('GET', '/api/v1/patients')).status, 401);
  assert.equal((await s.call('POST', '/api/v1/auth/login', { body: { email: 'admin@demo.local', password: 'wrong' } })).status, 401);
});

test('each role can log in via UI form and API; /auth/me reflects role', async () => {
  for (const role of Object.keys(ACCOUNTS)) {
    const ui = await s.loginUi(role);
    assert.equal(ui.status, 302, `UI login ${role}`);
    assert.equal(ui.location, '/dashboard');
    const dash = await s.call('GET', '/dashboard', { cookie: ui.cookie });
    assert.equal(dash.status, 200);
    assert.match(dash.text, /<title>Dashboard - Clinic Task Board<\/title>/);
    assert.match(dash.text, /<h1>Dashboard<\/h1>/);
    assert.match(dash.text, /id="logout-link"[^>]*>Log out</);
    const { cookie } = await s.loginApi(role);
    const me = await s.call('GET', '/api/v1/auth/me', { cookie });
    assert.equal(me.json.user.role, role);
  }
});

test('seed data: 12 patients, 25 tasks, UUID ids, dashboard counts', async () => {
  const { cookie } = await s.loginApi('admin');
  const patients = await s.call('GET', '/api/v1/patients?size=100', { cookie });
  assert.equal(patients.json.total, 12);
  assert.ok(patients.json.items.every((p) => UUID_RE.test(p.id)));
  const tasks = (await s.call('GET', '/api/v1/tasks', { cookie })).json.items;
  assert.equal(tasks.length, 25);
  const today = todayIso();
  const overdue = tasks.filter((t) => t.status !== 'done' && t.dueDate < today).length;
  const dueToday = tasks.filter((t) => t.status !== 'done' && t.dueDate === today).length;
  assert.ok(dueToday > 0, 'seed has open tasks due today');
  const dash = (await s.call('GET', '/dashboard', { cookie })).text;
  assert.match(dash, new RegExp(`data-stat="overdueTasks">${overdue}<`));
  assert.match(dash, /data-stat="patients">12</);
  // search + pagination
  const q = await s.call('GET', '/api/v1/patients?q=Patel', { cookie });
  assert.equal(q.json.total, 1);
  const paged = await s.call('GET', '/api/v1/patients?page=2&size=5', { cookie });
  assert.equal(paged.json.items.length, 5); assert.equal(paged.json.pages, 3);
});

test('admin: patient CRUD with read-back, validation 422, 409 on delete with open tasks', async () => {
  const { cookie, user } = await s.loginApi('admin');
  // validation
  const bad = await s.call('POST', '/api/v1/patients', { cookie, body: { firstName: '', lastName: 'X'.repeat(51), dateOfBirth: todayIso(1), email: 'nope', phone: '12' } });
  assert.equal(bad.status, 422);
  assert.deepEqual(bad.json.errors.map((e) => e.field).sort(), ['dateOfBirth', 'email', 'firstName', 'lastName', 'phone']);
  // create
  const created = await s.call('POST', '/api/v1/patients', { cookie, body: { firstName: 'Test', lastName: 'Person', dateOfBirth: '1990-05-05', phone: '+1-555-0100', email: 'tp@example.com' } });
  assert.equal(created.status, 201);
  assert.ok(UUID_RE.test(created.json.id));
  assert.equal(created.headers.get('location'), `/api/v1/patients/${created.json.id}`);
  // read-back + update
  assert.equal((await s.call('GET', `/api/v1/patients/${created.json.id}`, { cookie })).json.phone, '+1-555-0100');
  const upd = await s.call('PUT', `/api/v1/patients/${created.json.id}`, { cookie, body: { firstName: 'Test', lastName: 'Person', dateOfBirth: '1990-05-05', phone: '+1-555-0199' } });
  assert.equal(upd.status, 200);
  assert.equal((await s.call('GET', `/api/v1/patients/${created.json.id}`, { cookie })).json.phone, '+1-555-0199');
  // dependent workflow: open task blocks delete
  const t = await s.call('POST', '/api/v1/tasks', { cookie, body: validTask(created.json.id, user.id) });
  assert.equal(t.status, 201);
  const del = await s.call('DELETE', `/api/v1/patients/${created.json.id}`, { cookie });
  assert.equal(del.status, 409);
  assert.match(del.json.error, /open task/i);
  // mark done -> completedAt set -> delete succeeds
  const done = await s.call('PATCH', `/api/v1/tasks/${t.json.id}/status`, { cookie, body: { status: 'done' } });
  assert.equal(done.status, 200); assert.ok(done.json.completedAt);
  const detail = await s.call('GET', `/tasks/${t.json.id}`, { cookie });
  assert.match(detail.text, new RegExp(`data-field="completedAt">${done.json.completedAt.replace(/[.]/g, '\\.')}<`));
  assert.equal((await s.call('DELETE', `/api/v1/patients/${created.json.id}`, { cookie })).status, 204);
  assert.equal((await s.call('GET', `/api/v1/patients/${created.json.id}`, { cookie })).status, 404);
  // audit contains our mutations
  const audit = (await s.call('GET', '/api/v1/audit', { cookie })).json.items;
  assert.ok(audit.some((a) => a.action === 'delete' && a.entity === 'patient' && a.entityId === created.json.id && a.actorEmail === 'admin@demo.local'));
});

test('task validation: title length, past dueDate, bad refs, enum values', async () => {
  const { cookie, user } = await s.loginApi('admin');
  const pid = await firstPatientId(s, cookie);
  const r = await s.call('POST', '/api/v1/tasks', { cookie, body: { title: 'ab', dueDate: todayIso(-1), priority: 'urgent', status: 'closed', patientId: 'nope', assigneeId: 'nope' } });
  assert.equal(r.status, 422);
  assert.deepEqual(r.json.errors.map((e) => e.field).sort(), ['assigneeId', 'dueDate', 'patientId', 'priority', 'status', 'title']);
  assert.equal((await s.call('POST', '/api/v1/tasks', { cookie, body: { ...validTask(pid, user.id), title: 'abc', dueDate: todayIso(0) } })).status, 201, 'boundary: 3 chars, due today');
  // UI form re-renders with preserved values and .field-error
  const ui = await s.call('POST', '/tasks/new', { cookie, form: { title: 'ab', dueDate: '', priority: 'low', patientId: pid, assigneeId: user.id } });
  assert.equal(ui.status, 422);
  assert.match(ui.text, /class="field-error" role="alert" data-field="title"/);
  assert.match(ui.text, /id="title" name="title" value="ab"/);
});

test('staff: can create patient/task, edit own task, cannot delete patient or access /admin', async () => {
  const { cookie, user } = await s.loginApi('staff');
  const pid = await firstPatientId(s, cookie);
  const t = await s.call('POST', '/api/v1/tasks', { cookie, body: validTask(pid, user.id) });
  assert.equal(t.status, 201);
  assert.equal((await s.call('PUT', `/api/v1/tasks/${t.json.id}`, { cookie, body: { ...validTask(pid, user.id), title: 'Edited by staff' } })).json.title, 'Edited by staff');
  assert.equal((await s.call('DELETE', `/api/v1/patients/${pid}`, { cookie })).status, 403);
  assert.equal((await s.call('GET', '/api/v1/users', { cookie })).status, 403);
  const admin = await s.call('GET', '/admin', { cookie });
  assert.equal(admin.status, 403); assert.match(admin.text, /<h1>403 Forbidden<\/h1>/);
  // cannot edit a task created by admin and assigned to admin
  const adminTask = (await s.call('GET', '/api/v1/tasks', { cookie })).json.items.find((x) => x.assigneeId !== user.id);
  assert.equal((await s.call('PUT', `/api/v1/tasks/${adminTask.id}`, { cookie, body: validTask(pid, user.id) })).status, 403);
  assert.equal((await s.call('DELETE', `/api/v1/tasks/${t.json.id}`, { cookie })).status, 204);
});

test('viewer: read-only; every mutation returns 403; UI shows disabled buttons', async () => {
  const { cookie, user } = await s.loginApi('viewer');
  const pid = await firstPatientId(s, cookie);
  const task = await openTaskFor(s, cookie, pid);
  assert.equal((await s.call('GET', `/api/v1/tasks/${task.id}`, { cookie })).status, 200);
  const attempts = [
    ['POST', '/api/v1/patients', { firstName: 'A', lastName: 'B', dateOfBirth: '1990-01-01' }],
    ['PUT', `/api/v1/patients/${pid}`, { firstName: 'A', lastName: 'B', dateOfBirth: '1990-01-01' }],
    ['DELETE', `/api/v1/patients/${pid}`],
    ['POST', '/api/v1/tasks', validTask(pid, user.id)],
    ['PUT', `/api/v1/tasks/${task.id}`, validTask(pid, user.id)],
    ['PATCH', `/api/v1/tasks/${task.id}/status`, { status: 'done' }],
    ['DELETE', `/api/v1/tasks/${task.id}`],
    ['GET', '/api/v1/users'], ['GET', '/api/v1/audit'],
  ];
  for (const [m, p, body] of attempts) assert.equal((await s.call(m, p, { cookie, body })).status, 403, `${m} ${p}`);
  assert.equal((await s.call('GET', '/patients/new', { cookie })).status, 403);
  const page = await s.call('GET', `/patients/${pid}`, { cookie });
  assert.match(page.text, /<button type="button" disabled[^>]*>Delete<\/button>/);
  assert.equal((await s.call('GET', `/api/v1/tasks/${task.id}`, { cookie })).status, 200, 'task still exists');
});

test('admin: deactivate user via API, deactivated user cannot log in; self-deactivate 409', async () => {
  const { cookie, user } = await s.loginApi('admin');
  const target = (await s.call('GET', '/api/v1/users', { cookie })).json.items.find((u) => u.role === 'viewer');
  assert.equal((await s.call('POST', `/api/v1/users/${user.id}/deactivate`, { cookie })).status, 409);
  const r = await s.call('POST', `/api/v1/users/${target.id}/deactivate`, { cookie });
  assert.equal(r.status, 200); assert.equal(r.json.active, false);
  assert.equal((await s.call('POST', '/api/v1/auth/login', { body: ACCOUNTS.viewer })).status, 401);
  const adminPage = (await s.call('GET', '/admin?tab=audit', { cookie })).text;
  assert.match(adminPage, /id="tab-audit"[^>]*aria-selected="true"/);
  assert.match(adminPage, /<td>deactivate<\/td><td>user<\/td>/);
});

test('profile: change display name and password, validation on short password', async () => {
  const ui = await s.loginUi('staff');
  const bad = await s.call('POST', '/profile', { cookie: ui.cookie, form: { displayName: 'Sam S', currentPassword: 'Staff123!', newPassword: 'short' } });
  assert.equal(bad.status, 422); assert.match(bad.text, /data-field="newPassword"/);
  const ok = await s.call('POST', '/profile', { cookie: ui.cookie, form: { displayName: 'Sam Renamed', currentPassword: 'Staff123!', newPassword: 'NewPass123!' } });
  assert.equal(ok.status, 302);
  assert.equal((await s.call('POST', '/api/v1/auth/login', { body: { email: 'staff@demo.local', password: 'NewPass123!' } })).status, 200);
  await s.call('POST', '/profile', { cookie: ui.cookie, form: { displayName: 'Sam Staff', currentPassword: 'NewPass123!', newPassword: 'Staff123!' } }); // restore
});

test('registration: UI form creates staff account, auto-logs in, redirects to dashboard', async () => {
  const form = await s.call('GET', '/register');
  assert.equal(form.status, 200);
  assert.match(form.text, /<title>Create account - Clinic Task Board<\/title>/);
  assert.match(form.text, /<form method="post" action="\/register"/);
  const r = await s.call('POST', '/register', { form: { displayName: 'Nina New', email: 'Nina@Example.com', password: 'Welcome123', confirmPassword: 'Welcome123', role: 'staff' } });
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /^\/dashboard/);
  const cookie = r.headers.get('set-cookie').split(';')[0];
  const me = await s.call('GET', '/api/v1/auth/me', { cookie });
  assert.equal(me.json.user.email, 'nina@example.com', 'email is normalised to lowercase');
  assert.equal(me.json.user.role, 'staff');
  assert.ok(UUID_RE.test(me.json.user.id));
  const dash = await s.call('GET', '/dashboard', { cookie });
  assert.match(dash.text, /Nina New/);
  // can log in again with the new credentials
  assert.equal((await s.call('POST', '/api/v1/auth/login', { body: { email: 'nina@example.com', password: 'Welcome123' } })).status, 200);
  // audit recorded the registration
  const admin = await s.loginApi('admin');
  assert.ok((await s.call('GET', '/api/v1/audit', { cookie: admin.cookie })).json.items.some((a) => a.action === 'register' && a.entityId === me.json.user.id));
});

test('registration: validation (duplicate email, short password, mismatch, admin role rejected) in UI and API', async () => {
  const ui = await s.call('POST', '/register', { form: { displayName: '', email: 'admin@demo.local', password: 'short', confirmPassword: 'other', role: 'admin' } });
  assert.equal(ui.status, 422);
  for (const f of ['displayName', 'email', 'password', 'confirmPassword', 'role']) assert.match(ui.text, new RegExp(`data-field="${f}"`), f);
  assert.match(ui.text, /already exists/);
  assert.match(ui.text, /name="email" value="admin@demo.local"/, 'entered values preserved');
  const api = await s.call('POST', '/api/v1/auth/register', { body: { displayName: 'X', email: 'not-an-email', password: 'Welcome123', confirmPassword: 'Welcome124' } });
  assert.equal(api.status, 422);
  assert.deepEqual(api.json.errors.map((e) => e.field).sort(), ['confirmPassword', 'email']);
  const admin = await s.call('POST', '/api/v1/auth/register', { body: { displayName: 'Evil', email: 'evil@example.com', password: 'Welcome123', confirmPassword: 'Welcome123', role: 'admin' } });
  assert.equal(admin.status, 422); assert.equal(admin.json.errors[0].field, 'role');
});

test('registration: API creates viewer account (201) whose mutations are then forbidden', async () => {
  const r = await s.call('POST', '/api/v1/auth/register', { body: { displayName: 'Vic Viewer', email: 'vic@example.com', password: 'Welcome123', confirmPassword: 'Welcome123', role: 'viewer' } });
  assert.equal(r.status, 201);
  assert.equal(r.json.user.role, 'viewer'); assert.equal(r.json.user.active, true);
  const cookie = r.headers.get('set-cookie').split(';')[0];
  assert.equal((await s.call('GET', '/api/v1/patients', { cookie })).status, 200);
  assert.equal((await s.call('POST', '/api/v1/patients', { cookie, body: { firstName: 'A', lastName: 'B', dateOfBirth: '1990-01-01' } })).status, 403);
  // a signed-in user visiting /register is sent to the dashboard
  assert.equal((await s.call('GET', '/register', { cookie })).headers.get('location'), '/dashboard');
});

// ---------------------------------------------------------------- seeded defects (each ON in isolation)
async function withServer(defects, fn) { const srv = await startServer(defects); try { await fn(srv); } finally { await srv.close(); } }

test('DEFECT_PATIENT_EDIT_DROPS_PHONE: phone lost after edit only when ON', async () => {
  await withServer({ DEFECT_PATIENT_EDIT_DROPS_PHONE: '1' }, async (d) => {
    assert.equal((await d.call('GET', '/api/v1/_debug/flags')).json.DEFECT_PATIENT_EDIT_DROPS_PHONE, true);
    const { cookie } = await d.loginApi('admin');
    const p = (await d.call('POST', '/api/v1/patients', { cookie, body: { firstName: 'Ph', lastName: 'One', dateOfBirth: '1980-01-01', phone: '5550001111' } })).json;
    assert.equal(p.phone, '5550001111', 'create still persists phone');
    await d.call('PUT', `/api/v1/patients/${p.id}`, { cookie, body: { firstName: 'Ph', lastName: 'One', dateOfBirth: '1980-01-01', phone: '5550002222' } });
    assert.equal((await d.call('GET', `/api/v1/patients/${p.id}`, { cookie })).json.phone, null, 'DEFECT: phone dropped on read-back');
  });
});

test('DEFECT_VIEWER_CAN_DELETE_TASK: viewer DELETE returns 200 and removes task only when ON', async () => {
  await withServer({ DEFECT_VIEWER_CAN_DELETE_TASK: '1' }, async (d) => {
    const { cookie } = await d.loginApi('viewer');
    const task = (await d.call('GET', '/api/v1/tasks', { cookie })).json.items[0];
    assert.equal((await d.call('DELETE', `/api/v1/tasks/${task.id}`, { cookie })).status, 200, 'DEFECT: viewer allowed');
    assert.equal((await d.call('GET', `/api/v1/tasks/${task.id}`, { cookie })).status, 404);
  });
});

test('DEFECT_TASK_TITLE_MIN_IGNORED: API accepts 1-char title, UI still rejects', async () => {
  await withServer({ DEFECT_TASK_TITLE_MIN_IGNORED: '1' }, async (d) => {
    const { cookie, user } = await d.loginApi('admin');
    const pid = await firstPatientId(d, cookie);
    assert.equal((await d.call('POST', '/api/v1/tasks', { cookie, body: { ...validTask(pid, user.id), title: 'x' } })).status, 201, 'DEFECT: API accepts');
    const ui = await d.call('POST', '/tasks/new', { cookie, form: { title: 'x', dueDate: todayIso(1), priority: 'low', patientId: pid, assigneeId: user.id } });
    assert.equal(ui.status, 422); assert.match(ui.text, /data-field="title"/);
  });
});

test('DEFECT_DASHBOARD_OVERDUE_OFF_BY_ONE: overdue count includes tasks due today', async () => {
  await withServer({ DEFECT_DASHBOARD_OVERDUE_OFF_BY_ONE: '1' }, async (d) => {
    const { cookie } = await d.loginApi('admin');
    const tasks = (await d.call('GET', '/api/v1/tasks', { cookie })).json.items;
    const today = todayIso();
    const correct = tasks.filter((t) => t.status !== 'done' && t.dueDate < today).length;
    const dueToday = tasks.filter((t) => t.status !== 'done' && t.dueDate === today).length;
    assert.ok(dueToday > 0);
    assert.match((await d.call('GET', '/dashboard', { cookie })).text, new RegExp(`data-stat="overdueTasks">${correct + dueToday}<`), 'DEFECT: off by due-today count');
  });
});

test('DEFECT_PATIENT_DELETE_IGNORES_OPEN_TASKS: delete succeeds despite open tasks', async () => {
  await withServer({ DEFECT_PATIENT_DELETE_IGNORES_OPEN_TASKS: '1' }, async (d) => {
    const { cookie } = await d.loginApi('admin');
    const task = (await d.call('GET', '/api/v1/tasks?status=open', { cookie })).json.items[0];
    assert.equal((await d.call('DELETE', `/api/v1/patients/${task.patientId}`, { cookie })).status, 204, 'DEFECT: 409 rule skipped');
    assert.equal((await d.call('GET', `/api/v1/tasks/${task.id}`, { cookie })).status, 404, 'dependent tasks removed too');
  });
});

test('DEFECT_LOGIN_500: POST /login returns 500; API login still works', async () => {
  await withServer({ DEFECT_LOGIN_500: '1' }, async (d) => {
    const ui = await d.loginUi('admin');
    assert.equal(ui.status, 500);
    assert.equal((await d.call('POST', '/api/v1/auth/login', { body: ACCOUNTS.admin })).status, 200);
  });
});
