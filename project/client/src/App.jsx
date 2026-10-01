import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import Navbar from './components/Navbar.jsx';
import LoginForm from './components/LoginForm.jsx';
import TaskList from './components/TaskList.jsx';
import PatientList from './components/PatientList.jsx';
import AuditLog from './components/AuditLog.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('tasks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await api.logout();
    setUser(null);
  }

  if (loading) return <p>Loading...</p>;
  if (!user) return <LoginForm onLogin={setUser} />;

  return (
    <div className="app">
      <Navbar user={user} view={view} onNavigate={setView} onLogout={handleLogout} />
      <main>
        {view === 'tasks' && <TaskList user={user} />}
        {view === 'patients' && <PatientList user={user} />}
        {view === 'audit' && user.role === 'admin' && <AuditLog />}
      </main>
    </div>
  );
}
