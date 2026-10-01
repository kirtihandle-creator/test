import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import ErrorMessage from './ErrorMessage.jsx';

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listAudit()
      .then((d) => setItems(d.items || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <h1>Audit log</h1>
      <ErrorMessage message={error} />
      <table className="audit-table">
        <thead>
          <tr>
            <th>When</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td>{a.createdAt}</td>
              <td>{a.userEmail || a.userId}</td>
              <td>{a.action}</td>
              <td>{a.entity} #{a.entityId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
