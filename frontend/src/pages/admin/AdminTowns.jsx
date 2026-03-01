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
      <div className="d-flex align-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-800" style={{ marginBottom:2 }}>Towns & Stages</h4>
          <p className="text-muted" style={{ margin:0 }}>Manage towns and matatu stages/terminuses</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="ad-tabs">
            <button className={`ad-tab ${activeTab === 'towns' ? 'active' : ''}`} onClick={() => setTab('towns')}>Towns</button>
            <button className={`ad-tab ${activeTab === 'stages' ? 'active' : ''}`} onClick={() => setTab('stages')}>Stages</button>
          </div>
          <div className="ad-search-wrap">
            <i className="bi bi-search"></i>
            <input className="ad-search-input" placeholder={`Search ${activeTab}…`} value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-ad btn-ad-primary" onClick={() => openAdd(activeTab === 'towns' ? 'town' : 'stage')}>
            <i className="bi bi-plus-lg"></i> Add {activeTab === 'towns' ? 'Town' : 'Stage'}
          </button>
        </div>
      </div>

      {/* Towns Tab */}
      {activeTab === 'towns' && (
        <div className="ad-card">
          {loading ? (
            <div style={{ padding:'3rem', textAlign:'center' }}><div className="ad-spinner" style={{ margin:'0 auto' }}></div></div>
          ) : towns.length === 0 ? (
            <div className="ad-empty"><i className="bi bi-geo-alt"></i><h5>No towns yet</h5><p>Add towns that MTN Sacco serves</p></div>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead><tr><th>Town</th><th>Stages</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {towns.map(t => (
                    <tr key={t.slug}>
                      <td className="fw-700">{t.name}</td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {stagesForTown(t.id).slice(0, 4).map(s => (
                            <span key={s.id} className="ad-tag">{s.name}</span>
                          ))}
                          {stagesForTown(t.id).length > 4 && (
                            <span className="text-muted" style={{ fontSize:'.75rem' }}>+{stagesForTown(t.id).length - 4} more</span>
                          )}
                          {stagesForTown(t.id).length === 0 && <span className="text-muted">No stages</span>}
                        </div>
                      </td>
                      <td><span className={`badge ${t.is_active ? 'badge-active' : 'badge-inactive'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="actions">
                          <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => { setTab('stages'); openAdd('stage'); setTimeout(() => setForm(f => ({ ...f, town_id: String(t.id) })), 0); }} data-tip="Add Stage">
                            <i className="bi bi-plus-lg"></i>
                          </button>
                          <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => openEdit(t, 'town')} data-tip="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn-ad btn-ad-danger btn-ad-sm" onClick={() => handleDeleteTown(t.slug, t.name)} data-tip="Delete">
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
            <div style={{ padding:'3rem', textAlign:'center' }}><div className="ad-spinner" style={{ margin:'0 auto' }}></div></div>
          ) : stages.length === 0 ? (
            <div className="ad-empty"><i className="bi bi-sign-stop"></i><h5>No stages yet</h5><p>Add matatu stages for towns</p></div>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead><tr><th>Stage Name</th><th>Town</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {stages.map(s => (
                    <tr key={s.slug}>
                      <td className="fw-600">{s.name}</td>
                      <td><span className="ad-tag"><i className="bi bi-geo-alt" style={{ marginRight:3 }}></i>{s.town_name}</span></td>
                      <td style={{ fontSize:'.82rem', color:'var(--gray-500)' }}>{s.address || <span className="text-muted">—</span>}</td>
                      <td><span className={`badge ${s.is_active ? 'badge-active' : 'badge-inactive'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="actions">
                          <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => openEdit(s, 'stage')} data-tip="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn-ad btn-ad-danger btn-ad-sm" onClick={() => handleDeleteStage(s.slug, s.name)} data-tip="Delete">
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
        <div className="ad-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="ad-modal ad-modal-sm">
            <div className="ad-modal-header">
              <span className="ad-modal-title">
                <i className={`bi ${editType === 'town' ? 'bi-geo-alt' : 'bi-sign-stop'}`} style={{ marginRight:8, color:'var(--primary)' }}></i>
                {editing ? `Edit ${editType === 'town' ? 'Town' : 'Stage'}` : `Add ${editType === 'town' ? 'Town' : 'Stage'}`}
              </span>
              <button className="ad-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="ad-modal-body">
              {error && <div className="ad-alert ad-alert-error"><i className="bi bi-exclamation-circle-fill"></i>{error}</div>}
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {editType === 'stage' && (
                  <div className="ad-form-group">
                    <label className="ad-label">Town *</label>
                    <select className="ad-select" value={form.town_id}
                      onChange={e => setForm(f => ({ ...f, town_id: e.target.value }))}>
                      <option value="">Select town</option>
                      {towns.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="ad-form-group">
                  <label className="ad-label">{editType === 'town' ? 'Town Name' : 'Stage Name'} *</label>
                  <input className="ad-input"
                    placeholder={editType === 'town' ? "e.g. Murang'a" : "e.g. CBD Stage"}
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                {editType === 'stage' && (
                  <div className="ad-form-group">
                    <label className="ad-label">Address / Landmark</label>
                    <input className="ad-input" placeholder="e.g. Near Total Petrol Station"
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                )}
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