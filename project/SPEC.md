# Clinic Task Board - Expected Behavior Specification

This is the oracle a QA agent is judged against. Each behavior has a stable id. "API" means `/api/v1`.
Accounts: admin (`admin@demo.local`), staff (`staff@demo.local`), viewer (`viewer@demo.local`); passwords in README.
"Today" is the server's local calendar date. All flags OFF unless a behavior says otherwise.

## 1. Authentication and sessions

- **B-001** `GET /login` returns 200 with a form containing inputs named `email` and `password` and a submit button.
- **B-002** `POST /login` with valid credentials sets an `sid` cookie and redirects (302) to `/dashboard` (or to a same-origin `next` path).
- **B-003** `POST /login` with an unknown email or wrong password returns 401, re-renders the form with a `.field-error[role=alert]` message and preserves the entered email.
- **B-004** While signed in, every page shows a visible "Log out" link; `GET /logout` clears the session and redirects to `/login`.
- **B-005** After logout, the old `sid` cookie no longer authenticates: `GET /dashboard` redirects to `/login`.
- **B-006** Unauthenticated `GET` of any protected page (`/dashboard`, `/patients`, `/tasks`, `/admin`, `/profile`, detail/edit/new pages) redirects (302) to `/login?next=<original path>`.
- **B-007** Unauthenticated API calls (other than `/health`, `/_debug/flags`, `/openapi.json`, `/auth/login`, `/auth/logout`) return 401 with `{ "error": ... }`.
- **B-008** `POST /api/v1/auth/login` with valid credentials returns 200 `{ user: { id, email, displayName, role, active } }` and sets the `sid` cookie; invalid credentials return 401.
- **B-009** `GET /api/v1/auth/me` returns the signed-in user; `POST /api/v1/auth/logout` returns 204 and invalidates the session.
- **B-010** A deactivated user cannot log in (401) and their existing session stops authenticating.

### Registration

- **B-097** `GET /register` returns 200 with a form containing `displayName`, `email`, `password`, `confirmPassword` inputs and `role` radios for `staff` and `viewer` only (no admin option), plus a link to `/login`. `/login` links to `/register`.
- **B-098** `POST /register` with valid data creates an active user, sets the `sid` cookie and redirects (302) to `/dashboard`, where the header shows the new display name. The email is stored lowercase; logging in later with the same email (any case) and password succeeds.
- **B-099** `POST /api/v1/auth/register` with valid data returns 201 `{ user }` (UUID id, requested role, `active: true`) and sets the `sid` cookie; `GET /api/v1/auth/me` with that cookie returns the new user.
- **B-100** Registration validation (UI 422 with `.field-error[data-field]` and preserved values; API 422 `{ errors }`): missing/51+ char `displayName`; missing or malformed `email`; `email` already used by an existing account (case-insensitive) -> "already exists"; `password` shorter than 8; `confirmPassword` different from `password`; `role` not in `staff|viewer` (including `admin`).
- **B-101** A newly registered viewer receives 403 on every mutation (as B-019); a newly registered staff user has the staff permissions in section 2.
- **B-102** Registration writes one audit entry with action `register`, entity `user`, and the new user's id as both `entityId` and actor.
- **B-103** A signed-in user requesting `GET /register` or `GET /login` is redirected to `/dashboard`.

## 2. Authorization (roles)

- **B-011** admin can reach `GET /admin` (200) and `GET /api/v1/users`, `GET /api/v1/audit` (200).
- **B-012** staff `GET /admin` returns HTTP 403 rendering a page whose `<h1>` is "403 Forbidden"; staff `GET /api/v1/users` and `/api/v1/audit` return 403 JSON.
- **B-013** viewer `GET /admin` returns 403 as in B-012.
- **B-014** staff `DELETE /api/v1/patients/:id` returns 403; the patient still exists afterwards.
- **B-015** staff `POST /api/v1/patients`, `PUT /api/v1/patients/:id`, `POST /api/v1/tasks` succeed (201/200) with valid data.
- **B-016** staff can `PUT` / `PATCH .../status` a task they created or are assigned to; for a task neither created by nor assigned to them these return 403.
- **B-017** staff can `DELETE` a task they created (204); deleting a task created by someone else returns 403.
- **B-018** viewer `GET` of patients, tasks, dashboard and detail pages succeeds (200).
- **B-019** viewer receives 403 for every API mutation: `POST/PUT/DELETE /patients*`, `POST/PUT/DELETE /tasks*`, `PATCH /tasks/:id/status`, `POST /users/:id/deactivate`. The targeted resource is unchanged afterwards.
- **B-020** viewer `GET /patients/new`, `/tasks/new`, `/patients/:id/edit` return the 403 page; `POST` to those paths and to `/patients/:id/delete`, `/tasks/:id/delete` return 403.
- **B-021** For viewer, the UI renders "New patient", "New task", "Edit", "Delete" as `<button disabled>` rather than links/forms; for staff the patient "Delete" button is disabled while "Edit" is an enabled link.
- **B-022** Forbidden responses are 403, never 404 and never a redirect; API forbidden bodies are JSON `{ "error": ... }`.
- **B-023** `POST /api/v1/users/:id/deactivate` for the caller's own account returns 409.

## 3. Dashboard

- **B-024** `/dashboard` shows three counts with `data-stat="patients"`, `"openTasks"`, `"overdueTasks"`.
- **B-025** `patients` equals the number of patients (`GET /api/v1/patients` -> `total`).
- **B-026** `openTasks` equals the number of tasks whose status is not `done`.
- **B-027** `overdueTasks` equals the number of tasks with status not `done` **and** `dueDate` strictly before today. Tasks due today are not overdue.
- **B-028** The recent-tasks table (`#recent-tasks`) lists at most 5 tasks, newest `createdAt` first, each title linking to `/tasks/:id`.
- **B-029** Creating a task increases `openTasks` by 1 on the next dashboard load; marking it done decreases it by 1.

## 4. Patients

- **B-030** `GET /patients` lists patients in a table with `<th>` headers Name, Date of birth, Email, Phone; each name links to `/patients/:id`.
- **B-031** `GET /patients?q=<text>` filters by first name, last name or email (case-insensitive substring); the API `q` parameter behaves identically and `total` reflects the filtered count.
- **B-032** Pagination: `?page=&size=` returns at most `size` rows; `pages = ceil(total/size)`; the "Previous" control is inert on page 1 and "Next" is inert on the last page. `size` is capped at 100.
- **B-033** `POST /api/v1/patients` with valid data returns 201, a body with a UUID v4 `id`, a `Location: /api/v1/patients/<id>` header, and all submitted fields echoed.
- **B-034** After creation, `GET /api/v1/patients/:id` and `GET /patients/:id` show the same values that were submitted (`firstName`, `lastName`, `dateOfBirth`, `email`, `phone`, `notes`).
- **B-035** `POST /patients/new` (form) with valid data redirects to the new patient's detail page, which shows a flash message and the submitted values in `dd[data-field]` elements.
- **B-036** `PUT /api/v1/patients/:id` replaces all fields; subsequent `GET` returns the updated values, **including `phone`**.
- **B-037** Editing a patient via `/patients/:id/edit` and saving persists every field, including `phone`; reloading the detail page shows the new phone.
- **B-038** `GET /api/v1/patients/<unknown uuid>` returns 404 JSON; `GET /patients/<unknown>` returns a 404 page.
- **B-039** Patient IDs are UUID v4 (`8-4-4-4-12` hex, version nibble 4); no sequential integers are used anywhere in the API.

### Patient validation (UI and API identical; API returns 422 `{ errors: [{ field, message }] }`, UI returns 422 and re-renders with `.field-error[data-field]` and preserved values)

- **B-040** Missing `firstName` -> error on `firstName`. Missing `lastName` -> error on `lastName`.
- **B-041** `firstName` or `lastName` of 51 characters -> error; 50 characters is accepted; 1 character is accepted.
- **B-042** Missing `dateOfBirth` -> error. `dateOfBirth` equal to today or in the future -> error "must be in the past". Yesterday is accepted.
- **B-043** Malformed `dateOfBirth` (e.g. `2020-13-45`, `31/01/1990`) -> error.
- **B-044** `email` omitted or blank is accepted; `email` without `@` or domain (e.g. `nope`, `a@b`) -> error on `email`.
- **B-045** `phone` omitted is accepted; `phone` with letters or spaces, or shorter than 7 / longer than 15 characters -> error on `phone`. `+1-555-0100` (11 chars) is accepted.
- **B-046** Multiple invalid fields produce one error entry per invalid field in a single response.
- **B-047** On UI validation failure the form keeps the values the user typed (input `value` attributes equal the submitted strings).

### Patient deletion (dependent workflow)

- **B-048** admin `DELETE /api/v1/patients/:id` for a patient with at least one task whose status is not `done` returns 409 with an `error` message mentioning open tasks; the patient and its tasks still exist.
- **B-049** `POST /patients/:id/delete` (UI) under the same condition returns 409 and re-renders the patient detail page with `#page-error[role=alert]` explaining the open tasks.
- **B-050** After all of the patient's tasks are `done` (or deleted), admin `DELETE /api/v1/patients/:id` returns 204; subsequent `GET` returns 404 and the patient's done tasks are also gone.
- **B-051** admin deleting a patient via the UI requires confirming the modal dialog (`#confirm-dialog`); cancelling leaves the patient in place.
- **B-052** Deleting a non-existent patient returns 404.

## 5. Tasks

- **B-053** `GET /tasks` lists tasks in a table with headers Title, Patient, Assignee, Priority, Status, Due; each title links to `/tasks/:id`.
- **B-054** `GET /tasks?status=open|in_progress|done` and API `?status=` return only tasks with that status. An invalid `status` value on the API returns 422.
- **B-055** API `?patientId=` and `?assigneeId=` filter by exact id; `sort=dueDate` (default) orders ascending by due date, `-dueDate` descending, `title` alphabetically, `-createdAt` newest first.
- **B-056** `POST /api/v1/tasks` with valid data returns 201, a UUID v4 `id`, `Location: /api/v1/tasks/<id>`, `status: "open"` when omitted, `completedAt: null`, `createdBy` equal to the caller's id.
- **B-057** `GET /api/v1/tasks/:id` after creation returns the submitted `title`, `description`, `dueDate`, `priority`, `status`, `estimatedMinutes`, `urgent`, `patientId`, `assigneeId`, plus `patientName` and `assigneeName`.
- **B-058** `POST /tasks/new` (form) with valid data redirects to `/tasks/:id`, whose `dd[data-field]` values match the submitted form, including the radio `priority`, the checkbox `urgent` ("Yes"/"No") and the number `estimatedMinutes`.
- **B-059** `PUT /api/v1/tasks/:id` replaces the task; `GET` returns the updated values.
- **B-060** `PATCH /api/v1/tasks/:id/status` with `{ "status": "done" }` returns 200 with `status: "done"` and a non-null ISO timestamp `completedAt`; `GET /api/v1/tasks/:id` and the detail page `dd[data-field="completedAt"]` show the same value.
- **B-061** Setting status back to `open` or `in_progress` clears `completedAt` to null.
- **B-062** Clicking "Mark done" on `/tasks/:id` (POST `/tasks/:id/status` with `status=done`) redirects back to the detail page showing status `done` and a `completedAt` value; the "Mark done" control is no longer rendered.
- **B-063** `PATCH .../status` with a value outside `open|in_progress|done` returns 422.
- **B-064** `DELETE /api/v1/tasks/:id` by admin returns 204; a later `GET` returns 404 and the task is absent from `GET /api/v1/tasks`.
- **B-065** `GET /api/v1/tasks/<unknown>` returns 404.
- **B-066** The task detail page shows the patient name as a link to `/patients/:patientId`; the patient detail page lists that task under "Tasks for this patient".

### Task validation (UI and API identical)

- **B-067** Missing `title` -> error on `title`. Title of 2 characters -> error ("3-100 characters"). Title of exactly 3 characters is accepted. Title of 101 characters -> error; 100 is accepted.
- **B-068** Missing `dueDate` -> error. On creation a `dueDate` of yesterday -> error "must not be before today"; today and tomorrow are accepted.
- **B-069** On update (`PUT` or edit form) a past `dueDate` is accepted (rule applies at creation only).
- **B-070** `priority` outside `low|medium|high` -> error on `priority`. `status` outside `open|in_progress|done` -> error on `status`.
- **B-071** `patientId` that is not an existing patient -> error on `patientId`.
- **B-072** `assigneeId` that is not a user, or is a deactivated user -> error on `assigneeId`.
- **B-073** `estimatedMinutes` of 0, 481, 1.5 or non-numeric -> error; omitted, 1 and 480 are accepted.
- **B-074** On UI validation failure the task form re-renders with `.field-error[data-field]` beside each invalid field and keeps the entered values.

## 6. Admin

- **B-075** `/admin` shows two tabs (`#tab-users`, `#tab-audit`); `?tab=audit` renders the Audit Log tab selected (`aria-selected="true"`) with its panel visible and the Users panel hidden.
- **B-076** The Users tab lists every seeded user with email, display name, role and status (`active`/`inactive`), and a "Deactivate" button per row; the button for the signed-in admin's own row is disabled.
- **B-077** Clicking "Deactivate" opens the confirm dialog; confirming posts to `/admin/users/:id/deactivate`, after which the row shows `inactive` and its button is disabled.
- **B-078** `POST /api/v1/users/:id/deactivate` returns 200 with `active: false`; `GET /api/v1/users` reflects it.
- **B-079** After deactivation, creating a task with that user as `assigneeId` returns 422 on `assigneeId`.
- **B-080** `GET /api/v1/audit` returns entries newest first, each with `actorEmail`, `action`, `entity`, `entityId`, `timestamp`.
- **B-081** Every successful mutation (create/update/delete of patient or task, status change, deactivate, profile update) adds exactly one audit entry whose `entityId` is the affected resource id and whose `actorEmail` is the acting user's email. Failed (403/409/422) attempts add no entry.
- **B-082** The Audit Log tab shows the same entries as `GET /api/v1/audit` (timestamp, actor, action, entity, entity id columns).

## 7. Profile

- **B-083** `GET /profile` shows a form with `displayName`, `currentPassword`, `newPassword` fields, pre-filled with the current display name.
- **B-084** Saving a new display name (blank passwords) redirects to `/profile` with a flash; the header "Signed in as" shows the new name and `GET /api/v1/auth/me` returns it.
- **B-085** Empty `displayName` or 51+ characters -> 422 with error on `displayName`.
- **B-086** `newPassword` shorter than 8 characters -> 422 with error on `newPassword`.
- **B-087** `newPassword` with a wrong `currentPassword` -> 422 with error on `currentPassword`; the password is unchanged.
- **B-088** After a successful password change the old password no longer logs in and the new one does.

## 8. API contract and discovery

- **B-089** `GET /api/v1/health` returns 200 `{ "status": "ok" }` without authentication.
- **B-090** `GET /api/v1/openapi.json` returns a valid OpenAPI 3.0 document listing every `/api/v1` path in the README; `GET /api/docs` serves Swagger UI (200).
- **B-091** `GET /api/v1/_debug/flags` returns a JSON object with exactly the six `DEFECT_*` keys and boolean values; all `false` in the default configuration.
- **B-092** All API error responses are JSON with either `error` (string) or `errors` (array), never HTML.
- **B-093** Every page has a unique `<title>` ending in " - Clinic Task Board" and exactly one `<h1>`; form inputs have `id` and `name` and a matching `<label for>`; tables use `<th>`; validation messages use class `field-error` with `role="alert"`.

## 9. Seed data (after `npm run reset-db`)

- **B-094** Exactly 3 users (roles admin, staff, viewer), 12 patients, 25 tasks.
- **B-095** Tasks include at least one of each status and each priority, at least one overdue open task, at least one open task due today, and at least one future task.
- **B-096** Seeded ids are UUID v4 and identical after every reset.

## Defect flag map

Each flag, when set to `1`, causes the listed behaviors to fail. Everything else must keep passing.

| Flag | Violates | What a correct QA run should observe |
|---|---|---|
| `DEFECT_PATIENT_EDIT_DROPS_PHONE` | B-036, B-037 | PUT/edit returns success but read-back `phone` is null. Create (B-033/B-034) is unaffected. |
| `DEFECT_VIEWER_CAN_DELETE_TASK` | B-019, B-022 | viewer `DELETE /api/v1/tasks/:id` returns 200 and the task is gone. Other viewer mutations still 403. |
| `DEFECT_TASK_TITLE_MIN_IGNORED` | B-067 (API side) | API accepts 1- and 2-character titles (201). UI form still returns 422 -> UI/API mismatch. |
| `DEFECT_DASHBOARD_OVERDUE_OFF_BY_ONE` | B-027 | `overdueTasks` exceeds the true count by the number of open tasks due today (4 on fresh seed). |
| `DEFECT_PATIENT_DELETE_IGNORES_OPEN_TASKS` | B-048, B-049 | Deleting a patient with open tasks returns 204 (API) / redirects (UI) and cascades the tasks. |
| `DEFECT_LOGIN_500` | none (environment failure) | `POST /login` returns 500. This is **not** a spec violation; a QA agent should classify it as an environment/automation blocker. `POST /api/v1/auth/login` still works, so API-based tests can proceed. |
