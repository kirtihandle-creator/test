import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const PRIORITIES = ['low', 'medium', 'high'];

export default function TaskForm({ initial = {}, onSave, onCancel }) {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [priority, setPriority] = useState(initial.priority || 'medium');
  const [patientId, setPatientId] = useState(initial.patientId || '');
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    api.listPatients()
      .then((d) => setPatients(d.items || []))
      .catch(() => setPatients([]));
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ title: title.trim(), description: description.trim(), priority, patientId });
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{initial.id ? 'Edit task' : 'New task'}</h2>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Priority
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>
      <label>
        Patient
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
          <option value="">Select a patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}
