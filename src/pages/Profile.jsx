import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import { authApi } from '../lib/api.js';
import {
  Shield, Edit2, Save, X, Loader,
  CheckCircle, Clock, AlertCircle, Camera, Trash2,
  ShieldCheck, Phone, Mail, User, Calendar, Star,
  Globe, Bell, Baby, CreditCard, RefreshCw, Link2,
  KeyRound, Languages, Palette, BellRing, BellOff,
} from 'lucide-react';

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const SUB_STATUS = {
  ACTIVE:    { color: '#16a34a', bg: '#dcfce7', Icon: CheckCircle, label: 'Active'    },
  TRIAL:     { color: '#7c3aed', bg: '#ede9fe', Icon: Clock,       label: 'Trial'     },
  CANCELLED: { color: '#dc2626', bg: '#fee2e2', Icon: AlertCircle, label: 'Cancelled' },
  EXPIRED:   { color: '#d97706', bg: '#fef3c7', Icon: AlertCircle, label: 'Expired'   },
  NONE:      { color: '#64748b', bg: '#f1f5f9', Icon: Shield,      label: 'Free'      },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)',
  borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none',
  background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box',
  transition: 'border-color .15s',
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: .6,
};

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      {children}
    </h2>
  );
}

function InfoRow({ Icon, label, value, mono, badge, badgeBg, badgeColor, last }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--border-light)',
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon size={13} style={{ color: 'var(--green)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{label}</div>
        {badge ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: badgeBg, color: badgeColor }}>
            {value}
          </span>
        ) : (
          <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-word' }}>{value}</div>
        )}
      </div>
    </div>
  );
}

function fmtDate(d, opts) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, opts ?? { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return null;
  return new Date(d).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  const months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
  if (months < 24) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''}`;
}

function formatChallenges(list) {
  if (!list || list.length === 0) return null;
  return list.map(c => c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
}

function formatPlan(plan) {
  if (!plan) return null;
  return plan.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────

function AvatarSection({ user, t, onPhotoUpdated }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const photoUrl = user?.photoUrl ?? user?.avatarUrl ?? user?.avatar ?? null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await authApi.updatePhoto(fd);
      await onPhotoUpdated(res);
      setMsg(t('profile.photoUpdated'));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.message ?? t('common.error'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = async () => {
    setUploading(true); setMsg('');
    try {
      await authApi.removePhoto();
      await onPhotoUpdated(null);
      setMsg(t('profile.photoUpdated'));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg(err.message ?? t('common.error'));
    } finally { setUploading(false); }
  };

  const statusKey = user?.subscriptionStatus ?? 'NONE';
  const cfg = SUB_STATUS[statusKey] ?? SUB_STATUS.NONE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px 20px', background: 'linear-gradient(160deg,var(--green-dark) 0%,var(--green) 100%)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
      {msg && (
        <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{msg}</div>
      )}

      {/* Avatar with camera overlay */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={user?.name ?? 'Avatar'}
            style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,.3)', boxShadow: '0 4px 20px rgba(0,0,0,.25)' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'rgba(255,255,255,.18)',
          display: photoUrl ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 34,
          border: '3px solid rgba(255,255,255,.3)',
          boxShadow: '0 4px 20px rgba(0,0,0,.25)',
          flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>

        {/* Camera button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 28, height: 28, borderRadius: '50%',
            background: '#fff', border: '2px solid var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.2)',
          }}
        >
          {uploading
            ? <Loader size={12} style={{ color: 'var(--green)', animation: 'spin 1s linear infinite' }} />
            : <Camera size={13} style={{ color: 'var(--green)' }} />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {/* Name & status */}
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{user?.name ?? '—'}</div>
      <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginBottom: 10 }}>{user?.email}</div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
        <cfg.Icon size={11} /> {cfg.label}
      </span>

      {/* Remove photo link */}
      {photoUrl && (
        <button onClick={removePhoto} disabled={uploading}
          style={{ marginTop: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Trash2 size={11} /> {t('profile.removePhoto')}
        </button>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Profile() {
  const { user: authUser, refreshUser } = useAuth();
  const { t } = useLang();

  // Full data from /auth/me: { user, childProfile, subscription, preferences }
  const [fullData, setFullData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ name: '', phone: '' });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [msgType, setMsgType] = useState('success');

  // Load full profile data on mount
  const loadFullData = async () => {
    try {
      const d = await authApi.me();
      setFullData(d);
    } catch { /* keep showing whatever we have */ }
    finally { setDataLoading(false); }
  };

  useEffect(() => { loadFullData(); }, []);

  // Prefer fullData.user for richest fields; fall back to authUser
  const user = fullData?.user ?? authUser;
  const childProfile = fullData?.childProfile ?? null;
  const subscription = fullData?.subscription ?? null;
  const preferences  = fullData?.preferences  ?? null;

  useEffect(() => {
    setForm({ name: user?.name ?? '', phone: user?.phone ?? '' });
  }, [user]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await authApi.updateProfile({ name: form.name, phone: form.phone });
      await refreshUser();
      await loadFullData();
      setEditing(false);
      setMsg(t('profile.updated'));
      setMsgType('success');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg(e.message ?? t('common.error'));
      setMsgType('error');
    } finally { setSaving(false); }
  };

  const statusKey = user?.subscriptionStatus ?? 'NONE';
  const subCfg = SUB_STATUS[statusKey] ?? SUB_STATUS.NONE;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('profile.title')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{t('profile.subtitle')}</p>
      </div>

      {/* Avatar hero */}
      <AvatarSection user={user} t={t} onPhotoUpdated={async () => { await refreshUser(); await loadFullData(); }} />

      {/* Message bar */}
      {msg && (
        <div style={{
          borderRadius: 8, padding: '8px 14px', fontSize: 13, marginBottom: 14,
          background: msgType === 'success' ? 'var(--green-light)' : '#fee2e2',
          border: `1px solid ${msgType === 'success' ? '#86efac' : '#fca5a5'}`,
          color: msgType === 'success' ? 'var(--green-dark)' : '#991b1b',
        }}>{msg}</div>
      )}

      {dataLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
        </div>
      )}

      {/* ── Account Details ───────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <SectionTitle><User size={15} style={{ color: 'var(--green)' }} />{t('profile.accountDetails')}</SectionTitle>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>
              <Edit2 size={13} /> {t('common.edit')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={save} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? .7 : 1 }}>
                {saving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />} {t('common.save')}
              </button>
              <button onClick={() => { setEditing(false); setForm({ name: user?.name ?? '', phone: user?.phone ?? '' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', background: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>
                <X size={13} /> {t('common.cancel')}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('profile.fullName')}</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('profile.emailAddress')}</label>
              <input value={user?.email ?? ''} disabled style={{ ...inputStyle, opacity: .55, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('profile.phone')}</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+250 ..."
                style={inputStyle}
              />
            </div>
          </div>
        ) : (
          <div>
            <InfoRow Icon={User}     label={t('profile.fullName')}     value={user?.name}  />
            <InfoRow Icon={Mail}     label={t('profile.emailAddress')} value={user?.email} />
            <InfoRow Icon={Phone}    label={t('profile.phone')}        value={user?.phone} />
            <InfoRow Icon={Calendar} label={t('profile.memberSince')}  value={fmtDate(user?.createdAt)} />
            <InfoRow Icon={RefreshCw} label={t('profile.lastUpdated')} value={fmtDate(user?.updatedAt)} />
            <InfoRow Icon={Clock}    label={t('profile.lastLogin')}    value={fmtDateTime(user?.lastLoginAt)} last />
          </div>
        )}
      </Card>

      {/* ── Security ──────────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle><Shield size={15} style={{ color: 'var(--green)' }} />{t('profile.security')}</SectionTitle>
        <div>
          {/* MFA */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: user?.mfaEnabled ? 'var(--green-light)' : 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <ShieldCheck size={13} style={{ color: user?.mfaEnabled ? 'var(--green)' : 'var(--muted)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{t('profile.mfaStatus')}</div>
              <div style={{ fontSize: 14, color: user?.mfaEnabled ? 'var(--green)' : 'var(--muted)', fontWeight: 600 }}>
                {user?.mfaEnabled ? t('common.enabled') : t('common.disabled')}
              </div>
            </div>
          </div>

          {/* Google link */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: user?.googleId ? 'var(--green-light)' : 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <Link2 size={13} style={{ color: user?.googleId ? 'var(--green)' : 'var(--muted)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{t('profile.googleLinked')}</div>
              <div style={{ fontSize: 14, color: user?.googleId ? 'var(--green)' : 'var(--muted)', fontWeight: 600 }}>
                {user?.googleId ? t('common.yes') : t('common.no')}
              </div>
            </div>
          </div>

          {/* Role */}
          {user?.role && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <User size={13} style={{ color: 'var(--muted)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{t('profile.role')}</div>
                <div style={{ fontSize: 14, color: 'var(--text)', textTransform: 'capitalize' }}>{user.role.toLowerCase()}</div>
              </div>
            </div>
          )}

          {/* Password changed */}
          <InfoRow Icon={KeyRound} label={t('profile.passwordChanged')} value={fmtDate(user?.passwordChangedAt)} last />
        </div>
      </Card>

      {/* ── Child Profile ─────────────────────────────────────────────────── */}
      {childProfile && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle><Baby size={15} style={{ color: 'var(--green)' }} />{t('profile.childProfile')}</SectionTitle>
          <div>
            <InfoRow Icon={User}     label={t('profile.childName')}       value={childProfile.childName} />
            <InfoRow Icon={Calendar} label={t('profile.childDOB')}        value={fmtDate(childProfile.dateOfBirth)} />
            <InfoRow Icon={Clock}    label={t('profile.childAge')}        value={calcAge(childProfile.dateOfBirth) ?? (childProfile.ageMonths ? `${childProfile.ageMonths} months` : null)} />
            <InfoRow Icon={Star}     label={t('profile.childChallenges')} value={formatChallenges(childProfile.challenges)} last />
          </div>
        </Card>
      )}

      {/* ── Subscription Details ──────────────────────────────────────────── */}
      {subscription && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle><CreditCard size={15} style={{ color: 'var(--green)' }} />{t('profile.subscriptionDetails')}</SectionTitle>
          <div>
            {/* Plan */}
            <InfoRow Icon={Star}        label={t('profile.plan')}          value={formatPlan(subscription.plan)} />
            {/* Status badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: subCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <subCfg.Icon size={13} style={{ color: subCfg.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{t('profile.subscriptionStatus')}</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: subCfg.bg, color: subCfg.color }}>
                  <subCfg.Icon size={10} /> {subCfg.label}
                </span>
              </div>
            </div>
            <InfoRow Icon={Globe}       label={t('profile.platform')}      value={subscription.platform?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase())} />
            <InfoRow Icon={Calendar}    label={t('profile.periodStart')}   value={fmtDate(subscription.periodStart)} />
            <InfoRow Icon={Calendar}    label={t('profile.periodEnd')}     value={fmtDate(subscription.periodEnd)} />
            {subscription.cardLast4 && (
              <InfoRow Icon={CreditCard} label={t('profile.card')} value={`${subscription.cardBrand ?? 'Card'} •••• ${subscription.cardLast4}`} />
            )}
            {subscription.mobileMoneyPhone && (
              <InfoRow Icon={Phone} label={t('profile.mobileMoney')} value={`${subscription.mobileMoneyProvider?.toUpperCase() ?? 'MoMo'} — ${subscription.mobileMoneyPhone}`} />
            )}
            {subscription.cancelledAt && (
              <InfoRow Icon={AlertCircle} label={t('profile.cancelledAt')} value={fmtDate(subscription.cancelledAt)} last />
            )}
          </div>
        </Card>
      )}

      {/* ── Preferences ───────────────────────────────────────────────────── */}
      {preferences && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle><Palette size={15} style={{ color: 'var(--green)' }} />{t('profile.preferences')}</SectionTitle>
          <div>
            <InfoRow Icon={Languages} label={t('profile.prefLanguage')}  value={preferences.language?.toUpperCase()} />
            <InfoRow Icon={Palette}   label={t('profile.prefTheme')}     value={preferences.darkMode === 'dark' ? t('settings.dark') : preferences.darkMode === 'light' ? t('settings.light') : t('settings.system')} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {preferences.emailNotifications !== false ? <BellRing size={13} style={{ color: 'var(--green)' }} /> : <BellOff size={13} style={{ color: 'var(--muted)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{t('profile.notifications')}</div>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>
                  {preferences.emailNotifications !== false ? t('common.enabled') : t('common.disabled')}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
