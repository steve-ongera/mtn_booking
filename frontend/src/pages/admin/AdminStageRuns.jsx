// frontend/src/pages/admin/AdminStageRuns.jsx
import { useState, useEffect } from 'react';
import { adminStageRuns, adminMatatus, adminRoutes } from '../../services/api';

const STATUSES = ['loading','departed','arrived','cancelled'];
const STATUS_COLORS = {
  loading: 'badge-info',
  departed: 'badge-primary',
  arrived: 'badge-success',
  cancelled: 'badge-danger'
};

export default function AdminStageRuns() {
  const [items, setItems]     = useState([]);
  const [matatus, setMatatus] = useState([]);
  const [routes, setRoutes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setModal] = useState(false);
  const [showManifest, setManifest] = useState(null);
  const [manifestData, setManifestData] = useState(null);
  const [form, setForm] = useState({ matatu_id:'', route_id:'', run_date:'', fare:0, status:'loading' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const p = filterDate ? `?run_date=${filterDate}` : '';
      const [runs, m, r] = await Promise.all([adminStageRuns.list(p), adminMatatus.list(), adminRoutes.list()]);
      setItems(runs.results || runs);
      setMatatus(m.results || m);
      setRoutes(r.results || r);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterDate]);

  const openAdd = () => {
    setForm({ matatu_id:'', route_id:'', run_date: filterDate || '', fare:0, status:'loading' });
    setError(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.matatu_id || !form.route_id || !form.run_date) {
      setError('Matatu, route and date required.'); return;
    }
    setSaving(true); setError('');
    try {
      await adminStageRuns.create({ 
        matatu_id: Number(form.matatu_id), 
        route_id: Number(form.route_id), 
        run_date: form.run_date, 
        fare: Number(form.fare), 
        status: form.status 
      });
      setModal(false); load();
    } catch (e) { 
      setError(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Save failed.'); 
    } finally { setSaving(false); }
  };

  const changeStatus = async (slug, s) => {
    try { await adminStageRuns.updateStatus(slug, s); load(); }
    catch { alert('Status update failed.'); }
  };

  const openManifest = async (run) => {
    setManifest(run); setManifestData(null);
    const d = await adminStageRuns.manifest(run.slug);
    setManifestData(d);
  };

  const handleDelete = async (r) => {
    if (!confirm('Delete this stage run?')) return;
    try { await adminStageRuns.delete(r.slug); load(); }
    catch { alert('Delete failed.'); }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 style={{ marginBottom: '4px' }}>Stage Runs</h3>
          <p className="text-muted" style={{ margin: 0 }}>Daily runs for stage (fill & go) matatus</p>
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
          
          {/* Add Button */}
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg"></i> New Run
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="ad-card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p className="text-muted">Loading stage runs...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            color: 'var(--gray-400)'
          }}>
            <i className="bi bi-sign-stop" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
            <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No stage runs for {filterDate}</h5>
            <p style={{ fontSize: '0.95rem' }}>Create the first run for today</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Matatu</th>
                  <th>Route</th>
                  <th>Fare</th>
                  <th>Passengers</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.slug}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>Run #{r.run_number}</div>
                      <div className="text-muted" style={{ fontSize: '.75rem' }}>{r.run_date}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '.85rem', fontWeight: '500' }}>{r.matatu_name}</div>
                      <code style={{ 
                        fontSize: '.72rem',
                        background: 'var(--gray-100)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--gray-600)'
                      }}>
                        {r.plate_number}
                      </code>
                    </td>
                    <td style={{ fontSize: '.85rem' }}>{r.origin} → {r.destination}</td>
                    <td style={{ fontWeight: '700', color: 'var(--gray-900)' }}>
                      KES {Number(r.fare).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: '600', 
                        color: r.available_seats > 0 ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {r.available_seats}
                      </span>
                      <span className="text-muted"> free</span>
                    </td>
                    <td>
                      <select 
                        value={r.status}
                        onChange={e => changeStatus(r.slug, e.target.value)}
                        className="form-control"
                        style={{ 
                          width: 'auto',
                          minWidth: '100px',
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
                          onClick={() => openManifest(r)} 
                          title="View Manifest"
                          style={{ padding: '6px 10px' }}
                        >
                          <i className="bi bi-people"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(r)} 
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

      {/* Create Modal */}
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
          <div className="ad-card" style={{ width: '550px', maxWidth: '90vw' }}>
            <div className="ad-card-header">
              <span className="ad-card-title">
                <i className="bi bi-plus-circle" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                New Stage Run
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
                    {matatus.filter(m => m.service_type === 'stage').map(m => (
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
                    value={form.run_date} 
                    onChange={e => setForm(f => ({ ...f, run_date: e.target.value }))} 
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
                  <><div className="spinner" style={{ width: '18px', height: '18px', marginRight: '8px' }}></div> Creating...</>
                ) : (
                  <><i className="bi bi-check-lg"></i> Create Run</>
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
                Manifest — {showManifest.matatu_name} Run #{showManifest.run_number}
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