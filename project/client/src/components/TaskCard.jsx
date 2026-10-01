import React from 'react';

const STATUSES = ['open', 'in_progress', 'done'];

export default function TaskCard({ task, user, onStatus, onEdit, onDelete }) {
  const canEdit = user.role === 'admin' || user.role === 'staff';
  const canDelete = user.role === 'admin';

  return (
    <li className={`task-card status-${task.status}`}>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <dl>
        <dt>Patient</dt>
        <dd>{task.patientName || task.patientId}</dd>
        <dt>Priority</dt>
        <dd>{task.priority}</dd>
        <dt>Status</dt>
        <dd>{task.status}</dd>
      </dl>
      {canEdit && (
        <div className="actions">
          <select
            value={task.status}
            onChange={(e) => onStatus(task.id, e.target.value)}
            aria-label="Status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="button" onClick={onEdit}>Edit</button>
          {canDelete && (
            <button type="button" onClick={() => onDelete(task.id)}>Delete</button>
          )}
        </div>
      )}
    </li>
  );
}
