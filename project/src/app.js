'use strict';
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { openDb, DEFAULT_DB_PATH } = require('./db');
const { readFlags } = require('./flags');
const { createAuth } = require('./auth');
const { createRepo } = require('./repo');
const { pagesRouter } = require('./routes/pages');
const { apiRouter, docsRouter } = require('./routes/api');
const V = require('./views');

// App factory so tests can spin up isolated instances with their own DB and flags.
function createApp({ dbPath = DEFAULT_DB_PATH, env = process.env } = {}) {
  const flags = readFlags(env);
  const db = openDb(dbPath);
  const auth = createAuth(db, (req) => V.forbiddenPage(req.user));
  const repo = createRepo(db, flags);
  repo.db = db;

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use('/static', express.static(path.join(__dirname, '..', 'public')));
  app.use(auth.attachUser);

  app.use('/api/docs', ...docsRouter());
  app.use('/api/v1', apiRouter({ repo, auth, flags }));
  app.use('/', pagesRouter({ repo, auth, flags }));

  app.use((req, res) => res.status(404).send(V.notFoundPage(req.user)));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (env.NODE_ENV !== 'test') console.error(err);
    if (req.originalUrl.startsWith('/api/')) return res.status(500).json({ error: 'Internal server error' });
    res.status(500).send(V.layout({ title: 'Server error', user: req.user, body: '<h1>500 Internal Server Error</h1><p role="alert" class="error-msg">Something went wrong. Please try again.</p>' }));
  });

  app.locals.db = db;
  app.locals.flags = flags;
  return app;
}

module.exports = { createApp };
