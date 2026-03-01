// frontend/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminDash, adminBookings } from '../../services/api';

function StatCard({ icon, iconClass, label, value, sub, subIcon }) {
  return (
    <div className="ad-stat">
      <div className="d-flex align-center justify-between">
        <div>
          <div className="ad-stat-label">{label}</div>
          <div className="ad-stat-value">{value ?? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 28 }}></span>}</div>
        </div>
        <div className={`ad-stat-icon ${iconClass}`}>
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      {sub && (
        <div className="ad-stat-sub">
          {subIcon && <i className={`bi ${subIcon}`}></i>}
          {sub}
        </div>
      )}
    </div>
  );
}

function MiniBar({ data }) {
  if (!data?.length) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: '.84rem' }}>
      No data yet
    </div>
  );
  const max = Math.max(...data.map(d => Number(d.revenue))) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, padding: '0 4px' }}>
      {data.slice(-20).map((d, i) => (
        <div
          key={i}
          title={`${d.date}: KES ${Number(d.revenue).toLocaleString()}`}
          style={{
            flex: 1,
            height: `${Math.max(4, (Number(d.revenue) / max) * 100)}%`,
            background: 'var(--primary)',
            borderRadius: '3px 3px 0 0',
            opacity: .75 + (i / data.length) * .25,
            cursor: 'default',
            minHeight: 4,
          }}
        />
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminDash.stats(),
      adminDash.revenueChart(14),
      adminBookings.list('?ordering=-created_at'),
    ]).then(([s, c, b]) => {
      setStats(s);
      setChart(c);
      setRecentBookings((b.results || b).slice(0, 6));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => n != null ? Number(n).toLocaleString() : '—';
  const fmtCur = (n) => n != null ? `KES ${Number(n).toLocaleString()}` : '—';

  return (
    <div>
      {/* Stats Grid */}
      <div className="ad-stat-grid mb-4">
        <StatCard icon="bi-ticket-perforated" iconClass="blue"  label="Total Bookings"   value={fmt(stats?.total_bookings)}    sub={`${fmt(stats?.confirmed_bookings)} confirmed`} subIcon="bi-check-circle" />
        <StatCard icon="bi-cash-stack"        iconClass="green" label="Total Revenue"    value={fmtCur(stats?.total_revenue)}  sub={`${fmtCur(stats?.revenue_today)} today`}      subIcon="bi-calendar-day" />
        <StatCard icon="bi-bus-front"         iconClass="cyan"  label="Active Matatus"   value={fmt(stats?.active_matatus)}    sub={`${fmt(stats?.total_matatus)} total`}         subIcon="bi-info-circle" />
        <StatCard icon="bi-people"            iconClass="yellow"label="Drivers"          value={fmt(stats?.total_drivers)}     sub={`${fmt(stats?.total_passengers)} passengers`} subIcon="bi-person" />
        <StatCard icon="bi-clock-history"     iconClass="blue"  label="Pending Bookings" value={fmt(stats?.pending_bookings)}  sub="awaiting payment" />
        <StatCard icon="bi-calendar-week"     iconClass="green" label="Revenue This Week" value={fmtCur(stats?.revenue_this_week)} sub="last 7 days" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Revenue Chart */}
        <div className="ad-card">
          <div className="ad-card-header">
            <span className="ad-card-title">Revenue — Last 14 Days</span>
            <span style={{ fontSize: '.78rem', color: 'var(--gray-400)' }}>
              {fmtCur(stats?.revenue_this_week)} this week
            </span>
          </div>
          <div style={{ padding: '20px 16px 16px' }}>
            <MiniBar data={chart} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '.7rem', color: 'var(--gray-400)' }}>
              {chart.slice(-20).length > 1 && (
                <>
                  <span>{chart[0]?.date}</span>
                  <span>{chart[chart.length - 1]?.date}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="ad-card ad-card-pad">
          <div className="ad-card-title mb-3">Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: 'bi-plus-circle', label: 'Add Matatu',    to: '/admin/matatus',    color: 'var(--primary)' },
              { icon: 'bi-calendar-plus', label: 'New Trip',    to: '/admin/trips',      color: 'var(--success)' },
              { icon: 'bi-person-plus', label: 'Add Driver',    to: '/admin/drivers',    color: 'var(--warning)' },
              { icon: 'bi-ticket-perforated', label: 'Bookings',to: '/admin/bookings',   color: 'var(--info)' },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 8, padding: '16px 10px',
                  background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)',
                  borderRadius: 'var(--radius)', cursor: 'pointer',
                  transition: 'all .15s', fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)'; }}
              >
                <i className={`bi ${a.icon}`} style={{ fontSize: '1.3rem', color: a.color }}></i>
                <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="ad-card">
        <div className="ad-card-header">
          <span className="ad-card-title">Recent Bookings</span>
          <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => navigate('/admin/bookings')}>
            View All <i className="bi bi-arrow-right"></i>
          </button>
        </div>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="ad-spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="ad-empty">
            <i className="bi bi-ticket-perforated"></i>
            <h5>No bookings yet</h5>
            <p>Bookings will appear here as passengers book seats</p>
          </div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Passenger</th>
                  <th>Route</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.reference} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/bookings')}>
                    <td><code style={{ fontSize: '.78rem' }}>{b.reference}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.passenger_name}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--gray-400)' }}>{b.passenger_phone}</div>
                    </td>
                    <td style={{ fontSize: '.82rem' }}>{b.route_display || '—'}</td>
                    <td style={{ fontSize: '.82rem', color: 'var(--gray-500)' }}>{b.departure_date || '—'}</td>
                    <td style={{ fontWeight: 700 }}>KES {Number(b.total_amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${b.status}`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}