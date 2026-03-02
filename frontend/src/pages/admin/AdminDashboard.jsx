// frontend/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminDash, adminBookings } from '../../services/api';

function StatCard({ icon, iconClass, label, value, sub, subIcon }) {
  return (
    <div className="ad-card" style={{ padding: '20px' }}>
      <div className="d-flex align-center justify-between">
        <div>
          <div style={{ 
            fontSize: '0.85rem', 
            fontWeight: '500', 
            color: 'var(--gray-500)',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}>
            {label}
          </div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: 'var(--gray-900)',
            lineHeight: '1.2',
            fontFamily: 'var(--font-display)'
          }}>
            {value ?? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 28 }}></span>}
          </div>
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          background: iconClass === 'blue' ? 'var(--info-light)' : 
                     iconClass === 'green' ? 'var(--success-light)' : 
                     iconClass === 'cyan' ? 'var(--info-light)' : 
                     iconClass === 'yellow' ? 'var(--warning-light)' : 'var(--primary-soft)',
          color: iconClass === 'blue' ? 'var(--info)' : 
                 iconClass === 'green' ? 'var(--success)' : 
                 iconClass === 'cyan' ? 'var(--info)' : 
                 iconClass === 'yellow' ? 'var(--warning)' : 'var(--primary)'
        }}>
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      {sub && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--gray-200)',
          fontSize: '0.85rem',
          color: 'var(--gray-600)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {subIcon && <i className={`bi ${subIcon}`} style={{ color: 'var(--gray-400)' }}></i>}
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        marginBottom: '24px' 
      }}>
        <StatCard icon="bi-ticket-perforated" iconClass="blue"  label="Total Bookings"   value={fmt(stats?.total_bookings)}    sub={`${fmt(stats?.confirmed_bookings)} confirmed`} subIcon="bi-check-circle" />
        <StatCard icon="bi-cash-stack"        iconClass="green" label="Total Revenue"    value={fmtCur(stats?.total_revenue)}  sub={`${fmtCur(stats?.revenue_today)} today`}      subIcon="bi-calendar-day" />
        <StatCard icon="bi-bus-front"         iconClass="cyan"  label="Active Matatus"   value={fmt(stats?.active_matatus)}    sub={`${fmt(stats?.total_matatus)} total`}         subIcon="bi-info-circle" />
        <StatCard icon="bi-people"            iconClass="yellow"label="Drivers"          value={fmt(stats?.total_drivers)}     sub={`${fmt(stats?.total_passengers)} passengers`} subIcon="bi-person" />
        <StatCard icon="bi-clock-history"     iconClass="blue"  label="Pending Bookings" value={fmt(stats?.pending_bookings)}  sub="awaiting payment" />
        <StatCard icon="bi-calendar-week"     iconClass="green" label="Revenue This Week" value={fmtCur(stats?.revenue_this_week)} sub="last 7 days" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Revenue Chart */}
        <div className="ad-card">
          <div className="ad-card-header">
            <span className="ad-card-title">Revenue — Last 14 Days</span>
            <span className="badge badge-success" style={{ fontSize: '.78rem' }}>
              {fmtCur(stats?.revenue_this_week)} this week
            </span>
          </div>
          <div className="ad-card-body">
            <MiniBar data={chart} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '.7rem', color: 'var(--gray-400)' }}>
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
        <div className="ad-card">
          <div className="ad-card-header">
            <span className="ad-card-title">Quick Actions</span>
          </div>
          <div className="ad-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { icon: 'bi-plus-circle', label: 'Add Matatu',    to: '/admin/matatus',    color: 'var(--primary)' },
                { icon: 'bi-calendar-plus', label: 'New Trip',    to: '/admin/trips',      color: 'var(--success)' },
                { icon: 'bi-person-plus', label: 'Add Driver',    to: '/admin/drivers',    color: 'var(--warning)' },
                { icon: 'bi-ticket-perforated', label: 'Bookings', to: '/admin/bookings',   color: 'var(--info)' },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.to)}
                  className="btn btn-outline-primary"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '20px 12px',
                    height: 'auto',
                    borderWidth: '1.5px'
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.borderColor = a.color; 
                    e.currentTarget.style.backgroundColor = `${a.color}10`;
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.borderColor = 'var(--primary)'; 
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <i className={`bi ${a.icon}`} style={{ fontSize: '1.5rem', color: a.color }}></i>
                  <span style={{ fontSize: '.85rem', fontWeight: '600' }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="ad-card">
        <div className="ad-card-header">
          <span className="ad-card-title">Recent Bookings</span>
          <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/admin/bookings')}>
            View All <i className="bi bi-arrow-right"></i>
          </button>
        </div>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p className="text-muted">Loading bookings...</p>
          </div>
        ) : recentBookings.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            color: 'var(--gray-400)'
          }}>
            <i className="bi bi-ticket-perforated" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
            <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No bookings yet</h5>
            <p style={{ fontSize: '0.95rem' }}>Bookings will appear here as passengers book seats</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
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
                    <td>
                      <code style={{ 
                        fontSize: '.78rem', 
                        background: 'var(--gray-100)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--gray-700)'
                      }}>
                        {b.reference}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{b.passenger_name}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--gray-500)' }}>{b.passenger_phone}</div>
                    </td>
                    <td style={{ fontSize: '.82rem' }}>{b.route_display || '—'}</td>
                    <td style={{ fontSize: '.82rem', color: 'var(--gray-500)' }}>{b.departure_date || '—'}</td>
                    <td style={{ fontWeight: '700', color: 'var(--gray-900)' }}>KES {Number(b.total_amount).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${b.status === 'confirmed' ? 'success' : 
                                                       b.status === 'pending' ? 'warning' : 
                                                       b.status === 'cancelled' ? 'danger' : 'info'}`}>
                        {b.status}
                      </span>
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