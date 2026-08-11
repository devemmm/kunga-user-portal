import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { authApi, subscriptionsApi, paymentsApi } from '../lib/api.js';
import { User, CreditCard, Shield, Edit2, Save, X, Loader, CheckCircle, Star, Clock, AlertCircle } from 'lucide-react';

const SUB_STATUS = {
  ACTIVE:    { label: 'Active',    color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  TRIAL:     { label: 'Trial',     color: '#7c3aed', bg: '#ede9fe', icon: Clock },
  CANCELLED: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2', icon: AlertCircle },
  EXPIRED:   { label: 'Expired',   color: '#d97706', bg: '#fef3c7', icon: AlertCircle },
  NONE:      { label: 'Free',      color: '#64748b', bg: '#f1f5f9', icon: Shield },
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [sub, setSub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    setForm({ name: user?.name ?? '', email: user?.email ?? '' });
    Promise.allSettled([
      subscriptionsApi.getStatus().then(setSub),
      paymentsApi.myHistory().then(d => setPayments(Array.isArray(d) ? d : (d?.payments ?? d?.transactions ?? []))),
    ]).finally(() => setLoading(false));
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({ name: form.name });
      await refreshUser();
      setEditing(false);
      setSaveMsg('Profile updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg(err.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const statusKey = sub?.status ?? user?.subscriptionStatus ?? 'NONE';
  const cfg = SUB_STATUS[statusKey] ?? SUB_STATUS.NONE;
  const StatusIcon = cfg.icon;

  const tabs = [
    { id: 'profile',      label: 'Profile' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'payments',     label: 'Payments' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Profile</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Manage your account and subscription</p>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 26 }}>
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{user?.email}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
            <StatusIcon size={11} /> {cfg.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 16px', border: 'none', background: 'none', fontWeight: tab === t.id ? 700 : 500, fontSize: 14, color: tab === t.id ? 'var(--green)' : 'var(--muted)', borderBottom: tab === t.id ? '2px solid var(--green)' : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
          {saveMsg && (
            <div style={{ background: 'var(--green-light)', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', color: 'var(--green-dark)', fontSize: 13, marginBottom: 14 }}>{saveMsg}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Account Details</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <Edit2 size={14} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveProfile} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />} Save
                </button>
                <button onClick={() => { setEditing(false); setForm({ name: user?.name ?? '', email: user?.email ?? '' }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', background: 'none', fontSize: 13, cursor: 'pointer' }}>
                  <X size={13} /> Cancel
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>Full Name</label>
              {editing ? (
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
              ) : (
                <div style={{ fontSize: 15 }}>{user?.name ?? '—'}</div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>Email Address</label>
              <div style={{ fontSize: 15 }}>{user?.email}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>Member Since</label>
              <div style={{ fontSize: 15 }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription tab */}
      {tab === 'subscription' && (
        <div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Current Plan</h2>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} /></div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StatusIcon size={24} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{sub?.plan ?? 'Free'}</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                      <StatusIcon size={12} /> {cfg.label}
                    </span>
                  </div>
                </div>

                {sub?.periodEnd && (
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                    {statusKey === 'CANCELLED' ? 'Access until' : 'Renews on'}: <strong>{new Date(sub.periodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                  </div>
                )}

                {sub?.platform && (
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                    Platform: <strong style={{ textTransform: 'capitalize' }}>{sub.platform.replace(/_/g, ' ')}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plans (if not active) */}
          {(!sub || statusKey === 'NONE' || statusKey === 'EXPIRED' || statusKey === 'CANCELLED') && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Available Plans</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { name: 'Gold', price: '$299.99/mo', color: '#d97706', bg: '#fef3c7', features: ['All learning modules', 'Progress tracking', 'Milestone tracking'] },
                  { name: 'Premium', price: '$349.99/mo', color: '#7c3aed', bg: '#ede9fe', features: ['Everything in Gold', 'Ask Dr. Gad (2 questions/mo)', 'Priority support'] },
                ].map(plan => (
                  <div key={plan.name} style={{ background: 'var(--surface)', border: `2px solid ${plan.color}`, borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 17 }}>{plan.name}</div>
                        <div style={{ fontSize: 15, color: plan.color, fontWeight: 600 }}>{plan.price}</div>
                      </div>
                      <Star size={20} style={{ color: plan.color }} />
                    </div>
                    <ul style={{ paddingLeft: 16, marginBottom: 0 }}>
                      {plan.features.map(f => <li key={f} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{f}</li>)}
                    </ul>
                    <div style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>Download the Kunga Basics iOS app to subscribe.</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payments tab */}
      {tab === 'payments' && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Payment History</h2>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} /></div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <CreditCard size={36} style={{ margin: '0 auto 12px', opacity: .4 }} />
              <div>No payment history yet</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {payments.map((p, i) => (
                <div key={p.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={18} style={{ color: 'var(--green)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.plan ?? p.description ?? 'Subscription'}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--green)' }}>
                    {p.currency ?? '$'}{p.amount ?? p.amountUsd ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
