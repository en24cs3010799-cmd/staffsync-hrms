import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { roleLabel } from '../utils.js';

const menus = {
  hr: [
    { to: '/', icon: 'speedometer2', label: 'Dashboard', end: true },
    { to: '/employees', icon: 'people', label: 'Employees' },
    { to: '/leaves', icon: 'calendar2-check', label: 'Leaves' },
    { to: '/attendance', icon: 'clock-history', label: 'Attendance' },
    { to: '/announcements', icon: 'megaphone', label: 'Announcements' },
    { to: '/training', icon: 'mortarboard', label: 'Training' },
    { to: '/profile', icon: 'person-circle', label: 'My Profile' },
  ],
  manager: [
    { to: '/', icon: 'speedometer2', label: 'Dashboard', end: true },
    { to: '/employees', icon: 'people', label: 'My Team' },
    { to: '/leaves', icon: 'calendar2-check', label: 'Leaves' },
    { to: '/attendance', icon: 'clock-history', label: 'Attendance' },
    { to: '/training', icon: 'mortarboard', label: 'Training' },
    { to: '/announcements', icon: 'megaphone', label: 'Announcements' },
    { to: '/profile', icon: 'person-circle', label: 'My Profile' },
  ],
  employee: [
    { to: '/', icon: 'speedometer2', label: 'Dashboard', end: true },
    { to: '/leaves', icon: 'calendar2-check', label: 'My Leaves' },
    { to: '/attendance', icon: 'clock-history', label: 'Attendance' },
    { to: '/training', icon: 'mortarboard', label: 'Training' },
    { to: '/announcements', icon: 'megaphone', label: 'Announcements' },
    { to: '/profile', icon: 'person-circle', label: 'My Profile' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <i className="bi bi-diagram-3-fill me-2" />
          StaffSync
        </div>
        <nav className="nav flex-column mt-3">
          {menus[user.role].map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className="side-link"
              onClick={() => setOpen(false)}
            >
              <i className={`bi bi-${m.icon} me-2`} />
              {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="btn btn-light d-lg-none" onClick={() => setOpen(!open)} aria-label="Menu">
            <i className="bi bi-list" />
          </button>
          <div className="ms-auto d-flex align-items-center gap-3">
            <div className="text-end lh-sm">
              <div className="fw-semibold">{user.name}</div>
              <small className="text-muted">{roleLabel[user.role]}</small>
            </div>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1" />
              Logout
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
