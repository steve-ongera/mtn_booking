// frontend/src/pages/admin/AdminBookings.jsx
import { useState, useEffect } from 'react';
import { adminBookings } from '../../services/api';

export default function AdminBookings() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      let p = '';
      if (search) p += `?search=${search}`;
      if (filterStatus) p += `${p ? '&' : '?'}status=${filterStatus}`;
      const data = await adminBookings.list(p);
      setItems(data.results || data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus]);

  const handleConfirm = async (ref) => {
    setActionLoading(ref);
    try { await adminBookings.confirm(ref); load(); setDetail(null); }
    catch { alert('Failed to confirm.'); }
    finally { setActionLoading(''); }
  };

  const handleCancel = async (ref) => {
    if (!confirm('Cancel this booking?')) return;
    setActionLoading(ref);
    try { await adminBookings.cancel(ref); load(); setDetail(null); }
    catch { alert('Failed to cancel.'); }
    finally { setActionLoading(''); }
  };

  const STATUS_COLORS = { 
    confirmed: 'badge-success', 
    pending: 'badge-warning', 
    cancelled: 'badge-danger', 
    refunded: 'badge-info' 
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 style={{ marginBottom: '4px' }}>Bookings</h3>
          <p className="text-muted" style={{ margin: 0 }}>All passenger bookings</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {/* Status Filter Tabs */}
          <div className="ad-tabs" style={{ 
            display: 'flex', 
            gap: '4px', 
            background: 'var(--gray-100)', 
            padding: '4px', 
            borderRadius: 'var(--radius)' 
          }}>
            {[['','All'],['pending','Pending'],['confirmed','Confirmed'],['cancelled','Cancelled']].map(([v,l]) => (
              <button 
                key={v} 
                className={`btn btn-sm ${filterStatus === v ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none' }}
                onClick={() => setFilter(v)}
              >
                {l}
              </button>
            ))}
          </div>
          
          {/* Search */}
          <div className="ad-search" style={{ position: 'relative' }}>
            <i className="bi bi-search"></i>
            <input 
              className="form-control" 
              placeholder="Search ref, name, phone..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="ad-card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p className="text-muted">Loading bookings...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            color: 'var(--gray-400)'
          }}>
            <i className="bi bi-ticket-perforated" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
            <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No bookings found</h5>
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
                  <th>Seats</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(b => (
                  <tr 
                    key={b.reference} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => setDetail(b)}
                  >
                    <td>
                      <code style={{ 
                        fontSize: '.75rem',
                        background: 'var(--gray-100)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--gray-700)'
                      }}>
                        {b.reference}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{b.passenger_name}</div>
                      <div className="text-muted" style={{ fontSize: '.75rem' }}>{b.passenger_phone}</div>
                    </td>
                    <td style={{ fontSize: '.82rem' }}>{b.route_display || '—'}</td>
                    <td style={{ fontSize: '.82rem' }}>{b.departure_date || '—'}</td>
                    <td style={{ fontSize: '.82rem' }}>
                      {b.seat_numbers?.join(', ')}
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--gray-900)' }}>
                      KES {Number(b.total_amount).toLocaleString()}
                    </td>
                    <td>
                      {b.payment_receipt ? (
                        <span className="badge badge-success">
                          <i className="bi bi-check-circle-fill"></i> Paid
                        </span>
                      ) : (
                        <span className={`badge ${b.payment_status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                          {b.payment_status || 'pending'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[b.status] || 'badge-info'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="d-flex gap-1">
                        {b.status === 'pending' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleConfirm(b.reference)}
                            disabled={actionLoading === b.reference}
                            title="Confirm"
                            style={{ padding: '6px 10px' }}
                          >
                            {actionLoading === b.reference ? (
                              <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                            ) : (
                              <i className="bi bi-check-circle"></i>
                            )}
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleCancel(b.reference)} 
                            title="Cancel"
                            style={{ padding: '6px 10px' }}
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div 
          className="ad-modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={e => e.target === e.currentTarget && setDetail(null)}
        >
          <div className="ad-card" style={{ width: '700px', maxWidth: '90vw' }}>
            <div className="ad-card-header">
              <span className="ad-card-title">
                <i className="bi bi-ticket-perforated" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                Booking Detail
              </span>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => setDetail(null)}
                style={{ border: 'none', padding: '8px' }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="ad-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  ['Reference', <code style={{ 
                    background: 'var(--gray-100)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)'
                  }}>{detail.reference}</code>],
                  ['Status', <span className={`badge ${STATUS_COLORS[detail.status]}`}>{detail.status}</span>],
                  ['Passenger', detail.passenger_name],
                  ['Phone', detail.passenger_phone],
                  ['Email', detail.passenger_email || '—'],
                  ['ID Number', detail.passenger_id_number || '—'],
                  ['Route', detail.route_display || '—'],
                  ['Date', detail.departure_date || '—'],
                  ['Seats', detail.seat_numbers?.join(', ') || '—'],
                  ['Amount', <span style={{ fontWeight: '700' }}>KES {Number(detail.total_amount).toLocaleString()}</span>],
                  ['Receipt', detail.payment_receipt || '—'],
                  ['Created', new Date(detail.created_at).toLocaleString()],
                ].map(([l, v]) => (
                  <div key={l} style={{ 
                    background: 'var(--gray-50)', 
                    borderRadius: '8px', 
                    padding: '12px'
                  }}>
                    <div style={{ 
                      fontSize: '.7rem', 
                      color: 'var(--gray-400)', 
                      fontWeight: '700', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px', 
                      marginBottom: '4px' 
                    }}>
                      {l}
                    </div>
                    <div style={{ 
                      fontWeight: '500', 
                      fontSize: '.88rem',
                      color: 'var(--gray-700)'
                    }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ 
              padding: '20px 24px', 
              borderTop: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              {detail.status === 'pending' && (
                <button 
                  className="btn btn-success" 
                  onClick={() => handleConfirm(detail.reference)} 
                  disabled={actionLoading === detail.reference}
                >
                  {actionLoading === detail.reference ? (
                    <><div className="spinner" style={{ width: '18px', height: '18px', marginRight: '8px' }}></div> Confirming...</>
                  ) : (
                    <><i className="bi bi-check-circle"></i> Confirm</>
                  )}
                </button>
              )}
              {detail.status !== 'cancelled' && (
                <button 
                  className="btn btn-outline-danger" 
                  onClick={() => handleCancel(detail.reference)}
                >
                  <i className="bi bi-x-circle"></i> Cancel Booking
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}