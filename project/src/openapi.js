'use strict';
// OpenAPI 3 document for /api/v1. Kept in sync by hand with routes/api.js and validation.js.
const { PRIORITIES, STATUSES, SELF_SIGNUP_ROLES } = require('./validation');

function buildOpenApi() {
  const uuid = { type: 'string', format: 'uuid' };
  const date = { type: 'string', format: 'date', example: '2026-01-31' };
  const idParam = { name: 'id', in: 'path', required: true, schema: uuid };
  const err = (description) => ({ description, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } });
  const json = (schema) => ({ content: { 'application/json': { schema } } });
  const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
  const std = { 401: err('Not authenticated'), 403: err('Forbidden for this role') };
  const validation = { 422: { description: 'Validation failed', ...json(ref('ValidationError')) } };

  return {
    openapi: '3.0.3',
    info: { title: 'Clinic Task Board API', version: '1.0.0',
      description: 'Session-cookie authenticated JSON API. Log in via POST /auth/login, then reuse the `sid` cookie. Roles: admin (full access), staff (create/edit own tasks, manage patients but not delete), viewer (read-only; all mutations return 403).' },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: 'sid' } },
      schemas: {
        Error: { type: 'object', properties: { error: { type: 'string' } }, required: ['error'] },
        ValidationError: { type: 'object', properties: { errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } }, required: ['field', 'message'] } } }, required: ['errors'] },
        User: { type: 'object', properties: { id: uuid, email: { type: 'string', format: 'email' }, displayName: { type: 'string' }, role: { type: 'string', enum: ['admin', 'staff', 'viewer'] }, active: { type: 'boolean' } } },
        PatientInput: { type: 'object', required: ['firstName', 'lastName', 'dateOfBirth'], properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 50 }, lastName: { type: 'string', minLength: 1, maxLength: 50 },
          dateOfBirth: { ...date, description: 'Must be in the past' }, email: { type: 'string', format: 'email', nullable: true },
          phone: { type: 'string', pattern: '^[0-9+-]{7,15}$', nullable: true }, notes: { type: 'string', nullable: true } } },
        Patient: { allOf: [ref('PatientInput'), { type: 'object', properties: { id: uuid, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }] },
        PatientList: { type: 'object', properties: { items: { type: 'array', items: ref('Patient') }, total: { type: 'integer' }, page: { type: 'integer' }, size: { type: 'integer' }, pages: { type: 'integer' } } },
        TaskInput: { type: 'object', required: ['title', 'dueDate', 'priority', 'patientId', 'assigneeId'], properties: {
          title: { type: 'string', minLength: 3, maxLength: 100 }, description: { type: 'string', nullable: true },
          dueDate: { ...date, description: 'Not before today when creating' }, priority: { type: 'string', enum: PRIORITIES },
          status: { type: 'string', enum: STATUSES, default: 'open' }, estimatedMinutes: { type: 'integer', minimum: 1, maximum: 480, nullable: true },
          urgent: { type: 'boolean', default: false }, patientId: { ...uuid, description: 'Must reference an existing patient' },
          assigneeId: { ...uuid, description: 'Must reference an active user' } } },
        Task: { allOf: [ref('TaskInput'), { type: 'object', properties: { id: uuid, createdBy: uuid, completedAt: { type: 'string', format: 'date-time', nullable: true, description: 'Set server-side when status becomes done' },
          patientName: { type: 'string' }, assigneeName: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } } }] },
        TaskList: { type: 'object', properties: { items: { type: 'array', items: ref('Task') } } },
        AuditEntry: { type: 'object', properties: { id: uuid, actorId: { ...uuid, nullable: true }, actorEmail: { type: 'string' }, action: { type: 'string' }, entity: { type: 'string' }, entityId: { type: 'string' }, timestamp: { type: 'string', format: 'date-time' } } },
      },
    },
    security: [{ cookieAuth: [] }],
    paths: {
      '/health': { get: { summary: 'Health check', security: [], responses: { 200: { description: 'OK', ...json({ type: 'object', properties: { status: { type: 'string', example: 'ok' } } }) } } } },
      '/_debug/flags': { get: { summary: 'Active seeded-defect flags', security: [], responses: { 200: { description: 'Flag map', ...json({ type: 'object', additionalProperties: { type: 'boolean' } }) } } } },
      '/auth/login': { post: { summary: 'Log in and receive session cookie', security: [], requestBody: { required: true, ...json({ type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } }) },
        responses: { 200: { description: 'Logged in', ...json({ type: 'object', properties: { user: ref('User') } }) }, 401: err('Invalid credentials') } } },
      '/auth/register': { post: { summary: 'Create a new account (staff or viewer) and start a session', security: [],
        requestBody: { required: true, ...json({ type: 'object', required: ['displayName', 'email', 'password', 'confirmPassword'], properties: {
          displayName: { type: 'string', minLength: 1, maxLength: 50 }, email: { type: 'string', format: 'email', description: 'Must be unique' },
          password: { type: 'string', minLength: 8 }, confirmPassword: { type: 'string', description: 'Must equal password' },
          role: { type: 'string', enum: SELF_SIGNUP_ROLES, default: 'staff', description: 'admin cannot be self-assigned' } } }) },
        responses: { 201: { description: 'Account created; session cookie set', ...json({ type: 'object', properties: { user: ref('User') } }) }, ...validation } } },
      '/auth/logout': { post: { summary: 'Log out', security: [], responses: { 204: { description: 'Logged out' } } } },
      '/auth/me': { get: { summary: 'Current user', responses: { 200: { description: 'Current session user', ...json({ type: 'object', properties: { user: ref('User') } }) }, 401: std[401] } } },
      '/patients': {
        get: { summary: 'List patients', parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }, { name: 'size', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } }],
          responses: { 200: { description: 'Paged list', ...json(ref('PatientList')) }, 401: std[401] } },
        post: { summary: 'Create patient (admin, staff)', requestBody: { required: true, ...json(ref('PatientInput')) },
          responses: { 201: { description: 'Created; Location header set', headers: { Location: { schema: { type: 'string' } } }, ...json(ref('Patient')) }, ...std, ...validation } } },
      '/patients/{id}': { parameters: [idParam],
        get: { summary: 'Get patient', responses: { 200: { description: 'Patient', ...json(ref('Patient')) }, 401: std[401], 404: err('Not found') } },
        put: { summary: 'Update patient (admin, staff)', requestBody: { required: true, ...json(ref('PatientInput')) }, responses: { 200: { description: 'Updated', ...json(ref('Patient')) }, ...std, 404: err('Not found'), ...validation } },
        delete: { summary: 'Delete patient (admin only). Fails with 409 if open tasks reference it.', responses: { 204: { description: 'Deleted' }, ...std, 404: err('Not found'), 409: err('Patient has open tasks') } } },
      '/tasks': {
        get: { summary: 'List tasks', parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: STATUSES } }, { name: 'patientId', in: 'query', schema: uuid }, { name: 'assigneeId', in: 'query', schema: uuid },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['dueDate', '-dueDate', 'title', '-title', 'priority', 'createdAt', '-createdAt'], default: 'dueDate' } }],
          responses: { 200: { description: 'Task list', ...json(ref('TaskList')) }, 401: std[401], ...validation } },
        post: { summary: 'Create task (admin, staff)', requestBody: { required: true, ...json(ref('TaskInput')) },
          responses: { 201: { description: 'Created; Location header set', headers: { Location: { schema: { type: 'string' } } }, ...json(ref('Task')) }, ...std, ...validation } } },
      '/tasks/{id}': { parameters: [idParam],
        get: { summary: 'Get task', responses: { 200: { description: 'Task', ...json(ref('Task')) }, 401: std[401], 404: err('Not found') } },
        put: { summary: 'Update task (admin; staff only for own/assigned tasks)', requestBody: { required: true, ...json(ref('TaskInput')) }, responses: { 200: { description: 'Updated', ...json(ref('Task')) }, ...std, 404: err('Not found'), ...validation } },
        delete: { summary: 'Delete task (admin; staff only for tasks they created)', responses: { 204: { description: 'Deleted' }, ...std, 404: err('Not found') } } },
      '/tasks/{id}/status': { parameters: [idParam], patch: { summary: 'Change task status; done sets completedAt', requestBody: { required: true, ...json({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: STATUSES } } }) },
        responses: { 200: { description: 'Updated', ...json(ref('Task')) }, ...std, 404: err('Not found'), ...validation } } },
      '/users': { get: { summary: 'List users (admin)', responses: { 200: { description: 'Users', ...json({ type: 'object', properties: { items: { type: 'array', items: ref('User') } } }) }, ...std } } },
      '/users/{id}/deactivate': { parameters: [idParam], post: { summary: 'Deactivate user (admin)', responses: { 200: { description: 'Deactivated', ...json(ref('User')) }, ...std, 404: err('Not found'), 409: err('Cannot deactivate self') } } },
      '/audit': { get: { summary: 'Audit log of all mutations (admin)', responses: { 200: { description: 'Entries, newest first', ...json({ type: 'object', properties: { items: { type: 'array', items: ref('AuditEntry') } } }) }, ...std } } },
    },
  };
}

module.exports = { buildOpenApi };
