'use strict';
// Server-rendered HTML templates as plain functions. No template engine, no build step.
const { PRIORITIES, STATUSES } = require('./validation');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const errFor = (errors, field) => errors.filter((e) => e.field === field).map((e) => `<span class="field-error" role="alert" data-field="${esc(field)}">${esc(e.message)}</span>`).join('');
const cls = (errors, field) => (errors.some((e) => e.field === field) ? ' class="invalid"' : '');
const opt = (v, label, sel) => `<option value="${esc(v)}"${String(v) === String(sel) ? ' selected' : ''}>${esc(label)}</option>`;

const badge = (kind, v) => `<span class="badge badge-${kind} badge-${kind}-${esc(String(v).replace(/[^a-z_]/g, ''))}">${esc(String(v).replace('_', ' '))}</span>`;
const initials = (name) => esc(String(name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase());
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z"/></svg>',
  patients: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
  tasks: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-2 14-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z"/></svg>',
  admin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
};

function layout({ title, user, body, flash, error, active = '', authPage = false }) {
  const link = (href, key, label) => `<a href="${href}" class="nav-link${active === key ? ' active' : ''}"${active === key ? ' aria-current="page"' : ''}>${ICONS[key] || ''}<span>${label}</span></a>`;
  const nav = user
    ? `<nav class="nav" aria-label="Main">${link('/dashboard', 'dashboard', 'Dashboard')}${link('/patients', 'patients', 'Patients')}${link('/tasks', 'tasks', 'Tasks')}${user.role === 'admin' ? link('/admin', 'admin', 'Admin') : ''}</nav>
       <div class="who"><a href="/profile" class="avatar${active === 'profile' ? ' active' : ''}" title="Profile"><span class="avatar-circle">${initials(user.display_name)}</span><span class="avatar-text"><strong>${esc(user.display_name)}</strong><small>${esc(user.role)}</small></span></a><a href="/logout" id="logout-link" class="logout">Log out</a></div>`
    : `<nav class="nav" aria-label="Main"><a href="/login" class="nav-link${active === 'login' ? ' active' : ''}"><span>Log in</span></a><a href="/register" class="nav-link${active === 'register' ? ' active' : ''}"><span>Create account</span></a></nav>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} - Clinic Task Board</title><link rel="stylesheet" href="/static/style.css"></head>
<body class="${authPage ? 'auth-body' : ''}"><header class="topbar"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">+</span>Clinic Task Board</a>${nav}</header>
<main id="main" class="${authPage ? 'auth-main' : ''}">${flash ? `<div class="flash" role="status">${esc(flash)}</div>` : ''}${error ? `<div class="flash flash-error error-msg" role="alert" id="page-error">${esc(error)}</div>` : ''}${body}</main>
<script src="/static/app.js"></script></body></html>`;
}

const page = (title, user, body, opts = {}) => layout({ title, user, body: `<h1>${esc(title)}</h1>${body}`, ...opts });

const authShell = (title, subtitle, form, footer) => `<section class="auth-card card"><header class="auth-head"><h1>${esc(title)}</h1><p class="muted">${subtitle}</p></header>${form}<footer class="auth-foot">${footer}</footer></section>`;

function loginPage({ error = '', email = '', next = '' } = {}) {
  return layout({ title: 'Log in', user: null, active: 'login', authPage: true, body: authShell('Welcome back', 'Sign in to manage patients and tasks.', `
<form method="post" action="/login" class="form" id="login-form" novalidate>
  <input type="hidden" name="next" value="${esc(next)}">
  ${error ? `<p class="field-error form-error" role="alert">${esc(error)}</p>` : ''}
  <div class="field"><label for="email">Email</label><input type="email" id="email" name="email" value="${esc(email)}" required autocomplete="username" placeholder="you@example.com"></div>
  <div class="field"><label for="password">Password</label><input type="password" id="password" name="password" required autocomplete="current-password"></div>
  <button type="submit" id="login-submit" class="btn-block">Sign in</button>
</form>`, `<p>New here? <a href="/register" id="register-link">Create an account</a></p>
<details class="demo-accounts"><summary>Demo accounts</summary><ul><li><code>admin@demo.local</code> / <code>Admin123!</code></li><li><code>staff@demo.local</code> / <code>Staff123!</code></li><li><code>viewer@demo.local</code> / <code>Viewer123!</code></li></ul></details>`) });
}

function registerPage({ values = {}, errors = [] } = {}) {
  const v = values;
  return layout({ title: 'Create account', user: null, active: 'register', authPage: true, body: authShell('Create your account', 'New accounts start as staff or viewer. Admin access is granted by an administrator.', `
<form method="post" action="/register" class="form" id="register-form" novalidate>
  <div class="field"><label for="displayName">Display name</label><input type="text" id="displayName" name="displayName" value="${esc(v.displayName)}" maxlength="50" autocomplete="name"${cls(errors, 'displayName')}>${errFor(errors, 'displayName')}</div>
  <div class="field"><label for="email">Email</label><input type="email" id="email" name="email" value="${esc(v.email)}" autocomplete="username" placeholder="you@example.com"${cls(errors, 'email')}>${errFor(errors, 'email')}</div>
  <div class="field-row">
    <div class="field"><label for="password">Password</label><input type="password" id="password" name="password" autocomplete="new-password"${cls(errors, 'password')}><small class="help">At least 8 characters</small>${errFor(errors, 'password')}</div>
    <div class="field"><label for="confirmPassword">Confirm password</label><input type="password" id="confirmPassword" name="confirmPassword" autocomplete="new-password"${cls(errors, 'confirmPassword')}>${errFor(errors, 'confirmPassword')}</div>
  </div>
  <fieldset class="field role-picker"><legend>Role</legend>
    <label class="inline choice" for="role-staff"><input type="radio" id="role-staff" name="role" value="staff"${(v.role || 'staff') === 'staff' ? ' checked' : ''}><span><strong>Staff</strong><small class="help">Create and manage patients and tasks</small></span></label>
    <label class="inline choice" for="role-viewer"><input type="radio" id="role-viewer" name="role" value="viewer"${v.role === 'viewer' ? ' checked' : ''}><span><strong>Viewer</strong><small class="help">Read-only access</small></span></label>
    ${errFor(errors, 'role')}</fieldset>
  <button type="submit" id="register-submit" class="btn-block">Create account</button>
</form>`, `<p>Already have an account? <a href="/login" id="login-link">Sign in</a></p>`) });
}

const forbiddenPage = (user) => layout({ title: 'Forbidden', user, body: `<h1>403 Forbidden</h1><p class="error-msg" role="alert">Your role (${esc(user ? user.role : 'anonymous')}) is not allowed to perform this action.</p><p><a href="/dashboard">Back to dashboard</a></p>` });
const notFoundPage = (user) => layout({ title: 'Not found', user, body: '<h1>404 Not found</h1><p>The requested resource does not exist.</p><p><a href="/dashboard">Back to dashboard</a></p>' });

function dashboardPage(user, s, opts = {}) {
  const rows = s.recentTasks.map((t) => `<tr><td><a href="/tasks/${t.id}">${esc(t.title)}</a></td><td>${esc(t.patientName)}</td><td>${badge('status', t.status)}</td><td>${esc(t.dueDate)}</td></tr>`).join('');
  return page('Dashboard', user, `
<section class="stats">
  <div class="stat stat-blue" id="stat-patients">${ICONS.patients}<span class="stat-label">Patients</span><span class="stat-value" data-stat="patients">${s.patients}</span><a href="/patients">View patients</a></div>
  <div class="stat stat-green" id="stat-open-tasks">${ICONS.tasks}<span class="stat-label">Open tasks</span><span class="stat-value" data-stat="openTasks">${s.openTasks}</span><a href="/tasks?status=open">View open tasks</a></div>
  <div class="stat stat-red" id="stat-overdue-tasks">${ICONS.alert}<span class="stat-label">Overdue tasks</span><span class="stat-value" data-stat="overdueTasks">${s.overdueTasks}</span><a href="/tasks">View all tasks</a></div>
</section>
<h2>Recent tasks</h2>
<table id="recent-tasks"><thead><tr><th>Title</th><th>Patient</th><th>Status</th><th>Due</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="empty">No tasks yet</td></tr>'}</tbody></table>`, { active: 'dashboard', ...opts });
}

function pager(base, p) {
  const link = (n, label) => (n < 1 || n > p.pages || n === p.page ? `<span class="disabled">${label}</span>` : `<a href="${base}page=${n}&size=${p.size}">${label}</a>`);
  return `<nav class="pager" aria-label="Pagination">${link(p.page - 1, 'Previous')}<span>Page ${p.page} of ${p.pages} (${p.total} total)</span>${link(p.page + 1, 'Next')}</nav>`;
}

function patientsPage(user, result, q, can) {
  const rows = result.items.map((p) => `<tr data-id="${p.id}"><td><a href="/patients/${p.id}">${esc(p.lastName)}, ${esc(p.firstName)}</a></td><td>${esc(p.dateOfBirth)}</td><td>${esc(p.email || '')}</td><td>${esc(p.phone || '')}</td></tr>`).join('');
  return page('Patients', user, `
<form method="get" action="/patients" class="toolbar" role="search"><label for="q">Search</label><input type="search" id="q" name="q" value="${esc(q)}" placeholder="Name or email"><input type="hidden" name="size" value="${result.size}"><button type="submit">Search</button>
${can.mutate ? `<a class="button" href="/patients/new" id="new-patient">${ICONS.plus}New patient</a>` : '<button type="button" disabled title="Your role cannot create patients">New patient</button>'}</form>
<table id="patients-table"><thead><tr><th>Name</th><th>Date of birth</th><th>Email</th><th>Phone</th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="empty">No patients match your search</td></tr>'}</tbody></table>
${pager(`/patients?q=${encodeURIComponent(q)}&`, result)}`, { active: 'patients' });
}

function patientDetailPage(user, p, tasks, can, opts = {}) {
  const rows = tasks.map((t) => `<tr><td><a href="/tasks/${t.id}">${esc(t.title)}</a></td><td>${badge('status', t.status)}</td><td>${esc(t.dueDate)}</td></tr>`).join('');
  return page(`${p.firstName} ${p.lastName}`, user, `
<dl class="details" id="patient-details">
  <dt>First name</dt><dd data-field="firstName">${esc(p.firstName)}</dd><dt>Last name</dt><dd data-field="lastName">${esc(p.lastName)}</dd>
  <dt>Date of birth</dt><dd data-field="dateOfBirth">${esc(p.dateOfBirth)}</dd><dt>Email</dt><dd data-field="email">${esc(p.email || '')}</dd>
  <dt>Phone</dt><dd data-field="phone">${esc(p.phone || '')}</dd><dt>Notes</dt><dd data-field="notes">${esc(p.notes || '')}</dd><dt>ID</dt><dd data-field="id">${p.id}</dd>
</dl>
<div class="actions">
  ${can.mutate ? `<a class="button" href="/patients/${p.id}/edit" id="edit-patient">Edit</a>` : '<button type="button" disabled>Edit</button>'}
  ${can.deletePatient ? `<form method="post" action="/patients/${p.id}/delete" data-confirm="Delete patient ${esc(p.firstName)} ${esc(p.lastName)}? This cannot be undone."><button type="submit" class="danger" id="delete-patient">Delete</button></form>` : '<button type="button" disabled title="Only admins can delete patients">Delete</button>'}
</div>
<h2>Tasks for this patient</h2>
<table id="patient-tasks"><thead><tr><th>Title</th><th>Status</th><th>Due</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="empty">No tasks for this patient</td></tr>'}</tbody></table>`, { active: 'patients', ...opts });
}

function patientFormPage(user, { patient = {}, errors = [], isNew }) {
  const p = patient; const action = isNew ? '/patients/new' : `/patients/${p.id}/edit`;
  return page(isNew ? 'New patient' : 'Edit patient', user, `
<form method="post" action="${action}" class="card form" id="patient-form" novalidate>
  <div class="field"><label for="firstName">First name</label><input type="text" id="firstName" name="firstName" value="${esc(p.firstName)}" maxlength="50"${cls(errors, 'firstName')}>${errFor(errors, 'firstName')}</div>
  <div class="field"><label for="lastName">Last name</label><input type="text" id="lastName" name="lastName" value="${esc(p.lastName)}" maxlength="50"${cls(errors, 'lastName')}>${errFor(errors, 'lastName')}</div>
  <div class="field"><label for="dateOfBirth">Date of birth</label><input type="date" id="dateOfBirth" name="dateOfBirth" value="${esc(p.dateOfBirth)}"${cls(errors, 'dateOfBirth')}>${errFor(errors, 'dateOfBirth')}</div>
  <div class="field"><label for="email">Email</label><input type="email" id="email" name="email" value="${esc(p.email)}"${cls(errors, 'email')}>${errFor(errors, 'email')}</div>
  <div class="field"><label for="phone">Phone</label><input type="tel" id="phone" name="phone" value="${esc(p.phone)}"${cls(errors, 'phone')}>${errFor(errors, 'phone')}</div>
  <div class="field"><label for="notes">Notes</label><textarea id="notes" name="notes" rows="3">${esc(p.notes)}</textarea></div>
  <div class="form-actions"><button type="submit" id="save-patient">${isNew ? 'Create patient' : 'Save changes'}</button><a class="button ghost" href="${isNew ? '/patients' : `/patients/${p.id}`}">Cancel</a></div>
</form>`, { active: 'patients' });
}

function tasksPage(user, tasks, { status = '', sort = 'dueDate' }, can) {
  const rows = tasks.map((t) => `<tr data-id="${t.id}" class="${t.status !== 'done' && t.dueDate < new Date().toISOString().slice(0, 10) ? 'overdue' : ''}"><td><a href="/tasks/${t.id}">${esc(t.title)}</a></td><td>${esc(t.patientName)}</td><td>${esc(t.assigneeName)}</td><td>${badge('priority', t.priority)}</td><td>${badge('status', t.status)}</td><td>${esc(t.dueDate)}</td></tr>`).join('');
  return page('Tasks', user, `
<form method="get" action="/tasks" class="toolbar" id="task-filter">
  <label for="status">Status</label><select id="status" name="status">${opt('', 'All', status)}${STATUSES.map((s) => opt(s, s, status)).join('')}</select>
  <label for="sort">Sort</label><select id="sort" name="sort">${opt('dueDate', 'Due date (soonest)', sort)}${opt('-dueDate', 'Due date (latest)', sort)}${opt('title', 'Title A-Z', sort)}${opt('priority', 'Priority', sort)}${opt('-createdAt', 'Newest', sort)}</select>
  <button type="submit">Apply</button>
  ${can.mutate ? `<a class="button" href="/tasks/new" id="new-task">${ICONS.plus}New task</a>` : '<button type="button" disabled title="Your role cannot create tasks">New task</button>'}</form>
<table id="tasks-table"><thead><tr><th>Title</th><th>Patient</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty">No tasks match this filter</td></tr>'}</tbody></table>`, { active: 'tasks' });
}

function taskDetailPage(user, t, can, opts = {}) {
  return page(t.title, user, `
<dl class="details" id="task-details">
  <dt>Title</dt><dd data-field="title">${esc(t.title)}</dd><dt>Description</dt><dd data-field="description">${esc(t.description || '')}</dd>
  <dt>Patient</dt><dd data-field="patient"><a href="/patients/${t.patientId}">${esc(t.patientName)}</a></dd><dt>Assignee</dt><dd data-field="assignee">${esc(t.assigneeName)}</dd>
  <dt>Priority</dt><dd data-field="priority">${esc(t.priority)}</dd><dt>Status</dt><dd data-field="status">${esc(t.status)}</dd>
  <dt>Due date</dt><dd data-field="dueDate">${esc(t.dueDate)}</dd><dt>Estimated minutes</dt><dd data-field="estimatedMinutes">${esc(t.estimatedMinutes ?? '')}</dd>
  <dt>Urgent</dt><dd data-field="urgent">${t.urgent ? 'Yes' : 'No'}</dd><dt>Completed at</dt><dd data-field="completedAt">${esc(t.completedAt || '')}</dd><dt>ID</dt><dd data-field="id">${t.id}</dd>
</dl>
<div class="actions">
  ${can.editTask ? `<a class="button" href="/tasks/${t.id}/edit" id="edit-task">Edit</a>` : '<button type="button" disabled title="You cannot edit this task">Edit</button>'}
  ${can.editTask && t.status !== 'done' ? `<form method="post" action="/tasks/${t.id}/status"><input type="hidden" name="status" value="done"><button type="submit" id="mark-done">Mark done</button></form>` : ''}
  ${can.deleteTask ? `<form method="post" action="/tasks/${t.id}/delete" data-confirm="Delete task &quot;${esc(t.title)}&quot;?"><button type="submit" class="danger" id="delete-task">Delete</button></form>` : '<button type="button" disabled title="You cannot delete this task">Delete</button>'}
</div>`, { active: 'tasks', ...opts });
}

function taskFormPage(user, { task = {}, errors = [], isNew, patients, users }) {
  const t = task; const action = isNew ? '/tasks/new' : `/tasks/${t.id}/edit`;
  return page(isNew ? 'New task' : 'Edit task', user, `
<form method="post" action="${action}" class="card form" id="task-form" novalidate>
  <div class="field"><label for="title">Title</label><input type="text" id="title" name="title" value="${esc(t.title)}" maxlength="100"${cls(errors, 'title')}>${errFor(errors, 'title')}</div>
  <div class="field"><label for="description">Description</label><textarea id="description" name="description" rows="3">${esc(t.description)}</textarea></div>
  <div class="field"><label for="patientId">Patient</label><select id="patientId" name="patientId"${cls(errors, 'patientId')}>${opt('', '-- select --', t.patientId)}${patients.map((p) => opt(p.id, `${p.lastName}, ${p.firstName}`, t.patientId)).join('')}</select>${errFor(errors, 'patientId')}</div>
  <div class="field"><label for="assigneeId">Assignee</label><select id="assigneeId" name="assigneeId"${cls(errors, 'assigneeId')}>${opt('', '-- select --', t.assigneeId)}${users.map((u) => opt(u.id, `${u.displayName} (${u.role})`, t.assigneeId)).join('')}</select>${errFor(errors, 'assigneeId')}</div>
  <div class="field"><label for="dueDate">Due date</label><input type="date" id="dueDate" name="dueDate" value="${esc(t.dueDate)}"${cls(errors, 'dueDate')}>${errFor(errors, 'dueDate')}</div>
  <fieldset class="field"><legend>Priority</legend>${PRIORITIES.map((p) => `<label class="inline" for="priority-${p}"><input type="radio" id="priority-${p}" name="priority" value="${p}"${(t.priority || 'medium') === p ? ' checked' : ''}> ${p}</label>`).join('')}${errFor(errors, 'priority')}</fieldset>
  <div class="field"><label for="status">Status</label><select id="status" name="status">${STATUSES.map((s) => opt(s, s, t.status || 'open')).join('')}</select>${errFor(errors, 'status')}</div>
  <div class="field"><label for="estimatedMinutes">Estimated minutes</label><input type="number" id="estimatedMinutes" name="estimatedMinutes" min="1" max="480" value="${esc(t.estimatedMinutes ?? '')}"${cls(errors, 'estimatedMinutes')}>${errFor(errors, 'estimatedMinutes')}</div>
  <div class="field"><label class="inline" for="urgent"><input type="checkbox" id="urgent" name="urgent" value="on"${t.urgent ? ' checked' : ''}> Urgent</label></div>
  <div class="form-actions"><button type="submit" id="save-task">${isNew ? 'Create task' : 'Save changes'}</button><a class="button ghost" href="${isNew ? '/tasks' : `/tasks/${t.id}`}">Cancel</a></div>
</form>`, { active: 'tasks' });
}

function adminPage(user, users, audit, tab) {
  const userRows = users.map((u) => `<tr data-id="${u.id}"><td>${esc(u.email)}</td><td>${esc(u.displayName)}</td><td>${badge('role', u.role)}</td><td class="status">${badge('active', u.active ? 'active' : 'inactive')}</td>
    <td>${u.active && u.id !== user.id ? `<form method="post" action="/admin/users/${u.id}/deactivate" data-confirm="Deactivate ${esc(u.email)}?"><button type="submit" class="danger deactivate-user">Deactivate</button></form>` : '<button type="button" disabled>Deactivate</button>'}</td></tr>`).join('');
  const auditRows = audit.map((a) => `<tr><td>${esc(a.timestamp)}</td><td>${esc(a.actorEmail)}</td><td>${esc(a.action)}</td><td>${esc(a.entity)}</td><td>${esc(a.entityId)}</td></tr>`).join('');
  return page('Admin', user, `
<div class="tabs" role="tablist">
  <a role="tab" href="/admin?tab=users" id="tab-users" aria-selected="${tab === 'users'}" class="${tab === 'users' ? 'active' : ''}">Users</a>
  <a role="tab" href="/admin?tab=audit" id="tab-audit" aria-selected="${tab === 'audit'}" class="${tab === 'audit' ? 'active' : ''}">Audit Log</a>
</div>
<section role="tabpanel" id="panel-users"${tab === 'users' ? '' : ' hidden'}><h2>Users</h2>
<table id="users-table"><thead><tr><th>Email</th><th>Display name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>${userRows}</tbody></table></section>
<section role="tabpanel" id="panel-audit"${tab === 'audit' ? '' : ' hidden'}><h2>Audit Log</h2>
<table id="audit-table"><thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Entity</th><th>Entity ID</th></tr></thead><tbody>${auditRows}</tbody></table></section>`, { active: 'admin' });
}

function profilePage(user, { errors = [], values = {}, flash } = {}) {
  return page('Profile', user, `
<form method="post" action="/profile" class="card form" id="profile-form" novalidate>
  <div class="field"><label for="displayName">Display name</label><input type="text" id="displayName" name="displayName" value="${esc(values.displayName ?? user.display_name)}" maxlength="50"${cls(errors, 'displayName')}>${errFor(errors, 'displayName')}</div>
  <div class="field"><label for="currentPassword">Current password</label><input type="password" id="currentPassword" name="currentPassword"${cls(errors, 'currentPassword')}>${errFor(errors, 'currentPassword')}</div>
  <div class="field"><label for="newPassword">New password (leave blank to keep)</label><input type="password" id="newPassword" name="newPassword"${cls(errors, 'newPassword')}>${errFor(errors, 'newPassword')}</div>
  <button type="submit" id="save-profile">Save profile</button>
</form>`, { flash, active: 'profile' });
}

module.exports = { layout, page, esc, loginPage, registerPage, forbiddenPage, notFoundPage, dashboardPage, patientsPage, patientDetailPage,
  patientFormPage, tasksPage, taskDetailPage, taskFormPage, adminPage, profilePage };
