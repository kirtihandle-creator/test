# Clinic Task Board

A tiny, self-contained Express + SQLite web app used as a **test target** for a universal Playwright QA agent.
It has server-rendered pages, a JSON API with OpenAPI/Swagger, three roles, shared UI/API validation,
an audit log, dependent-workflow rules, and **six seeded defects that can be switched on with env vars**.

The expected behaviors are listed as a numbered oracle in [SPEC.md](SPEC.md).

## Setup

Requires Node 18+. No build step, no external services.

```powershell
npm install
npm run reset-db      # recreate data/clinic.sqlite with seed data
npm start             # http://localhost:4000
npm test              # smoke test (in-memory DBs, all flags on/off)
```

Optional env vars: `PORT` (default 4000), `DB_PATH` (default `data/clinic.sqlite`).

### Running with defect flags on (Windows PowerShell)

```powershell
$env:DEFECT_PATIENT_EDIT_DROPS_PHONE = "1"; npm start
```

Several at once:

```powershell
$env:DEFECT_VIEWER_CAN_DELETE_TASK = "1"; $env:DEFECT_TASK_TITLE_MIN_IGNORED = "1"; npm start
```

Clear a flag for the current shell: `Remove-Item Env:DEFECT_VIEWER_CAN_DELETE_TASK`.
Active flags are printed at startup and served at `GET /api/v1/_debug/flags` (no auth).

## Accounts (seeded)

| Email | Password | Role | Permissions |
|---|---|---|---|
| admin@demo.local | Admin123! | admin | Full CRUD on everything, `/admin` dashboard, users, audit log |
| staff@demo.local | Staff123! | staff | Create/edit patients; create tasks; edit/complete tasks they created or are assigned to; delete only tasks they created; cannot delete patients; no `/admin` |
| viewer@demo.local | Viewer123! | viewer | Read-only. Every mutation returns 403 (API) or a 403 page (UI); mutation buttons are rendered disabled |

New users can self-register at `/register` (or `POST /api/v1/auth/register`) as **staff** or **viewer**; admin
accounts can only be seeded. Registration signs the new user in immediately.

Auth is a session cookie (`sid`) set by `POST /login` (form), `POST /register`, or `POST /api/v1/auth/login` (JSON).
Unauthenticated page requests redirect to `/login?next=...`; unauthenticated API calls return `401`.
Forbidden actions return `403` (JSON for API, HTML 403 page for UI), never 404 or a redirect.

## Pages

| Route | Who | Notes |
|---|---|---|
| `GET /` | anyone | Redirects to `/dashboard` or `/login` |
| `GET/POST /login` | anonymous | Email + password form; wrong credentials re-render with `.field-error` and HTTP 401 |
| `GET/POST /register` | anonymous | Create account: display name, email, password, confirm, role (staff/viewer); signs in and redirects to `/dashboard` |
| `GET /logout`, `POST /logout` | signed in | Clears session, redirects to `/login` |
| `GET /dashboard` | all roles | Counts (patients, open tasks, overdue tasks), 5 most recent tasks, section links |
| `GET /patients?q=&page=&size=` | all roles | Search box, pagination (`Previous`/`Next`), `New patient` disabled for viewer |
| `GET/POST /patients/new` | admin, staff | Create form with inline validation |
| `GET /patients/:id` | all roles | Detail `<dl>` with `data-field` attributes; tasks for patient; Edit/Delete (disabled per role) |
| `GET/POST /patients/:id/edit` | admin, staff | Edit form |
| `POST /patients/:id/delete` | admin | Modal confirm; 409 page if open tasks exist |
| `GET /tasks?status=&sort=` | all roles | Status filter `<select>`, sort `<select>`, overdue rows highlighted |
| `GET/POST /tasks/new` | admin, staff | Text, textarea, selects, date, radio (priority), number, checkbox (urgent) |
| `GET /tasks/:id` | all roles | Detail incl. `completedAt`; Edit / Mark done / Delete per permission |
| `GET/POST /tasks/:id/edit` | admin; staff if creator or assignee | |
| `POST /tasks/:id/status` | same as edit | form field `status` |
| `POST /tasks/:id/delete` | admin; staff if creator | Modal confirm |
| `GET /admin?tab=users|audit` | admin | Tabs (Users / Audit Log); deactivate button with confirm dialog |
| `POST /admin/users/:id/deactivate` | admin | 409 for self |
| `GET/POST /profile` | all roles | Change display name and password (current password required) |

Flash messages appear in `.flash[role=status]`; page-level errors in `#page-error[role=alert]`.

## JSON API (`/api/v1`)

OpenAPI 3: `GET /api/v1/openapi.json`. Swagger UI: `GET /api/docs`.
Bodies are JSON. IDs are server-generated UUID v4, returned in the body and in the `Location` header on `201`.

| Method + path | Who | Success | Notes |
|---|---|---|---|
| `GET /health` | public | 200 `{ "status": "ok" }` | |
| `GET /_debug/flags` | public | 200 flag map | test-harness support |
| `POST /auth/login` | public | 200 `{ user }` + `sid` cookie | 401 on bad credentials or inactive user |
| `POST /auth/register` | public | 201 `{ user }` + `sid` cookie | body: displayName, email, password, confirmPassword, role (`staff`\|`viewer`, default staff); 422 on validation |
| `POST /auth/logout` | public | 204 | |
| `GET /auth/me` | signed in | 200 `{ user }` | |
| `GET /patients?q=&page=&size=` | all | 200 `{ items, total, page, size, pages }` | size max 100 |
| `POST /patients` | admin, staff | 201 Patient | 422 on validation |
| `GET /patients/:id` | all | 200 Patient | 404 |
| `PUT /patients/:id` | admin, staff | 200 Patient | full replace; 422 / 404 |
| `DELETE /patients/:id` | admin | 204 | **409** if any non-done task references the patient |
| `GET /tasks?status=&patientId=&assigneeId=&sort=` | all | 200 `{ items }` | sort: `dueDate`, `-dueDate`, `title`, `-title`, `priority`, `createdAt`, `-createdAt`; invalid status -> 422 |
| `POST /tasks` | admin, staff | 201 Task | 422 on validation |
| `GET /tasks/:id` | all | 200 Task | 404 |
| `PUT /tasks/:id` | admin; staff (creator/assignee) | 200 Task | 403 otherwise |
| `PATCH /tasks/:id/status` | admin; staff (creator/assignee) | 200 Task | body `{ status }`; `done` sets `completedAt` |
| `DELETE /tasks/:id` | admin; staff (creator) | 204 | viewer -> 403 |
| `GET /users` | admin | 200 `{ items }` | |
| `POST /users/:id/deactivate` | admin | 200 User | 409 for own account |
| `GET /audit` | admin | 200 `{ items }` | every mutation: actor, action, entity, entityId, timestamp |

## Validation rules (identical in UI and API)

Failures: API returns `422 { "errors": [{ "field", "message" }] }`; UI re-renders the form with HTTP 422,
`.field-error[role=alert][data-field=...]` next to the field, and previously entered values preserved.

**Patient**
- `firstName`, `lastName`: required, 1-50 characters.
- `dateOfBirth`: required, `YYYY-MM-DD`, strictly before today.
- `email`: optional; must be a valid address if present.
- `phone`: optional; digits, `+`, `-` only; 7-15 characters.
- `notes`: optional free text.

**Task**
- `title`: required, 3-100 characters.
- `dueDate`: required, `YYYY-MM-DD`; on **creation** must not be before today (editing an existing task may keep a past date).
- `priority`: one of `low`, `medium`, `high`.
- `status`: one of `open`, `in_progress`, `done` (defaults to `open`).
- `estimatedMinutes`: optional integer 1-480.
- `urgent`: boolean (checkbox).
- `patientId`: must reference an existing patient.
- `assigneeId`: must reference an **active** user.
- Setting status to `done` (via PUT, PATCH, edit form or "Mark done") sets `completedAt` server-side; leaving `done` clears it.

**Registration**
- `displayName`: 1-50 characters. `email`: required, valid, unique (case-insensitive; stored lowercase).
- `password`: at least 8 characters; `confirmPassword` must match. `role`: `staff` or `viewer` (default `staff`); `admin` is rejected.

**Profile**
- `displayName`: 1-50 characters. `newPassword`: optional, at least 8 characters, requires the correct `currentPassword`.

**Dependent workflow**
- Deleting a patient that has any task with status other than `done` fails with `409` and a clear message. Deleting a patient with no open tasks also removes its done tasks.
- Deactivated users cannot log in, cannot be assigned tasks, and their existing sessions stop working.

## Seeded defect flags

All OFF unless the env var equals `1`. Each violates the SPEC ids listed in [SPEC.md](SPEC.md#defect-flag-map).

| Flag | Effect when ON |
|---|---|
| `DEFECT_PATIENT_EDIT_DROPS_PHONE` | `PUT /api/v1/patients/:id` and the edit form silently store `phone` as null. Response looks fine; read-back shows the phone gone. |
| `DEFECT_VIEWER_CAN_DELETE_TASK` | viewer `DELETE /api/v1/tasks/:id` returns 200 and deletes the task. |
| `DEFECT_TASK_TITLE_MIN_IGNORED` | API accepts task titles of 1-2 characters; the UI form still rejects them. |
| `DEFECT_DASHBOARD_OVERDUE_OFF_BY_ONE` | Dashboard overdue count includes open tasks due today. |
| `DEFECT_PATIENT_DELETE_IGNORES_OPEN_TASKS` | Patient delete succeeds even with open tasks (and cascades them away). |
| `DEFECT_LOGIN_500` | `POST /login` (UI form) throws and returns a 500 page. The JSON login still works. Simulates an environment/automation failure, not a spec violation. |

## Seed data

Deterministic (fixed PRNG seed): 3 users, 12 patients with varied optional fields, 25 tasks across all
statuses and priorities, assigned to admin or staff. Due dates are relative to the day the DB is reset:
8 in the past, 4 due today, 13 in the future. IDs are UUID v4 strings, stable across resets.

## Layout

```
src/server.js       start-up + flag banner        src/routes/pages.js   every server-rendered route
src/app.js          app factory (used by tests)   src/routes/api.js     every /api/v1 route
src/db.js           schema, seed, reset           src/openapi.js        OpenAPI 3 document
src/repo.js         data access + audit + defects src/views.js          HTML templates
src/validation.js   shared UI/API rules           src/auth.js           sessions, roles, capabilities
src/flags.js        defect flag names             public/               style.css, app.js (dialog, tabs)
test/smoke.test.js  smoke test
```
