import { useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, roleLabel } from '../utils.js';
import Alert from '../components/Alert.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', address: user.address || '',
    currentPassword: '', newPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const payload = { name: form.name, phone: form.phone, address: form.address };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const { data } = await api.put('/users/me', payload);
      setUser(data);
      setForm({ ...form, currentPassword: '', newPassword: '' });
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const info = [
    ['Email', user.email],
    ['Role', roleLabel[user.role]],
    ['Department', user.department || '-'],
    ['Designation', user.designation || '-'],
    ['Date of joining', fmtDate(user.dateOfJoining)],
    ['Reporting manager', user.manager?.name || '-'],
  ];

  return (
    <>
      <h4 className="mb-3">My Profile</h4>
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-center mb-3">
                <i className="bi bi-person-circle text-primary" style={{ fontSize: '4rem' }} />
                <h5 className="mb-0">{user.name}</h5>
                <small className="text-muted">{user.designation || roleLabel[user.role]}</small>
              </div>
              <ul className="list-group list-group-flush">
                {info.map(([k, v]) => (
                  <li key={k} className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">{k}</span>
                    <span className="text-end">{v}</span>
                  </li>
                ))}
              </ul>
              <small className="text-muted d-block mt-3">
                Department, role and manager can only be changed by HR.
              </small>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <h6 className="mb-3">Edit personal details</h6>
              <Alert message={error} onClose={() => setError('')} />
              <Alert type="success" message={success} onClose={() => setSuccess('')} />
              <form onSubmit={save}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full name</label>
                    <input className="form-control" required value={form.name} onChange={set('name')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows="2" value={form.address} onChange={set('address')} />
                  </div>
                </div>

                <hr className="my-4" />
                <h6 className="mb-3">Change password</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Current password</label>
                    <input type="password" className="form-control" value={form.currentPassword} onChange={set('currentPassword')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">New password</label>
                    <input type="password" minLength={6} className="form-control" value={form.newPassword} onChange={set('newPassword')} />
                  </div>
                </div>

                <button className="btn btn-primary mt-4" disabled={busy}>
                  {busy ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
