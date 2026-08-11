import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api.js';
import { Eye, EyeOff, Loader, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <XCircle size={48} style={{ color: '#dc2626', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Invalid link</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>This password reset link is invalid or has expired.</p>
        <button onClick={() => navigate('/login')} style={btnStyle}>Back to sign in</button>
      </div>
    </div>
  );

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      await authApi.resetPassword(token, form.password);
      setDone(true);
    } catch (err) {
      setError(err.message ?? 'Failed to reset password. The link may have expired.');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <CheckCircle size={48} style={{ color: 'var(--green)', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Password reset!</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>Your password has been updated. You can now sign in with your new password.</p>
        <button onClick={() => navigate('/login')} style={btnStyle}>Go to sign in</button>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="Kunga Basics" style={{ width: 64, height: 64, borderRadius: 16, margin: '0 auto 12px', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }} />
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--green)' }}>Kunga Basics</div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '28px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Set new password</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>Choose a strong password for your account.</p>

          <form onSubmit={submit}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 5 }}>New password</label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} required minLength={8}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', display: 'flex', cursor: 'pointer' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 5 }}>Confirm new password</label>
              <input type={show ? 'text' : 'password'} required
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat your new password"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Resetting…</> : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const pageStyle = { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, flexDirection: 'column', textAlign: 'center' };
const cardStyle = { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '32px 28px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', maxWidth: 380, width: '100%' };
const btnStyle = { width: '100%', padding: '11px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer' };
