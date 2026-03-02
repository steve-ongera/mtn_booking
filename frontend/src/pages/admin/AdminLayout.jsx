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
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || 'A'
    : 'A';

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99,
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`ad-sidebar ${sideOpen ? 'open' : ''}`}>
        {/* Header with Logo */}
        <div className="ad-sidebar-header">
          <div className="ad-logo">
            <div className="ad-logo-icon">
              <i className="bi bi-bus-front-fill"></i>
            </div>
            <div className="ad-logo-text">
              <span className="ad-logo-main">MTN Sacco</span>
              <span className="ad-logo-sub">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="ad-sidebar-nav">
          {NAV.map((item, i) => {
            if (item.section) {
              return (
                <div key={i} className="ad-nav-section">
                  <div className="ad-nav-label">{item.section}</div>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `ad-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSideOpen(false)}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer with Logout */}
        <div className="ad-sidebar-footer">
          <button
            className="ad-nav-item w-100"
            onClick={handleLogout}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              color: 'var(--danger)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem'
            }}
          >
            <i className="bi bi-box-arrow-left" style={{ color: 'var(--danger)' }}></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="ad-main">
        {/* Topbar */}
        <header className="ad-topbar">
          <div className="ad-topbar-left">
            <button
              className="ad-menu-toggle"
              onClick={() => setSideOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <i className="bi bi-list"></i>
            </button>
            <h1 className="ad-page-title">{pageTitle}</h1>
          </div>

          <div className="ad-topbar-right">
            {/* User Info */}
            <div className="ad-user" onClick={() => navigate('/admin/dashboard')}>
              <div className="ad-user-avatar">
                {initials}
              </div>
              <div className="ad-user-info">
                <span className="ad-user-name">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </span>
                <span className="ad-user-role">
                  {user?.is_superuser ? 'Superuser' : 'Admin'}
                </span>
              </div>
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