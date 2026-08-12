/**
 * DailyRoutineModal
 *
 * Shown once per session for premium users when they log in.
 * Tracks today's routine tasks. When all are checked → auto-redirects to home.
 * "Do it later" dismisses for the session.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { routineApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import { CheckCircle, X, Flame, ChevronRight, Loader } from 'lucide-react';

// ── Task catalogue (mirrors TodaysRoutine.jsx) ────────────────────────────────
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
  { key: 'morning',   emoji: '🌅', label: 'Morning' },
  { key: 'afternoon', emoji: '☀️', label: 'Afternoon' },
  { key: 'evening',   emoji: '🌙', label: 'Evening' },
];

const TODAY = new Date().toISOString().split('T')[0];
const SESSION_KEY = `kb_routine_modal_${TODAY}`;

function mergeWithTemplate(apiEntries = []) {
  const map = new Map(apiEntries.map(e => [`${e.category}|${e.taskKey}`, e]));
  return ROUTINE_TASK_KEYS.map(t => ({
    ...t,
    completed:   map.get(`${t.category}|${t.taskKey}`)?.completed ?? false,
    completedAt: map.get(`${t.category}|${t.taskKey}`)?.completedAt ?? null,
  }));
}

// ── Progress ring ─────────────────────────────────────────────────────────────
function Ring({ pct = 0, size = 64, stroke = 6 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#fff" strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .45s ease' }} />
    </svg>
  );
}

export default function DailyRoutineModal() {
  const { user } = useAuth();
  const { t }    = useLang();
  const navigate = useNavigate();

  const isPremium = ['ACTIVE', 'TRIAL', 'active', 'trial'].includes(user?.subscriptionStatus);

  const [visible,  setVisible]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [tasks,    setTasks]    = useState(mergeWithTemplate([]));
  const [streak,   setStreak]   = useState(0);
  const [toggling, setToggling] = useState(null);
  const [closing,  setClosing]  = useState(false);
  const didInit = useRef(false);

  // Decide whether to show
  useEffect(() => {
    if (!isPremium || !user) return;
    if (didInit.current) return;
    didInit.current = true;

    if (sessionStorage.getItem(SESSION_KEY)) return; // already dismissed this session

    Promise.all([
      routineApi.getDate(TODAY),
      routineApi.streak().catch(() => ({ streak: 0 })),
    ]).then(([data, streakData]) => {
      const merged = mergeWithTemplate(data?.entries ?? []);
      setTasks(merged);
      setStreak(streakData?.streak ?? 0);

      const allDone = merged.every(t => t.completed);
      if (!allDone) {
        // Only show if not already fully completed for today
        setVisible(true);
      } else {
        sessionStorage.setItem(SESSION_KEY, 'done');
      }
    }).catch(() => {
      // silently fail — don't block the app
    }).finally(() => setLoading(false));
  }, [isPremium, user]);

  // Auto-close with redirect when all tasks done
  useEffect(() => {
    if (!visible || loading) return;
    const allDone = tasks.length > 0 && tasks.every(t => t.completed);
    if (allDone) {
      // Short celebration delay then close & go home
      setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, 'done');
        setClosing(true);
        setTimeout(() => {
          setVisible(false);
          navigate('/');
        }, 400);
      }, 1200);
    }
  }, [tasks, visible, loading, navigate]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, 'later');
    setClosing(true);
    setTimeout(() => setVisible(false), 300);
  };

  const toggleTask = async (task) => {
    const key = `${task.category}|${task.taskKey}`;
    const newCompleted = !task.completed;
    setTasks(prev => prev.map(t =>
      t.category === task.category && t.taskKey === task.taskKey
        ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null }
        : t
    ));
    setToggling(key);
    try {
      await routineApi.toggle(TODAY, task.category, task.taskKey, newCompleted);
    } catch {
      setTasks(prev => prev.map(t =>
        t.category === task.category && t.taskKey === task.taskKey
          ? { ...t, completed: task.completed, completedAt: task.completedAt }
          : t
      ));
    } finally {
      setToggling(null);
    }
  };

  if (!visible) return null;

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount     = tasks.length;
  const pct            = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone        = completedCount === totalCount && totalCount > 0;

  return (
    <>
      <style>{`
        @keyframes routineIn  { from { opacity:0; transform:translateY(32px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes routineOut { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(24px) scale(.97); } }
        @keyframes spin        { to { transform:rotate(360deg); } }
        @keyframes celebrate   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        .routine-task-row:hover { background: var(--green-light,#f0fdf4) !important; }
      `}</style>

      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 0 0',
      }} onClick={dismiss}>

        {/* Sheet */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg)', width: '100%', maxWidth: 560,
            borderRadius: '24px 24px 0 0',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 -8px 48px rgba(0,0,0,.25)',
            animation: `${closing ? 'routineOut' : 'routineIn'} .32s cubic-bezier(.34,1.1,.64,1) both`,
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(130deg,#0D3D22 0%,#1B5E3B 55%,#2D7A52 100%)',
            borderRadius: '24px 24px 0 0', padding: '22px 20px 18px',
            position: 'relative', overflow: 'hidden', flexShrink: 0,
          }}>
            {/* Decorative blob */}
            <div style={{ position:'absolute', top:-30, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase', marginBottom: 4 }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -.3 }}>
                  {"Today's Routine"}
                </div>
                <div style={{ marginTop: 5, fontSize: 13, color: 'rgba(255,255,255,.75)' }}>
                  {completedCount}/{totalCount} tasks complete
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 12, width: 160 }}>
                  <div style={{ height: 5, background: 'rgba(255,255,255,.18)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 99, transition: 'width .4s ease' }} />
                  </div>
                </div>

                {streak > 0 && (
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.14)', borderRadius: 20, padding: '4px 10px' }}>
                    <Flame size={13} color="#FCD34D" fill="#FCD34D" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{streak} day streak</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <Ring pct={pct} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pct}%</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,.55)', marginTop: 1, textTransform: 'uppercase', letterSpacing: .3 }}>done</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dismiss X */}
            <button onClick={dismiss} style={{
              position: 'absolute', top: 14, right: 14, zIndex: 2,
              background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%',
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer', fontSize: 14,
            }}>
              <X size={14} />
            </button>
          </div>

          {/* ── All-done celebration ──────────────────────────────────────── */}
          {allDone && (
            <div style={{
              margin: '14px 16px 0', padding: '14px 18px',
              background: 'linear-gradient(135deg,#FEF9C3,#FEF08A)',
              border: '1px solid #FCD34D', borderRadius: 16,
              display: 'flex', alignItems: 'center', gap: 12,
              animation: 'celebrate .5s ease both',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 28 }}>🏆</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#78350F' }}>All done for today!</div>
                <div style={{ fontSize: 12.5, color: '#92400E', marginTop: 2 }}>Amazing — redirecting you home…</div>
              </div>
            </div>
          )}

          {/* ── Loading ───────────────────────────────────────────────────── */}
          {loading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <Loader size={26} style={{ color: 'var(--green)', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* ── Task list ─────────────────────────────────────────────────── */}
          {!loading && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 8px' }}>
              {CATEGORIES.map(cat => {
                const catTasks = tasks.filter(tk => tk.category === cat.key);
                const catDone  = catTasks.filter(t => t.completed).length;
                const catTotal = catTasks.length;

                return (
                  <div key={cat.key} style={{ marginBottom: 14 }}>
                    {/* Category label */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, padding: '0 4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', letterSpacing: .8, textTransform: 'uppercase' }}>{cat.label}</span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                        background: catDone === catTotal ? 'var(--green-light,#f0fdf4)' : 'var(--border)',
                        color: catDone === catTotal ? 'var(--green)' : 'var(--muted)',
                      }}>{catDone}/{catTotal}</span>
                    </div>

                    {/* Task rows */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                      {catTasks.map((task, i) => {
                        const key       = `${task.category}|${task.taskKey}`;
                        const isToggle  = toggling === key;
                        const label     = t(`routine.task.${task.taskKey}`) || task.taskKey.replace(/_/g, ' ').replace(/\b\w/g,l=>l.toUpperCase());

                        return (
                          <button
                            key={key}
                            className="routine-task-row"
                            onClick={() => !isToggle && toggleTask(task)}
                            disabled={isToggle}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                              padding: '11px 14px', background: 'none', border: 'none',
                              borderBottom: i < catTasks.length - 1 ? '1px solid var(--border)' : 'none',
                              cursor: isToggle ? 'wait' : 'pointer', textAlign: 'left',
                              opacity: isToggle ? .6 : 1, transition: 'background .12s, opacity .15s',
                            }}
                          >
                            {/* Checkbox */}
                            <div style={{
                              width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: task.completed ? 'none' : '2px solid var(--border)',
                              background: task.completed ? 'var(--green)' : 'var(--bg)',
                              boxShadow: task.completed ? '0 2px 6px rgba(27,94,59,.2)' : 'none',
                              transition: 'all .2s',
                            }}>
                              {task.completed && <CheckCircle size={13} color="#fff" strokeWidth={2.5} />}
                            </div>

                            <span style={{
                              flex: 1, fontSize: 13.5, fontWeight: 500,
                              color: task.completed ? 'var(--muted)' : 'var(--text)',
                              textDecoration: task.completed ? 'line-through' : 'none',
                              transition: 'all .2s',
                            }}>
                              {label}
                            </span>

                            {isToggle && <Loader size={13} style={{ color: 'var(--muted)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          {!loading && (
            <div style={{ padding: '12px 16px 20px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { sessionStorage.setItem(SESSION_KEY, 'later'); setClosing(true); setTimeout(() => { setVisible(false); navigate('/routine'); }, 300); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 14,
                  padding: '13px 20px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                }}
              >
                Open Full Routine <ChevronRight size={16} />
              </button>
              <button onClick={dismiss} style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '8px',
              }}>
                Do it later
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
