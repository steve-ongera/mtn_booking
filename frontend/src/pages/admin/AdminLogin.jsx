// frontend/src/pages/admin/AdminLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuth } from '../../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('access_token')) navigate('/admin/dashboard', { replace: true });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminAuth.login(form.username, form.password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.error || err.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <i className="bi bi-bus-front-fill"></i>
            </div>
            <h2 style={{ color: '#fff', margin: '0 0 4px', fontSize: '1.3rem' }}>MTN Sacco Admin</h2>
            <p style={{ color: 'rgba(255,255,255,.75)', margin: 0, fontSize: '.88rem' }}>
              Sign in to manage the platform
            </p>
          </div>

          {/* Body */}
          <div className="login-body">
            {error && (
              <div className="ad-alert ad-alert-error mb-3">
                <i className="bi bi-exclamation-circle-fill"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="ad-form-group mb-3">
                <label className="ad-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-person" style={{
                    position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--gray-400)', fontSize: '.95rem', pointerEvents: 'none',
                  }}></i>
                  <input
                    className="ad-input"
                    style={{ paddingLeft: 34 }}
                    placeholder="Enter username"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    autoFocus
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="ad-form-group mb-4">
                <label className="ad-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-lock" style={{
                    position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--gray-400)', fontSize: '.95rem', pointerEvents: 'none',
                  }}></i>
                  <input
                    className="ad-input"
                    style={{ paddingLeft: 34, paddingRight: 40 }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--gray-400)',
                      cursor: 'pointer', padding: 2, fontSize: '.95rem',
                    }}
                  >
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-ad btn-ad-primary btn-ad-lg w-100"
                disabled={loading}
                style={{ justifyContent: 'center', gap: 8 }}
              >
                {loading ? (
                  <><div className="ad-spinner ad-spinner-sm ad-spinner-white"></div> Signing in...</>
                ) : (
                  <><i className="bi bi-box-arrow-in-right"></i> Sign In</>
                )}
              </button>
            </form>

            <div className="text-center mt-4" style={{ fontSize: '.8rem', color: 'var(--gray-400)' }}>
              MTN Sacco — Murang'a County · Admin Panel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}