import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { milestonesApi } from '../lib/api.js';
import { useLang } from '../lib/i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import {
  ChevronLeft, ChevronRight, Loader, Lock,
  CheckCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWeekMonday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWeekLabel(ymd) {
  if (!ymd) return '';
  const [y, mo, d] = ymd.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ── Config ───────────────────────────────────────────────────────────────────
const METRIC_KEYS = [
  { key: 'responseName', emoji: '👂', color: '#3b82f6' },
  { key: 'eyeContact',   emoji: '👁️', color: '#8b5cf6' },
  { key: 'sitting',      emoji: '🪑', color: '#f59e0b' },
  { key: 'sounds',       emoji: '🗣️', color: '#10b981' },
  { key: 'calmness',     emoji: '😊', color: '#f43f5e' },
];

const SCALE_LABELS_KEYS = [
  'milestone.needsSupport',
  'milestone.emerging',
  'milestone.developing',
  'milestone.consistent',
  'milestone.independent',
];

// ── ScaleSelector ─────────────────────────────────────────────────────────────
function ScaleSelector({ value, onChange, readOnly, accentColor }) {
  const { t } = useLang();
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const isSelected = value === n;
        const isFilled   = value >= n;
        return (
          <button
            key={n}
            onClick={() => !readOnly && onChange(value === n ? 0 : n)}
            style={{
              flex: 1, height: 42, borderRadius: 9, border: `1.5px solid ${isFilled ? accentColor + '80' : 'var(--border)'}`,
              background: isSelected ? accentColor : isFilled ? accentColor + '18' : 'var(--surface)',
              cursor: readOnly ? 'default' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: isSelected ? '#fff' : isFilled ? accentColor : 'var(--muted)' }}>{n}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Past Report Card ──────────────────────────────────────────────────────────
function ReportCard({ report }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);

  const rated = METRIC_KEYS.filter(m => (report[m.key] ?? 0) > 0);
  const avg = rated.length > 0
    ? (rated.reduce((s, m) => s + report[m.key], 0) / rated.length).toFixed(1)
    : null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 10 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🏆</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{formatWeekLabel(report.weekStart)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {rated.length} {t('milestone.selectRating').toLowerCase()}
            {avg && <span style={{ marginLeft: 8, color: '#f59e0b', fontWeight: 700 }}>★ {avg}/5</span>}
          </div>
        </div>
        {expanded ? <ChevronUp size={15} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--muted)' }} />}
      </button>

      {expanded && (
        <div style={{ padding: '4px 16px 14px', borderTop: '1px solid var(--border)' }}>
          {METRIC_KEYS.map(m => {
            const val = report[m.key] ?? 0;
            const label = SCALE_LABELS_KEYS[val - 1];
            return (
              <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{m.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t(`milestone.${m.key}`)}</div>
                  {val > 0 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t(label)}</div>}
                </div>
                {val > 0 ? (
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{ width: 8, height: 8, borderRadius: 2, background: n <= val ? m.color : 'var(--border)' }} />
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
                )}
              </div>
            );
          })}
          {report.notes && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{report.notes}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MilestoneReport() {
  const { t }    = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isPremium = ['ACTIVE', 'TRIAL', 'active', 'trial'].includes(user?.subscriptionStatus);

  const todayMonday = getWeekMonday(new Date());
  const [weekStart, setWeekStart] = useState(toYMD(todayMonday));
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');

  const [scores, setScores] = useState({
    responseName: 0, eyeContact: 0, sitting: 0, sounds: 0, calmness: 0,
  });
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await milestonesApi.list();
      const arr = res?.reports ?? res ?? [];
      setReports(Array.isArray(arr) ? arr : []);
    } catch { setReports([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // When week changes, pre-fill form if existing report
  useEffect(() => {
    const existing = reports.find(r => r.weekStart === weekStart);
    if (existing) {
      setScores({
        responseName: existing.responseName ?? 0,
        eyeContact:   existing.eyeContact   ?? 0,
        sitting:      existing.sitting      ?? 0,
        sounds:       existing.sounds       ?? 0,
        calmness:     existing.calmness     ?? 0,
      });
      setNotes(existing.notes ?? '');
    } else {
      setScores({ responseName: 0, eyeContact: 0, sitting: 0, sounds: 0, calmness: 0 });
      setNotes('');
    }
    setSaved(false);
    setError('');
  }, [weekStart, reports]);

  const isCurrentWeek = weekStart === toYMD(todayMonday);

  const prevWeek = () => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(toYMD(d));
  };
  const nextWeek = () => {
    if (isCurrentWeek) return;
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    setWeekStart(toYMD(d));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await milestonesApi.submit({ weekStart, ...scores, notes: notes.trim() || undefined });
      setSaved(true);
      await load();
    } catch (e) {
      setError(e?.data?.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const existingReport = reports.find(r => r.weekStart === weekStart);
  const pastReports = reports.filter(r => r.weekStart !== weekStart)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  if (!isPremium) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/progress')} style={{ background: 'var(--border-light)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
            <ChevronLeft size={18} style={{ color: 'var(--text)' }} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.3 }}>{t('milestone.title')}</h1>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{t('milestone.locked')}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>{t('milestone.lockedDesc')}</div>
          <Link to="/payments" style={{ background: 'var(--green)', color: '#fff', borderRadius: 24, padding: '12px 28px', fontWeight: 700, fontSize: 14 }}>
            {t('routine.upgrade')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/progress')} style={{ background: 'var(--border-light)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
          <ChevronLeft size={18} style={{ color: 'var(--text)' }} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.3, marginBottom: 2 }}>{t('milestone.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{t('milestone.subtitle')}</p>
        </div>
      </div>

      {/* ── Week navigator ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={prevWeek}
          style={{ background: 'var(--border-light)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
          title={t('milestone.prev')}
        >
          <ChevronLeft size={16} style={{ color: 'var(--text)' }} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            {t('milestone.weekOf')} {formatWeekLabel(weekStart)}
          </div>
          {isCurrentWeek && (
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginTop: 2 }}>● {t('milestone.currentWeek')}</div>
          )}
          {existingReport && !isCurrentWeek && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>✅ {t('milestone.alreadySaved')}</div>
          )}
        </div>
        <button
          onClick={nextWeek}
          disabled={isCurrentWeek}
          style={{ background: 'var(--border-light)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: isCurrentWeek ? 'not-allowed' : 'pointer', opacity: isCurrentWeek ? 0.4 : 1 }}
          title={t('milestone.next')}
        >
          <ChevronRight size={16} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      {/* ── Rating form ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {METRIC_KEYS.map(m => (
          <div key={m.key} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{m.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{t(`milestone.${m.key}`)}</div>
                {scores[m.key] > 0 && (
                  <div style={{ fontSize: 11, color: m.color, fontWeight: 600, marginTop: 1 }}>
                    {t(SCALE_LABELS_KEYS[scores[m.key] - 1])}
                  </div>
                )}
              </div>
              {scores[m.key] > 0 && (
                <div style={{
                  background: m.color + '20', border: `1px solid ${m.color}40`,
                  borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 700, color: m.color,
                }}>
                  {scores[m.key]}/5
                </div>
              )}
            </div>
            <ScaleSelector
              value={scores[m.key]}
              onChange={v => setScores(s => ({ ...s, [m.key]: v }))}
              accentColor={m.color}
            />
          </div>
        ))}

        {/* Notes */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
          <label style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', display: 'block', marginBottom: 10 }}>
            📝 {t('milestone.notes')}
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value.slice(0, 500))}
            placeholder={t('milestone.notesPlaceholder')}
            rows={3}
            style={{
              width: '100%', border: '1px solid var(--border)', borderRadius: 10,
              padding: '10px 12px', fontSize: 13, color: 'var(--text)',
              background: 'var(--bg)', resize: 'vertical', boxSizing: 'border-box',
              outline: 'none', lineHeight: 1.5,
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{notes.length}/500</div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* ── Save button ── */}
      {saved ? (
        <div style={{
          background: 'var(--green-light)', border: '1px solid var(--green)',
          borderRadius: 'var(--radius)', padding: '16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <CheckCircle size={22} style={{ color: 'var(--green)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--green)' }}>{t('milestone.saved')}</div>
            <div style={{ fontSize: 12, color: 'var(--green)', opacity: .8, marginTop: 2 }}>
              {formatWeekLabel(weekStart)}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleSave}
          disabled={saving || Object.values(scores).every(v => v === 0)}
          style={{
            width: '100%', background: 'var(--green)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)', padding: '15px',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
            opacity: (saving || Object.values(scores).every(v => v === 0)) ? 0.6 : 1,
            transition: 'opacity .2s',
          }}
        >
          {saving ? t('milestone.saving') : existingReport ? t('milestone.editReport') : t('milestone.save')}
        </button>
      )}

      {/* ── Past Reports ── */}
      {pastReports.length > 0 && (
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 12, letterSpacing: -.2 }}>
            {t('milestone.pastReports')}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Loader size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            pastReports.map((r, i) => <ReportCard key={r.id ?? i} report={r} />)
          )}
        </div>
      )}
    </div>
  );
}
