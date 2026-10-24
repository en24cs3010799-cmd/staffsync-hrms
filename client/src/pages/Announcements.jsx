import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate } from '../utils.js';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';

const types = ['Announcement', 'News', 'Policy', 'Event'];
const empty = { title: '', message: '', type: 'Announcement' };

export default function Announcements() {
  const { user } = useAuth();
  const isHR = user.role === 'hr';

  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState('');

  const load = () => api.get('/announcements').then((r) => setList(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setForm(empty); setFormError(''); setModal(true); };
  const openEdit = (a) => {
    setEditId(a._id);
    setForm({ title: a.title, message: a.message, type: a.type });
    setFormError('');
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) await api.put(`/announcements/${editId}`, form);
      else await api.post('/announcements', form);
      setModal(false);
      setSuccess(editId ? 'Announcement updated' : 'Announcement posted');
      load();
    } catch (err) {
      setFormError(errMsg(err));
    }
  };

  const remove = async (a) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${a._id}`);
      setSuccess('Announcement deleted');
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Announcements &amp; News</h4>
        {isHR && (
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg me-1" />
            Post New
          </button>
        )}
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {list.length === 0 && <div className="text-muted">No announcements yet.</div>}
      <div className="row g-3">
        {list.map((a) => (
          <div className="col-12" key={a._id}>
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="badge bg-primary me-2">{a.type}</span>
                    <strong>{a.title}</strong>
                  </div>
                  {isHR && (
                    <div className="text-nowrap">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(a)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(a)}><i className="bi bi-trash" /></button>
                    </div>
                  )}
                </div>
                <p className="mt-2 mb-1" style={{ whiteSpace: 'pre-wrap' }}>{a.message}</p>
                <small className="text-muted">Posted by {a.postedBy?.name || 'HR'} on {fmtDate(a.createdAt)}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal show={modal} onClose={() => setModal(false)} title={editId ? 'Edit Announcement' : 'New Announcement'}>
        <form onSubmit={save}>
          <div className="modal-body">
            <Alert message={formError} />
            <div className="mb-3">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {types.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Title</label>
              <input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Message</label>
              <textarea className="form-control" rows="5" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary">{editId ? 'Save' : 'Post'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
