import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import ErrorMessage from './ErrorMessage.jsx';

export default function PatientList({ user }) {
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const canDelete = user.role === 'admin';

  const load = useCallback(() => {
    api.listPatients(q)
      .then((d) => setPatients(d.items || []))
      .catch((e) => setError(e.message));
  }, [q]);

  useEffect(load, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this patient?')) return;
    try {
      await api.deletePatient(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section>
      <h1>Patients</h1>
      <ErrorMessage message={error} />
      <input
        type="search"
        placeholder="Search patients"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search patients"
      />
      <table className="patient-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Date of birth</th>
            {canDelete && <th />}
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.phone}</td>
              <td>{p.dob}</td>
              {canDelete && (
                <td>
                  <button type="button" onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {patients.length === 0 && <p>No patients found.</p>}
    </section>
  );
}
