'use strict';
const crypto = require('crypto');

// Cookie-session auth with an in-memory session store (fine for a demo target).
function createAuth(db, render403) {
  const sessions = new Map();
  const findUser = db.prepare('SELECT * FROM users WHERE id = ?');

  function login(email, password) {
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').trim().toLowerCase());
    if (!u || u.password !== password || !u.active) return null;
    const sid = crypto.randomBytes(24).toString('hex');
    sessions.set(sid, u.id);
    return { sid, user: u };
  }
  function startSession(userId) { const sid = crypto.randomBytes(24).toString('hex'); sessions.set(sid, userId); return sid; }
  function logout(sid) { sessions.delete(sid); }

  // Attaches req.user (or null) on every request.
  function attachUser(req, res, next) {
    const sid = req.cookies.sid;
    const userId = sid && sessions.get(sid);
    const u = userId ? findUser.get(userId) : null;
    req.user = u && u.active ? u : null;
    if (!req.user && sid) sessions.delete(sid);
    next();
  }

  const isApi = (req) => req.originalUrl.startsWith('/api/');

  function requireAuth(req, res, next) {
    if (req.user) return next();
    if (isApi(req)) return res.status(401).json({ error: 'Authentication required' });
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  }

  function forbid(req, res) {
    if (isApi(req)) return res.status(403).json({ error: 'Forbidden: insufficient role' });
    return res.status(403).send(render403(req));
  }

  function requireRole(...roles) {
    return (req, res, next) => {
      if (!req.user) return requireAuth(req, res, next);
      if (roles.includes(req.user.role)) return next();
      return forbid(req, res);
    };
  }

  // Capability rules shared by API, pages and templates (drives disabled buttons).
  const can = {
    mutate: (u) => !!u && u.role !== 'viewer',
    deletePatient: (u) => !!u && u.role === 'admin',
    editTask: (u, t) => !!u && (u.role === 'admin' || (u.role === 'staff' && (t.createdBy === u.id || t.assigneeId === u.id))),
    deleteTask: (u, t) => !!u && (u.role === 'admin' || (u.role === 'staff' && t.createdBy === u.id)),
    admin: (u) => !!u && u.role === 'admin',
  };

  return { login, startSession, logout, attachUser, requireAuth, requireRole, forbid, can };
}

module.exports = { createAuth };
