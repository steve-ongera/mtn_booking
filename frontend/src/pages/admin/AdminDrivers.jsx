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
      {/* Header */}
      <div className="d-flex align-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 style={{ marginBottom: '4px' }}>Drivers</h3>
          <p className="text-muted" style={{ margin: 0 }}>Registered MTN Sacco drivers</p>
        </div>
        <div className="d-flex gap-2">
          {/* Search */}
          <div className="ad-search" style={{ position: 'relative' }}>
            <i className="bi bi-search"></i>
            <input 
              className="form-control" 
              placeholder="Search drivers..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>
          
          {/* Add Button */}
          <button className="btn btn-primary" onClick={openAdd}>
            <i className="bi bi-person-plus"></i> Add Driver
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="ad-card">
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p className="text-muted">Loading drivers...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            color: 'var(--gray-400)'
          }}>
            <i className="bi bi-person-badge" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}></i>
            <h5 style={{ color: 'var(--gray-600)', marginBottom: '8px' }}>No drivers found</h5>
            <p style={{ fontSize: '0.95rem' }}>Register your first driver</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Phone</th>
                  <th>License</th>
                  <th>Assigned Matatu</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="d-flex align-center gap-2">
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: 'var(--primary-soft)', 
                          color: 'var(--primary)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: '700', 
                          fontSize: '.85rem',
                          flexShrink: 0 
                        }}>
                          {(d.full_name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{d.full_name}</div>
                          <div className="text-muted" style={{ fontSize: '.72rem' }}>@{d.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{d.phone}</td>
                    <td>
                      <code style={{ 
                        fontSize: '.78rem',
                        background: 'var(--gray-100)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--gray-700)'
                      }}>
                        {d.license_number}
                      </code>
                    </td>
                    <td>
                      {d.assigned_matatu ? (
                        <span>
                          <i className="bi bi-bus-front" style={{ color: 'var(--primary)', marginRight: '5px' }}></i>
                          {d.assigned_matatu.name} 
                          <code style={{ 
                            fontSize: '.7rem',
                            background: 'var(--gray-100)',
                            padding: '2px 4px',
                            borderRadius: 'var(--radius-xs)',
                            marginLeft: '4px'
                          }}>
                            {d.assigned_matatu.plate}
                          </code>
                        </span>
                      ) : (
                        <span className="text-muted">Not assigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${d.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        <span style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: d.status === 'active' ? 'var(--success)' : 'var(--danger)',
                          marginRight: '6px'
                        }}></span>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className={`btn btn-sm ${d.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => handleToggle(d.id)}
                          title={d.status === 'active' ? 'Suspend' : 'Activate'}
                          style={{ padding: '6px 10px' }}
                        >
                          <i className={`bi ${d.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(d.id, d.full_name)} 
                          title="Remove"
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

      {/* Add Driver Modal */}
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
                <i className="bi bi-person-plus" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                Register Driver
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

              {/* Personal Info Section */}
              <h5 style={{ 
                fontSize: '0.9rem', 
                marginBottom: '16px',
                color: 'var(--gray-700)',
                fontWeight: '600'
              }}>
                Personal Info
              </h5>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {[['first_name','First Name'],['last_name','Last Name']].map(([f,l]) => (
                  <div className="form-group" key={f}>
                    <label className="form-label">{l} *</label>
                    <input 
                      className="form-control" 
                      value={form[f]} 
                      onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} 
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input 
                    className="form-control" 
                    placeholder="07XX XXX XXX" 
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ID Number *</label>
                  <input 
                    className="form-control" 
                    value={form.id_number}
                    onChange={e => setForm(p => ({ ...p, id_number: e.target.value }))} 
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">License Number *</label>
                  <input 
                    className="form-control" 
                    placeholder="DL/XXXX/YYYY" 
                    value={form.license_number}
                    onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} 
                  />
                </div>
              </div>

              {/* Divider */}
              <div style={{ 
                height: '1px', 
                background: 'var(--gray-200)', 
                margin: '24px 0' 
              }}></div>

              {/* Login Credentials Section */}
              <h5 style={{ 
                fontSize: '0.9rem', 
                marginBottom: '16px',
                color: 'var(--gray-700)',
                fontWeight: '600'
              }}>
                Login Credentials
              </h5>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input 
                    className="form-control" 
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    className="form-control" 
                    type="email" 
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      style={{ paddingRight: '40px' }}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(v => !v)}
                      style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: 'var(--gray-400)', 
                        fontSize: '.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
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
                  <><div className="spinner" style={{ width: '18px', height: '18px', marginRight: '8px' }}></div> Registering...</>
                ) : (
                  <><i className="bi bi-person-check"></i> Register Driver</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}