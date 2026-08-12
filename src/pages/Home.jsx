import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { modulesApi, subscriptionsApi, announcementsApi, progressApi, routineApi, preferencesApi } from '../lib/api.js';
import { useLang } from '../lib/i18n.jsx';
import {
  BookOpen, TrendingUp, MessageCircle, Star, ChevronRight,
  Bell, X, ArrowRight, Zap, Lock, Play, Award, Sparkles,
  Clock, CheckCircle, Target, CheckSquare, Flame, Download,
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

const FREE_BOOK_URL = "https://api.kungabasics.com/storage/kunga/resources/books/Why%20your%20child%20understand%20but%20doesn%27t%20speak%20by%20Kunga%20Bacis.pdf";
const FREE_BOOK_KEY = 'kunga_free_book_seen';

// ── Free Book Modal ───────────────────────────────────────────────────────────
function FreeBookModal({ onClose, onDownloaded }) {
  const [marking, setMarking] = useState(false);
  const handleDownloaded = async () => {
    setMarking(true);
    try { await preferencesApi.update({ freeBookDownloaded: true }); } catch {}
    onDownloaded();
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: 20,
        maxWidth: 380, width: '100%', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,.35)',
        animation: 'modalIn .25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#0D3D22 0%,#1B5E3B 60%,#2D7A52 100%)',
          padding: '28px 24px 24px', position: 'relative', textAlign: 'center',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: '50%',
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1,
          }}>✕</button>
          <div style={{ fontSize: 52, marginBottom: 10 }}>📖</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,.15)', borderRadius: 99, padding: '4px 12px',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: .5 }}>🎁 FREE RESOURCE</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 800, lineHeight: 1.3, margin: 0 }}>
            Why Your Child Understands But Doesn't Speak
          </h2>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>
            by Dr. Gad · Kunga Basics
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px 24px' }}>
          <p style={{ fontSize: 13.5, color: 'var(--ink2)', lineHeight: 1.65, margin: '0 0 20px' }}>
            This free guide explains the brain science behind why many children understand language perfectly but struggle to express themselves — and what you can do about it at home.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            {['Why speech delay happens', 'The attention-language connection', 'Daily exercises you can start today'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'var(--green)', fontSize: 11 }}>✓</span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{item}</span>
              </div>
            ))}
          </div>

          <a
            href={FREE_BOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            download
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'var(--green)', color: '#fff', borderRadius: 12,
              padding: '13px 20px', fontWeight: 800, fontSize: 15,
              textDecoration: 'none', width: '100%', boxSizing: 'border-box',
            }}
          >
            <Download size={16} /> Download Free Book
          </a>
          <button
            onClick={handleDownloaded}
            disabled={marking}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              width: '100%', marginTop: 10, padding: '11px 20px',
              background: 'var(--green-light,#f0fdf4)', color: 'var(--green)',
              border: '1.5px solid var(--green)', borderRadius: 12,
              fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              opacity: marking ? .6 : 1,
            }}
          >
            <CheckCircle size={15} /> I've already downloaded it
          </button>
          <button onClick={onClose} style={{
            display: 'block', width: '100%', marginTop: 8, padding: '9px',
            background: 'none', border: 'none', color: 'var(--muted)',
            fontSize: 13, cursor: 'pointer',
          }}>
            Maybe later
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(.9) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const { t } = useLang();
  const isPremium = ['ACTIVE', 'TRIAL', 'active', 'trial'].includes(user?.subscriptionStatus);

  const [modules, setModules]         = useState([]);
  const [allModules, setAllModules]   = useState([]);   // all modules with progress, from getGroups
  const [totalModuleCount, setTotalModuleCount] = useState(0);
  const [announcements, setAnn]       = useState([]);
  const [progressItems, setProgressItems] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [routineTasks, setRoutineTasks] = useState(mergeRoutine([]));
  const [routineStreak, setRoutineStreak] = useState(0);
  const [toggling, setToggling] = useState(null);

  // Show the free book modal — hidden permanently once user marks it downloaded (DB),
  // or just for the current session via sessionStorage ("Maybe later").
  const [showBookModal, setShowBookModal] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem(FREE_BOOK_KEY)) return; // dismissed this session
    preferencesApi.get().then(res => {
      if (!res?.preferences?.freeBookDownloaded) setShowBookModal(true);
    }).catch(() => {
      // fallback: show the modal if prefs can't be fetched
      setShowBookModal(true);
    });
  }, []);
  const closeBookModal = () => {
    sessionStorage.setItem(FREE_BOOK_KEY, '1');
    setShowBookModal(false);
  };
  const markBookDownloaded = () => {
    // prefs already saved by the modal's handleDownloaded
    sessionStorage.setItem(FREE_BOOK_KEY, '1');
    setShowBookModal(false);
  };

  useEffect(() => {
    Promise.allSettled([
      modulesApi.list({ limit: 5 })
        .then(d => {
          const all = Array.isArray(d) ? d : (d?.modules ?? []);
          setModules(all.slice(0, 5));
          const total = d?.total ?? d?.count ?? all.length;
          if (total > 0) setTotalModuleCount(total);
        })
        .catch(() => {}),
      // Use getGroups() as the source of truth for progress stats — same as Modules page
      modulesApi.getGroups()
        .then(d => {
          const grps = Array.isArray(d) ? d : (d?.groups ?? []);
          const flat = grps.flatMap(g => g.modules ?? []);
          setAllModules(flat);
          if (flat.length > 0) setTotalModuleCount(flat.length);
        })
        .catch(() => {}),
      announcementsApi.getActive()
        .then(d => setAnn(Array.isArray(d) ? d : (d?.announcements ?? [])))
        .catch(() => {}),
      progressApi.get()
        .then(d => {
          const arr = Array.isArray(d) ? d : (d?.progress ?? []);
          // Deduplicate by moduleId — keep the most-watched entry per module
          const byModule = new Map();
          for (const item of arr) {
            const key = item.moduleId;
            const existing = byModule.get(key);
            if (!existing || (item.watchedPercent ?? 0) > (existing.watchedPercent ?? 0)) {
              byModule.set(key, item);
            }
          }
          setProgressItems(Array.from(byModule.values()));
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

  // Compute stats from getGroups() data — same logic as Modules page filter
  const src = allModules.length > 0 ? allModules : progressItems;
  const totalModules = totalModuleCount || src.length;

  const completedList  = allModules.length > 0
    ? allModules.filter(m => m.isCompleted || m.completed || (m.progressPercent ?? 0) >= 90)
    : progressItems.filter(i => i.completed);
  const inProgressList = allModules.length > 0
    ? allModules.filter(m => {
        const pct = m.progressPercent ?? m.watchedPercent ?? 0;
        const done = m.isCompleted || m.completed || pct >= 90;
        return !done && pct > 0;
      })
    : progressItems.filter(i => !i.completed && (i.watchedPercent ?? 0) > 0);

  const completed  = completedList.length;
  const inProgress = inProgressList.length;

  const watchedSum = (allModules.length > 0 ? allModules : progressItems)
    .reduce((s, m) => s + (m.progressPercent ?? m.watchedPercent ?? 0), 0);
  const avgPct = totalModules > 0 ? Math.round(watchedSum / totalModules) : 0;

  // Most recent in-progress module — from progressItems (has lastWatchedAt)
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

      {/* ── Free Book Modal ── */}
      {showBookModal && <FreeBookModal onClose={closeBookModal} onDownloaded={markBookDownloaded} />}

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
        background: 'var(--surface)', border: '1px solid var(--border)',
        padding: '22px 20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          {/* Left: greeting */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 4 }}>
              {t(greetingKey())}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: -.5, lineHeight: 1.1 }}>
              {firstName} 👋
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
              {avgPct > 0
                ? `${avgPct}% — ${t('home.subtitle.premium')}`
                : t('home.subtitle.free')}
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <Link to="/modules" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--green)', color: '#fff',
                borderRadius: 20, padding: '9px 18px',
                fontWeight: 700, fontSize: 13,
                boxShadow: '0 2px 8px rgba(22,163,74,.25)',
              }}>
                <BookOpen size={13} /> {t('nav.modules')}
              </Link>
              {isPremium && (
                <Link to="/ask-gad" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--surface)', color: 'var(--ink)',
                  borderRadius: 20, padding: '9px 16px',
                  fontWeight: 600, fontSize: 13,
                  border: '1px solid var(--border)',
                }}>
                  <MessageCircle size={13} /> {t('nav.askGad')}
                </Link>
              )}
              <a
                href="https://api.kungabasics.com/storage/kunga/resources/books/Why%20your%20child%20understand%20but%20doesn%27t%20speak%20by%20Kunga%20Bacis.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#dc2626', color: '#fff',
                  borderRadius: 20, padding: '9px 16px',
                  fontWeight: 700, fontSize: 13,
                  border: 'none', textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(220,38,38,.3)',
                }}
              >
                <Download size={13} /> {t('nav.freeBook')}
              </a>
            </div>
          </div>

          {/* Right: progress ring */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ position: 'relative', width: 76, height: 76 }}>
              <ProgressRing pct={avgPct} trackColor='var(--border)' fillColor='var(--green)' />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{avgPct}%</div>
                <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, fontWeight: 600, letterSpacing: .3 }}>DONE</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Overall</div>
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
          { icon: CheckCircle, label: t('home.stat.completed'),  value: completed,   color: 'var(--green)',  bg: 'var(--green-light)',  filter: 'completed' },
          { icon: Clock,       label: t('home.stat.inProgress'), value: inProgress,  color: 'var(--sky)',    bg: 'var(--sky-light)',    filter: 'in-progress' },
          { icon: Target,      label: t('home.stat.total'),      value: totalModuleCount || modules.length, color: 'var(--purple)', bg: 'var(--purple-light)', filter: 'all' },
        ].map(({ icon: Icon, label, value, color, bg, filter }, i) => (
          <Link key={i} to={`/modules?filter=${filter}`} style={{
            padding: '18px 14px',
            borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            textDecoration: 'none', cursor: 'pointer',
            transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover, var(--border))'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -.5, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, fontWeight: 500 }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Smart Learning CTA ── */}
      {(() => {
        // Use progressItems for lastWatchedAt sorting, but validate against allModules truth
        const inProgressModuleIds = new Set(inProgressList.map(m => m.id));
        const inProgressItem = progressItems
          .filter(i => !i.completed && (i.watchedPercent ?? 0) > 0 && (allModules.length === 0 || inProgressModuleIds.has(i.moduleId)))
          .sort((a, b) => new Date(b.lastWatchedAt ?? 0) - new Date(a.lastWatchedAt ?? 0))[0];
        const allDone = totalModules > 0 && completed >= totalModules;

        let to, label, sub, icon, gradient;

        if (allDone) {
          to = '/modules';
          label = '🏆 All done — review modules';
          sub = 'You\'ve completed everything. Great work!';
          gradient = 'linear-gradient(135deg,#16a34a,#15803d)';
          icon = <Award size={18} fill="#fff" color="#fff" />;
        } else if (inProgressItem) {
          to = `/modules/${inProgressItem.moduleId}`;
          label = 'Continue Learning';
          sub = `${inProgressItem.watchedPercent ?? 0}% complete — pick up where you left off`;
          gradient = 'linear-gradient(135deg,#1B5E3B,var(--green))';
          icon = <Play size={18} fill="#fff" color="#fff" />;
        } else {
          // Find first module to start
          const firstModule = modules[0];
          to = firstModule ? `/modules/${firstModule.id}` : '/modules';
          label = 'Start Learning';
          sub = 'Begin your first module now';
          gradient = 'linear-gradient(135deg,#0D3D22,#1B5E3B)';
          icon = <Zap size={18} fill="#fff" color="#fff" />;
        }

        return (
          <Link to={to} className="fade-up" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: gradient,
            borderRadius: 16, padding: '16px 20px',
            textDecoration: 'none',
            boxShadow: '0 6px 24px rgba(13,61,34,.28)',
            animationDelay: '70ms',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 13, flexShrink: 0,
              background: 'rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: -.2 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{sub}</div>
            </div>
            <ChevronRight size={20} style={{ color: 'rgba(255,255,255,.7)', flexShrink: 0 }} />
          </Link>
        );
      })()}

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
