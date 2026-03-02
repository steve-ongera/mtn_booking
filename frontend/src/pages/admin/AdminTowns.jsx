// frontend/src/pages/admin/AdminTowns.jsx
import { useState, useEffect } from 'react';
import { adminTowns, adminStages } from '../../services/api';

export default function AdminTowns() {
  const [towns, setTowns]   = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab] = useState('towns');
  const [search, setSearch] = useState('');
  const [showModal, setModal] = useState(false);
  const [editType, setEditType] = useState('town'); // 'town' | 'stage'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:'', address:'', town_id:'', is_active:true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const p = search ? `?search=${search}` : '';
      const [t, s] = await Promise.all([adminTowns.list(p), adminStages.list(p)]);
      setTowns(t.results || t);
      setStages(s.results || s);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = (type) => {
    setEditType(type);
    setEditing(null);
    setForm({ name:'', address:'', town_id:'', is_active:true });
    setError(''); setModal(true);
  };

  const openEdit = (item, type) => {
    setEditType(type);
    setEditing(item);
    if (type === 'town') {
      setForm({ name: item.name, is_active: item.is_active });
    } else {
      setForm({ name: item.name, address: item.address || '', town_id: String(item.town), is_active: item.is_active });
    }
    setError(''); setModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { setError('Name is required.'); return; }
    if (editType === 'stage' && !form.town_id) { setError('Town is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editType === 'town') {
        const p = { name: form.name, is_active: form.is_active };
        editing ? await adminTowns.update(editing.slug, p) : await adminTowns.create(p);
      } else {
        const p = { name: form.name, address: form.address, town_id: Number(form.town_id), is_active: form.is_active };
        editing ? await adminStages.update(editing.slug, p) : await adminStages.create(p);
      }
      setModal(false); load();
    } catch (e) { setError(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDeleteTown = async (slug, name) => {
    if (!confirm(`Delete town "${name}"? All stages in this town will also be removed.`)) return;
    try { await adminTowns.delete(slug); load(); }
    catch { alert('Delete failed — may have routes.'); }
  };

  const handleDeleteStage = async (slug, name) => {
    if (!confirm(`Delete stage "${name}"?`)) return;
    try { await adminStages.delete(slug); load(); }
    catch { alert('Delete failed.'); }
  };

  const stagesForTown = (townId) => stages.filter(s => s.town === townId);

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 style={{ marginBottom: '4px' }}>Towns & Stages</h3>
          <p className="text-muted" style={{ margin: 0 }}>Manage towns and matatu stages/terminuses</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {/* Tabs */}
          <div className="ad-tabs" style={{ 
            display: 'flex', 
            gap: '4px', 
            background: 'var(--gray-100)', 
            padding: '4px', 
            borderRadius: 'var(--radius)' 
          }}>
            <button 
              className={`btn btn-sm ${activeTab === 'towns' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none' }}
              onClick={() => setTab('towns')}
            >
              Towns
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'stages' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none' }}
              onClick={() => setTab('stages')}
            >
              Stages
            </button>
          </div>

          {/* Search */}
          <div className="ad-search" style={{ position: 'relative' }}>
            <i className="bi bi-search"></i>
            <input 
              className="form-control" 
              placeholder={`Search ${activeTab}...`} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '220px' }}
            />
          </div>
          
          {/* Add Button */}
          <button className="btn btn-primary" onClick={() => openAdd(activeTab === 'towns' ? 'town' : 'stage')}>
            <i className="bi bi-plus-lg"></i> Add {activeTab === 'towns' ? 'Town' : 'Stage'}
          </button>
        </div>
      </div>

      {/* Towns Tab */}
      {activeTab === 'towns' && (
        <div className="ad-card">
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <p className="text-muted">Loading towns...</p>
            </div>
          ) : towns.length === 0 ? (
            <div style={{ 
              padding: '48px', 
              textAlign: 'center',
              color: 'var(--gray-400)'
            }}>
              <i className="bi bi-geo-alt" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
              <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No towns yet</h5>
              <p style={{ fontSize: '0.95rem' }}>Add towns that MTN Sacco serves</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Town</th>
                    <th>Stages</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {towns.map(t => (
                    <tr key={t.slug}>
                      <td style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{t.name}</td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap" style={{ maxWidth: '300px' }}>
                          {stagesForTown(t.id).slice(0, 4).map(s => (
                            <span key={s.id} className="badge badge-info" style={{ fontSize: '.75rem' }}>{s.name}</span>
                          ))}
                          {stagesForTown(t.id).length > 4 && (
                            <span className="text-muted" style={{ fontSize: '.75rem', paddingLeft: '4px' }}>
                              +{stagesForTown(t.id).length - 4} more
                            </span>
                          )}
                          {stagesForTown(t.id).length === 0 && (
                            <span className="text-muted" style={{ fontSize: '.82rem' }}>No stages</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${t.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => { 
                              setTab('stages'); 
                              openAdd('stage'); 
                              setTimeout(() => setForm(f => ({ ...f, town_id: String(t.id) })), 0); 
                            }} 
                            title="Add Stage"
                            style={{ padding: '6px 10px' }}
                          >
                            <i className="bi bi-plus-lg"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => openEdit(t, 'town')} 
                            title="Edit"
                            style={{ padding: '6px 10px' }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDeleteTown(t.slug, t.name)} 
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
      )}

      {/* Stages Tab */}
      {activeTab === 'stages' && (
        <div className="ad-card">
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <p className="text-muted">Loading stages...</p>
            </div>
          ) : stages.length === 0 ? (
            <div style={{ 
              padding: '48px', 
              textAlign: 'center',
              color: 'var(--gray-400)'
            }}>
              <i className="bi bi-sign-stop" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
              <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No stages yet</h5>
              <p style={{ fontSize: '0.95rem' }}>Add matatu stages for towns</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Stage Name</th>
                    <th>Town</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map(s => (
                    <tr key={s.slug}>
                      <td style={{ fontWeight: '500' }}>{s.name}</td>
                      <td>
                        <span className="badge badge-info">
                          <i className="bi bi-geo-alt" style={{ marginRight: '3px' }}></i>
                          {s.town_name}
                        </span>
                      </td>
                      <td style={{ fontSize: '.82rem', color: 'var(--gray-600)' }}>
                        {s.address || <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => openEdit(s, 'stage')} 
                            title="Edit"
                            style={{ padding: '6px 10px' }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDeleteStage(s.slug, s.name)} 
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
      )}

      {/* Modal */}
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
                <i className={`bi ${editType === 'town' ? 'bi-geo-alt' : 'bi-sign-stop'}`} style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                {editing ? `Edit ${editType === 'town' ? 'Town' : 'Stage'}` : `Add ${editType === 'town' ? 'Town' : 'Stage'}`}
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
                {/* Town selection for stages */}
                {editType === 'stage' && (
                  <div className="form-group">
                    <label className="form-label">Town *</label>
                    <select 
                      className="form-control" 
                      value={form.town_id}
                      onChange={e => setForm(f => ({ ...f, town_id: e.target.value }))}
                    >
                      <option value="">Select town</option>
                      {towns.filter(t => t.is_active).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Name field */}
                <div className="form-group">
                  <label className="form-label">{editType === 'town' ? 'Town Name' : 'Stage Name'} *</label>
                  <input 
                    className="form-control"
                    placeholder={editType === 'town' ? "e.g. Murang'a" : "e.g. CBD Stage"}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  />
                </div>

                {/* Address for stages */}
                {editType === 'stage' && (
                  <div className="form-group">
                    <label className="form-label">Address / Landmark</label>
                    <input 
                      className="form-control" 
                      placeholder="e.g. Near Total Petrol Station"
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
                    />
                  </div>
                )}

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