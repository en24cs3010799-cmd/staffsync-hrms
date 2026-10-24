import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, inputDate } from '../utils.js';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const emptyForm = {
  name: '', email: '', password: '', role: 'employee', department: '', designation: '',
  phone: '', address: '', dateOfJoining: '', salary: '', manager: '', isActive: true,
};

export default function Employees() {
  const { user } = useAuth();
  const isHR = user.role === 'hr';

  const [list, setList] = useState([]);
  const [managers, setManagers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const load = () =>
    api.get('/users').then((r) => setList(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
    if (isHR) api.get('/users/managers').then((r) => setManagers(r.data)).catch(() => {});
  }, [isHR]);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, dateOfJoining: inputDate(new Date()) });
    setFormError('');
    setModal(true);
  };

  const openEdit = (u) => {
    setEditId(u._id);
    setForm({
      name: u.name, email: u.email, password: '', role: u.role,
      department: u.department || '', designation: u.designation || '',
      phone: u.phone || '', address: u.address || '',
      dateOfJoining: inputDate(u.dateOfJoining), salary: u.salary ?? '',
      manager: u.manager?._id || '', isActive: u.isActive,
    });
    setFormError('');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = { ...form, salary: Number(form.salary) || 0 };
    if (!payload.password) delete payload.password;
    try {
      if (editId) await api.put(`/users/${editId}`, payload);
      else await api.post('/users', payload);
      setModal(false);
      setSuccess(editId ? 'Employee updated' : 'Employee added (default password: Welcome@123 if none was set)');
      load();
    } catch (err) {
      setFormError(errMsg(err));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      setSuccess('Employee deleted');
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const q = search.toLowerCase();
  const shown = list.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q)
  );

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0">{isHR ? 'Employees' : 'My Team'}</h4>
        <div className="d-flex gap-2">
          <input
            className="form-control"
            placeholder="Search name, email, department"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isHR && (
            <button className="btn btn-primary text-nowrap" onClick={openAdd}>
              <i className="bi bi-plus-lg me-1" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Phone</th>
                <th>Joined</th>
                {isHR && <th>Manager</th>}
                <th>Status</th>
                {isHR && <th className="text-end">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">No records found</td>
                </tr>
              )}
              {shown.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="fw-semibold">{u.name}</div>
                    <small className="text-muted">{u.email}</small>
                  </td>
                  <td><StatusBadge value={u.role} label={u.role.toUpperCase()} /></td>
                  <td>{u.department || '-'}</td>
                  <td>{u.designation || '-'}</td>
                  <td>{u.phone || '-'}</td>
                  <td>{fmtDate(u.dateOfJoining)}</td>
                  {isHR && <td>{u.manager?.name || '-'}</td>}
                  <td><StatusBadge value={u.isActive ? 'Active' : 'Inactive'} /></td>
                  {isHR && (
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(u)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => remove(u)}
                        disabled={u._id === user._id}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal show={modal} onClose={() => setModal(false)} title={editId ? 'Edit Employee' : 'Add Employee'} size="modal-lg">
        <form onSubmit={save}>
          <div className="modal-body">
            <Alert message={formError} />
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full name *</label>
                <input className="form-control" required value={form.name} onChange={set('name')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control" required value={form.email} onChange={set('email')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">{editId ? 'New password (optional)' : 'Password'}</label>
                <input
                  type="password"
                  className="form-control"
                  minLength={6}
                  placeholder={editId ? 'Leave blank to keep current' : 'Default: Welcome@123'}
                  value={form.password}
                  onChange={set('password')}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={set('role')}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Department</label>
                <input className="form-control" value={form.department} onChange={set('department')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Designation</label>
                <input className="form-control" value={form.designation} onChange={set('designation')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Date of joining</label>
                <input type="date" className="form-control" value={form.dateOfJoining} onChange={set('dateOfJoining')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Salary (monthly)</label>
                <input type="number" min="0" className="form-control" value={form.salary} onChange={set('salary')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Reporting manager</label>
                <select className="form-select" value={form.manager} onChange={set('manager')}>
                  <option value="">-- None --</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Address</label>
                <textarea className="form-control" rows="2" value={form.address} onChange={set('address')} />
              </div>
              {editId && (
                <div className="col-12">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="active" checked={form.isActive} onChange={set('isActive')} />
                    <label className="form-check-label" htmlFor="active">Account active</label>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary">{editId ? 'Save changes' : 'Add employee'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
