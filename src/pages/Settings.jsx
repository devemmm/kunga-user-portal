import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useTheme } from '../lib/theme.jsx';
import { useLang, SUPPORTED_LANGS } from '../lib/i18n.jsx';
import { authApi, logout } from '../lib/api.js';
import {
  Sun, Moon, Monitor, CheckCircle, Loader,
  Shield, ShieldCheck, ShieldOff, Lock, Eye, EyeOff, LogOut,
} from 'lucide-react';

// ─── SHARED ATOMS ─────────────────────────────────────────────────────────────

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
  return <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{children}</h2>;
}

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 44, height: 25, borderRadius: 99, border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        background: on ? 'var(--green)' : 'var(--border)',
        position: 'relative', transition: 'background .2s', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 22 : 3,
        width: 19, height: 19, borderRadius: '50%', background: '#fff',
        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </button>
  );
}

function OtpInput({ value, onChange, label, autoFocus }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="text" inputMode="numeric" maxLength={6}
        value={value} onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        autoFocus={autoFocus}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 10,
          fontSize: 22, letterSpacing: 8, fontWeight: 700, textAlign: 'center',
          border: '1.5px solid var(--border)', background: 'var(--bg)',
          color: 'var(--text)', boxSizing: 'border-box', outline: 'none',
          fontFamily: 'monospace',
        }}
      />
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, prefs, updatePrefs, refreshUser } = useAuth();
  const { theme, setTheme }  = useTheme();
  const { lang, setLang, t } = useLang();

  const [saving, setSaving]     = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [localPrefs, setLocalPrefs] = useState(null);

  // Password
  const [pwdForm, setPwdForm]   = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdMsg, setPwdMsg]     = useState('');
  const [pwdErr, setPwdErr]     = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  // MFA
  const [mfaPhase, setMfaPhase]   = useState('idle');
  const [mfaOtp, setMfaOtp]       = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaErr, setMfaErr]       = useState('');
  const mfaEnabled = user?.mfaEnabled ?? false;

  useEffect(() => { if (prefs) setLocalPrefs({ ...prefs }); }, [prefs]);

  const toggle = useCallback(async (key, value) => {
    const next = { ...localPrefs, [key]: value };
    setLocalPrefs(next);
    setSaving(true);
    try {
      await updatePrefs({ [key]: value });
      setSavedMsg(t('settings.saved'));
      setTimeout(() => setSavedMsg(''), 2000);
    } catch { setLocalPrefs({ ...prefs }); }
    finally { setSaving(false); }
  }, [localPrefs, prefs, updatePrefs, t]);

  const onThemeChange = async (mode) => {
    setTheme(mode);
    try { await updatePrefs({ darkMode: mode }); } catch { /* non-critical */ }
  };

  const onLangChange = async (code) => {
    setLang(code);
    try { await updatePrefs({ language: code }); } catch { /* non-critical */ }
  };

  const changePwd = async e => {
    e.preventDefault(); setPwdErr(''); setPwdMsg('');
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdErr(t('settings.pwdMismatch')); return; }
    setPwdSaving(true);
    try {
      await authApi.changePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.newPwd });
      setPwdMsg(t('settings.pwdChanged'));
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      setTimeout(() => setPwdMsg(''), 3000);
    } catch (e) { setPwdErr(e.message ?? t('common.error')); }
    finally { setPwdSaving(false); }
  };

  const startMfaEnable = async () => {
    setMfaErr(''); setMfaLoading(true);
    try { await authApi.mfaSetupSend(); setMfaPhase('otp'); setMfaOtp(''); }
    catch (e) { setMfaErr(e.message ?? t('common.error')); }
    finally { setMfaLoading(false); }
  };

  const verifyMfaEnable = async () => {
    setMfaErr(''); setMfaLoading(true);
    try { await authApi.mfaSetupVerify(mfaOtp); await refreshUser(); setMfaPhase('success'); setTimeout(() => setMfaPhase('idle'), 3000); }
    catch (e) { setMfaErr(e.message ?? t('common.error')); }
    finally { setMfaLoading(false); }
  };

  const startMfaDisable = async () => {
    setMfaErr(''); setMfaLoading(true);
    try { await authApi.mfaDisableSend(); setMfaPhase('otp-disable'); setMfaOtp(''); }
    catch (e) { setMfaErr(e.message ?? t('common.error')); }
    finally { setMfaLoading(false); }
  };

  const verifyMfaDisable = async () => {
    setMfaErr(''); setMfaLoading(true);
    try { await authApi.mfaDisableVerify(mfaOtp); await refreshUser(); setMfaPhase('idle'); }
    catch (e) { setMfaErr(e.message ?? t('common.error')); }
    finally { setMfaLoading(false); }
  };

  const THEME_OPTIONS = [
    { value: 'light',  label: t('settings.themeLight'),  Icon: Sun    },
    { value: 'dark',   label: t('settings.themeDark'),   Icon: Moon   },
    { value: 'system', label: t('settings.themeSystem'), Icon: Monitor },
  ];

  const TEXT_SIZE_OPTIONS = [
    { value: 'small',  label: t('settings.textSmall')  },
    { value: 'medium', label: t('settings.textMedium') },
    { value: 'large',  label: t('settings.textLarge')  },
  ];

  const NOTIF_ITEMS = [
    { key: 'notificationsEnabled', label: t('settings.notifAll'),           desc: t('settings.notifAllDesc'),           master: true },
    { key: 'routineReminderOn',    label: t('settings.notifRoutine'),        desc: t('settings.notifRoutineDesc')        },
    { key: 'streakAlertsOn',       label: t('settings.notifStreak'),         desc: t('settings.notifStreakDesc')         },
    { key: 'milestoneRemindersOn', label: t('settings.notifMilestone'),      desc: t('settings.notifMilestoneDesc')      },
    { key: 'drGadResponseOn',      label: t('settings.notifDrGad'),          desc: t('settings.notifDrGadDesc')          },
    { key: 'announcementsOn',      label: t('settings.notifAnnouncements'),  desc: t('settings.notifAnnouncementsDesc')  },
    { key: 'marketingOn',          label: t('settings.notifMarketing'),      desc: t('settings.notifMarketingDesc')      },
  ];

  const masterOff = localPrefs && !localPrefs.notificationsEnabled;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('profile.tabSettings')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          {t('settings.appearance')}, {t('settings.language').toLowerCase()}, {t('settings.notifications').toLowerCase()} & {t('settings.security').toLowerCase()}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {savedMsg && (
          <div style={{ background: 'var(--green-light)', border: '1px solid #86efac', borderRadius: 8, padding: '8px 14px', color: 'var(--green-dark)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={14} /> {savedMsg}
          </div>
        )}

        {/* ── Appearance ── */}
        <Card>
          <SectionTitle>{t('settings.appearance')}</SectionTitle>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('settings.theme')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {THEME_OPTIONS.map(({ value, label, Icon }) => (
                <button key={value} onClick={() => onThemeChange(value)}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${theme === value ? 'var(--green)' : 'var(--border)'}`,
                    background: theme === value ? 'var(--green-light)' : 'var(--surface)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    transition: 'all .15s',
                  }}
                >
                  <Icon size={18} style={{ color: theme === value ? 'var(--green)' : 'var(--muted)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: theme === value ? 'var(--green)' : 'var(--muted)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('settings.textSize')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {TEXT_SIZE_OPTIONS.map(({ value, label }) => (
                <button key={value} onClick={() => toggle('textSize', value)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${localPrefs?.textSize === value ? 'var(--green)' : 'var(--border)'}`,
                    background: localPrefs?.textSize === value ? 'var(--green-light)' : 'var(--surface)',
                    fontSize: value === 'small' ? 11 : value === 'medium' ? 13 : 15,
                    fontWeight: 700,
                    color: localPrefs?.textSize === value ? 'var(--green)' : 'var(--muted)',
                    transition: 'all .15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── Language ── */}
        <Card>
          <SectionTitle>{t('settings.language')}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SUPPORTED_LANGS.map(({ code, native, flag }) => (
              <button key={code} onClick={() => onLangChange(code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${lang === code ? 'var(--green)' : 'var(--border)'}`,
                  background: lang === code ? 'var(--green-light)' : 'var(--surface)',
                  transition: 'all .15s', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 20 }}>{flag}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: lang === code ? 'var(--green)' : 'var(--text)' }}>{native}</span>
                {lang === code && <CheckCircle size={15} style={{ color: 'var(--green)', marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
        </Card>

        {/* ── Notifications ── */}
        <Card>
          <SectionTitle>{t('settings.notifications')}</SectionTitle>
          {!localPrefs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--muted)' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {NOTIF_ITEMS.map(({ key, label, desc, master }, i) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < NOTIF_ITEMS.length - 1 ? '1px solid var(--border-light)' : undefined,
                  opacity: (!master && masterOff) ? 0.45 : 1,
                }}>
                  <div style={{ flex: 1, paddingRight: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: master ? 700 : 600 }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{desc}</div>
                  </div>
                  <Toggle on={!!localPrefs[key]} onChange={v => toggle(key, v)} disabled={!master && masterOff} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Security ── */}
        <Card>
          <SectionTitle>{t('settings.security')}</SectionTitle>

          {/* MFA */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: mfaEnabled ? 'var(--green-light)' : 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, border: '1px solid var(--border)',
              }}>
                {mfaEnabled
                  ? <ShieldCheck size={20} style={{ color: 'var(--green)' }} />
                  : <Shield      size={20} style={{ color: 'var(--muted)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t('settings.mfaTitle')}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>
                  {mfaEnabled ? t('settings.mfaEnabledDesc') : t('settings.mfaDesc')}
                </div>
              </div>
              {mfaEnabled && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'var(--green-light)', color: 'var(--green)', flexShrink: 0 }}>
                  <CheckCircle size={11} /> {t('common.enabled')}
                </span>
              )}
            </div>

            {mfaErr && (
              <div style={{ background: '#fee2e2', borderRadius: 8, padding: '8px 12px', color: '#991b1b', fontSize: 13, marginBottom: 10 }}>{mfaErr}</div>
            )}

            {mfaPhase === 'idle' && (
              <button onClick={mfaEnabled ? startMfaDisable : startMfaEnable} disabled={mfaLoading}
                style={{
                  padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  border: `2px solid ${mfaEnabled ? '#fca5a5' : 'var(--green)'}`,
                  background: mfaEnabled ? '#fee2e2' : 'var(--green-light)',
                  color: mfaEnabled ? '#b91c1c' : 'var(--green)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {mfaLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : mfaEnabled ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                {mfaEnabled ? t('settings.mfaDisable') : t('settings.mfaEnable')}
              </button>
            )}

            {mfaPhase === 'otp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {t('settings.mfaSetupDesc', { email: user?.email })}
                </div>
                <OtpInput value={mfaOtp} onChange={setMfaOtp} label={t('settings.mfaEnterCode')} autoFocus />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={verifyMfaEnable} disabled={mfaOtp.length < 6 || mfaLoading}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'var(--green)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: (mfaOtp.length < 6 || mfaLoading) ? 0.6 : 1 }}>
                    {mfaLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={13} />}
                    {t('settings.mfaVerify')}
                  </button>
                  <button onClick={() => { setMfaPhase('idle'); setMfaOtp(''); setMfaErr(''); }}
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {mfaPhase === 'otp-disable' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {t('settings.mfaDisableDesc', { email: user?.email })}
                </div>
                <OtpInput value={mfaOtp} onChange={setMfaOtp} label={t('settings.mfaEnterCode')} autoFocus />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={verifyMfaDisable} disabled={mfaOtp.length < 6 || mfaLoading}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: (mfaOtp.length < 6 || mfaLoading) ? 0.6 : 1 }}>
                    {mfaLoading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldOff size={13} />}
                    {t('settings.mfaDisableVerify')}
                  </button>
                  <button onClick={() => { setMfaPhase('idle'); setMfaOtp(''); setMfaErr(''); }}
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}

            {mfaPhase === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--green-light)', borderRadius: 10, color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
                <CheckCircle size={15} /> {t('settings.mfaSuccess')}
              </div>
            )}
          </div>

          {/* Change password */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t('settings.changePassword')}</div>
            {pwdMsg && <div style={{ background: 'var(--green-light)', borderRadius: 8, padding: '8px 12px', color: 'var(--green-dark)', fontSize: 13, marginBottom: 10 }}>{pwdMsg}</div>}
            {pwdErr && <div style={{ background: '#fee2e2', borderRadius: 8, padding: '8px 12px', color: '#991b1b', fontSize: 13, marginBottom: 10 }}>{pwdErr}</div>}
            <form onSubmit={changePwd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'current', label: t('settings.currentPwd') },
                { key: 'newPwd',  label: t('settings.newPwd') },
                { key: 'confirm', label: t('settings.confirmNewPwd') },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={pwdForm[key]}
                    onChange={e => setPwdForm(f => ({ ...f, [key]: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 12, padding: 0 }}>
                  {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showPwd ? 'Hide' : 'Show'}
                </button>
                <button type="submit" disabled={pwdSaving}
                  style={{ marginLeft: 'auto', padding: '9px 18px', borderRadius: 10, background: 'var(--green)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {pwdSaving ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={13} />}
                  {pwdSaving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      {/* ── Sign Out ── */}
      <button
        onClick={() => logout()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 20px', borderRadius: 12, marginTop: 8,
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
