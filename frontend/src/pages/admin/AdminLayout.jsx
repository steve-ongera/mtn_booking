// frontend/src/pages/admin/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { adminAuth } from '../../services/api';

const NAV = [
  { section: 'Overview' },
  { to: '/admin/dashboard',   icon: 'bi-grid-1x2',        label: 'Dashboard' },
  { section: 'Operations' },
  { to: '/admin/matatus',     icon: 'bi-bus-front',        label: 'Matatus' },
  { to: '/admin/trips',       icon: 'bi-calendar2-week',   label: 'Express Trips' },
  { to: '/admin/stage-runs',  icon: 'bi-sign-stop',        label: 'Stage Runs' },
  { to: '/admin/bookings',    icon: 'bi-ticket-perforated',label: 'Bookings' },
  { section: 'People' },
  { to: '/admin/drivers',     icon: 'bi-person-badge',     label: 'Drivers' },
  { section: 'Configuration' },
  { to: '/admin/routes',      icon: 'bi-map',              label: 'Routes' },
  { to: '/admin/towns',       icon: 'bi-geo-alt',          label: 'Towns & Stages' },
];

const PAGE_TITLES = {
  '/admin/dashboard':  'Dashboard',
  '/admin/matatus':    'Matatus',
  '/admin/trips':      'Express Trips',
  '/admin/stage-runs': 'Stage Runs',
  '/admin/bookings':   'Bookings',
  '/admin/drivers':    'Drivers',
  '/admin/routes':     'Routes',
  '/admin/towns':      'Towns & Stages',
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('admin_user') || '{}');
      setUser(u);
    } catch {}
  }, []);

  const handleLogout = () => {
    if (confirm('Sign out?')) adminAuth.logout();
  };

  // Current page title
  const pageTitle = Object.entries(PAGE_TITLES).find(([k]) =>
    location.pathname.startsWith(k)
  )?.[1] || 'Admin';

  // Initials for avatar
  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase()
    : 'A';

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
            zIndex: 99, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`ad-sidebar ${sideOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="ad-sidebar-logo">
          <div className="ad-logo-icon">
            <i className="bi bi-bus-front-fill"></i>
          </div>
          <div>
            <div className="ad-logo-text">MTN Sacco</div>
            <div className="ad-logo-sub">Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="ad-sidebar-nav">
          {NAV.map((item, i) => {
            if (item.section) {
              return <div key={i} className="ad-nav-label">{item.section}</div>;
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `ad-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSideOpen(false)}
              >
                <i className={`bi ${item.icon} nav-icon`}></i>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="ad-sidebar-footer">
          <button
            className="ad-nav-item w-100"
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontFamily: 'var(--font-body)' }}
          >
            <i className="bi bi-box-arrow-left nav-icon"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ad-main">
        {/* Topbar */}
        <header className="ad-topbar">
          <button
            className="btn-ad btn-ad-ghost btn-ad-sm"
            onClick={() => setSideOpen(v => !v)}
            style={{ display: 'none', padding: 6 }}
            id="menu-toggle"
          >
            <i className="bi bi-list" style={{ fontSize: '1.2rem' }}></i>
          </button>

          <div className="ad-topbar-title">{pageTitle}</div>

          <div className="ad-topbar-actions">
            <div style={{ fontSize: '.82rem', color: 'var(--gray-500)', textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </div>
              <div>{user?.is_superuser ? 'Superuser' : 'Admin'}</div>
            </div>
            <div
              className="ad-avatar"
              title={user?.username}
              onClick={() => navigate('/admin/dashboard')}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="ad-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}