import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, inputDate, todayInput, trainingState } from '../utils.js';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const emptyForm = () => ({
  title: '', description: '', trainer: '', mode: 'Online',
  startDate: todayInput(), endDate: todayInput(), assignedTo: [],
});

export default function Training() {
  const { user } = useAuth();
  const canManage = user.role === 'hr' || user.role === 'manager';

  const [list, setList] = useState([]);
  const [people, setPeople] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');

  const load = () => api.get('/training').then((r) => setList(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
    if (canManage) api.get('/users').then((r) => setPeople(r.data.filter((u) => u.isActive))).catch(() => {});
  }, [canManage]);

  const openAdd = () => { setEditId(null); setForm(emptyForm()); setFormError(''); setModal(true); };
  const openEdit = (t) => {
    setEditId(t._id);
    setForm({
      title: t.title, description: t.description || '', trainer: t.trainer || '', mode: t.mode,
      startDate: inputDate(t.startDate), endDate: inputDate(t.endDate),
      assignedTo: t.assignedTo.map((u) => u._id),
    });
    setFormError('');
    setModal(true);
  };

  const toggle = (id) =>
    setForm((f) => ({
      ...f,
      assignedTo: f.assignedTo.includes(id) ? f.assignedTo.filter((x) => x !== id) : [...f.assignedTo, id],
    }));

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) await api.put(`/training/${editId}`, form);
      else await api.post('/training', form);
      setModal(false);
      setSuccess(editId ? 'Training updated' : 'Training program created');
      load();
    } catch (err) {
      setFormError(errMsg(err));
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    try {
      await api.delete(`/training/${t._id}`);
      setSuccess('Training deleted');
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const canEdit = (t) => user.role === 'hr' || t.createdBy?._id === user._id;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Training &amp; Development</h4>
        {canManage && (
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg me-1" />
            New Program
          </button>
        )}
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {list.length === 0 && (
        <div className="text-muted">
          {canManage ? 'No training programs yet. Create one for your team.' : 'No trainings have been assigned to you.'}
        </div>
      )}

      <div className="row g-3">
        {list.map((t) => (
          <div className="col-12 col-lg-6" key={t._id}>
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0">{t.title}</h5>
                  <StatusBadge value={trainingState(t)} />
                </div>
                <p className="text-muted mb-2">{t.description || 'No description'}</p>
                <div className="small mb-1"><i className="bi bi-calendar-event me-1" />{fmtDate(t.startDate)} – {fmtDate(t.endDate)}</div>
                <div className="small mb-1"><i className="bi bi-person-video3 me-1" />Trainer: {t.trainer || 'TBA'} · {t.mode}</div>
                {canManage && (
                  <div className="small mt-2">
                    <i className="bi bi-people me-1" />
                    {t.assignedTo.length === 0 ? 'Nobody assigned' : t.assignedTo.map((u) => u.name).join(', ')}
                  </div>
                )}
              </div>
              {canManage && canEdit(t) && (
                <div className="card-footer bg-white text-end">
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(t)}><i className="bi bi-pencil" /></button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => remove(t)}><i className="bi bi-trash" /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal show={modal} onClose={() => setModal(false)} title={editId ? 'Edit Training' : 'New Training Program'} size="modal-lg">
        <form onSubmit={save}>
          <div className="modal-body">
            <Alert message={formError} />
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Title *</label>
                <input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Mode</label>
                <select className="form-select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                  <option>Online</option>
                  <option>Offline</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Trainer</label>
                <input className="form-control" value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Start date *</label>
                <input type="date" className="form-control" required value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate < e.target.value ? e.target.value : form.endDate })} />
              </div>
              <div className="col-md-4">
                <label className="form-label">End date *</label>
                <input type="date" className="form-control" required min={form.startDate} value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="form-label">Assign to</label>
                <div className="border rounded p-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                  {people.length === 0 && <div className="text-muted small">No team members available</div>}
                  {people.map((p) => (
                    <div className="form-check" key={p._id}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`p-${p._id}`}
                        checked={form.assignedTo.includes(p._id)}
                        onChange={() => toggle(p._id)}
                      />
                      <label className="form-check-label" htmlFor={`p-${p._id}`}>
                        {p.name} <small className="text-muted">· {p.department || p.role}</small>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary">{editId ? 'Save changes' : 'Create program'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
