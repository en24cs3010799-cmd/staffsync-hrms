import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, todayInput } from '../utils.js';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const types = ['Casual', 'Sick', 'Earned', 'Maternity', 'Unpaid'];
const emptyForm = () => ({ leaveType: 'Casual', fromDate: todayInput(), toDate: todayInput(), reason: '' });

export default function Leaves() {
  const { user } = useAuth();
  const canReview = user.role === 'hr' || user.role === 'manager';

  const [tab, setTab] = useState(canReview ? 'review' : 'mine');
  const [mine, setMine] = useState([]);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [applyModal, setApplyModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');

  const [review, setReview] = useState(null); // leave being reviewed
  const [comment, setComment] = useState('');

  const loadMine = () =>
    api.get('/leaves/my').then((r) => setMine(r.data)).catch((e) => setError(errMsg(e)));
  const loadRequests = () =>
    canReview && api.get('/leaves').then((r) => setRequests(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    loadMine();
    loadRequests();
  }, []);

  const apply = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/leaves', form);
      setApplyModal(false);
      setSuccess('Leave request submitted');
      loadMine();
    } catch (err) {
      setFormError(errMsg(err));
    }
  };

  const cancel = async (l) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await api.delete(`/leaves/${l._id}`);
      setSuccess('Leave request cancelled');
      loadMine();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const decide = async (status) => {
    try {
      await api.put(`/leaves/${review._id}/status`, { status, comment });
      setReview(null);
      setComment('');
      setSuccess(`Leave ${status.toLowerCase()}`);
      loadRequests();
    } catch (err) {
      setError(errMsg(err));
      setReview(null);
    }
  };

  const shownRequests = requests.filter((l) => filter === 'All' || l.status === filter);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Leave Management</h4>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm()); setFormError(''); setApplyModal(true); }}>
          <i className="bi bi-plus-lg me-1" />
          Apply for Leave
        </button>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {canReview && (
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button className={`nav-link ${tab === 'review' ? 'active' : ''}`} onClick={() => setTab('review')}>
              {user.role === 'hr' ? 'All Requests' : 'Team Requests'}
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
              My Leaves
            </button>
          </li>
        </ul>
      )}

      {tab === 'review' && canReview && (
        <>
          <div className="mb-3 d-flex gap-2">
            {['Pending', 'Approved', 'Rejected', 'All'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th>
                    <th>Reason</th><th>Status</th><th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shownRequests.length === 0 && (
                    <tr><td colSpan="8" className="text-center text-muted py-4">No requests</td></tr>
                  )}
                  {shownRequests.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <div className="fw-semibold">{l.employee?.name}</div>
                        <small className="text-muted">{l.employee?.department}</small>
                      </td>
                      <td>{l.leaveType}</td>
                      <td>{fmtDate(l.fromDate)}</td>
                      <td>{fmtDate(l.toDate)}</td>
                      <td>{l.days}</td>
                      <td style={{ maxWidth: 220 }}>{l.reason}</td>
                      <td>
                        <StatusBadge value={l.status} />
                        {l.reviewedBy && <div className="small text-muted">by {l.reviewedBy.name}</div>}
                      </td>
                      <td className="text-end">
                        {l.status === 'Pending' && l.employee?._id !== user._id ? (
                          <button className="btn btn-sm btn-outline-primary" onClick={() => { setReview(l); setComment(''); }}>
                            Review
                          </button>
                        ) : (
                          <small className="text-muted">{l.reviewComment}</small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'mine' && (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th>
                  <th>Status</th><th>Remarks</th><th />
                </tr>
              </thead>
              <tbody>
                {mine.length === 0 && (
                  <tr><td colSpan="8" className="text-center text-muted py-4">You have not applied for any leave yet</td></tr>
                )}
                {mine.map((l) => (
                  <tr key={l._id}>
                    <td>{l.leaveType}</td>
                    <td>{fmtDate(l.fromDate)}</td>
                    <td>{fmtDate(l.toDate)}</td>
                    <td>{l.days}</td>
                    <td style={{ maxWidth: 220 }}>{l.reason}</td>
                    <td><StatusBadge value={l.status} /></td>
                    <td className="small text-muted">
                      {l.reviewComment}
                      {l.reviewedBy && <div>by {l.reviewedBy.name}</div>}
                    </td>
                    <td className="text-end">
                      {l.status === 'Pending' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(l)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal show={applyModal} onClose={() => setApplyModal(false)} title="Apply for Leave">
        <form onSubmit={apply}>
          <div className="modal-body">
            <Alert message={formError} />
            <div className="mb-3">
              <label className="form-label">Leave type</label>
              <select className="form-select" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
                {types.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="row g-3 mb-3">
              <div className="col">
                <label className="form-label">From</label>
                <input type="date" className="form-control" required value={form.fromDate}
                  onChange={(e) => setForm({ ...form, fromDate: e.target.value, toDate: form.toDate < e.target.value ? e.target.value : form.toDate })} />
              </div>
              <div className="col">
                <label className="form-label">To</label>
                <input type="date" className="form-control" required min={form.fromDate} value={form.toDate}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="form-label">Reason</label>
              <textarea className="form-control" rows="3" required value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={() => setApplyModal(false)}>Cancel</button>
            <button className="btn btn-primary">Submit request</button>
          </div>
        </form>
      </Modal>

      <Modal show={!!review} onClose={() => setReview(null)} title="Review Leave Request">
        {review && (
          <>
            <div className="modal-body">
              <p className="mb-1"><strong>{review.employee?.name}</strong> · {review.leaveType} leave</p>
              <p className="mb-1">{fmtDate(review.fromDate)} to {fmtDate(review.toDate)} ({review.days} day{review.days > 1 ? 's' : ''})</p>
              <p className="text-muted">{review.reason}</p>
              <label className="form-label">Comment (optional)</label>
              <textarea className="form-control" rows="2" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => decide('Rejected')}>Reject</button>
              <button className="btn btn-success" onClick={() => decide('Approved')}>Approve</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
