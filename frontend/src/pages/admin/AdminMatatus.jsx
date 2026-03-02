// frontend/src/pages/admin/AdminMatatus.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminMatatus, adminMatatuTypes, adminRoutes, adminDrivers } from '../../services/api';

const EMPTY_FORM = {
  name: '', plate_number: '', service_type: 'stage',
  matatu_type_id: '', route_id: '', owner_id: '',
  driver_id: '', total_seats: 14, is_active: true, amenities: '',
};

export default function AdminMatatus() {
  const navigate = useNavigate();
  const [items, setItems]       = useState([]);
  const [types, setTypes]       = useState([]);
  const [routes, setRoutes]     = useState([]);
  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterType, setFilter] = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [showAssign, setShowAssign]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : '';
      const [m, t, r, d] = await Promise.all([
        adminMatatus.list(params),
        adminMatatuTypes.list(),
        adminRoutes.list(),
        adminDrivers.list(),
      ]);
      setItems(m.results || m);
      setTypes(t.results || t);
      setRoutes(r.results || r);
      setDrivers(d.results || d);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const filtered = filterType ? items.filter(i => i.service_type === filterType) : items;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name,
      plate_number: m.plate_number,
      service_type: m.service_type,
      matatu_type_id: types.find(t => t.name === m.matatu_type_name)?.id || '',
      route_id: routes.find(r => r.name === m.route_name)?.id || '',
      driver_id: '',
      owner_id: '',
      total_seats: m.total_seats,
      is_active: m.is_active,
      amenities: (m.amenities || []).join(', '),
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.plate_number) {
      setError('Name and plate number are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        plate_number: form.plate_number,
        service_type: form.service_type,
        matatu_type_id: form.matatu_type_id || undefined,
        route_id: form.route_id || undefined,
        total_seats: Number(form.total_seats),
        is_active: form.is_active,
        amenities: form.amenities ? form.amenities.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      editing ? await adminMatatus.update(editing.slug, payload)
              : await adminMatatus.create(payload);
      setShowModal(false);
      load();
    } catch (e) {
      const d = e;
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (m) => {
    if (!confirm(`Delete matatu "${m.name}"?`)) return;
    try { await adminMatatus.delete(m.slug); load(); }
    catch { alert('Delete failed — may have bookings assigned.'); }
  };

  const openAssign = (m) => {
    setAssignTarget(m);
    setAssignDriverId('');
    setShowAssign(true);
  };

  const handleAssign = async () => {
    if (!assignDriverId) return;
    setSaving(true);
    try {
      await adminMatatus.assignDriver(assignTarget.slug, assignDriverId);
      setShowAssign(false);
      load();
    } catch { alert('Assign failed.'); }
    finally { setSaving(false); }
  };

  const svcBadge = (t) => t === 'express'
    ? <span className="badge badge-info"><i className="bi bi-lightning-fill"></i> Express</span>
    : <span className="badge badge-success"><i className="bi bi-sign-stop-fill"></i> Stage</span>;

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 style={{ marginBottom: '4px' }}>Matatus</h3>
          <p className="text-muted" style={{ margin: 0 }}>Manage all registered matatus</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {/* Service type filter */}
          <div className="ad-tabs" style={{ display: 'flex', gap: '4px', background: 'var(--gray-100)', padding: '4px', borderRadius: 'var(--radius)' }}>
            {[['', 'All'], ['stage', 'Stage'], ['express', 'Express']].map(([v, l]) => (
              <button 
                key={v} 
                className={`btn btn-sm ${filterType === v ? 'btn-primary' : 'btn-outline'}`}
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
              placeholder="Search matatus..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
          
          {/* Add Button */}
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-plus-lg"></i> Add Matatu
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="ad-card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p className="text-muted">Loading matatus...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            color: 'var(--gray-400)'
          }}>
            <i className="bi bi-bus-front" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
            <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No matatus found</h5>
            <p style={{ fontSize: '0.95rem' }}>Add your first matatu to get started</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Matatu</th>
                  <th>Plate</th>
                  <th>Type</th>
                  <th>Route</th>
                  <th>Service</th>
                  <th>Seats</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.slug}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{m.name}</div>
                      {(m.amenities || []).length > 0 && (
                        <div className="d-flex gap-1 flex-wrap" style={{ marginTop: '4px' }}>
                          {m.amenities.slice(0, 3).map(a => (
                            <span key={a} className="badge badge-info" style={{ fontSize: '.62rem' }}>{a}</span>
                          ))}
                          {m.amenities.length > 3 && (
                            <span className="text-muted" style={{ fontSize: '.7rem' }}>+{m.amenities.length - 3}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td><code style={{ 
                      background: 'var(--gray-100)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--gray-700)'
                    }}>{m.plate_number}</code></td>
                    <td style={{ fontSize: '.82rem', color: 'var(--gray-600)' }}>{m.matatu_type_name || '—'}</td>
                    <td style={{ fontSize: '.82rem' }}>{m.route_name || <span className="text-muted">No route</span>}</td>
                    <td>{svcBadge(m.service_type)}</td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{m.seat_count || m.total_seats}</span>
                      <span className="text-muted"> seats</span>
                    </td>
                    <td style={{ fontSize: '.82rem' }}>
                      {m.driver_name ? (
                        <span>
                          <i className="bi bi-person-fill" style={{ color: 'var(--success)', marginRight: '4px' }}></i>
                          {m.driver_name}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${m.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          onClick={() => openEdit(m)} 
                          title="Edit"
                          style={{ padding: '6px 10px' }}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/admin/matatus/${m.slug}/layout`)}
                          title="Seat Layout"
                          style={{ padding: '6px 10px' }}
                        >
                          <i className="bi bi-grid-3x3-gap"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          onClick={() => openAssign(m)} 
                          title="Assign Driver"
                          style={{ padding: '6px 10px' }}
                        >
                          <i className="bi bi-person-check"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(m)} 
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
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="ad-card" style={{ width: '600px', maxWidth: '90vw' }}>
            <div className="ad-card-header">
              <span className="ad-card-title">
                <i className="bi bi-bus-front" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                {editing ? 'Edit Matatu' : 'Add New Matatu'}
              </span>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => setShowModal(false)}
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
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Matatu Name *</label>
                  <input 
                    className="form-control" 
                    placeholder="e.g. Kiserian Express" 
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Plate Number *</label>
                  <input 
                    className="form-control" 
                    placeholder="KAA 000A" 
                    value={form.plate_number}
                    onChange={e => setForm(f => ({ ...f, plate_number: e.target.value.toUpperCase() }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Service Type</label>
                  <select 
                    className="form-control" 
                    value={form.service_type}
                    onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                  >
                    <option value="stage">Stage (Fill & Go)</option>
                    <option value="express">Express (Scheduled)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Matatu Type</label>
                  <select 
                    className="form-control" 
                    value={form.matatu_type_id}
                    onChange={e => setForm(f => ({ ...f, matatu_type_id: e.target.value }))}
                  >
                    <option value="">Select type</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Route</label>
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
                  <label className="form-label">Total Seats</label>
                  <input 
                    className="form-control" 
                    type="number" 
                    min={1} 
                    max={60} 
                    value={form.total_seats}
                    onChange={e => setForm(f => ({ ...f, total_seats: e.target.value }))} 
                  />
                </div>
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
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Amenities (comma-separated)</label>
                  <input 
                    className="form-control" 
                    placeholder="WiFi, AC, USB, Music" 
                    value={form.amenities}
                    onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} 
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
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><div className="spinner" style={{ width: '18px', height: '18px', marginRight: '8px' }}></div> Saving...</>
                ) : (
                  <><i className="bi bi-check-lg"></i> Save Matatu</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {showAssign && assignTarget && (
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
          onClick={e => e.target === e.currentTarget && setShowAssign(false)}
        >
          <div className="ad-card" style={{ width: '450px', maxWidth: '90vw' }}>
            <div className="ad-card-header">
              <span className="ad-card-title">Assign Driver — {assignTarget.name}</span>
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => setShowAssign(false)}
                style={{ border: 'none', padding: '8px' }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="ad-card-body">
              <div className="form-group">
                <label className="form-label">Select Driver</label>
                <select 
                  className="form-control" 
                  value={assignDriverId}
                  onChange={e => setAssignDriverId(e.target.value)}
                >
                  <option value="">Choose a driver</option>
                  {drivers.filter(d => d.status === 'active').map(d => (
                    <option key={d.id} value={d.id}>{d.full_name} — {d.phone}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ 
              padding: '20px 24px', 
              borderTop: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button className="btn btn-outline" onClick={() => setShowAssign(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={saving || !assignDriverId}>
                {saving ? (
                  <><div className="spinner" style={{ width: '18px', height: '18px', marginRight: '8px' }}></div> Assigning...</>
                ) : (
                  <><i className="bi bi-person-check"></i> Assign</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}