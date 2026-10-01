'use strict';
const express = require('express');
const V = require('../views');
const { validatePatient, validateTask, validateProfile, validateRegistration } = require('../validation');

// Server-rendered pages. All routes are listed here in order.
function pagesRouter({ repo, auth, flags }) {
  const r = express.Router();
  const { requireAuth, requireRole, forbid, can } = auth;
  const caps = (u, t) => ({ mutate: can.mutate(u), deletePatient: can.deletePatient(u), editTask: t ? can.editTask(u, t) : false, deleteTask: t ? can.deleteTask(u, t) : false });
  const flashOf = (req) => (req.query.flash ? String(req.query.flash) : undefined);
  const notFound = (req, res) => res.status(404).send(V.notFoundPage(req.user));

  r.get('/', (req, res) => res.redirect(req.user ? '/dashboard' : '/login'));

  // ---- Auth ----
  r.get('/login', (req, res) => (req.user ? res.redirect('/dashboard') : res.send(V.loginPage({ next: req.query.next || '' }))));
  r.post('/login', (req, res) => {
    if (flags.DEFECT_LOGIN_500) throw new Error('Simulated login failure (DEFECT_LOGIN_500)');
    const result = auth.login(req.body.email, req.body.password);
    if (!result) return res.status(401).send(V.loginPage({ error: 'Invalid email or password', email: req.body.email || '', next: req.body.next || '' }));
    res.cookie('sid', result.sid, { httpOnly: true, sameSite: 'lax' });
    const next = typeof req.body.next === 'string' && req.body.next.startsWith('/') ? req.body.next : '/dashboard';
    res.redirect(next);
  });
  r.get('/register', (req, res) => (req.user ? res.redirect('/dashboard') : res.send(V.registerPage())));
  r.post('/register', (req, res) => {
    const { value, errors } = validateRegistration(req.body, { db: repo.db });
    if (errors.length) return res.status(422).send(V.registerPage({ values: req.body, errors }));
    const u = repo.createUser(value);
    res.cookie('sid', auth.startSession(u.id), { httpOnly: true, sameSite: 'lax' });
    res.redirect(`/dashboard?flash=${encodeURIComponent('Welcome, ' + u.displayName + '! Your account has been created.')}`);
  });
  r.get('/logout', (req, res) => { auth.logout(req.cookies.sid); res.clearCookie('sid'); res.redirect('/login'); });
  r.post('/logout', (req, res) => { auth.logout(req.cookies.sid); res.clearCookie('sid'); res.redirect('/login'); });

  r.use(requireAuth); // everything below requires a signed-in user

  r.get('/dashboard', (req, res) => res.send(V.dashboardPage(req.user, repo.dashboardStats(), { flash: flashOf(req) })));

  // ---- Patients ----
  r.get('/patients', (req, res) => {
    const q = String(req.query.q || '');
    res.send(V.patientsPage(req.user, repo.listPatients({ q, page: req.query.page, size: req.query.size }), q, caps(req.user)));
  });
  r.get('/patients/new', requireRole('admin', 'staff'), (req, res) => res.send(V.patientFormPage(req.user, { isNew: true })));
  r.post('/patients/new', requireRole('admin', 'staff'), (req, res) => {
    const { value, errors } = validatePatient(req.body);
    if (errors.length) return res.status(422).send(V.patientFormPage(req.user, { patient: req.body, errors, isNew: true }));
    const p = repo.createPatient(value, req.user);
    res.redirect(`/patients/${p.id}?flash=${encodeURIComponent('Patient created')}`);
  });
  r.get('/patients/:id', (req, res) => {
    const p = repo.getPatient(req.params.id);
    if (!p) return notFound(req, res);
    res.send(V.patientDetailPage(req.user, p, repo.listTasks({ patientId: p.id }), caps(req.user), { flash: flashOf(req) }));
  });
  r.get('/patients/:id/edit', requireRole('admin', 'staff'), (req, res) => {
    const p = repo.getPatient(req.params.id);
    if (!p) return notFound(req, res);
    res.send(V.patientFormPage(req.user, { patient: p, isNew: false }));
  });
  r.post('/patients/:id/edit', requireRole('admin', 'staff'), (req, res) => {
    if (!repo.getPatient(req.params.id)) return notFound(req, res);
    const { value, errors } = validatePatient(req.body);
    if (errors.length) return res.status(422).send(V.patientFormPage(req.user, { patient: { ...req.body, id: req.params.id }, errors, isNew: false }));
    repo.updatePatient(req.params.id, value, req.user);
    res.redirect(`/patients/${req.params.id}?flash=${encodeURIComponent('Patient updated')}`);
  });
  r.post('/patients/:id/delete', requireRole('admin'), (req, res) => {
    const result = repo.deletePatient(req.params.id, req.user);
    if (result.notFound) return notFound(req, res);
    if (result.conflict) {
      const p = repo.getPatient(req.params.id);
      const error = `Cannot delete patient: ${result.openTasks} open task(s) still reference this patient. Complete or delete them first.`;
      return res.status(409).send(V.patientDetailPage(req.user, p, repo.listTasks({ patientId: p.id }), caps(req.user), { error }));
    }
    res.redirect(`/patients?flash=${encodeURIComponent('Patient deleted')}`);
  });

  // ---- Tasks ----
  const formData = () => ({ patients: repo.listPatients({ size: 100 }).items, users: repo.activeUsers() });
  r.get('/tasks', (req, res) => res.send(V.tasksPage(req.user, repo.listTasks({ status: req.query.status, sort: req.query.sort }), req.query, caps(req.user))));
  r.get('/tasks/new', requireRole('admin', 'staff'), (req, res) => res.send(V.taskFormPage(req.user, { isNew: true, task: { assigneeId: req.user.id, patientId: req.query.patientId }, ...formData() })));
  r.post('/tasks/new', requireRole('admin', 'staff'), (req, res) => {
    const { value, errors } = validateTask(req.body, { db: repo.db, isCreate: true, api: false, flags });
    if (errors.length) return res.status(422).send(V.taskFormPage(req.user, { task: req.body, errors, isNew: true, ...formData() }));
    const t = repo.createTask(value, req.user);
    res.redirect(`/tasks/${t.id}?flash=${encodeURIComponent('Task created')}`);
  });
  r.get('/tasks/:id', (req, res) => {
    const t = repo.getTask(req.params.id);
    if (!t) return notFound(req, res);
    res.send(V.taskDetailPage(req.user, t, caps(req.user, t), { flash: flashOf(req) }));
  });
  function loadEditableTask(req, res, next) {
    const t = repo.getTask(req.params.id);
    if (!t) return notFound(req, res);
    if (!can.editTask(req.user, t)) return forbid(req, res);
    req.task = t; next();
  }
  r.get('/tasks/:id/edit', loadEditableTask, (req, res) => res.send(V.taskFormPage(req.user, { task: req.task, isNew: false, ...formData() })));
  r.post('/tasks/:id/edit', loadEditableTask, (req, res) => {
    const { value, errors } = validateTask(req.body, { db: repo.db, isCreate: false, api: false, flags });
    if (errors.length) return res.status(422).send(V.taskFormPage(req.user, { task: { ...req.body, id: req.params.id }, errors, isNew: false, ...formData() }));
    repo.updateTask(req.params.id, value, req.user);
    res.redirect(`/tasks/${req.params.id}?flash=${encodeURIComponent('Task updated')}`);
  });
  r.post('/tasks/:id/status', loadEditableTask, (req, res) => {
    if (!['open', 'in_progress', 'done'].includes(req.body.status)) return res.status(422).send(V.taskDetailPage(req.user, req.task, caps(req.user, req.task)));
    repo.setTaskStatus(req.params.id, req.body.status, req.user);
    res.redirect(`/tasks/${req.params.id}?flash=${encodeURIComponent('Status updated')}`);
  });
  r.post('/tasks/:id/delete', (req, res) => {
    const t = repo.getTask(req.params.id);
    if (!t) return notFound(req, res);
    if (!can.deleteTask(req.user, t)) return forbid(req, res);
    repo.deleteTask(req.params.id, req.user);
    res.redirect(`/tasks?flash=${encodeURIComponent('Task deleted')}`);
  });

  // ---- Admin ----
  r.get('/admin', requireRole('admin'), (req, res) => res.send(V.adminPage(req.user, repo.listUsers(), repo.listAudit(100), req.query.tab === 'audit' ? 'audit' : 'users')));
  r.post('/admin/users/:id/deactivate', requireRole('admin'), (req, res) => {
    if (req.params.id === req.user.id) return res.status(409).send(V.adminPage(req.user, repo.listUsers(), repo.listAudit(100), 'users'));
    if (!repo.deactivateUser(req.params.id, req.user)) return notFound(req, res);
    res.redirect('/admin?tab=users');
  });

  // ---- Profile ----
  r.get('/profile', (req, res) => res.send(V.profilePage(req.user, { flash: flashOf(req) })));
  r.post('/profile', (req, res) => {
    const { value, errors } = validateProfile(req.body, req.user);
    if (errors.length) return res.status(422).send(V.profilePage(req.user, { errors, values: req.body }));
    repo.updateProfile(req.user.id, value, req.user);
    res.redirect(`/profile?flash=${encodeURIComponent('Profile saved')}`);
  });

  return r;
}

module.exports = { pagesRouter };
