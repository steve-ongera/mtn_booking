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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--gray-900) 0%, var(--gray-800) 100%)',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Login Card - Using ad-card with custom styling */}
        <div className="ad-card" style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'var(--shadow-xl)'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '32px 32px 24px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            margin: '-1px -1px 0 -1px',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'white',
              fontSize: '2rem'
            }}>
              <i className="bi bi-bus-front-fill"></i>
            </div>
            <h2 style={{ 
              color: '#fff', 
              margin: '0 0 4px', 
              fontSize: '1.5rem',
              fontFamily: 'var(--font-display)',
              fontWeight: '700'
            }}>
              MTN Sacco Admin
            </h2>
            <p style={{ 
              color: 'rgba(255,255,255,.9)', 
              margin: 0, 
              fontSize: '.95rem',
              fontWeight: '500'
            }}>
              Sign in to manage the platform
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '32px' }}>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
                <i className="bi bi-exclamation-circle-fill"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-person" style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--gray-400)', fontSize: '1rem', pointerEvents: 'none', zIndex: 1
                  }}></i>
                  <input
                    className="form-control"
                    style={{ paddingLeft: '42px' }}
                    placeholder="Enter username"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    autoFocus
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-lock" style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--gray-400)', fontSize: '1rem', pointerEvents: 'none', zIndex: 1
                  }}></i>
                  <input
                    className="form-control"
                    style={{ paddingLeft: '42px', paddingRight: '42px' }}
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
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--gray-400)',
                      cursor: 'pointer', padding: '4px', fontSize: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 1
                    }}
                  >
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={loading}
                style={{ 
                  justifyContent: 'center', 
                  gap: '8px',
                  height: '48px',
                  fontSize: '1rem'
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right"></i> 
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4" style={{ 
              fontSize: '.85rem', 
              color: 'var(--gray-500)',
              paddingTop: '16px',
              borderTop: '1px solid var(--gray-200)'
            }}>
              MTN Sacco — Murang'a County · Admin Panel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}