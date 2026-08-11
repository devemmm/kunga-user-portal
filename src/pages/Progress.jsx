import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { progressApi, usersApi, milestonesApi, routineApi } from '../lib/api.js';
import { useLang } from '../lib/i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import {
  TrendingUp, CheckCircle, Clock, Loader, Award,
  BookOpen, Play, Flame, ChevronDown, ChevronUp, ChevronRight,
  Plus, Lock, Star,
} from 'lucide-react';

// ── Streak badge config ───────────────────────────────────────────────────────
const STREAK_BADGES = [
  { days: 7,   emoji: '🔥', color: '#f59e0b' },
  { days: 14,  emoji: '⚡', color: '#8b5cf6' },
  { days: 30,  emoji: '🌟', color: '#ec4899' },
  { days: 100, emoji: '🏆', color: '#16a34a' },
];

function getStreakMsg(streak, t) {
  if (streak >= 100) return t('progress.streakMsg.100');
  if (streak >= 30)  return t('progress.streakMsg.30');
  if (streak >= 14)  return t('progress.streakMsg.14');
  if (streak >= 7)   return t('progress.streakMsg.7');
  if (streak >= 1)   return t('progress.streakMsg.1');
  return t('progress.streakMsg.0');
}

function getNextBadge(streak) {
  return STREAK_BADGES.find(b => b.days > streak) ?? null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtWeek(ymd) {
  if (!ymd) return '';
  const [y, mo, d] = ymd.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ProgressBar({ value, color = 'var(--green)', height = 8 }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div style={{ background: 'var(--border)', borderRadius: 99, height, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .5s ease' }} />
    </div>
  );
}

function ProgressRing({ pct = 0, size = 100, stroke = 8, color = '#fff' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .6s ease' }} />
    </svg>
  );
}

// ── Streak Card ───────────────────────────────────────────────────────────────
function StreakCard({ streak = 0 }) {
  const { t } = useLang();
  const nextBadge    = getNextBadge(streak);
  const nextBadgePct = nextBadge ? Math.min(100, (streak / nextBadge.days) * 100) : 100;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px',
    }}>
      {/* Top row: flame + count + Active pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 32 }}>🔥</span>
        <span style={{ fontSize: 44, fontWeight: 900, color: 'var(--green)', lineHeight: 1, letterSpacing: -2 }}>{streak}</span>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            Active
          </span>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18, marginLeft: 2 }}>day in a row</div>

      {/* Next badge progress */}
      {nextBadge && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
              {nextBadge.days - streak} more days to earn {nextBadge.emoji} {nextBadge.days} days badge
            </span>
            <span style={{ fontSize: 12, color: nextBadge.color, fontWeight: 700 }}>
              {Math.round(nextBadgePct)}%
            </span>
          </div>
          <div style={{ height: 7, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${nextBadgePct}%`, height: '100%', background: nextBadge.color, borderRadius: 99, transition: 'width .6s ease' }} />
          </div>
        </div>
      )}

      {/* Badge row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {STREAK_BADGES.map(b => {
          const earned = streak >= b.days;
          return (
            <div key={b.days} style={{
              borderRadius: 12, border: `1.5px solid ${earned ? b.color + '60' : 'var(--border)'}`,
              background: earned ? b.color + '15' : 'var(--bg)',
              padding: '10px 8px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, opacity: earned ? 1 : 0.45,
            }}>
              <span style={{ fontSize: 22 }}>{earned ? b.emoji : '🔒'}</span>
              <span style={{ fontSize: 11, color: earned ? b.color : 'var(--muted)', fontWeight: 700 }}>{b.days} days</span>
            </div>
          );
        })}
      </div>

      {/* Motivational message */}
      <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
        {getStreakMsg(streak, t)}
      </div>
    </div>
  );
}

// ── This Week Card ────────────────────────────────────────────────────────────
function ThisWeekCard({ weekActivity = [], streak = 0 }) {
  const { t } = useLang();
  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayIdx   = (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun
  const maxActivity = Math.max(...weekActivity, 1);
  const activeDays  = weekActivity.filter(v => v > 0).length;
  const todayTasks  = weekActivity[todayIdx] ?? 0;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '18px 18px 14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{t('progress.thisWeek')}</div>
        <div style={{
          background: 'var(--green-light)', borderRadius: 99, padding: '3px 11px',
          fontSize: 13, fontWeight: 800, color: 'var(--green)',
        }}>
          {activeDays}/7
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        {activeDays} {t('progress.activeDays')}
        {todayTasks > 0 && <> · <span style={{ color: 'var(--text)', fontWeight: 600 }}>{todayTasks}/{todayTasks} {t('progress.tasksToday')}</span></>}
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 8 }}>
        {DAY_LABELS.map((day, i) => {
          const val      = weekActivity[i] ?? 0;
          const isToday  = i === todayIdx;
          const active   = val > 0;
          const barH     = active ? Math.max(12, (val / maxActivity) * 62) : 0;

          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 0 }}>
              {/* task count label above bar */}
              {active && (
                <span style={{ fontSize: 10, fontWeight: 700, color: isToday ? 'var(--green)' : 'var(--muted)', marginBottom: 3 }}>{val}</span>
              )}
              {/* bar */}
              <div style={{
                width: '100%', height: active ? barH : 4,
                background: isToday
                  ? 'var(--green)'
                  : active
                    ? 'rgba(27,143,88,.45)'
                    : 'var(--border)',
                borderRadius: active ? '4px 4px 3px 3px' : 3,
                transition: 'height .4s ease',
              }} />
            </div>
          );
        })}
      </div>

      {/* Day labels */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {DAY_LABELS.map((day, i) => {
          const isToday = i === todayIdx;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* today underline */}
              <div style={{
                height: 2, width: '60%', borderRadius: 99,
                background: isToday ? 'var(--green)' : 'transparent',
              }} />
              <span style={{
                fontSize: 10, fontWeight: isToday ? 800 : 400,
                color: isToday ? 'var(--green)' : 'var(--muted)',
              }}>{day}</span>
              {/* today dot */}
              {isToday && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }} />}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        {[
          { dot: 'var(--green)', label: 'Today' },
          { dot: 'rgba(27,143,88,.45)', label: 'Active day' },
          { dot: 'var(--border)', label: 'No activity' },
        ].map(({ dot, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Module item ───────────────────────────────────────────────────────────────
function ModuleItem({ item }) {
  const { t } = useLang();
  const pct   = item.watchedPercent ?? item.completionPct ?? 0;
  const done  = item.completed;
  const color = done ? 'var(--green)' : 'var(--sky)';
  const bg    = done ? 'var(--green-light)' : 'var(--sky-light)';

  return (
    <Link to={`/modules/${item.moduleId ?? item.id}`}
      style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {done
          ? <CheckCircle size={18} style={{ color: 'var(--green)' }} />
          : <Play size={16} fill="var(--sky)" color="var(--sky)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.module?.title ?? item.title ?? `Module ${(item.moduleId ?? item.id)?.slice(-4)}`}
        </div>
        <ProgressBar value={pct} color={color} height={5} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{pct}%</span>
    </Link>
  );
}

// ── Milestone Report Card ─────────────────────────────────────────────────────
const METRIC_KEYS = [
  { key: 'responseName', emoji: '👂', color: '#3b82f6' },
  { key: 'eyeContact',   emoji: '👁️', color: '#8b5cf6' },
  { key: 'sitting',      emoji: '🪑', color: '#f59e0b' },
  { key: 'sounds',       emoji: '🗣️', color: '#10b981' },
  { key: 'calmness',     emoji: '😊', color: '#f43f5e' },
];

function MilestoneCard({ report }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);

  const rated = METRIC_KEYS.filter(m => (report[m.key] ?? 0) > 0);
  const avg = rated.length > 0
    ? (rated.reduce((s, m) => s + report[m.key], 0) / rated.length).toFixed(1)
    : null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--gold-light,#fffbeb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
          🏆
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{fmtWeek(report.weekStart)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {rated.length} areas rated
            {avg && <span style={{ marginLeft: 8, color: '#f59e0b', fontWeight: 700 }}>★ {avg}/5</span>}
          </div>
        </div>
        {expanded ? <ChevronUp size={15} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--muted)' }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 12 }}>
            {METRIC_KEYS.map(m => {
              const val = report[m.key] ?? 0;
              if (!val) return null;
              return (
                <div key={m.key} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: m.color + '15', border: `1px solid ${m.color}40`,
                  borderRadius: 8, padding: '5px 10px', fontSize: 12,
                }}>
                  <span>{m.emoji}</span>
                  <span style={{ color: m.color, fontWeight: 700 }}>{val}/5</span>
                </div>
              );
            })}
          </div>
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Progress() {
  const { t }    = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isPremium = ['ACTIVE', 'TRIAL', 'active', 'trial'].includes(user?.subscriptionStatus);

  const [items,       setItems]       = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [weekActivity,setWeekActivity]= useState([0,0,0,0,0,0,0]);
  const [reports,     setReports]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modulesOpen, setModulesOpen] = useState(false);

  const load = useCallback(async () => {
    const TODAY = new Date().toISOString().slice(0, 10);
    // todayIdx in Mon-indexed display: 0=Mon…6=Sun
    const todayDayIdx = (new Date().getDay() + 6) % 7;

    try {
      const [progressRes, summaryRes, streakRes, milestonesRes, todayRoutineRes] = await Promise.allSettled([
        progressApi.get(),
        usersApi.getProgressSummary().catch(() => null),
        routineApi.streak().catch(() => null),
        milestonesApi.list().catch(() => null),
        routineApi.getDate(TODAY).catch(() => null),
      ]);

      if (progressRes.status === 'fulfilled') {
        const arr = Array.isArray(progressRes.value)
          ? progressRes.value
          : (progressRes.value?.progress ?? []);
        setItems(arr);
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        setSummary(summaryRes.value);
      }

      // Week activity: prefer summary, fall back to streak endpoint
      const streakData = streakRes.status === 'fulfilled' ? streakRes.value : null;
      const wa = (summaryRes.value?.weekActivity ?? streakData?.weekActivity ?? null);
      const waArr = wa ? [...wa] : [0,0,0,0,0,0,0];

      // Patch today's slot with the actual count from today's routine endpoint
      // so the bar reflects tasks completed right now, not a cached value.
      if (todayRoutineRes.status === 'fulfilled' && todayRoutineRes.value) {
        const todayData = todayRoutineRes.value;
        const tasks = todayData?.tasks ?? todayData?.entries ?? todayData ?? [];
        const completed = Array.isArray(tasks)
          ? tasks.filter(t => t.completed).length
          : Object.values(todayData).filter(v => v === true || v?.completed === true).length;
        waArr[todayDayIdx] = completed;
      }

      setWeekActivity(waArr);

      if (milestonesRes.status === 'fulfilled' && milestonesRes.value) {
        const arr = milestonesRes.value?.reports ?? milestonesRes.value ?? [];
        setReports(Array.isArray(arr) ? arr : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Derived from items
  const total      = items.length;
  const completed  = items.filter(i => i.completed).length;
  const inProgress = items.filter(i => !i.completed && (i.watchedPercent ?? i.completionPct ?? 0) > 0).length;
  const avgPct     = total > 0
    ? Math.round(items.reduce((s, i) => s + (i.watchedPercent ?? i.completionPct ?? 0), 0) / total)
    : 0;

  // Summary values with fallbacks
  const streak          = summary?.streak ?? 0;
  const milestonesCount = summary?.milestonesCount ?? reports.length;
  const todayPct        = summary?.todayRoutinePercent ?? null;
  const totalModules    = summary?.totalModules ?? total;
  const completedModules= summary?.completedModules ?? completed;

  // Completed items for expandable list
  const completedItems = items.filter(i => i.completed);

  // Week active days
  const activeDays = weekActivity.filter(v => v > 0).length;
  const todayTasks = weekActivity[(new Date().getDay() + 6) % 7] ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.3, marginBottom: 3 }}>{t('progress.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t('progress.subtitle')}</p>
        </div>
        {/* today routine badge */}
        {todayPct !== null && (
          <div style={{
            background: 'var(--green-light)', borderRadius: 99, padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--green)',
          }}>
            ✅ {todayPct}% {t('progress.todayRoutine')}
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { emoji: '🔥', label: t('progress.streak'),          value: streak },
          { emoji: '✅', label: t('progress.completedModules'), value: completedModules },
          { emoji: '🏆', label: t('progress.milestonesCount'), value: milestonesCount },
        ].map(({ emoji, label, value }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '14px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Streak card + This Week (premium only) ── */}
      {isPremium ? (
        <>
          <StreakCard streak={streak} />
          <ThisWeekCard weekActivity={weekActivity} streak={streak} />
        </>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={20} style={{ color: 'var(--muted)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{t('progress.streak')} & {t('progress.thisWeek')}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t('routine.lockedDesc')}</div>
          </div>
          <Link to="/payments" style={{ background: 'var(--green)', color: '#fff', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {t('routine.upgrade')}
          </Link>
        </div>
      )}

      {/* ── Hero overall progress ── */}
      <div style={{
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(130deg,var(--green-dark) 0%,var(--green) 55%,var(--green-mid) 100%)',
        padding: '24px 24px 20px',
        boxShadow: '0 4px 24px rgba(27,94,59,.22)',
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', fontWeight: 500, marginBottom: 6 }}>{t('progress.overallProgress')}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -1 }}>{avgPct}%</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 6 }}>
              {completedModules} / {totalModules} {t('progress.modules')} {t('progress.completed')}
            </div>
            <div style={{ marginTop: 12, maxWidth: 200 }}>
              <div style={{ height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${avgPct}%`, background: '#fff', borderRadius: 99, transition: 'width .5s' }} />
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 90, height: 90 }}>
              <ProgressRing pct={avgPct} size={90} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{avgPct}%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>done</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Completed modules (collapsible) ── */}
      {completedItems.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <button
            onClick={() => setModulesOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={18} style={{ color: 'var(--green)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{t('progress.completedModules')}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{completedItems.length} {t('progress.modules')}</div>
            </div>
            {modulesOpen ? <ChevronUp size={16} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
          </button>
          {modulesOpen && (
            <div style={{ padding: '0 16px', borderTop: '1px solid var(--border)' }}>
              {completedItems.map(item => <ModuleItem key={item.id} item={item} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Milestone Reports ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: -.2 }}>
            {t('progress.milestoneReports')}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {reports.length > 0 && (
              <Link to="/milestones" style={{
                fontSize: 12, fontWeight: 700, color: 'var(--green)',
                background: 'var(--green-light)', borderRadius: 20, padding: '5px 12px',
              }}>
                {t('progress.viewAll')}
              </Link>
            )}
            {isPremium && (
              <button
                onClick={() => navigate('/milestones')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'var(--green)', color: '#fff',
                  border: 'none', borderRadius: 20, padding: '5px 12px',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Plus size={12} /> {t('progress.addReport')}
              </button>
            )}
          </div>
        </div>

        {!isPremium ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '24px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{t('milestone.locked')}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{t('milestone.lockedDesc')}</div>
            <Link to="/payments" style={{ background: 'var(--green)', color: '#fff', borderRadius: 20, padding: '9px 24px', fontWeight: 700, fontSize: 13, display: 'inline-block' }}>
              {t('routine.upgrade')}
            </Link>
          </div>
        ) : reports.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '32px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{t('progress.noReports')}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{t('progress.noReportsDesc')}</div>
            <button
              onClick={() => navigate('/milestones')}
              style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 20, padding: '9px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              {t('progress.addReport')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reports.slice(0, 3).map((r, i) => <MilestoneCard key={r.id ?? i} report={r} />)}
            {reports.length > 3 && (
              <Link to="/milestones" style={{
                display: 'block', textAlign: 'center', padding: '12px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700, color: 'var(--green)',
              }}>
                {t('progress.viewAll')} ({reports.length})
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Continue learning CTA ── */}
      {inProgress > 0 && (
        <Link to="/modules" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '14px 18px', textDecoration: 'none',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={18} style={{ color: 'var(--green)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Continue Watching</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
              {inProgress} {t('progress.modules')} {t('progress.inProgress')} — {t('progress.pickUp')}
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
        </Link>
      )}
    </div>
  );
}
