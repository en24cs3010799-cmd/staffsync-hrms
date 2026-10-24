import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate, fmtTime, todayInput } from '../utils.js';
import Alert from '../components/Alert.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Attendance() {
  const { user } = useAuth();
  const canView = user.role === 'hr' || user.role === 'manager';

  const [tab, setTab] = useState('mine');
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [date, setDate] = useState(todayInput());
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMine = () => {
    api.get('/attendance/today').then((r) => setToday(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/attendance/my').then((r) => setHistory(r.data)).catch(() => {});
  };

  const loadTeam = () =>
    api.get('/attendance', { params: { date } }).then((r) => setRecords(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(loadMine, []);
  useEffect(() => {
    if (canView && tab === 'team') loadTeam();
  }, [tab, date]);

  const act = async (kind) => {
    setError('');
    try {
      await api.post(`/attendance/${kind}`);
      setSuccess(kind === 'checkin' ? 'Checked in. Have a great day!' : 'Checked out. See you tomorrow!');
      loadMine();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <h4 className="mb-3">Attendance</h4>
      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {canView && (
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button className={`nav-link ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>My Attendance</button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${tab === 'team' ? 'active' : ''}`} onClick={() => setTab('team')}>
              {user.role === 'hr' ? 'All Employees' : 'My Team'}
            </button>
          </li>
        </ul>
      )}

      {tab === 'mine' && (
        <>
          <div className="card mb-4">
            <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <div className="text-muted small">Today · {fmtDate(new Date())}</div>
                {!today && <div className="fs-5">You have not checked in yet</div>}
                {today && (
                  <div className="fs-5">
                    In: <strong>{fmtTime(today.checkIn)}</strong>
                    {today.checkOut && <> · Out: <strong>{fmtTime(today.checkOut)}</strong> · {today.workHours} hrs</>}
                  </div>
                )}
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-success" disabled={!!today} onClick={() => act('checkin')}>
                  <i className="bi bi-box-arrow-in-right me-1" />
                  Check In
                </button>
                <button className="btn btn-danger" disabled={!today || !!today.checkOut} onClick={() => act('checkout')}>
                  <i className="bi bi-box-arrow-right me-1" />
                  Check Out
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-white"><strong>Recent history</strong></div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {history.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">No records yet</td></tr>}
                  {history.map((h) => (
                    <tr key={h._id}>
                      <td>{fmtDate(h.date)}</td>
                      <td>{fmtTime(h.checkIn)}</td>
                      <td>{fmtTime(h.checkOut)}</td>
                      <td>{h.checkOut ? h.workHours : '-'}</td>
                      <td><StatusBadge value={h.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'team' && canView && (
        <div className="card">
          <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
            <strong>{records.length} present on selected date</strong>
            <input type="date" className="form-control w-auto" value={date} max={todayInput()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead className="table-light">
                <tr><th>Employee</th><th>Department</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {records.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-4">No attendance marked</td></tr>}
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="fw-semibold">{r.employee?.name}</div>
                      <small className="text-muted">{r.employee?.designation}</small>
                    </td>
                    <td>{r.employee?.department || '-'}</td>
                    <td>{fmtTime(r.checkIn)}</td>
                    <td>{fmtTime(r.checkOut)}</td>
                    <td>{r.checkOut ? r.workHours : '-'}</td>
                    <td><StatusBadge value={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
