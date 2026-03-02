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
      const p = { 
        origin_id: Number(form.origin_id), 
        destination_id: Number(form.destination_id), 
        distance_km: form.distance_km ? Number(form.distance_km) : undefined, 
        is_active: form.is_active 
      };
      editing ? await adminRoutes.update(editing.slug, p) : await adminRoutes.create(p);
      setModal(false); load();
    } catch (e) { 
      setError(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Save failed.'); 
    } finally { setSaving(false); }
  };

  const handleDelete = async (r) => {
    if (!confirm(`Delete route "${r.name}"?`)) return;
    try { await adminRoutes.delete(r.slug); load(); }
    catch { alert('Delete failed — may have trips.'); }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 style={{ marginBottom: '4px' }}>Routes</h3>
          <p className="text-muted" style={{ margin: 0 }}>Define matatu routes between towns</p>
        </div>
        <div className="d-flex gap-2">
          {/* Search */}
          <div className="ad-search" style={{ position: 'relative' }}>
            <i className="bi bi-search"></i>
            <input 
              className="form-control" 
              placeholder="Search routes..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
          
          {/* Add Button */}
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg"></i> Add Route
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="ad-card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p className="text-muted">Loading routes...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            color: 'var(--gray-400)'
          }}>
            <i className="bi bi-map" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
            <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No routes yet</h5>
            <p style={{ fontSize: '0.95rem' }}>Create your first route to start adding trips</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Distance</th>
                  <th>Matatus</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.slug}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                        {r.origin_name} → {r.destination_name}
                      </div>
                      {r.stops?.length > 0 && (
                        <div className="text-muted" style={{ fontSize: '.75rem', marginTop: '2px' }}>
                          {r.stops.length} stop{r.stops.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      {r.distance_km ? (
                        <span style={{ fontWeight: '500' }}>{r.distance_km} km</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: '500' }}>{r.matatu_count || 0}</span>
                    </td>
                    <td>
                      <span className={`badge ${r.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          onClick={() => openEdit(r)} 
                          title="Edit"
                          style={{ padding: '6px 10px' }}
                        >
                          <i className="bi bi-pencil"></i>
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
          <div className="ad-card" style={{ width: '450px', maxWidth: '90vw' }}>
            <div className="ad-card-header">
              <span className="ad-card-title">
                <i className="bi bi-map" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                {editing ? 'Edit Route' : 'Add Route'}
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
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Origin Town */}
                <div className="form-group">
                  <label className="form-label">Origin Town *</label>
                  <select 
                    className="form-control" 
                    value={form.origin_id} 
                    onChange={e => setForm(f => ({ ...f, origin_id: e.target.value }))}
                  >
                    <option value="">Select town</option>
                    {towns.filter(t => t.is_active).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Destination Town */}
                <div className="form-group">
                  <label className="form-label">Destination Town *</label>
                  <select 
                    className="form-control" 
                    value={form.destination_id} 
                    onChange={e => setForm(f => ({ ...f, destination_id: e.target.value }))}
                  >
                    <option value="">Select town</option>
                    {towns.filter(t => t.is_active && String(t.id) !== String(form.origin_id)).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Distance */}
                <div className="form-group">
                  <label className="form-label">Distance (km)</label>
                  <input 
                    className="form-control" 
                    type="number" 
                    placeholder="e.g. 87" 
                    value={form.distance_km}
                    onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))} 
                  />
                </div>

                {/* Status */}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-control" 
                    value={form.is_active ? 'true' : 'false'}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
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
                  <><i className="bi bi-check-lg"></i> Save</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}