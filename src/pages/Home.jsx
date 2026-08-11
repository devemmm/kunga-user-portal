import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { modulesApi, subscriptionsApi, announcementsApi, progressApi, routineApi } from '../lib/api.js';
import { useLang } from '../lib/i18n.jsx';
import {
  BookOpen, TrendingUp, MessageCircle, Star, ChevronRight,
  Bell, X, ArrowRight, Zap, Lock, Play, Award, Sparkles,
  Clock, CheckCircle, Target, CheckSquare, Flame,
} from 'lucide-react';

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
const TODAY = new Date().toISOString().split('T')[0];

function mergeRoutine(apiEntries = []) {
  const map = new Map(apiEntries.map(e => [`${e.category}|${e.taskKey}`, e]));
  return ROUTINE_TASK_KEYS.map(t => ({
    ...t,
    completed: map.get(`${t.category}|${t.taskKey}`)?.completed ?? false,
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const LANG_KEY = { en: 'en', fr: 'fr', kin: 'rw' };
function loc(base, translations, lang) {
  if (!translations || lang === 'en') return base;
  const key = LANG_KEY[lang] ?? lang;
  return translations[key] ?? translations[lang] ?? base;
}

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting.morning';
  if (h < 17) return 'home.greeting.afternoon';
  return 'home.greeting.evening';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 16, r = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,var(--border) 25%,var(--border-light) 50%,var(--border) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
  );
}

// ── Progress ring ─────────────────────────────────────────────────────────────
function ProgressRing({ pct = 0, size = 80, stroke = 7, trackColor = 'rgba(255,255,255,.18)', fillColor = '#fff' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={fillColor} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .8s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

// ── Module card ───────────────────────────────────────────────────────────────
const ACCENT = ['#1B5E3B','#7C3AED','#0EA5E9','#D97706','#E11D48'];

function ModuleCard({ m, index }) {
  const { lang } = useLang();
  const accent = ACCENT[index % ACCENT.length];
  const videos = m.videos?.length ?? m.videoCount ?? 0;
  const title  = loc(m.title, m.titleTranslations, lang);
  return (
    <Link to={`/modules/${m.id}`}
      className="card-lift fade-up"
      style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
        animationDelay: `${index * 55}ms`,
      }}>
      {/* Left accent stripe */}
      <div style={{ width: 4, alignSelf: 'stretch', background: accent, flexShrink: 0 }} />

      {/* Emoji thumb */}
      <div style={{
        width: 54, height: 54, margin: '14px 14px 14px 16px',
        borderRadius: 12, flexShrink: 0,
        background: accent + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        {m.emoji ?? '📚'}
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: '14px 0' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Play size={10} fill="var(--muted)" color="var(--muted)" />
            {videos} video{videos !== 1 ? 's' : ''}
          </span>
          {m.ageRange && (
            <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--border-light)', borderRadius: 4, padding: '1px 6px' }}>
              {m.ageRange}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {m.progressPct != null && m.progressPct > 0 && (
          <div style={{ marginTop: 8, paddingRight: 16 }}>
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${m.progressPct}%`, background: accent, borderRadius: 2, transition: 'width .4s' }} />
            </div>
          </div>
        )}
      </div>

      <ChevronRight size={15} style={{ color: 'var(--muted)', flexShrink: 0, opacity: .5, marginRight: 14 }} />
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const { t } = useLang();
  const isPremium = ['ACTIVE', 'TRIAL', 'active', 'trial'].includes(user?.subscriptionStatus);

  const [modules, setModules]   = useState([]);
  const [announcements, setAnn] = useState([]);
  const [progressItems, setProgressItems] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [routineTasks, setRoutineTasks] = useState(mergeRoutine([]));
  const [routineStreak, setRoutineStreak] = useState(0);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      modulesApi.list({ limit: 5 })
        .then(d => setModules(Array.isArray(d) ? d.slice(0,5) : (d?.modules ?? []).slice(0,5)))
        .catch(() => {}),
      announcementsApi.getActive()
        .then(d => setAnn(Array.isArray(d) ? d : (d?.announcements ?? [])))
        .catch(() => {}),
      progressApi.get()
        .then(d => {
          const arr = Array.isArray(d) ? d : (d?.progress ?? []);
          setProgressItems(arr);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  // Fetch today's routine separately (premium only)
  useEffect(() => {
    if (!isPremium) return;
    routineApi.getDate(TODAY)
      .then(d => setRoutineTasks(mergeRoutine(d?.entries ?? [])))
      .catch(() => {});
    routineApi.streak()
      .then(d => setRoutineStreak(d?.streak ?? 0))
      .catch(() => {});
  }, [isPremium]);

  const toggleRoutineTask = async (task) => {
    const key = `${task.category}|${task.taskKey}`;
    const newCompleted = !task.completed;
    setRoutineTasks(prev => prev.map(t =>
      t.category === task.category && t.taskKey === task.taskKey ? { ...t, completed: newCompleted } : t
    ));
    setToggling(key);
    try {
      await routineApi.toggle(TODAY, task.category, task.taskKey, newCompleted);
    } catch {
      setRoutineTasks(prev => prev.map(t =>
        t.category === task.category && t.taskKey === task.taskKey ? { ...t, completed: task.completed } : t
      ));
    } finally { setToggling(null); }
  };

  const firstName    = user?.name?.split(' ')[0] ?? 'there';
  const totalModules = progressItems.length;
  const completed    = progressItems.filter(i => i.completed).length;
  const inProgress   = progressItems.filter(i => !i.completed && (i.watchedPercent ?? 0) > 0).length;
  const avgPct       = totalModules > 0
    ? Math.round(progressItems.reduce((s, i) => s + (i.watchedPercent ?? 0), 0) / totalModules)
    : 0;

  // Most recent in-progress module
  const spotlight = progressItems
    .filter(i => !i.completed && (i.watchedPercent ?? 0) > 0)
    .sort((a, b) => new Date(b.lastWatchedAt ?? 0) - new Date(a.lastWatchedAt ?? 0))[0] ?? null;

  const dismissAnn = id => announcementsApi.dismiss(id)
    .then(() => setAnn(a => a.filter(x => x.id !== id))).catch(() => {});

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 20, padding: 28, border: '1px solid var(--border)' }}>
        <Skeleton w={120} h={13} r={6} />
        <div style={{ marginTop: 10 }}><Skeleton w={220} h={30} r={8} /></div>
        <div style={{ marginTop: 8 }}><Skeleton w={180} h={13} r={6} /></div>
        <div style={{ marginTop: 20 }}><Skeleton w={140} h={36} r={20} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ background: 'var(--surface)', padding: '18px 16px' }}>
            <Skeleton h={22} w={50} r={6} />
            <div style={{ marginTop: 6 }}><Skeleton h={11} w={70} r={4} /></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <Skeleton w={54} h={54} r={12} />
            <div style={{ flex: 1 }}>
              <Skeleton h={14} r={6} />
              <div style={{ marginTop: 6 }}><Skeleton h={10} w={80} r={4} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* ── Announcements ── */}
      {announcements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {announcements.map((ann, i) => (
            <div key={ann.id} className="fade-up" style={{
              background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12,
              padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
              animationDelay: `${i * 50}ms`,
            }}>
              <Bell size={15} style={{ color: '#D97706', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#78350F' }}>{ann.title}</div>
                {ann.body && <div style={{ fontSize: 12, color: '#92400E', marginTop: 2, lineHeight: 1.5 }}>{ann.body}</div>}
              </div>
              <button onClick={() => dismissAnn(ann.id)}
                style={{ background: 'none', border: 'none', color: '#D97706', padding: '2px 4px', borderRadius: 4, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Hero ── */}
      <div className="fade-up" style={{
        borderRadius: 20, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg,#0D3D22 0%,#1B5E3B 50%,#2D7A52 100%)',
        padding: '28px 24px 26px',
        boxShadow: '0 8px 32px rgba(13,61,34,.28)',
      }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:-50, right:-30, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:80, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.03)', pointerEvents:'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          {/* Left: greeting */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 6 }}>
              {t(greetingKey())}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -.6, lineHeight: 1.1 }}>
              {firstName} 👋
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 8, lineHeight: 1.55 }}>
              {avgPct > 0
                ? `${avgPct}% — ${t('home.subtitle.premium')}`
                : t('home.subtitle.free')}
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              <Link to="/modules" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#fff', color: '#1B5E3B',
                borderRadius: 20, padding: '9px 18px',
                fontWeight: 700, fontSize: 13,
                boxShadow: '0 2px 12px rgba(0,0,0,.18)',
              }}>
                <BookOpen size={13} /> {t('nav.modules')}
              </Link>
              {isPremium && (
                <Link to="/ask-gad" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,.12)', color: '#fff',
                  borderRadius: 20, padding: '9px 16px',
                  fontWeight: 600, fontSize: 13,
                  border: '1px solid rgba(255,255,255,.22)',
                }}>
                  <MessageCircle size={13} /> {t('nav.askGad')}
                </Link>
              )}
            </div>
          </div>

          {/* Right: progress ring */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <ProgressRing pct={avgPct} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{avgPct}%</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.55)', marginTop: 2, fontWeight: 600, letterSpacing: .3 }}>DONE</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>Overall</div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="fade-up" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
        animationDelay: '60ms',
      }}>
        {[
          { icon: CheckCircle, label: t('home.stat.completed'),  value: completed,   color: 'var(--green)',  bg: 'var(--green-light)' },
          { icon: Clock,       label: t('home.stat.inProgress'), value: inProgress,  color: 'var(--sky)',    bg: 'var(--sky-light)' },
          { icon: Target,      label: t('home.stat.total'),      value: totalModules || modules.length, color: 'var(--purple)', bg: 'var(--purple-light)' },
        ].map(({ icon: Icon, label, value, color, bg }, i) => (
          <div key={i} style={{
            padding: '18px 14px',
            borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -.5, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Today's Routine widget ── */}
      <div className="fade-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={15} style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{t('routine.title')}</div>
              {isPremium && routineStreak > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green)', fontWeight: 600, marginTop: 1 }}>
                  <Flame size={11} fill="currentColor" /> {routineStreak} {t('routine.streak')}
                </div>
              )}
            </div>
          </div>
          <Link to="/routine" style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 3 }}>
            {t('home.viewAll')} <ChevronRight size={13} />
          </Link>
        </div>

        {isPremium ? (
          <div style={{ padding: '10px 18px' }}>
            {/* Progress bar */}
            {(() => {
              const done  = routineTasks.filter(t => t.completed).length;
              const total = routineTasks.length;
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{done}/{total} {t('routine.tasks')}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 99, transition: 'width .4s ease' }} />
                  </div>
                </div>
              );
            })()}

            {/* Show first 5 tasks inline */}
            {routineTasks.slice(0, 5).map((task, i) => {
              const key = `${task.category}|${task.taskKey}`;
              const isToggling = toggling === key;
              return (
                <button key={key}
                  onClick={() => toggleRoutineTask(task)}
                  disabled={isToggling}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 0', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                    opacity: isToggling ? .6 : 1, textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: task.completed ? 'var(--green)' : 'var(--surface)',
                    border: task.completed ? 'none' : '2px solid var(--border)',
                    transition: 'all .2s',
                  }}>
                    {task.completed && <CheckCircle size={13} color="#fff" strokeWidth={2.5} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: task.completed ? 'var(--muted)' : 'var(--text)', textDecoration: task.completed ? 'line-through' : 'none', flex: 1 }}>
                    {t(`routine.task.${task.taskKey}`)}
                  </span>
                </button>
              );
            })}

            {routineTasks.length > 5 && (
              <Link to="/routine" style={{ display: 'block', textAlign: 'center', padding: '10px 0 4px', fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>
                +{routineTasks.length - 5} more tasks →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={18} style={{ color: 'var(--muted)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{t('routine.locked')}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t('routine.lockedDesc')}</div>
            </div>
            <Link to="/payments" style={{ background: 'var(--green)', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {t('routine.upgrade')}
            </Link>
          </div>
        )}
      </div>

      {/* ── Continue where you left off ── */}
      {spotlight && (
        <Link to={`/modules/${spotlight.moduleId}`} className="card-lift fade-up" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '16px 18px',
          animationDelay: '100ms',
        }}>
          {/* Play button */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg,var(--green-dark),var(--green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(27,94,59,.35)',
          }}>
            <Play size={20} fill="#fff" color="#fff" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 3 }}>
              {t('home.continueWatching')}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {spotlight.module?.title ?? 'Last module'}
            </div>
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
                <div style={{ height: '100%', width: `${spotlight.watchedPercent ?? 0}%`, background: 'var(--green)', borderRadius: 2, transition: 'width .5s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{t('progress.watchedPct', { pct: spotlight.watchedPercent ?? 0 })}</div>
            </div>
          </div>

          <ChevronRight size={17} style={{ color: 'var(--green)', flexShrink: 0 }} />
        </Link>
      )}

      {/* ── Upgrade banner (free users only) ── */}
      {!isPremium && (
        <div className="fade-up" style={{ animationDelay: '80ms' }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#6D28D9,#7C3AED)',
            borderRadius: '16px 16px 0 0', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{t('home.premium.unlock')}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.72)' }}>{t('home.premium.desc')}</div>
            </div>
          </div>

          {/* Two payment options */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            border: '1px solid var(--border)', borderTop: 'none',
            borderRadius: '0 0 16px 16px', overflow: 'hidden',
          }}>
            {/* Online */}
            <Link to="/profile" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '16px 12px', textDecoration: 'none',
              background: 'var(--surface)', borderRight: '1px solid var(--border)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: '#ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Star size={16} color="#7C3AED" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', textAlign: 'center' }}>{t('sub.bankCta').split('→')[0].trim()}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.4 }}>{t('sub.downloadApp').split('.')[0]}</div>
            </Link>

            {/* Bank transfer */}
            <Link to="/manual-payment" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '16px 12px', textDecoration: 'none',
              background: 'var(--surface)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: '#d1fae5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowRight size={16} color="#059669" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', textAlign: 'center' }}>{t('payments.submitReceipt')}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.4 }}>{t('sub.cantPay')}</div>
            </Link>
          </div>
        </div>
      )}

      {/* ── Learning modules ── */}
      <div className="fade-up" style={{ animationDelay: '120ms' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: -.3 }}>{t('home.modules')}</div>
          </div>
          <Link to="/modules" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>
            {t('home.viewAll')} <ArrowRight size={13} />
          </Link>
        </div>

        {modules.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
            <BookOpen size={30} style={{ color: 'var(--muted)', margin: '0 auto 10px', opacity: .4 }} />
            <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>No modules yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {modules.map((m, i) => <ModuleCard key={m.id} m={m} index={i} />)}
          </div>
        )}
      </div>

      {/* ── Bottom quick actions ── */}
      <div className="fade-up" style={{ animationDelay: '160ms' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: -.3, marginBottom: 12 }}>{t('home.stat.total')} {t('nav.modules')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          <Link to="/progress" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px',
            transition: 'box-shadow .15s, transform .15s',
          }}
            className="card-lift">
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={18} style={{ color: 'var(--purple)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t('nav.progress')}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{t('progress.subtitle')}</div>
            </div>
          </Link>

          <Link to="/ask-gad" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: isPremium ? 'var(--surface)' : 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14, padding: '16px',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow .15s, transform .15s',
            opacity: isPremium ? 1 : .65,
          }}
            className="card-lift">
            {!isPremium && (
              <div style={{ position: 'absolute', top: 8, right: 10 }}>
                <Lock size={11} style={{ color: 'var(--muted)' }} />
              </div>
            )}
            <div style={{ width: 40, height: 40, borderRadius: 11, background: isPremium ? 'var(--sky-light)' : 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageCircle size={18} style={{ color: isPremium ? 'var(--sky)' : 'var(--muted)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t('nav.askGad')}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{isPremium ? t('home.askGad.sub') : t('home.askGad.locked')}</div>
            </div>
          </Link>

        </div>
      </div>

      {/* ── Premium badge (premium users) ── */}
      {isPremium && (
        <div className="fade-up" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
          border: '1px solid #FCD34D',
          borderRadius: 14, padding: '14px 18px',
          animationDelay: '180ms',
        }}>
          <div style={{ fontSize: 26 }}>⭐</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#78350F' }}>{t('home.premium.badge')}</div>
            <div style={{ fontSize: 12, color: '#92400E', marginTop: 1 }}>{t('home.premium.desc')}</div>
          </div>
          <Star size={16} fill="#D97706" color="#D97706" />
        </div>
      )}

    </div>
  );
}
