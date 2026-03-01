// frontend/src/pages/admin/AdminStageRuns.jsx
import { useState, useEffect } from 'react';
import { adminStageRuns, adminMatatus, adminRoutes } from '../../services/api';

const STATUSES = ['loading','departed','arrived','cancelled'];

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
      await adminStageRuns.create({ matatu_id: Number(form.matatu_id), route_id: Number(form.route_id), run_date: form.run_date, fare: Number(form.fare), status: form.status });
      setModal(false); load();
    } catch (e) { setError(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Save failed.'); }
    finally { setSaving(false); }
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
      <div className="d-flex align-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-800" style={{ marginBottom: 2 }}>Stage Runs</h4>
          <p className="text-muted" style={{ margin: 0 }}>Daily runs for stage (fill & go) matatus</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <input type="date" className="ad-input" style={{ width: 160 }} value={filterDate}
            onChange={e => setDate(e.target.value)} />
          <button className="btn-ad btn-ad-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg"></i> New Run
          </button>
        </div>
      </div>

      <div className="ad-card">
        {loading ? (
          <div style={{ padding:'3rem', textAlign:'center' }}><div className="ad-spinner" style={{ margin:'0 auto' }}></div></div>
        ) : items.length === 0 ? (
          <div className="ad-empty"><i className="bi bi-sign-stop"></i><h5>No stage runs for {filterDate}</h5><p>Create the first run for today</p></div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>Run</th><th>Matatu</th><th>Route</th><th>Fare</th><th>Passengers</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.slug}>
                    <td>
                      <div className="fw-700">Run #{r.run_number}</div>
                      <div className="text-muted" style={{ fontSize:'.75rem' }}>{r.run_date}</div>
                    </td>
                    <td>
                      <div style={{ fontSize:'.85rem' }}>{r.matatu_name}</div>
                      <code style={{ fontSize:'.72rem' }}>{r.plate_number}</code>
                    </td>
                    <td style={{ fontSize:'.85rem' }}>{r.origin} → {r.destination}</td>
                    <td style={{ fontWeight:700 }}>KES {Number(r.fare).toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight:600, color: r.available_seats > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {r.available_seats}
                      </span>
                      <span className="text-muted"> free</span>
                    </td>
                    <td>
                      <select value={r.status}
                        onChange={e => changeStatus(r.slug, e.target.value)}
                        style={{ border:'none', background:'transparent', fontWeight:600, fontSize:'.82rem', cursor:'pointer', fontFamily:'var(--font-body)', color:'var(--gray-700)' }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => openManifest(r)} data-tip="Manifest">
                          <i className="bi bi-people"></i>
                        </button>
                        <button className="btn-ad btn-ad-danger btn-ad-sm" onClick={() => handleDelete(r)} data-tip="Delete">
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
        <div className="ad-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="ad-modal ad-modal-md">
            <div className="ad-modal-header">
              <span className="ad-modal-title"><i className="bi bi-plus-circle" style={{ marginRight:8, color:'var(--primary)' }}></i>New Stage Run</span>
              <button className="ad-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="ad-modal-body">
              {error && <div className="ad-alert ad-alert-error"><i className="bi bi-exclamation-circle-fill"></i>{error}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="ad-form-group">
                  <label className="ad-label">Matatu *</label>
                  <select className="ad-select" value={form.matatu_id} onChange={e => setForm(f => ({ ...f, matatu_id: e.target.value }))}>
                    <option value="">Select matatu</option>
                    {matatus.filter(m => m.service_type === 'stage').map(m => <option key={m.id} value={m.id}>{m.name} ({m.plate_number})</option>)}
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
                  <input type="date" className="ad-input" value={form.run_date} onChange={e => setForm(f => ({ ...f, run_date: e.target.value }))} />
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Fare (KES)</label>
                  <input type="number" className="ad-input" value={form.fare} onChange={e => setForm(f => ({ ...f, fare: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="ad-modal-footer">
              <button className="btn-ad btn-ad-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-ad btn-ad-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="ad-spinner ad-spinner-sm ad-spinner-white"></div> Creating...</> : <><i className="bi bi-check-lg"></i> Create Run</>}
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
              <span className="ad-modal-title"><i className="bi bi-people" style={{ marginRight:8, color:'var(--primary)' }}></i>Manifest — {showManifest.matatu_name} Run #{showManifest.run_number}</span>
              <button className="ad-modal-close" onClick={() => setManifest(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="ad-modal-body">
              {!manifestData ? (
                <div style={{ textAlign:'center', padding:'2rem' }}><div className="ad-spinner" style={{ margin:'0 auto' }}></div></div>
              ) : manifestData.passengers.length === 0 ? (
                <div className="ad-empty"><i className="bi bi-people"></i><h5>No passengers yet</h5></div>
              ) : (
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