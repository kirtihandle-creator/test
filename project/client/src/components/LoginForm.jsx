import React, { useState } from 'react';
import { api } from '../api.js';
import ErrorMessage from './ErrorMessage.jsx';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api.login(email, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h1>Sign in</h1>
      <ErrorMessage message={error} />
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <button type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
    </form>
  );
}
