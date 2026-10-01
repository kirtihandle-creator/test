'use strict';
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { validatePatient, validateTask, validateRegistration, STATUSES } = require('../validation');
const { buildOpenApi } = require('../openapi');

// JSON API under /api/v1. Mirrors the page routes; identical validation rules.
function apiRouter({ repo, auth, flags }) {
  const r = express.Router();
  const { requireAuth, requireRole, can } = auth;
  const notFound = (res, what) => res.status(404).json({ error: `${what} not found` });
  const invalid = (res, errors) => res.status(422).json({ errors });
  const created = (req, res, path, body) => res.status(201).location(`${req.baseUrl}${path}`).json(body);
  const sessionUser = (u) => ({ id: u.id, email: u.email, displayName: u.display_name, role: u.role, active: !!u.active });

  // ---- Public ----
  r.get('/health', (req, res) => res.json({ status: 'ok' }));
  r.get('/_debug/flags', (req, res) => res.json(flags));
  r.get('/openapi.json', (req, res) => res.json(buildOpenApi()));

  // ---- Auth ----
  r.post('/auth/login', (req, res) => {
    const result = auth.login(req.body.email, req.body.password);
    if (!result) return res.status(401).json({ error: 'Invalid email or password' });
    res.cookie('sid', result.sid, { httpOnly: true, sameSite: 'lax' });
    res.json({ user: sessionUser(result.user) });
  });
  r.post('/auth/register', (req, res) => {
    const { value, errors } = validateRegistration(req.body || {}, { db: repo.db });
    if (errors.length) return invalid(res, errors);
    const u = repo.createUser(value);
    res.cookie('sid', auth.startSession(u.id), { httpOnly: true, sameSite: 'lax' });
    res.status(201).json({ user: u });
  });
  r.post('/auth/logout', (req, res) => { auth.logout(req.cookies.sid); res.clearCookie('sid'); res.status(204).end(); });
  r.get('/auth/me', requireAuth, (req, res) => res.json({ user: sessionUser(req.user) }));

  r.use(requireAuth); // everything below requires a session

  // ---- Patients ----
  r.get('/patients', (req, res) => res.json(repo.listPatients({ q: req.query.q, page: req.query.page, size: req.query.size })));
  r.post('/patients', requireRole('admin', 'staff'), (req, res) => {
    const { value, errors } = validatePatient(req.body || {});
    if (errors.length) return invalid(res, errors);
    const p = repo.createPatient(value, req.user);
    created(req, res, `/patients/${p.id}`, p);
  });
  r.get('/patients/:id', (req, res) => { const p = repo.getPatient(req.params.id); return p ? res.json(p) : notFound(res, 'Patient'); });
  r.put('/patients/:id', requireRole('admin', 'staff'), (req, res) => {
    if (!repo.getPatient(req.params.id)) return notFound(res, 'Patient');
    const { value, errors } = validatePatient(req.body || {});
    if (errors.length) return invalid(res, errors);
    res.json(repo.updatePatient(req.params.id, value, req.user));
  });
  r.delete('/patients/:id', requireRole('admin'), (req, res) => {
    const result = repo.deletePatient(req.params.id, req.user);
    if (result.notFound) return notFound(res, 'Patient');
    if (result.conflict) return res.status(409).json({ error: `Cannot delete patient: ${result.openTasks} open task(s) still reference this patient. Complete or delete them first.`, openTasks: result.openTasks });
    res.status(204).end();
  });

  // ---- Tasks ----
  r.get('/tasks', (req, res) => {
    const { status, patientId, assigneeId, sort } = req.query;
    if (status && !STATUSES.includes(status)) return invalid(res, [{ field: 'status', message: `status must be one of ${STATUSES.join(', ')}` }]);
    res.json({ items: repo.listTasks({ status, patientId, assigneeId, sort }) });
  });
  r.post('/tasks', requireRole('admin', 'staff'), (req, res) => {
    const { value, errors } = validateTask(req.body || {}, { db: repo.db, isCreate: true, api: true, flags });
    if (errors.length) return invalid(res, errors);
    const t = repo.createTask(value, req.user);
    created(req, res, `/tasks/${t.id}`, t);
  });
  r.get('/tasks/:id', (req, res) => { const t = repo.getTask(req.params.id); return t ? res.json(t) : notFound(res, 'Task'); });
  function loadTask(perm) {
    return (req, res, next) => {
      const t = repo.getTask(req.params.id);
      if (!t) return notFound(res, 'Task');
      if (!can[perm](req.user, t)) return res.status(403).json({ error: 'Forbidden: you may not modify this task' });
      req.task = t; next();
    };
  }
  r.put('/tasks/:id', requireRole('admin', 'staff'), loadTask('editTask'), (req, res) => {
    const { value, errors } = validateTask(req.body || {}, { db: repo.db, isCreate: false, api: true, flags });
    if (errors.length) return invalid(res, errors);
    res.json(repo.updateTask(req.params.id, value, req.user));
  });
  r.patch('/tasks/:id/status', requireRole('admin', 'staff'), loadTask('editTask'), (req, res) => {
    const status = req.body && req.body.status;
    if (!STATUSES.includes(status)) return invalid(res, [{ field: 'status', message: `status must be one of ${STATUSES.join(', ')}` }]);
    res.json(repo.setTaskStatus(req.params.id, status, req.user));
  });
  r.delete('/tasks/:id', (req, res) => {
    // DEFECT_VIEWER_CAN_DELETE_TASK: role check is skipped for viewers.
    const t = repo.getTask(req.params.id);
    if (!t) return notFound(res, 'Task');
    const allowed = flags.DEFECT_VIEWER_CAN_DELETE_TASK && req.user.role === 'viewer' ? true : can.deleteTask(req.user, t);
    if (!allowed) return res.status(403).json({ error: 'Forbidden: you may not delete this task' });
    repo.deleteTask(req.params.id, req.user);
    if (flags.DEFECT_VIEWER_CAN_DELETE_TASK && req.user.role === 'viewer') return res.status(200).json({ deleted: true });
    res.status(204).end();
  });

  // ---- Users / audit (admin) ----
  r.get('/users', requireRole('admin'), (req, res) => res.json({ items: repo.listUsers() }));
  r.post('/users/:id/deactivate', requireRole('admin'), (req, res) => {
    if (req.params.id === req.user.id) return res.status(409).json({ error: 'You cannot deactivate your own account' });
    const u = repo.deactivateUser(req.params.id, req.user);
    return u ? res.json(u) : notFound(res, 'User');
  });
  r.get('/audit', requireRole('admin'), (req, res) => res.json({ items: repo.listAudit(500) }));

  r.use((req, res) => res.status(404).json({ error: 'Not found' }));
  return r;
}

// Swagger UI mounted separately at /api/docs.
function docsRouter() {
  return [swaggerUi.serve, swaggerUi.setup(null, { swaggerOptions: { url: '/api/v1/openapi.json' }, customSiteTitle: 'Clinic Task Board API' })];
}

module.exports = { apiRouter, docsRouter };
