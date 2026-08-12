import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import { authApi, usersApi, logout } from '../lib/api.js';
import {
  Shield, Edit2, Save, X, Loader,
  CheckCircle, Clock, AlertCircle, Camera, Trash2,
  ShieldCheck, Phone, Mail, User, Calendar, Star,
  Globe, Bell, Baby, CreditCard, RefreshCw, Link2,
  KeyRound, Languages, Palette, BellRing, BellOff, LogOut,
  ChevronLeft, ChevronRight,
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

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  // If today → relative ("just now", "36 min ago", "2h ago")
  const isToday = new Date().toDateString() === date.toDateString();
  if (isToday) {
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    return `${hours}h ago`;
  }

  // Not today → full date + time with seconds and milliseconds
  const datePart = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${datePart} · ${hh}:${mm}:${ss}.${ms}`;
}

function getActivityMeta(action) {
  const map = {
    'user.login':              { icon: '🔑', color: '#16a34a', label: 'Signed in' },
    'user.logout':             { icon: '🚪', color: '#64748b', label: 'Signed out' },
    'user.register':           { icon: '🎉', color: '#7c3aed', label: 'Account created' },
    'user.profile.update':     { icon: '✏️',  color: '#0ea5e9', label: 'Profile updated' },
    'user.photo.update':       { icon: '📷', color: '#0ea5e9', label: 'Photo updated' },
    'user.password.change':    { icon: '🔒', color: '#f59e0b', label: 'Password changed' },
    'user.password.reset':     { icon: '🔓', color: '#f59e0b', label: 'Password reset' },
    'video.watch':             { icon: '▶️',  color: '#16a34a', label: 'Watched a video' },
    'video.bookmark':          { icon: '🔖', color: '#7c3aed', label: 'Bookmarked a video' },
    'askgad.question':         { icon: '💬', color: '#0ea5e9', label: 'Asked Dr. Gad' },
    'admin.subscription.override': { icon: '⭐', color: '#f59e0b', label: 'Subscription updated' },
    'admin.subscription.cancel':   { icon: '❌', color: '#ef4444', label: 'Subscription cancelled' },
  };
  const found = map[action];
  if (found) return found;
  // Fallback — prettify unknown action keys
  const label = action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { icon: '📋', color: '#64748b', label };
}

const CHALLENGES = [
  'speech_delay', 'language_delay', 'autism_spectrum', 'hearing_impairment',
  'attention_deficit', 'social_difficulties', 'sensory_processing', 'motor_delays',
];

// ── Custom Date Picker ────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function DatePicker({ value, onChange }) {
  const today   = new Date();
  const parsed  = value ? new Date(value + 'T12:00:00') : null;

  const [open,       setOpen]   = useState(false);
  const [viewYear,   setVYear]  = useState((parsed ?? today).getFullYear());
  const [viewMonth,  setVMonth] = useState((parsed ?? today).getMonth());
  const [pickMode,   setPick]   = useState('day'); // 'day' | 'month' | 'year'
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const prevMonth = () => { if (viewMonth === 0) { setVMonth(11); setVYear(y => y - 1); } else setVMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setVMonth(0); setVYear(y => y + 1); } else setVMonth(m => m + 1); };

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // shift so Monday = index 0
  const startOffset = (firstDay + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectDay = (d) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
    setPick('day');
  };

  const isSelected = (d) => {
    if (!parsed || !d) return false;
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === d;
  };

  const isToday = (d) => {
    if (!d) return false;
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
  };

  const displayValue = parsed
    ? parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  // Year range for year picker (current −20 to current +5)
  const yearList = [];
  for (let y = today.getFullYear() + 5; y >= today.getFullYear() - 20; y--) yearList.push(y);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setPick('day'); }}
        style={{
          ...inputStyle,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box',
          color: displayValue ? 'var(--text)' : 'var(--muted)',
        }}
      >
        <span>{displayValue || 'Select date of birth'}</span>
        <Calendar size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 200, top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1.5px solid var(--border)',
          borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,.14)',
          padding: '16px 14px 14px', minWidth: 280,
        }}>

          {/* ── Day view ── */}
          {pickMode === 'day' && (<>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button type="button" onClick={prevMonth} style={navBtn}>
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => setPick('month')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'var(--text)', padding: '4px 8px', borderRadius: 8 }}
              >
                {MONTHS[viewMonth]} {viewYear}
              </button>
              <button type="button" onClick={nextMonth} style={navBtn}>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 6 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', padding: '2px 0', letterSpacing: .4 }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
              {cells.map((d, i) => {
                const sel   = isSelected(d);
                const tod   = isToday(d);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!d}
                    onClick={() => d && selectDay(d)}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 8,
                      border: tod && !sel ? '1.5px solid var(--green)' : '1.5px solid transparent',
                      background: sel ? 'var(--green)' : 'none',
                      color: sel ? '#fff' : d ? 'var(--text)' : 'transparent',
                      fontSize: 12.5, fontWeight: sel ? 700 : 400,
                      cursor: d ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => { if (d && !sel) e.currentTarget.style.background = 'var(--green-light,#f0fdf4)'; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'none'; }}
                  >
                    {d || ''}
                  </button>
                );
              })}
            </div>

            {/* Clear / Today */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <button type="button" onClick={() => { onChange(''); setOpen(false); }} style={textBtn('#ef4444')}>Clear</button>
              <button type="button" onClick={() => {
                const t = new Date();
                setVYear(t.getFullYear()); setVMonth(t.getMonth());
                selectDay(t.getDate());
              }} style={textBtn('var(--green)')}>Today</button>
            </div>
          </>)}

          {/* ── Month view ── */}
          {pickMode === 'month' && (<>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button type="button" onClick={() => setVYear(y => y - 1)} style={navBtn}><ChevronLeft size={15} /></button>
              <button type="button" onClick={() => setPick('year')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: 'var(--text)', padding: '4px 8px', borderRadius: 8 }}>{viewYear}</button>
              <button type="button" onClick={() => setVYear(y => y + 1)} style={navBtn}><ChevronRight size={15} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {MONTHS.map((m, i) => {
                const active = i === viewMonth;
                return (
                  <button key={m} type="button" onClick={() => { setVMonth(i); setPick('day'); }}
                    style={{ padding: '9px 4px', borderRadius: 10, border: '1.5px solid', fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer',
                      borderColor: active ? 'var(--green)' : 'transparent',
                      background: active ? 'var(--green)' : 'var(--bg,#f9fafb)',
                      color: active ? '#fff' : 'var(--text)',
                    }}
                  >{m.slice(0,3)}</button>
                );
              })}
            </div>
          </>)}

          {/* ── Year view ── */}
          {pickMode === 'year' && (<>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 10, textAlign: 'center' }}>Select year</div>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {yearList.map(y => {
                const active = y === viewYear;
                return (
                  <button key={y} type="button" onClick={() => { setVYear(y); setPick('month'); }}
                    style={{ padding: '8px 4px', borderRadius: 10, border: '1.5px solid', fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer',
                      borderColor: active ? 'var(--green)' : 'transparent',
                      background: active ? 'var(--green)' : 'var(--bg,#f9fafb)',
                      color: active ? '#fff' : 'var(--text)',
                    }}
                  >{y}</button>
                );
              })}
            </div>
          </>)}

        </div>
      )}
    </div>
  );
}
const navBtn  = { background: 'var(--bg,#f5f5f5)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text)' };
const textBtn = (color) => ({ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color, padding: '4px 6px' });

function ChildProfileSection({ childProfile, t, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [form, setForm] = useState({
    childName: '', dateOfBirth: '', ageMonths: '', challenges: [],
  });

  // Seed form when editing
  const openEdit = () => {
    setForm({
      childName:   childProfile?.childName   ?? '',
      dateOfBirth: childProfile?.dateOfBirth ? childProfile.dateOfBirth.split('T')[0] : '',
      ageMonths:   childProfile?.ageMonths   ? String(childProfile.ageMonths) : '',
      challenges:  childProfile?.challenges  ?? [],
    });
    setMsg('');
    setEditing(true);
  };

  const toggleChallenge = (c) => setForm(f => ({
    ...f,
    challenges: f.challenges.includes(c) ? f.challenges.filter(x => x !== c) : [...f.challenges, c],
  }));

  const save = async () => {
    if (!form.childName.trim()) { setMsg(t('profile.childNameRequired') || 'Child name is required'); return; }
    setSaving(true); setMsg('');
    try {
      await usersApi.upsertChildProfile({
        childName:   form.childName.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        ageMonths:   form.ageMonths   ? Number(form.ageMonths) : undefined,
        challenges:  form.challenges,
      });
      await onSaved();
      setEditing(false);
    } catch (e) { setMsg(e.message ?? t('common.error')); }
    finally { setSaving(false); }
  };

  // No child profile yet → show prompt card
  if (!childProfile && !editing) {
    return (
      <div style={{
        background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
        border: '1.5px dashed var(--green)',
        borderRadius: 'var(--radius)', padding: 20, marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Baby size={22} style={{ color: 'var(--green)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>
            {t('profile.childProfileMissing') || "Set up your child's profile"}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            {t('profile.childProfileMissingDesc') || "Help us personalise the learning journey for your child by adding their details and challenges."}
          </div>
        </div>
        <button onClick={openEdit} style={{
          flexShrink: 0, background: 'var(--green)', color: '#fff',
          border: 'none', borderRadius: 10, padding: '9px 16px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          {t('profile.addChildProfile') || 'Add Profile'}
        </button>
      </div>
    );
  }

  // Editing form
  if (editing) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <SectionTitle><Baby size={15} style={{ color: 'var(--green)' }} />{t('profile.childProfile')}</SectionTitle>
          <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><X size={16} /></button>
        </div>
        {msg && <div style={{ background: '#fee2e2', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#991b1b', marginBottom: 12 }}>{msg}</div>}
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={labelStyle}>{t('profile.childName')} *</label>
            <input value={form.childName} onChange={e => setForm(f => ({ ...f, childName: e.target.value }))} placeholder={t('profile.childNamePlaceholder') || "Child's name"} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('profile.childDOB')}</label>
            <DatePicker value={form.dateOfBirth} onChange={val => setForm(f => ({ ...f, dateOfBirth: val }))} />
          </div>
          <div>
            <label style={labelStyle}>{t('profile.childAgeMonths') || 'Age (months, if DOB unknown)'}</label>
            <input type="number" min="0" max="240" value={form.ageMonths} onChange={e => setForm(f => ({ ...f, ageMonths: e.target.value }))} placeholder="e.g. 24" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('profile.childChallenges')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {CHALLENGES.map(c => {
                const active = form.challenges.includes(c);
                const label  = c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <button key={c} type="button" onClick={() => toggleChallenge(c)} style={{
                    padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                    background: active ? 'var(--green-light)' : 'var(--surface)',
                    color: active ? 'var(--green-dark)' : 'var(--muted)',
                  }}>{label}</button>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button onClick={() => setEditing(false)} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>
            {t('common.cancel')}
          </button>
        </div>
      </Card>
    );
  }

  // Show filled profile with edit button
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionTitle><Baby size={15} style={{ color: 'var(--green)' }} />{t('profile.childProfile')}</SectionTitle>
        <button onClick={openEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>
          <Edit2 size={13} /> {t('common.edit')}
        </button>
      </div>
      <div>
        <InfoRow Icon={User}     label={t('profile.childName')}       value={childProfile.childName} />
        <InfoRow Icon={Calendar} label={t('profile.childDOB')}        value={fmtDate(childProfile.dateOfBirth)} />
        <InfoRow Icon={Clock}    label={t('profile.childAge')}        value={calcAge(childProfile.dateOfBirth) ?? (childProfile.ageMonths ? `${childProfile.ageMonths} months` : null)} />
        <InfoRow Icon={Star}     label={t('profile.childChallenges')} value={formatChallenges(childProfile.challenges)} last />
      </div>
    </Card>
  );
}

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
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_PAGE_SIZE = 5;

  useEffect(() => {
    usersApi.getActivity()
      .then(d => setActivityLogs(d?.logs ?? []))
      .catch(() => {});
  }, []);

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
      {!dataLoading && (
        <ChildProfileSection
          childProfile={childProfile}
          t={t}
          onSaved={async () => { await loadFullData(); }}
        />
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

      {/* ── Activity Log ── */}
      {activityLogs.length > 0 && (() => {
        const totalPages = Math.ceil(activityLogs.length / ACTIVITY_PAGE_SIZE);
        const pageLogs   = activityLogs.slice((activityPage - 1) * ACTIVITY_PAGE_SIZE, activityPage * ACTIVITY_PAGE_SIZE);
        return (
          <Card>
            <SectionTitle><Clock size={15} style={{ color: 'var(--green)' }} />{t('profile.activityLog') || 'Recent Activity'}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {pageLogs.map((log, i) => {
                const { icon, color, label } = getActivityMeta(log.action);
                return (
                  <div key={log.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 0',
                    borderBottom: i < pageLogs.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                      {log.details && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, marginTop: 2, textAlign: 'right', maxWidth: 130 }}>
                      {formatRelativeTime(log.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                  disabled={activityPage === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', fontSize: 13, cursor: activityPage === 1 ? 'not-allowed' : 'pointer', opacity: activityPage === 1 ? .4 : 1, color: 'var(--text)' }}>
                  ← {t('common.prev') || 'Prev'}
                </button>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {activityPage} / {totalPages}
                </span>
                <button
                  onClick={() => setActivityPage(p => Math.min(totalPages, p + 1))}
                  disabled={activityPage === totalPages}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', fontSize: 13, cursor: activityPage === totalPages ? 'not-allowed' : 'pointer', opacity: activityPage === totalPages ? .4 : 1, color: 'var(--text)' }}>
                  {t('common.next') || 'Next'} →
                </button>
              </div>
            )}
          </Card>
        );
      })()}

      {/* ── Sign Out ── */}
      <button
        onClick={() => logout()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 20px', borderRadius: 12, marginTop: 4, marginBottom: 8,
          border: '1.5px solid #fca5a5', background: '#fff1f2',
          color: '#dc2626', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <LogOut size={16} /> {t('nav.signOut')}
      </button>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
