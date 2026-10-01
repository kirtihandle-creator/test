'use strict';
const { resetDb, DEFAULT_DB_PATH } = require('./db');
const dbPath = process.env.DB_PATH || DEFAULT_DB_PATH;
const db = resetDb(dbPath);
const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
console.log(`Database reset at ${dbPath}`);
console.log(`users=${count('users')} patients=${count('patients')} tasks=${count('tasks')}`);
db.close();
