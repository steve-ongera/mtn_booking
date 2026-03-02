// frontend/src/pages/admin/AdminTrips.jsx
import { useState, useEffect } from 'react';
import { adminTrips, adminMatatus, adminRoutes } from '../../services/api';

const STATUSES = ['scheduled','boarding','departed','arrived','cancelled'];
const STATUS_COLORS = { 
  scheduled: 'badge-info', 
  boarding: 'badge-warning', 
  departed: 'badge-primary', 
  arrived: 'badge-success', 
  cancelled: 'badge-danger' 
};

export default function AdminTrips() {
  const [items, setItems]     = useState([]);
  const [matatus, setMatatus] = useState([]);
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterDate, setDate] = useState('');
  const [showModal, setModal] = useState(false);
  const [showManifest, setManifest] = useState(null);
  const [manifestData, setManifestData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ matatu_id:'', route_id:'', departure_date:'', departure_time:'', arrival_time:'', fare:0, status:'scheduled', is_active:true });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      let p = '';
      if (search) p += `?search=${search}`;
      if (filterDate) p += `${p ? '&' : '?'}departure_date=${filterDate}`;
      const [t, m, r] = await Promise.all([adminTrips.list(p), adminMatatus.list(), adminRoutes.list()]);
      setItems(t.results || t);
      setMatatus(m.results || m);
      setRoutes(r.results || r);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterDate]);

  const openAdd = () => {
    setEditing(null);
    setForm({ matatu_id:'', route_id:'', departure_date:'', departure_time:'', arrival_time:'', fare:0, status:'scheduled', is_active:true });
    setError(''); setModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      matatu_id: matatus.find(m => m.name === t.matatu_name)?.id || '',
      route_id:  routes.find(r => r.origin_name === t.origin)?.id || '',
      departure_date: t.departure_date,
      departure_time: t.departure_time?.slice(0,5) || '',
      arrival_time:   t.arrival_time?.slice(0,5) || '',
      fare: t.fare,
      status: t.status,
      is_active: t.is_active,
    });
    setError(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.matatu_id || !form.route_id || !form.departure_date || !form.departure_time) {
      setError('Matatu, route, date and departure time are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const p = { 
        matatu_id: Number(form.matatu_id), 
        route_id: Number(form.route_id), 
        departure_date: form.departure_date, 
        departure_time: form.departure_time, 
        arrival_time: form.arrival_time || undefined, 
        fare: Number(form.fare), 
        status: form.status, 
        is_active: form.is_active 
      };
      editing ? await adminTrips.update(editing.slug, p) : await adminTrips.create(p);
      setModal(false); load();
    } catch (e) { 
      setError(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Save failed.'); 
    } finally { setSaving(false); }
  };

  const changeStatus = async (slug, s) => {
    try { await adminTrips.updateStatus(slug, s); load(); }
    catch { alert('Status update failed.'); }
  };

  const openManifest = async (trip) => {
    setManifest(trip);
    setManifestData(null);
    const data = await adminTrips.manifest(trip.slug);
    setManifestData(data);
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete trip on ${t.departure_date}?`)) return;
    try { await adminTrips.delete(t.slug); load(); }
    catch { alert('Delete failed.'); }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 style={{ marginBottom: '4px' }}>Express Trips</h3>
          <p className="text-muted" style={{ margin: 0 }}>Scheduled trips for express matatus</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {/* Date Filter */}
          <input 
            type="date" 
            className="form-control" 
            style={{ width: '160px' }} 
            value={filterDate}
            onChange={e => setDate(e.target.value)} 
          />
          
          {/* Search */}
          <div className="ad-search" style={{ position: 'relative' }}>
            <i className="bi bi-search"></i>
            <input 
              className="form-control" 
              placeholder="Search trips..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '220px' }}
            />
          </div>
          
          {/* Add Button */}
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg"></i> Add Trip
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="ad-card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p className="text-muted">Loading trips...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            color: 'var(--gray-400)'
          }}>
            <i className="bi bi-calendar2-week" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
            <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No trips found</h5>
            <p style={{ fontSize: '0.95rem' }}>Schedule your first express trip</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Matatu</th>
                  <th>Date</th>
                  <th>Departure</th>
                  <th>Fare</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.slug}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                        {t.origin} → {t.destination}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '.85rem', fontWeight: '500' }}>{t.matatu_name}</div>
                      <code style={{ 
                        fontSize: '.72rem',
                        background: 'var(--gray-100)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--gray-600)'
                      }}>
                        {t.plate_number}
                      </code>
                    </td>
                    <td style={{ fontSize: '.85rem', fontWeight: '600' }}>{t.departure_date}</td>
                    <td style={{ fontSize: '.85rem' }}>{t.departure_time?.slice(0,5)}</td>
                    <td style={{ fontWeight: '700', color: 'var(--gray-900)' }}>
                      KES {Number(t.fare).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: '600', 
                        color: t.available_seats > 0 ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {t.available_seats}
                      </span>
                      <span className="text-muted"> seats</span>
                    </td>
                    <td>
                      <select 
                        value={t.status}
                        onChange={e => changeStatus(t.slug, e.target.value)}
                        className="form-control"
                        style={{ 
                          width: 'auto',
                          minWidth: '110px',
                          padding: '4px 8px',
                          fontSize: '.82rem',
                          fontWeight: '500',
                          borderColor: 'var(--gray-200)',
                          background: 'white'
                        }}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          onClick={() => openManifest(t)} 
                          title="View Manifest"
                          style={{ padding: '6px 10px' }}
                        >
                          <i className="bi bi-people"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          onClick={() => openEdit(t)} 
                          title="Edit"
                          style={{ padding: '6px 10px' }}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(t)} 
                          title="Delete"
                          style={{ padding: '6px 10px' }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
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
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div className="ad-card" style={{ width: '600px', maxWidth: '90vw' }}>
            <div className="ad-card-header">
              <span className="ad-card-title">
                <i className="bi bi-calendar-plus" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                {editing ? 'Edit Trip' : 'Schedule Trip'}
              </span>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => setModal(false)}
                style={{ border: 'none', padding: '8px' }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="ad-card-body">
              {error && (
                <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                  <i className="bi bi-exclamation-circle-fill"></i>
                  {error}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Matatu *</label>
                  <select 
                    className="form-control" 
                    value={form.matatu_id} 
                    onChange={e => setForm(f => ({ ...f, matatu_id: e.target.value }))}
                  >
                    <option value="">Select matatu</option>
                    {matatus.filter(m => m.service_type === 'express').map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.plate_number})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Route *</label>
                  <select 
                    className="form-control" 
                    value={form.route_id} 
                    onChange={e => setForm(f => ({ ...f, route_id: e.target.value }))}
                  >
                    <option value="">Select route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={form.departure_date} 
                    onChange={e => setForm(f => ({ ...f, departure_date: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Departure Time *</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={form.departure_time} 
                    onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Arrival Time</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={form.arrival_time} 
                    onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fare (KES)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={form.fare} 
                    onChange={e => setForm(f => ({ ...f, fare: e.target.value }))} 
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Status</label>
                  <select 
                    className="form-control" 
                    value={form.status} 
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ 
              padding: '20px 24px', 
              borderTop: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><div className="spinner" style={{ width: '18px', height: '18px', marginRight: '8px' }}></div> Saving...</>
                ) : (
                  <><i className="bi bi-check-lg"></i> Save Trip</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Modal */}
      {showManifest && (
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
          onClick={e => e.target === e.currentTarget && setManifest(null)}
        >
          <div className="ad-card" style={{ width: '800px', maxWidth: '90vw' }}>
            <div className="ad-card-header">
              <span className="ad-card-title">
                <i className="bi bi-people" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                Manifest — {showManifest.origin} → {showManifest.destination} · {showManifest.departure_date}
              </span>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => setManifest(null)}
                style={{ border: 'none', padding: '8px' }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="ad-card-body">
              {!manifestData ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                  <p className="text-muted">Loading manifest...</p>
                </div>
              ) : manifestData.passengers.length === 0 ? (
                <div style={{ 
                  padding: '48px', 
                  textAlign: 'center',
                  color: 'var(--gray-400)'
                }}>
                  <i className="bi bi-people" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
                  <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No passengers yet</h5>
                </div>
              ) : (
                <>
                  <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                    <i className="bi bi-info-circle-fill"></i>
                    {manifestData.total_passengers} passenger{manifestData.total_passengers !== 1 ? 's' : ''} booked
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Ref</th>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Seats</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manifestData.passengers.map((p, i) => (
                          <tr key={p.reference}>
                            <td>{i+1}</td>
                            <td>
                              <code style={{ 
                                fontSize: '.75rem',
                                background: 'var(--gray-100)',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-xs)'
                              }}>
                                {p.reference}
                              </code>
                            </td>
                            <td style={{ fontWeight: '500' }}>{p.passenger_name}</td>
                            <td>{p.passenger_phone}</td>
                            <td>{p.seat_numbers?.join(', ')}</td>
                            <td style={{ fontWeight: '600' }}>KES {Number(p.total_amount).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${
                                p.status === 'confirmed' ? 'badge-success' :
                                p.status === 'pending' ? 'badge-warning' :
                                p.status === 'cancelled' ? 'badge-danger' : 'badge-info'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div style={{ 
              padding: '20px 24px', 
              borderTop: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button className="btn btn-outline" onClick={() => setManifest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}