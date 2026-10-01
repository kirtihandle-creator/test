'use strict';
// Shared validation used by BOTH the UI forms and the JSON API. Returns { value, errors: [{ field, message }] }.
const { todayIso } = require('./db');

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['open', 'in_progress', 'done'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+-]{7,15}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const str = (v) => (v === undefined || v === null ? '' : String(v).trim());

function isValidDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function validatePatient(input) {
  const errors = [];
  const p = {
    firstName: str(input.firstName), lastName: str(input.lastName), dateOfBirth: str(input.dateOfBirth),
    email: str(input.email) || null, phone: str(input.phone) || null, notes: str(input.notes) || null,
  };
  for (const f of ['firstName', 'lastName']) {
    if (!p[f]) errors.push({ field: f, message: `${f} is required` });
    else if (p[f].length > 50) errors.push({ field: f, message: `${f} must be 1-50 characters` });
  }
  if (!p.dateOfBirth) errors.push({ field: 'dateOfBirth', message: 'dateOfBirth is required' });
  else if (!isValidDate(p.dateOfBirth)) errors.push({ field: 'dateOfBirth', message: 'dateOfBirth must be a valid date (YYYY-MM-DD)' });
  else if (p.dateOfBirth >= todayIso()) errors.push({ field: 'dateOfBirth', message: 'dateOfBirth must be in the past' });
  if (p.email && !EMAIL_RE.test(p.email)) errors.push({ field: 'email', message: 'email must be a valid email address' });
  if (p.phone && !PHONE_RE.test(p.phone)) errors.push({ field: 'phone', message: 'phone must be 7-15 characters using digits, + or -' });
  return { value: p, errors };
}

// ctx: { db, isCreate, api, flags }
function validateTask(input, ctx) {
  const errors = [];
  const t = {
    title: str(input.title), description: str(input.description) || null, dueDate: str(input.dueDate),
    priority: str(input.priority), status: str(input.status) || 'open',
    estimatedMinutes: str(input.estimatedMinutes) === '' ? null : Number(input.estimatedMinutes),
    urgent: [true, 'true', 'on', '1', 1].includes(input.urgent),
    patientId: str(input.patientId), assigneeId: str(input.assigneeId),
  };
  // DEFECT_TASK_TITLE_MIN_IGNORED: API path accepts 1-char titles while the UI still enforces 3.
  const minTitle = ctx.flags.DEFECT_TASK_TITLE_MIN_IGNORED && ctx.api ? 1 : 3;
  if (!t.title) errors.push({ field: 'title', message: 'title is required' });
  else if (t.title.length < minTitle || t.title.length > 100) errors.push({ field: 'title', message: 'title must be 3-100 characters' });
  if (!t.dueDate) errors.push({ field: 'dueDate', message: 'dueDate is required' });
  else if (!isValidDate(t.dueDate)) errors.push({ field: 'dueDate', message: 'dueDate must be a valid date (YYYY-MM-DD)' });
  else if (ctx.isCreate && t.dueDate < todayIso()) errors.push({ field: 'dueDate', message: 'dueDate must not be before today' });
  if (!PRIORITIES.includes(t.priority)) errors.push({ field: 'priority', message: `priority must be one of ${PRIORITIES.join(', ')}` });
  if (!STATUSES.includes(t.status)) errors.push({ field: 'status', message: `status must be one of ${STATUSES.join(', ')}` });
  if (t.estimatedMinutes !== null && (!Number.isInteger(t.estimatedMinutes) || t.estimatedMinutes < 1 || t.estimatedMinutes > 480)) {
    errors.push({ field: 'estimatedMinutes', message: 'estimatedMinutes must be an integer between 1 and 480' });
  }
  if (!t.patientId) errors.push({ field: 'patientId', message: 'patientId is required' });
  else if (!ctx.db.prepare('SELECT 1 FROM patients WHERE id = ?').get(t.patientId)) {
    errors.push({ field: 'patientId', message: 'patientId must reference an existing patient' });
  }
  if (!t.assigneeId) errors.push({ field: 'assigneeId', message: 'assigneeId is required' });
  else if (!ctx.db.prepare('SELECT 1 FROM users WHERE id = ? AND active = 1').get(t.assigneeId)) {
    errors.push({ field: 'assigneeId', message: 'assigneeId must reference an active user' });
  }
  return { value: t, errors };
}

function validateProfile(input, user) {
  const errors = [];
  const displayName = str(input.displayName);
  const currentPassword = str(input.currentPassword);
  const newPassword = str(input.newPassword);
  if (!displayName || displayName.length > 50) errors.push({ field: 'displayName', message: 'displayName must be 1-50 characters' });
  if (newPassword) {
    if (newPassword.length < 8) errors.push({ field: 'newPassword', message: 'newPassword must be at least 8 characters' });
    if (currentPassword !== user.password) errors.push({ field: 'currentPassword', message: 'currentPassword is incorrect' });
  }
  return { value: { displayName, newPassword: newPassword || null }, errors };
}

const SELF_SIGNUP_ROLES = ['staff', 'viewer']; // admin accounts can only be seeded, never self-registered

// ctx: { db }
function validateRegistration(input, ctx) {
  const errors = [];
  const v = { displayName: str(input.displayName), email: str(input.email).toLowerCase(), password: str(input.password),
    confirmPassword: str(input.confirmPassword), role: str(input.role) || 'staff' };
  if (!v.displayName || v.displayName.length > 50) errors.push({ field: 'displayName', message: 'displayName must be 1-50 characters' });
  if (!v.email) errors.push({ field: 'email', message: 'email is required' });
  else if (!EMAIL_RE.test(v.email)) errors.push({ field: 'email', message: 'email must be a valid email address' });
  else if (ctx.db.prepare('SELECT 1 FROM users WHERE email = ?').get(v.email)) errors.push({ field: 'email', message: 'an account with this email already exists' });
  if (!v.password) errors.push({ field: 'password', message: 'password is required' });
  else if (v.password.length < 8) errors.push({ field: 'password', message: 'password must be at least 8 characters' });
  if (v.password && v.confirmPassword !== v.password) errors.push({ field: 'confirmPassword', message: 'passwords do not match' });
  if (!SELF_SIGNUP_ROLES.includes(v.role)) errors.push({ field: 'role', message: `role must be one of ${SELF_SIGNUP_ROLES.join(', ')}` });
  return { value: v, errors };
}

module.exports = { validatePatient, validateTask, validateProfile, validateRegistration, PRIORITIES, STATUSES, SELF_SIGNUP_ROLES };
