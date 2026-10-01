import React from 'react';

export default function Navbar({ user, view, onNavigate, onLogout }) {
  const links = [
    { key: 'tasks', label: 'Tasks' },
    { key: 'patients', label: 'Patients' },
  ];
  if (user.role === 'admin') links.push({ key: 'audit', label: 'Audit log' });

  return (
    <nav className="navbar" aria-label="Main">
      <strong>Clinic Task Board</strong>
      <ul>
        {links.map((l) => (
          <li key={l.key}>
            <button
              type="button"
              aria-current={view === l.key ? 'page' : undefined}
              onClick={() => onNavigate(l.key)}
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
      <span className="user">
        {user.email} ({user.role})
      </span>
      <button type="button" onClick={onLogout}>Log out</button>
    </nav>
  );
}
