# test reviewer notes

## Architecture
This is a small, self-contained Express + SQLite clinic task-board application under `project/`, with server-rendered HTML routes and a parallel JSON API at `/api/v1`. `src/app.js` composes middleware, authentication, repository access, page routes, API routes, static assets, and error handling; `src/repo.js` owns persistence, mapping, auditing, and defect injection. `src/validation.js` is shared by UI and API, while `src/openapi.js` documents the API contract. The root `app.py` is a separate FastAPI scratch application and is not part of the Node app described in `project/package.json`.

## Conventions
- Keep route-layer responsibilities separate: `src/routes/pages.js` renders via `src/views.js`, while `src/routes/api.js` returns JSON and status codes.
- Use `src/repo.js` for database access and mutations; mutations should write an audit entry through `audit()` (for example, `createPatient`, `updateTask`, and `deactivateUser`).
- Use shared capability checks from `src/auth.js` (`can.editTask`, `can.deleteTask`, `can.deletePatient`) in both authorization and UI button state. Staff task access depends on creator/assignee; deletion depends on creator.
- Keep UI/API validation identical by extending `src/validation.js`; validation failures use `{ errors: [{ field, message }] }` and HTTP `422`.
- API resources use camelCase mappings from SQLite snake_case columns, implemented by `toUser`, `toPatient`, and `toTask` in `src/repo.js`.
- IDs are generated as UUIDs (`crypto.randomUUID()` for runtime records); successful API creates return `201` plus a `Location` header using the `created()` helper in `src/routes/api.js`.
- Authentication is session-cookie based (`sid`). API unauthenticated requests return `401`; page requests redirect to `/login`; authorization failures are `403`, not disguised as `404`.
- Preserve deterministic seed behavior in `src/db.js`: the fixed PRNG and relative task dates are intentional test-fixture behavior.
- The OpenAPI document is hand-maintained in `src/openapi.js`; route or validation changes should keep it synchronized.

## Intentional non-standard choices
- Defect flags in `src/flags.js` intentionally create spec violations when enabled, including viewer task deletion, dropped patient phones, and incorrect overdue counts. Do not flag these behaviors unless the change alters the documented flag semantics.
- Sessions are stored in an in-memory `Map` in `src/auth.js`; this is explicitly acceptable for the demo target, not production persistence.
- Seeded passwords are stored plainly in SQLite and compared directly in `src/auth.js`; this is a deliberately tiny QA fixture.
- `DEFECT_LOGIN_500` intentionally makes only the UI login route fail while JSON login continues to work.

## Watch out for
- Do not bypass `auth.can` or route role middleware when adding mutation endpoints; the viewer role must remain read-only and forbidden actions must return `403`.
- Patient deletion must reject any non-`done` referencing task with `409`, while successful deletion cascades all associated tasks (`src/repo.js`).
- Task status transitions must set `completedAt` when entering `done` and clear it when leaving; this logic is centralized in `completedAtFor`.
- Task assignees must be active users, and deactivated users must no longer authenticate or be assignable.
- Avoid changing validation in only one surface: UI and API call `validatePatient`, `validateTask`, or registration/profile validators with deliberately different context only where documented.
- Every mutation, including registration, profile changes, status changes, and deactivation, should remain represented in the audit log.