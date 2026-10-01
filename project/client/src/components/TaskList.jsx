import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import TaskCard from './TaskCard.jsx';
import TaskForm from './TaskForm.jsx';
import ErrorMessage from './ErrorMessage.jsx';

export default function TaskList({ user }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const canEdit = user.role === 'admin' || user.role === 'staff';

  const load = useCallback(() => {
    api.listTasks()
      .then((d) => setTasks(d.items || []))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  async function handleStatus(id, status) {
    try {
      await api.setTaskStatus(id, status);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSave(values) {
    try {
      if (editing && editing.id) await api.updateTask(editing.id, values);
      else await api.createTask(values);
      setEditing(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section>
      <h1>Tasks</h1>
      <ErrorMessage message={error} />
      {canEdit && !editing && (
        <button type="button" onClick={() => setEditing({})}>New task</button>
      )}
      {editing && (
        <TaskForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
      {tasks.length === 0 ? (
        <p>No tasks.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              user={user}
              onStatus={handleStatus}
              onEdit={() => setEditing(t)}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
