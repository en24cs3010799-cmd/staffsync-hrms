import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate } from '../utils.js';
import StatusBadge from '../components/StatusBadge.jsx';

const cardsFor = (s) => {
  if (!s) return [];
  if (s.role === 'hr') {
    return [
      { label: 'Total Employees', value: s.totalEmployees, icon: 'people', color: 'primary', to: '/employees' },
      { label: 'Pending Leaves', value: s.pendingLeaves, icon: 'hourglass-split', color: 'warning', to: '/leaves' },
      { label: 'Present Today', value: s.presentToday, icon: 'check2-circle', color: 'success', to: '/attendance' },
      { label: 'Announcements', value: s.announcements, icon: 'megaphone', color: 'info', to: '/announcements' },
    ];
  }
  if (s.role === 'manager') {
    return [
      { label: 'Team Size', value: s.teamSize, icon: 'people', color: 'primary', to: '/employees' },
      { label: 'Pending Team Leaves', value: s.pendingLeaves, icon: 'hourglass-split', color: 'warning', to: '/leaves' },
      { label: 'Team Present Today', value: s.presentToday, icon: 'check2-circle', color: 'success', to: '/attendance' },
      { label: 'Trainings Created', value: s.trainings, icon: 'mortarboard', color: 'info', to: '/training' },
    ];
  }
  return [
    { label: 'Pending Leaves', value: s.pendingLeaves, icon: 'hourglass-split', color: 'warning', to: '/leaves' },
    { label: 'Approved Leaves', value: s.approvedLeaves, icon: 'calendar2-check', color: 'success', to: '/leaves' },
    { label: 'Days Present (this month)', value: s.daysPresent, icon: 'clock-history', color: 'primary', to: '/attendance' },
    { label: 'My Trainings', value: s.trainings, icon: 'mortarboard', color: 'info', to: '/training' },
  ];
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [news, setNews] = useState([]);

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/announcements').then((r) => setNews(r.data.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <>
      <h4 className="mb-1">Welcome back, {user.name.split(' ')[0]} 👋</h4>
      <p className="text-muted">Here is what is happening today.</p>

      <div className="row g-3 mb-4">
        {cardsFor(stats).map((c) => (
          <div className="col-12 col-sm-6 col-xl-3" key={c.label}>
            <Link to={c.to} className="text-decoration-none text-dark">
              <div className="card stat-card h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className={`stat-icon bg-${c.color} bg-opacity-10 text-${c.color === 'warning' ? 'warning' : c.color}`}>
                    <i className={`bi bi-${c.icon}`} />
                  </div>
                  <div>
                    <div className="fs-3 fw-bold lh-1">{c.value}</div>
                    <small className="text-muted">{c.label}</small>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <strong>Latest announcements &amp; news</strong>
          <Link to="/announcements" className="small">View all</Link>
        </div>
        <ul className="list-group list-group-flush">
          {news.length === 0 && <li className="list-group-item text-muted">No announcements yet.</li>}
          {news.map((n) => (
            <li className="list-group-item" key={n._id}>
              <div className="d-flex justify-content-between">
                <strong>{n.title}</strong>
                <small className="text-muted">{fmtDate(n.createdAt)}</small>
              </div>
              <div className="text-muted small">{n.message}</div>
              <span className="badge bg-light text-dark border mt-1">{n.type}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
