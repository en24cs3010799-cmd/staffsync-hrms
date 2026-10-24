import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';
import Alert from '../components/Alert.jsx';

const demo = [
  { label: 'HR', email: 'hr@staffsync.com', password: 'hr12345' },
  { label: 'Manager', email: 'manager@staffsync.com', password: 'manager123' },
  { label: 'Employee', email: 'employee@staffsync.com', password: 'employee123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="card login-card p-4">
        <div className="text-center mb-3">
          <i className="bi bi-diagram-3-fill text-primary fs-1" />
          <h3 className="fw-bold mb-0">StaffSync</h3>
          <small className="text-muted">Modern HR management solution</small>
        </div>

        <Alert message={error} />

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
            />
          </div>
          <button className="btn btn-primary w-100" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <hr />
        <div className="small text-muted mb-2">Demo accounts (click to fill):</div>
        <div className="d-flex gap-2 flex-wrap">
          {demo.map((d) => (
            <button
              key={d.label}
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setForm({ email: d.email, password: d.password })}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
