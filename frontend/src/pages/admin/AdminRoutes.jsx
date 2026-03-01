// frontend/src/pages/admin/AdminRoutes.jsx
import { useState, useEffect } from 'react';
import { adminRoutes, adminTowns } from '../../services/api';

export default function AdminRoutes() {
  const [items, setItems]   = useState([]);
  const [towns, setTowns]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ origin_id:'', destination_id:'', distance_km:'', is_active:true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const p = search ? `?search=${search}` : '';
      const [r, t] = await Promise.all([adminRoutes.list(p), adminTowns.list()]);
      setItems(r.results || r);
      setTowns(t.results || t);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ origin_id:'', destination_id:'', distance_km:'', is_active:true });
    setError(''); setModal(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      origin_id: towns.find(t => t.name === r.origin_name)?.id || '',
      destination_id: towns.find(t => t.name === r.destination_name)?.id || '',
      distance_km: r.distance_km || '',
      is_active: r.is_active,
    });
    setError(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.origin_id || !form.destination_id) { setError('Origin and destination required.'); return; }
    if (form.origin_id === form.destination_id) { setError('Origin and destination cannot be the same.'); return; }
    setSaving(true); setError('');
    try {
      const p = { origin_id: Number(form.origin_id), destination_id: Number(form.destination_id), distance_km: form.distance_km ? Number(form.distance_km) : undefined, is_active: form.is_active };
      editing ? await adminRoutes.update(editing.slug, p) : await adminRoutes.create(p);
      setModal(false); load();
    } catch (e) { setError(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (r) => {
    if (!confirm(`Delete route "${r.name}"?`)) return;
    try { await adminRoutes.delete(r.slug); load(); }
    catch { alert('Delete failed — may have trips.'); }
  };

  return (
    <div>
      <div className="d-flex align-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-800" style={{ marginBottom:2 }}>Routes</h4>
          <p className="text-muted" style={{ margin:0 }}>Define matatu routes between towns</p>
        </div>
        <div className="d-flex gap-2">
          <div className="ad-search-wrap">
            <i className="bi bi-search"></i>
            <input className="ad-search-input" placeholder="Search routes…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-ad btn-ad-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg"></i> Add Route
          </button>
        </div>
      </div>

      <div className="ad-card">
        {loading ? (
          <div style={{ padding:'3rem', textAlign:'center' }}><div className="ad-spinner" style={{ margin:'0 auto' }}></div></div>
        ) : items.length === 0 ? (
          <div className="ad-empty"><i className="bi bi-map"></i><h5>No routes yet</h5><p>Create your first route to start adding trips</p></div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>Route</th><th>Distance</th><th>Matatus</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.slug}>
                    <td>
                      <div className="fw-700">{r.origin_name} → {r.destination_name}</div>
                      {r.stops?.length > 0 && (
                        <div className="text-muted" style={{ fontSize:'.75rem' }}>{r.stops.length} stops</div>
                      )}
                    </td>
                    <td>{r.distance_km ? `${r.distance_km} km` : <span className="text-muted">—</span>}</td>
                    <td>{r.matatu_count || 0}</td>
                    <td><span className={`badge ${r.is_active ? 'badge-active' : 'badge-inactive'}`}>{r.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="actions">
                        <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => openEdit(r)} data-tip="Edit">
                          <i className="bi bi-pencil"></i>
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

      {showModal && (
        <div className="ad-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="ad-modal ad-modal-sm">
            <div className="ad-modal-header">
              <span className="ad-modal-title"><i className="bi bi-map" style={{ marginRight:8, color:'var(--primary)' }}></i>{editing ? 'Edit Route' : 'Add Route'}</span>
              <button className="ad-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="ad-modal-body">
              {error && <div className="ad-alert ad-alert-error"><i className="bi bi-exclamation-circle-fill"></i>{error}</div>}
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div className="ad-form-group">
                  <label className="ad-label">Origin Town *</label>
                  <select className="ad-select" value={form.origin_id} onChange={e => setForm(f => ({ ...f, origin_id: e.target.value }))}>
                    <option value="">Select town</option>
                    {towns.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Destination Town *</label>
                  <select className="ad-select" value={form.destination_id} onChange={e => setForm(f => ({ ...f, destination_id: e.target.value }))}>
                    <option value="">Select town</option>
                    {towns.filter(t => t.is_active && String(t.id) !== String(form.origin_id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Distance (km)</label>
                  <input className="ad-input" type="number" placeholder="e.g. 87" value={form.distance_km}
                    onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))} />
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Status</label>
                  <select className="ad-select" value={form.is_active ? 'true' : 'false'}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ad-modal-footer">
              <button className="btn-ad btn-ad-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-ad btn-ad-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="ad-spinner ad-spinner-sm ad-spinner-white"></div> Saving...</> : <><i className="bi bi-check-lg"></i> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}