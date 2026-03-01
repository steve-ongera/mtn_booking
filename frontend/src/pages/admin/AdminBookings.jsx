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

  const STATUS_COLORS = { confirmed: 'badge-confirmed', pending: 'badge-pending', cancelled: 'badge-cancelled', refunded: 'badge-inactive' };

  return (
    <div>
      <div className="d-flex align-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-800" style={{ marginBottom: 2 }}>Bookings</h4>
          <p className="text-muted" style={{ margin: 0 }}>All passenger bookings</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="ad-tabs">
            {[['','All'],['pending','Pending'],['confirmed','Confirmed'],['cancelled','Cancelled']].map(([v,l]) => (
              <button key={v} className={`ad-tab ${filterStatus === v ? 'active' : ''}`}
                onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <div className="ad-search-wrap">
            <i className="bi bi-search"></i>
            <input className="ad-search-input" placeholder="Search ref, name, phone…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="ad-card">
        {loading ? (
          <div style={{ padding:'3rem', textAlign:'center' }}><div className="ad-spinner" style={{ margin:'0 auto' }}></div></div>
        ) : items.length === 0 ? (
          <div className="ad-empty"><i className="bi bi-ticket-perforated"></i><h5>No bookings found</h5></div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>Reference</th><th>Passenger</th><th>Route</th><th>Date</th><th>Seats</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(b => (
                  <tr key={b.reference} style={{ cursor:'pointer' }} onClick={() => setDetail(b)}>
                    <td><code style={{ fontSize:'.75rem' }}>{b.reference}</code></td>
                    <td>
                      <div className="fw-600">{b.passenger_name}</div>
                      <div className="text-muted" style={{ fontSize:'.75rem' }}>{b.passenger_phone}</div>
                    </td>
                    <td style={{ fontSize:'.82rem' }}>{b.route_display || '—'}</td>
                    <td style={{ fontSize:'.82rem' }}>{b.departure_date || '—'}</td>
                    <td style={{ fontSize:'.82rem' }}>{b.seat_numbers?.join(', ')}</td>
                    <td style={{ fontWeight:700 }}>KES {Number(b.total_amount).toLocaleString()}</td>
                    <td>
                      {b.payment_receipt
                        ? <span className="badge badge-confirmed"><i className="bi bi-check-circle-fill"></i> Paid</span>
                        : <span className={`badge badge-${b.payment_status === 'failed' ? 'cancelled' : 'pending'}`}>
                            {b.payment_status || 'not paid'}
                          </span>
                      }
                    </td>
                    <td><span className={`badge ${STATUS_COLORS[b.status] || 'badge-inactive'}`}>{b.status}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="actions">
                        {b.status === 'pending' && (
                          <button
                            className="btn-ad btn-ad-success btn-ad-sm"
                            onClick={() => handleConfirm(b.reference)}
                            disabled={actionLoading === b.reference}
                            data-tip="Confirm"
                          >
                            {actionLoading === b.reference
                              ? <div className="ad-spinner ad-spinner-sm ad-spinner-white"></div>
                              : <i className="bi bi-check-circle"></i>}
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
                          <button className="btn-ad btn-ad-danger btn-ad-sm" onClick={() => handleCancel(b.reference)} data-tip="Cancel">
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
        <div className="ad-modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="ad-modal ad-modal-md">
            <div className="ad-modal-header">
              <span className="ad-modal-title"><i className="bi bi-ticket-perforated" style={{ marginRight:8, color:'var(--primary)' }}></i>Booking Detail</span>
              <button className="ad-modal-close" onClick={() => setDetail(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="ad-modal-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  ['Reference', <code>{detail.reference}</code>],
                  ['Status', <span className={`badge ${STATUS_COLORS[detail.status]}`}>{detail.status}</span>],
                  ['Passenger', detail.passenger_name],
                  ['Phone', detail.passenger_phone],
                  ['Email', detail.passenger_email || '—'],
                  ['ID Number', detail.passenger_id_number || '—'],
                  ['Route', detail.route_display || '—'],
                  ['Date', detail.departure_date || '—'],
                  ['Seats', detail.seat_numbers?.join(', ')],
                  ['Amount', `KES ${Number(detail.total_amount).toLocaleString()}`],
                  ['Receipt', detail.payment_receipt || '—'],
                  ['Created', new Date(detail.created_at).toLocaleString()],
                ].map(([l, v]) => (
                  <div key={l} style={{ background:'var(--gray-50)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:'.7rem', color:'var(--gray-400)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{l}</div>
                    <div style={{ fontWeight:600, fontSize:'.88rem' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ad-modal-footer">
              {detail.status === 'pending' && (
                <button className="btn-ad btn-ad-success" onClick={() => handleConfirm(detail.reference)} disabled={actionLoading === detail.reference}>
                  {actionLoading === detail.reference ? <><div className="ad-spinner ad-spinner-sm ad-spinner-white"></div> Confirming...</> : <><i className="bi bi-check-circle"></i> Confirm</>}
                </button>
              )}
              {detail.status !== 'cancelled' && (
                <button className="btn-ad btn-ad-danger" onClick={() => handleCancel(detail.reference)}>
                  <i className="bi bi-x-circle"></i> Cancel Booking
                </button>
              )}
              <button className="btn-ad btn-ad-secondary" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}