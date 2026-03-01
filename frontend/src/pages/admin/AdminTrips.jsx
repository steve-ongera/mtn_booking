// frontend/src/pages/admin/AdminTrips.jsx
import { useState, useEffect } from 'react';
import { adminTrips, adminMatatus, adminRoutes } from '../../services/api';

const STATUSES = ['scheduled','boarding','departed','arrived','cancelled'];
const STATUS_COLORS = { scheduled:'badge-scheduled', boarding:'badge-boarding', departed:'badge-departed', arrived:'badge-confirmed', cancelled:'badge-cancelled' };

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
      const p = { matatu_id: Number(form.matatu_id), route_id: Number(form.route_id), departure_date: form.departure_date, departure_time: form.departure_time, arrival_time: form.arrival_time || undefined, fare: Number(form.fare), status: form.status, is_active: form.is_active };
      editing ? await adminTrips.update(editing.slug, p) : await adminTrips.create(p);
      setModal(false); load();
    } catch (e) { setError(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Save failed.'); }
    finally { setSaving(false); }
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
      <div className="d-flex align-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-800" style={{ marginBottom: 2 }}>Express Trips</h4>
          <p className="text-muted" style={{ margin: 0 }}>Scheduled trips for express matatus</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <input type="date" className="ad-input" style={{ width: 160 }} value={filterDate}
            onChange={e => setDate(e.target.value)} />
          <div className="ad-search-wrap">
            <i className="bi bi-search"></i>
            <input className="ad-search-input" placeholder="Search trips…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-ad btn-ad-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg"></i> Add Trip
          </button>
        </div>
      </div>

      <div className="ad-card">
        {loading ? (
          <div style={{ padding:'3rem', textAlign:'center' }}><div className="ad-spinner" style={{ margin:'0 auto' }}></div></div>
        ) : items.length === 0 ? (
          <div className="ad-empty"><i className="bi bi-calendar2-week"></i><h5>No trips found</h5><p>Schedule your first express trip</p></div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>Route</th><th>Matatu</th><th>Date</th><th>Departure</th><th>Fare</th><th>Available</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.slug}>
                    <td><div className="fw-700">{t.origin} → {t.destination}</div></td>
                    <td>
                      <div style={{ fontSize:'.85rem' }}>{t.matatu_name}</div>
                      <code style={{ fontSize:'.72rem' }}>{t.plate_number}</code>
                    </td>
                    <td style={{ fontSize:'.85rem', fontWeight:600 }}>{t.departure_date}</td>
                    <td style={{ fontSize:'.85rem' }}>{t.departure_time?.slice(0,5)}</td>
                    <td style={{ fontWeight:700 }}>KES {Number(t.fare).toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight:600, color: t.available_seats > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {t.available_seats}
                      </span>
                      <span className="text-muted"> seats</span>
                    </td>
                    <td>
                      <select value={t.status}
                        onChange={e => changeStatus(t.slug, e.target.value)}
                        style={{ border:'none', background:'transparent', fontSize:'.82rem', fontWeight:600, cursor:'pointer', color: 'var(--gray-700)', fontFamily:'var(--font-body)' }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => openManifest(t)} data-tip="Manifest">
                          <i className="bi bi-people"></i>
                        </button>
                        <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => openEdit(t)} data-tip="Edit">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn-ad btn-ad-danger btn-ad-sm" onClick={() => handleDelete(t)} data-tip="Delete">
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
        <div className="ad-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="ad-modal ad-modal-md">
            <div className="ad-modal-header">
              <span className="ad-modal-title"><i className="bi bi-calendar-plus" style={{ marginRight:8, color:'var(--primary)' }}></i>{editing ? 'Edit Trip' : 'Schedule Trip'}</span>
              <button className="ad-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="ad-modal-body">
              {error && <div className="ad-alert ad-alert-error"><i className="bi bi-exclamation-circle-fill"></i>{error}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="ad-form-group">
                  <label className="ad-label">Matatu *</label>
                  <select className="ad-select" value={form.matatu_id} onChange={e => setForm(f => ({ ...f, matatu_id: e.target.value }))}>
                    <option value="">Select matatu</option>
                    {matatus.filter(m => m.service_type === 'express').map(m => <option key={m.id} value={m.id}>{m.name} ({m.plate_number})</option>)}
                  </select>
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Route *</label>
                  <select className="ad-select" value={form.route_id} onChange={e => setForm(f => ({ ...f, route_id: e.target.value }))}>
                    <option value="">Select route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Date *</label>
                  <input type="date" className="ad-input" value={form.departure_date} onChange={e => setForm(f => ({ ...f, departure_date: e.target.value }))} />
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Departure Time *</label>
                  <input type="time" className="ad-input" value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))} />
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Arrival Time</label>
                  <input type="time" className="ad-input" value={form.arrival_time} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))} />
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Fare (KES)</label>
                  <input type="number" className="ad-input" value={form.fare} onChange={e => setForm(f => ({ ...f, fare: e.target.value }))} />
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Status</label>
                  <select className="ad-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="ad-modal-footer">
              <button className="btn-ad btn-ad-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-ad btn-ad-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="ad-spinner ad-spinner-sm ad-spinner-white"></div> Saving...</> : <><i className="bi bi-check-lg"></i> Save Trip</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Modal */}
      {showManifest && (
        <div className="ad-modal-overlay" onClick={e => e.target === e.currentTarget && setManifest(null)}>
          <div className="ad-modal ad-modal-xl">
            <div className="ad-modal-header">
              <span className="ad-modal-title">
                <i className="bi bi-people" style={{ marginRight:8, color:'var(--primary)' }}></i>
                Manifest — {showManifest.origin} → {showManifest.destination} · {showManifest.departure_date}
              </span>
              <button className="ad-modal-close" onClick={() => setManifest(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="ad-modal-body">
              {!manifestData ? (
                <div style={{ textAlign:'center', padding:'2rem' }}><div className="ad-spinner" style={{ margin:'0 auto' }}></div></div>
              ) : manifestData.passengers.length === 0 ? (
                <div className="ad-empty"><i className="bi bi-people"></i><h5>No passengers yet</h5></div>
              ) : (
                <>
                  <div className="ad-alert ad-alert-info mb-3">
                    <i className="bi bi-info-circle-fill"></i>
                    {manifestData.total_passengers} passenger{manifestData.total_passengers !== 1 ? 's' : ''} booked
                  </div>
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead><tr><th>#</th><th>Ref</th><th>Name</th><th>Phone</th><th>Seats</th><th>Amount</th><th>Status</th></tr></thead>
                      <tbody>
                        {manifestData.passengers.map((p, i) => (
                          <tr key={p.reference}>
                            <td>{i+1}</td>
                            <td><code style={{ fontSize:'.75rem' }}>{p.reference}</code></td>
                            <td className="fw-600">{p.passenger_name}</td>
                            <td>{p.passenger_phone}</td>
                            <td>{p.seat_numbers?.join(', ')}</td>
                            <td>KES {Number(p.total_amount).toLocaleString()}</td>
                            <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="ad-modal-footer">
              <button className="btn-ad btn-ad-secondary" onClick={() => setManifest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}