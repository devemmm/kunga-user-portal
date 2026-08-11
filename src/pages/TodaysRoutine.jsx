import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { routineApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import { CheckCircle, Flame, Lock, Loader, RotateCcw } from 'lucide-react';

// ── Task catalogue — same as mobile app ──────────────────────────────────────
const ROUTINE_TASK_KEYS = [
  { category: 'morning',   taskKey: 'wake_up_routine' },
  { category: 'morning',   taskKey: 'teeth_brushing' },
  { category: 'morning',   taskKey: 'dressing' },
  { category: 'morning',   taskKey: 'breakfast' },
  { category: 'morning',   taskKey: 'eye_contact_practice' },
  { category: 'afternoon', taskKey: 'sensory_activities' },
  { category: 'afternoon', taskKey: 'learning_session' },
  { category: 'afternoon', taskKey: 'outdoor_time' },
  { category: 'afternoon', taskKey: 'speech_practice' },
  { category: 'evening',   taskKey: 'calm_down_routine' },
  { category: 'evening',   taskKey: 'reading_together' },
  { category: 'evening',   taskKey: 'bedtime_routine' },
];

const CATEGORIES = [
  { key: 'morning',   emoji: '🌅', tKey: 'routine.morning' },
  { key: 'afternoon', emoji: '☀️', tKey: 'routine.afternoon' },
  { key: 'evening',   emoji: '🌙', tKey: 'routine.evening' },
];

const TODAY = new Date().toISOString().split('T')[0];

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function mergeWithTemplate(apiEntries = []) {
  const map = new Map(apiEntries.map(e => [`${e.category}|${e.taskKey}`, e]));
  return ROUTINE_TASK_KEYS.map(t => ({
    ...t,
    completed:   map.get(`${t.category}|${t.taskKey}`)?.completed ?? false,
    completedAt: map.get(`${t.category}|${t.taskKey}`)?.completedAt ?? null,
  }));
}

// ── Individual task row ───────────────────────────────────────────────────────
function TaskRow({ task, onToggle, toggling }) {
  const { t } = useLang();
  const { completed } = task;
  const isToggling = toggling === `${task.category}|${task.taskKey}`;

  return (
    <button
      onClick={() => onToggle(task)}
      disabled={isToggling}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 0', background: 'none', border: 'none', cursor: isToggling ? 'wait' : 'pointer',
        borderBottom: '1px solid var(--border)', textAlign: 'left',
        opacity: isToggling ? .6 : 1, transition: 'opacity .15s',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: completed ? 'none' : '2px solid var(--border)',
        background: completed ? 'var(--green)' : 'var(--surface)',
        transition: 'all .2s',
        boxShadow: completed ? '0 2px 8px rgba(27,94,59,.25)' : 'none',
      }}>
        {completed && <CheckCircle size={14} color="#fff" strokeWidth={2.5} style={{ display: 'block' }} />}
      </div>

      <span style={{
        fontSize: 14, fontWeight: 500, flex: 1, color: completed ? 'var(--muted)' : 'var(--text)',
        textDecoration: completed ? 'line-through' : 'none', transition: 'all .2s',
      }}>
        {t(`routine.task.${task.taskKey}`)}
      </span>
    </button>
  );
}

// ── Circular progress ring ────────────────────────────────────────────────────
function Ring({ pct = 0, size = 80, stroke = 7 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#fff" strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .5s ease' }} />
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TodaysRoutine() {
  const { user } = useAuth();
  const { t }    = useLang();

  const isPremium = ['ACTIVE', 'TRIAL'].includes(user?.subscriptionStatus);

  const [tasks,    setTasks]    = useState(mergeWithTemplate([]));
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(null); // "category|taskKey"
  const [streak,   setStreak]   = useState(0);

  const load = useCallback(() => {
    if (!isPremium) { setLoading(false); return; }
    Promise.all([
      routineApi.getDate(TODAY).then(d => setTasks(mergeWithTemplate(d?.entries ?? []))),
      routineApi.streak().then(d => setStreak(d?.streak ?? 0)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [isPremium]);

  useEffect(() => { load(); }, [load]);

  const toggleTask = async (task) => {
    const key = `${task.category}|${task.taskKey}`;
    const newCompleted = !task.completed;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.category === task.category && t.taskKey === task.taskKey
        ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null }
        : t
    ));
    setToggling(key);

    try {
      await routineApi.toggle(TODAY, task.category, task.taskKey, newCompleted);
    } catch {
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.category === task.category && t.taskKey === task.taskKey
          ? { ...t, completed: task.completed, completedAt: task.completedAt }
          : t
      ));
    } finally {
      setToggling(null);
    }
  };

  const totalTasks     = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pct            = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const allDone        = completedTasks === totalTasks && totalTasks > 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Paywall ────────────────────────────────────────────────────────────────
  if (!isPremium) return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.3 }}>{t('routine.title')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{t('routine.subtitle')}</p>
      </div>
      <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={28} style={{ color: 'var(--green)' }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('routine.locked')}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 320, margin: '0 auto 24px', lineHeight: 1.6 }}>
          {t('routine.lockedDesc')}
        </p>
        <Link to="/payments" style={{ display: 'inline-block', background: 'var(--green)', color: '#fff', padding: '11px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
          {t('routine.upgrade')}
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Hero banner ── */}
      <div style={{
        background: 'linear-gradient(130deg,var(--green-dark) 0%,var(--green) 55%,var(--green-mid) 100%)',
        borderRadius: 'var(--radius-lg)', padding: '24px 24px 20px',
        boxShadow: '0 4px 24px rgba(27,94,59,.22)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .6 }}>
              {fmtDate(TODAY)}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -.3 }}>{t('routine.title')}</div>
            <div style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>
              {completedTasks}/{totalTasks} {t('routine.tasks')}
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 14, width: 180 }}>
              <div style={{ height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 99, transition: 'width .4s ease' }} />
              </div>
            </div>

            {/* Streak */}
            {streak > 0 && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', borderRadius: 20, padding: '5px 12px', width: 'fit-content' }}>
                <Flame size={14} color="#FCD34D" fill="#FCD34D" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  {streak} {t('routine.streak')}
                </span>
              </div>
            )}
          </div>

          {/* Ring */}
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <Ring pct={pct} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pct}%</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,.6)', marginTop: 2, textTransform: 'uppercase', letterSpacing: .4 }}>done</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── All done celebration ── */}
      {allDone && (
        <div style={{ background: 'linear-gradient(135deg,var(--gold-light),#FDE68A)', border: '1px solid #FCD34D', borderRadius: 'var(--radius)', padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ fontSize: 32 }}>🏆</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#78350F' }}>{t('routine.allDone')}</div>
            <div style={{ fontSize: 13, color: '#92400E', marginTop: 2 }}>{t('routine.allDoneDesc')}</div>
          </div>
        </div>
      )}

      {/* ── Task groups ── */}
      {CATEGORIES.map(cat => {
        const catTasks = tasks.filter(tk => tk.category === cat.key);
        const catDone  = catTasks.filter(tk => tk.completed).length;
        const catTotal = catTasks.length;
        const catAllDone = catDone === catTotal;

        return (
          <div key={cat.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {/* Category header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t(cat.tKey)}
                </span>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: catAllDone ? 'var(--green-light)' : 'var(--border-light)',
                color: catAllDone ? 'var(--green)' : 'var(--muted)',
              }}>
                {catDone}/{catTotal}
              </span>
            </div>

            {/* Tasks */}
            <div style={{ padding: '0 18px' }}>
              {catTasks.map((task, i) => (
                <div key={`${task.category}|${task.taskKey}`} style={{ borderBottom: i === catTasks.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <TaskRow task={task} onToggle={toggleTask} toggling={toggling} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Refresh / reload ── */}
      <button
        onClick={() => { setLoading(true); load(); }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 18px', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: 'fit-content', margin: '0 auto' }}
      >
        <RotateCcw size={14} /> Refresh
      </button>
    </div>
  );
}
