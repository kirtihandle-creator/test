'use strict';
const crypto = require('crypto');
const { todayIso } = require('./db');

// Data access layer. All mutations write an audit_log row. Seeded defects are applied here.
function createRepo(db, flags) {
  const now = () => new Date().toISOString();
  const uuid = () => crypto.randomUUID();

  const toUser = (r) => r && { id: r.id, email: r.email, displayName: r.display_name, role: r.role, active: !!r.active, createdAt: r.created_at };
  const toPatient = (r) => r && {
    id: r.id, firstName: r.first_name, lastName: r.last_name, dateOfBirth: r.date_of_birth,
    email: r.email, phone: r.phone, notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at,
  };
  const toTask = (r) => r && {
    id: r.id, title: r.title, description: r.description, dueDate: r.due_date, priority: r.priority, status: r.status,
    estimatedMinutes: r.estimated_minutes, urgent: !!r.urgent, patientId: r.patient_id, assigneeId: r.assignee_id,
    createdBy: r.created_by, completedAt: r.completed_at, createdAt: r.created_at, updatedAt: r.updated_at,
    patientName: r.patient_name, assigneeName: r.assignee_name,
  };

  function audit(actor, action, entity, entityId) {
    db.prepare('INSERT INTO audit_log (id,actor_id,actor_email,action,entity,entity_id,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(uuid(), actor ? actor.id : null, actor ? actor.email : 'anonymous', action, entity, entityId, now());
  }

  // ---- Patients ----
  function listPatients({ q = '', page = 1, size = 10 } = {}) {
    page = Math.max(1, parseInt(page, 10) || 1);
    size = Math.min(100, Math.max(1, parseInt(size, 10) || 10));
    const where = q ? 'WHERE first_name LIKE @like OR last_name LIKE @like OR email LIKE @like' : '';
    const params = { like: `%${q}%`, limit: size, offset: (page - 1) * size };
    const total = db.prepare(`SELECT COUNT(*) AS n FROM patients ${where}`).get(params).n;
    const items = db.prepare(`SELECT * FROM patients ${where} ORDER BY last_name, first_name LIMIT @limit OFFSET @offset`).all(params).map(toPatient);
    return { items, total, page, size, pages: Math.max(1, Math.ceil(total / size)) };
  }
  const getPatient = (id) => toPatient(db.prepare('SELECT * FROM patients WHERE id = ?').get(id));
  function createPatient(v, actor) {
    const id = uuid(); const ts = now();
    db.prepare(`INSERT INTO patients (id,first_name,last_name,date_of_birth,email,phone,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(id, v.firstName, v.lastName, v.dateOfBirth, v.email, v.phone, v.notes, ts, ts);
    audit(actor, 'create', 'patient', id);
    return getPatient(id);
  }
  function updatePatient(id, v, actor) {
    const existing = getPatient(id);
    if (!existing) return null;
    // DEFECT_PATIENT_EDIT_DROPS_PHONE: phone is silently not persisted on edit.
    const phone = flags.DEFECT_PATIENT_EDIT_DROPS_PHONE ? null : v.phone;
    db.prepare(`UPDATE patients SET first_name=?, last_name=?, date_of_birth=?, email=?, phone=?, notes=?, updated_at=? WHERE id=?`)
      .run(v.firstName, v.lastName, v.dateOfBirth, v.email, phone, v.notes, now(), id);
    audit(actor, 'update', 'patient', id);
    return getPatient(id);
  }
  function openTaskCount(patientId) {
    return db.prepare(`SELECT COUNT(*) AS n FROM tasks WHERE patient_id = ? AND status != 'done'`).get(patientId).n;
  }
  // Returns { ok } | { notFound } | { conflict, openTasks }
  function deletePatient(id, actor) {
    if (!getPatient(id)) return { notFound: true };
    const open = openTaskCount(id);
    if (open > 0 && !flags.DEFECT_PATIENT_DELETE_IGNORES_OPEN_TASKS) return { conflict: true, openTasks: open };
    db.prepare('DELETE FROM tasks WHERE patient_id = ?').run(id);
    db.prepare('DELETE FROM patients WHERE id = ?').run(id);
    audit(actor, 'delete', 'patient', id);
    return { ok: true };
  }

  // ---- Tasks ----
  const TASK_SELECT = `SELECT t.*, p.first_name || ' ' || p.last_name AS patient_name, u.display_name AS assignee_name
    FROM tasks t JOIN patients p ON p.id = t.patient_id JOIN users u ON u.id = t.assignee_id`;
  const SORTS = { dueDate: 't.due_date ASC', '-dueDate': 't.due_date DESC', title: 't.title ASC', '-title': 't.title DESC',
    priority: "CASE t.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END", createdAt: 't.created_at ASC', '-createdAt': 't.created_at DESC' };
  function listTasks({ status, patientId, assigneeId, sort = 'dueDate', limit } = {}) {
    const conds = []; const params = {};
    if (status) { conds.push('t.status = @status'); params.status = status; }
    if (patientId) { conds.push('t.patient_id = @patientId'); params.patientId = patientId; }
    if (assigneeId) { conds.push('t.assignee_id = @assigneeId'); params.assigneeId = assigneeId; }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const order = SORTS[sort] || SORTS.dueDate;
    const lim = limit ? `LIMIT ${parseInt(limit, 10)}` : '';
    return db.prepare(`${TASK_SELECT} ${where} ORDER BY ${order}, t.title ASC ${lim}`).all(params).map(toTask);
  }
  const getTask = (id) => toTask(db.prepare(`${TASK_SELECT} WHERE t.id = ?`).get(id));
  function createTask(v, actor) {
    const id = uuid(); const ts = now();
    const completed = v.status === 'done' ? ts : null;
    db.prepare(`INSERT INTO tasks (id,title,description,due_date,priority,status,estimated_minutes,urgent,patient_id,assignee_id,created_by,completed_at,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, v.title, v.description, v.dueDate, v.priority, v.status, v.estimatedMinutes, v.urgent ? 1 : 0, v.patientId, v.assigneeId, actor.id, completed, ts, ts);
    audit(actor, 'create', 'task', id);
    return getTask(id);
  }
  function completedAtFor(existing, newStatus, ts) {
    if (newStatus === 'done') return existing.completedAt || ts; // set server-side when marked done
    return null;
  }
  function updateTask(id, v, actor) {
    const existing = getTask(id);
    if (!existing) return null;
    const ts = now();
    db.prepare(`UPDATE tasks SET title=?, description=?, due_date=?, priority=?, status=?, estimated_minutes=?, urgent=?, patient_id=?, assignee_id=?, completed_at=?, updated_at=? WHERE id=?`)
      .run(v.title, v.description, v.dueDate, v.priority, v.status, v.estimatedMinutes, v.urgent ? 1 : 0, v.patientId, v.assigneeId, completedAtFor(existing, v.status, ts), ts, id);
    audit(actor, 'update', 'task', id);
    return getTask(id);
  }
  function setTaskStatus(id, status, actor) {
    const existing = getTask(id);
    if (!existing) return null;
    const ts = now();
    db.prepare('UPDATE tasks SET status=?, completed_at=?, updated_at=? WHERE id=?').run(status, completedAtFor(existing, status, ts), ts, id);
    audit(actor, 'status', 'task', id);
    return getTask(id);
  }
  function deleteTask(id, actor) {
    const r = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    if (r.changes) audit(actor, 'delete', 'task', id);
    return r.changes > 0;
  }

  // ---- Users / audit / dashboard ----
  const listUsers = () => db.prepare('SELECT * FROM users ORDER BY email').all().map(toUser);
  const activeUsers = () => db.prepare('SELECT * FROM users WHERE active = 1 ORDER BY display_name').all().map(toUser);
  const getUser = (id) => toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  function deactivateUser(id, actor) {
    const r = db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(id);
    if (r.changes) audit(actor, 'deactivate', 'user', id);
    return r.changes ? getUser(id) : null;
  }
  function createUser(v) {
    const id = uuid();
    db.prepare('INSERT INTO users (id,email,password,display_name,role,active,created_at) VALUES (?,?,?,?,?,1,?)')
      .run(id, v.email, v.password, v.displayName, v.role, now());
    const u = getUser(id);
    audit({ id, email: v.email }, 'register', 'user', id);
    return u;
  }
  function updateProfile(userId, v, actor) {
    if (v.newPassword) db.prepare('UPDATE users SET display_name=?, password=? WHERE id=?').run(v.displayName, v.newPassword, userId);
    else db.prepare('UPDATE users SET display_name=? WHERE id=?').run(v.displayName, userId);
    audit(actor, 'update', 'user', userId);
    return getUser(userId);
  }
  const listAudit = (limit = 200) => db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC, rowid DESC LIMIT ?').all(limit)
    .map((r) => ({ id: r.id, actorId: r.actor_id, actorEmail: r.actor_email, action: r.action, entity: r.entity, entityId: r.entity_id, timestamp: r.created_at }));

  function dashboardStats() {
    const today = todayIso();
    // DEFECT_DASHBOARD_OVERDUE_OFF_BY_ONE: counts tasks due today as overdue.
    const cmp = flags.DEFECT_DASHBOARD_OVERDUE_OFF_BY_ONE ? '<=' : '<';
    return {
      patients: db.prepare('SELECT COUNT(*) AS n FROM patients').get().n,
      openTasks: db.prepare(`SELECT COUNT(*) AS n FROM tasks WHERE status != 'done'`).get().n,
      overdueTasks: db.prepare(`SELECT COUNT(*) AS n FROM tasks WHERE status != 'done' AND due_date ${cmp} ?`).get(today).n,
      recentTasks: listTasks({ sort: '-createdAt', limit: 5 }),
    };
  }

  return { listPatients, getPatient, createPatient, updatePatient, deletePatient, openTaskCount,
    listTasks, getTask, createTask, updateTask, setTaskStatus, deleteTask,
    listUsers, activeUsers, getUser, createUser, deactivateUser, updateProfile, listAudit, dashboardStats };
}

module.exports = { createRepo };
