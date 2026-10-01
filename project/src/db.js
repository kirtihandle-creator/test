'use strict';
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'clinic.sqlite');

// Small deterministic PRNG so seed UUIDs are stable across resets.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uuidFrom(rand) {
  const hex = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 32; i++) s += hex[Math.floor(rand() * 16)];
  // Force version 4 and variant bits so the string is a valid UUID v4.
  s = s.slice(0, 12) + '4' + s.slice(13, 16) + hex[8 + Math.floor(rand() * 4)] + s.slice(17);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

// Local calendar date as YYYY-MM-DD, optionally offset by days.
function todayIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
  display_name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','staff','viewer')),
  active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL, email TEXT, phone TEXT, notes TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
  due_date TEXT NOT NULL, priority TEXT NOT NULL CHECK(priority IN ('low','medium','high')),
  status TEXT NOT NULL CHECK(status IN ('open','in_progress','done')),
  estimated_minutes INTEGER, urgent INTEGER NOT NULL DEFAULT 0,
  patient_id TEXT NOT NULL REFERENCES patients(id), assignee_id TEXT NOT NULL REFERENCES users(id),
  created_by TEXT NOT NULL REFERENCES users(id), completed_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY, actor_id TEXT, actor_email TEXT NOT NULL, action TEXT NOT NULL,
  entity TEXT NOT NULL, entity_id TEXT NOT NULL, created_at TEXT NOT NULL);
`;

const FIRST = ['Ava', 'Liam', 'Mia', 'Noah', 'Zoe', 'Ethan', 'Isla', 'Lucas', 'Emma', 'Oliver', 'Chloe', 'Arjun'];
const LAST = ['Patel', 'Nguyen', 'Garcia', 'Smith', 'Okafor', 'Kim', 'Rossi', 'Brown', 'Silva', 'Novak', 'Ahmed', 'Dubois'];
const TITLES = ['Follow-up call', 'Review lab results', 'Schedule MRI', 'Renew prescription', 'Post-op check',
  'Vaccination reminder', 'Update insurance record', 'Dietary consult', 'Blood pressure check', 'Discharge summary'];

function seed(db) {
  const rand = mulberry32(20260924);
  const now = new Date().toISOString();
  const insUser = db.prepare('INSERT INTO users (id,email,password,display_name,role,active,created_at) VALUES (?,?,?,?,?,1,?)');
  const users = [
    { id: uuidFrom(rand), email: 'admin@demo.local', password: 'Admin123!', name: 'Alice Admin', role: 'admin' },
    { id: uuidFrom(rand), email: 'staff@demo.local', password: 'Staff123!', name: 'Sam Staff', role: 'staff' },
    { id: uuidFrom(rand), email: 'viewer@demo.local', password: 'Viewer123!', name: 'Vera Viewer', role: 'viewer' },
  ];
  for (const u of users) insUser.run(u.id, u.email, u.password, u.name, u.role, now);

  const insPatient = db.prepare(`INSERT INTO patients (id,first_name,last_name,date_of_birth,email,phone,notes,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  const patients = [];
  for (let i = 0; i < 12; i++) {
    const year = 1940 + Math.floor(rand() * 75);
    const dob = `${year}-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`;
    const email = i % 3 === 0 ? null : `${FIRST[i].toLowerCase()}.${LAST[i].toLowerCase()}@example.com`;
    const phone = i % 4 === 0 ? null : `+1555${String(1000000 + Math.floor(rand() * 8999999))}`;
    const p = { id: uuidFrom(rand), first: FIRST[i], last: LAST[i], dob, email, phone, notes: i % 2 ? 'Allergic to penicillin' : null };
    patients.push(p);
    insPatient.run(p.id, p.first, p.last, p.dob, p.email, p.phone, p.notes, now, now);
  }

  const insTask = db.prepare(`INSERT INTO tasks (id,title,description,due_date,priority,status,estimated_minutes,urgent,
    patient_id,assignee_id,created_by,completed_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const statuses = ['open', 'open', 'in_progress', 'done', 'open'];
  const priorities = ['low', 'medium', 'high'];
  // Due-date offsets from today: 8 past, 4 today, 13 future.
  const offsets = [-10, -7, -5, -3, -2, -1, -14, -21, 0, 0, 0, 0, 1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120];
  for (let i = 0; i < 25; i++) {
    const status = statuses[i % statuses.length];
    const assignee = users[i % 2]; // alternate admin / staff
    const completed = status === 'done' ? new Date(Date.now() - (i + 1) * 3600 * 1000).toISOString() : null;
    insTask.run(uuidFrom(rand), `${TITLES[i % TITLES.length]} #${i + 1}`, i % 3 ? 'Auto-seeded task' : null,
      todayIso(offsets[i]), priorities[i % 3], status, 15 * (1 + (i % 6)), i % 5 === 0 ? 1 : 0,
      patients[i % patients.length].id, assignee.id, users[0].id, completed, now, now);
  }
  db.prepare('INSERT INTO audit_log (id,actor_id,actor_email,action,entity,entity_id,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(uuidFrom(rand), null, 'system', 'seed', 'database', 'seed', now);
}

function openDb(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  if (dbPath !== ':memory:') db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) seed(db);
  return db;
}

function resetDb(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') {
    for (const suffix of ['', '-wal', '-shm']) {
      try { fs.unlinkSync(dbPath + suffix); } catch (err) {
        if (err.code === 'ENOENT') continue; // nothing to delete
        throw new Error(`Cannot remove ${dbPath + suffix} (${err.code}). Stop the running server first, then run reset-db again.`);
      }
    }
  }
  return openDb(dbPath);
}

module.exports = { openDb, resetDb, todayIso, DEFAULT_DB_PATH };
