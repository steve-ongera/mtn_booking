// frontend/src/pages/admin/AdminDrivers.jsx
import { useState, useEffect } from 'react';
import { adminDrivers } from '../../services/api';

const EMPTY = { username:'', email:'', first_name:'', last_name:'', password:'', phone:'', license_number:'', id_number:'' };

export default function AdminDrivers() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const p = search ? `?search=${search}` : '';
      const data = await adminDrivers.list(p);
      setItems(data.results || data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = () => { setForm(EMPTY); setError(''); setModal(true); };

  const handleSave = async () => {
    const required = ['username','first_name','last_name','phone','license_number','id_number'];
    const missing = required.filter(k => !form[k]);
    if (missing.length) { setError(`Required: ${missing.join(', ')}`); return; }
    if (!form.password || form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setSaving(true); setError('');
    try {
      await adminDrivers.create(form);
      setModal(false); load();
    } catch (e) { setError(typeof e === 'object' ? Object.values(e).flat().join(' ') : 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try { await adminDrivers.toggleStatus(id); load(); }
    catch { alert('Status update failed.'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove driver "${name}"?`)) return;
    try { await adminDrivers.delete(id); load(); }
    catch { alert('Delete failed.'); }
  };

  return (
    <div>
      <div className="d-flex align-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-800" style={{ marginBottom:2 }}>Drivers</h4>
          <p className="text-muted" style={{ margin:0 }}>Registered MTN Sacco drivers</p>
        </div>
        <div className="d-flex gap-2">
          <div className="ad-search-wrap">
            <i className="bi bi-search"></i>
            <input className="ad-search-input" placeholder="Search drivers…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-ad btn-ad-primary" onClick={openAdd}>
            <i className="bi bi-person-plus"></i> Add Driver
          </button>
        </div>
      </div>

      <div className="ad-card">
        {loading ? (
          <div style={{ padding:'3rem', textAlign:'center' }}><div className="ad-spinner" style={{ margin:'0 auto' }}></div></div>
        ) : items.length === 0 ? (
          <div className="ad-empty"><i className="bi bi-person-badge"></i><h5>No drivers found</h5><p>Register your first driver</p></div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>Driver</th><th>Phone</th><th>License</th><th>Assigned Matatu</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="d-flex align-center gap-2">
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--blue-100)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.78rem', flexShrink:0 }}>
                          {(d.full_name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-600">{d.full_name}</div>
                          <div className="text-muted" style={{ fontSize:'.72rem' }}>@{d.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{d.phone}</td>
                    <td><code style={{ fontSize:'.78rem' }}>{d.license_number}</code></td>
                    <td>
                      {d.assigned_matatu
                        ? <span><i className="bi bi-bus-front" style={{ color:'var(--primary)', marginRight:5 }}></i>{d.assigned_matatu.name} <code style={{ fontSize:'.7rem' }}>{d.assigned_matatu.plate}</code></span>
                        : <span className="text-muted">Not assigned</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${d.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                        <span className={`dot dot-${d.status === 'active' ? 'green' : 'gray'}`}></span>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className={`btn-ad btn-ad-sm ${d.status === 'active' ? 'btn-ad-secondary' : 'btn-ad-success'}`}
                          onClick={() => handleToggle(d.id)}
                          data-tip={d.status === 'active' ? 'Suspend' : 'Activate'}
                        >
                          <i className={`bi ${d.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                        </button>
                        <button className="btn-ad btn-ad-danger btn-ad-sm" onClick={() => handleDelete(d.id, d.full_name)} data-tip="Remove">
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

      {/* Add Driver Modal */}
      {showModal && (
        <div className="ad-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="ad-modal ad-modal-md">
            <div className="ad-modal-header">
              <span className="ad-modal-title"><i className="bi bi-person-plus" style={{ marginRight:8, color:'var(--primary)' }}></i>Register Driver</span>
              <button className="ad-modal-close" onClick={() => setModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="ad-modal-body">
              {error && <div className="ad-alert ad-alert-error"><i className="bi bi-exclamation-circle-fill"></i>{error}</div>}
              <div className="ad-section-title mb-2">Personal Info</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                {[['first_name','First Name'],['last_name','Last Name']].map(([f,l]) => (
                  <div className="ad-form-group" key={f}>
                    <label className="ad-label">{l} *</label>
                    <input className="ad-input" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
                <div className="ad-form-group">
                  <label className="ad-label">Phone *</label>
                  <input className="ad-input" placeholder="07XX XXX XXX" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">ID Number *</label>
                  <input className="ad-input" value={form.id_number}
                    onChange={e => setForm(p => ({ ...p, id_number: e.target.value }))} />
                </div>
                <div className="ad-form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="ad-label">License Number *</label>
                  <input className="ad-input" placeholder="DL/XXXX/YYYY" value={form.license_number}
                    onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} />
                </div>
              </div>
              <div className="divider"></div>
              <div className="ad-section-title mb-2">Login Credentials</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="ad-form-group">
                  <label className="ad-label">Username *</label>
                  <input className="ad-input" value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))} />
                </div>
                <div className="ad-form-group">
                  <label className="ad-label">Email</label>
                  <input className="ad-input" type="email" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="ad-form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="ad-label">Password *</label>
                  <div style={{ position:'relative' }}>
                    <input
                      className="ad-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      style={{ paddingRight:38 }}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', fontSize:'.95rem' }}>
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="ad-modal-footer">
              <button className="btn-ad btn-ad-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-ad btn-ad-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><div className="ad-spinner ad-spinner-sm ad-spinner-white"></div> Registering...</> : <><i className="bi bi-person-check"></i> Register Driver</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}