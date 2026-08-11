import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progressApi } from '../lib/api.js';
import {
  TrendingUp, CheckCircle, Clock, Loader, Award,
  BookOpen, Play, Calendar, Flame, ChevronRight
} from 'lucide-react';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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

function StatCard({ icon: Icon, label, value, color, bg, delay = 0 }) {
  return (
    <div className="card-lift fade-up" style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '18px 16px', animationDelay: `${delay}ms`,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: -.5 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Progress() {
  const [items, setItems]   = useState([]);   // raw progress array from API
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressApi.get()
      .then(d => {
        // API returns { progress: [...] }
        const arr = Array.isArray(d) ? d : (d?.progress ?? []);
        setItems(arr);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Derived stats ──────────────────────────────────────────────────────────
  const total       = items.length;
  const completed   = items.filter(i => i.completed).length;
  const inProgress  = items.filter(i => !i.completed && i.watchedPercent > 0).length;
  const avgPct      = total > 0
    ? Math.round(items.reduce((s, i) => s + (i.watchedPercent ?? 0), 0) / total)
    : 0;

  // Group by module group
  const groups = items.reduce((acc, item) => {
    const g = item.module?.group?.name ?? 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  // Sort: in-progress first, then completed, then not started
  const sorted = [...items].sort((a, b) => {
    const score = x => x.completed ? 0 : x.watchedPercent > 0 ? -1 : 1;
    return score(a) - score(b);
  });

  if (total === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)', letterSpacing: -.4 }}>My Progress</div>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Track your learning journey</div>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '60px 20px', textAlign: 'center' }}>
        <TrendingUp size={40} style={{ color: 'var(--muted)', margin: '0 auto 16px', opacity: .4 }} />
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>No progress yet</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>Start watching modules to track your learning journey here</div>
        <Link to="/modules" style={{ background: 'var(--green)', color: '#fff', borderRadius: 20, padding: '10px 24px', fontWeight: 700, fontSize: 14, display: 'inline-block' }}>
          Browse modules
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Hero ── */}
      <div className="fade-up" style={{
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(130deg,var(--green-dark) 0%,var(--green) 55%,var(--green-mid) 100%)',
        padding: '28px 28px 24px',
        boxShadow: '0 4px 24px rgba(27,94,59,.25)',
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', fontWeight: 500, marginBottom: 4 }}>Overall completion</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -1 }}>{avgPct}%</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>
              {completed} of {total} module{total !== 1 ? 's' : ''} completed
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 14, width: 200, maxWidth: '100%' }}>
              <div style={{ height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${avgPct}%`, background: '#fff', borderRadius: 99, transition: 'width .5s' }} />
              </div>
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 100, height: 100 }}>
              <ProgressRing pct={avgPct} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{avgPct}%</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>done</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <StatCard icon={CheckCircle} label="Completed"   value={completed}  color="var(--green)"  bg="var(--green-light)"  delay={0} />
        <StatCard icon={Play}        label="In progress" value={inProgress}  color="var(--sky)"    bg="var(--sky-light)"    delay={60} />
        <StatCard icon={BookOpen}    label="Total"       value={total}       color="var(--purple)" bg="var(--purple-light)" delay={120} />
      </div>

      {/* ── Module breakdown ── */}
      {Object.entries(groups).map(([groupName, groupItems]) => (
        <div key={groupName} className="fade-up">
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', letterSpacing: -.2, marginBottom: 12 }}>{groupName}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groupItems.map(item => {
              const pct     = item.watchedPercent ?? 0;
              const done    = item.completed;
              const started = pct > 0;
              const color   = done ? 'var(--green)' : started ? 'var(--sky)' : 'var(--muted)';
              const bg      = done ? 'var(--green-light)' : started ? 'var(--sky-light)' : 'var(--border-light)';

              return (
                <Link key={item.id} to={`/modules/${item.moduleId}`}
                  className="card-lift"
                  style={{ display: 'flex', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
                  {/* Status icon */}
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {done
                      ? <CheckCircle size={20} style={{ color: 'var(--green)' }} />
                      : started
                        ? <Play size={18} fill="var(--sky)" color="var(--sky)" />
                        : <BookOpen size={18} style={{ color: 'var(--muted)' }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.module?.title ?? `Module ${item.moduleId?.slice(-4)}`}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>{pct}%</div>
                    </div>

                    <ProgressBar value={pct} color={color} height={6} />

                    <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                      {done && item.completedAt && (
                        <span style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                          <Award size={11} /> Completed {fmt(item.completedAt)}
                        </span>
                      )}
                      {!done && started && item.lastWatchedAt && (
                        <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} /> Last watched {fmt(item.lastWatchedAt)}
                        </span>
                      )}
                      {!started && (
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Not started yet</span>
                      )}
                      {item.module?.code && (
                        <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--border-light)', borderRadius: 4, padding: '1px 6px' }}>
                          {item.module.code}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={15} style={{ color: 'var(--muted)', opacity: .5, flexShrink: 0, alignSelf: 'center' }} />
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Completed modules celebration ── */}
      {completed > 0 && (
        <div className="fade-up" style={{ background: 'linear-gradient(135deg,var(--gold-light),#FDE68A)', border: '1px solid #FCD34D', borderRadius: 'var(--radius)', padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ fontSize: 32 }}>🏆</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#78350F' }}>
              {completed === 1 ? 'Great job! 1 module completed' : `Amazing! ${completed} modules completed`}
            </div>
            <div style={{ fontSize: 13, color: '#92400E', marginTop: 2 }}>
              Keep going — you're building great habits for your child
            </div>
          </div>
        </div>
      )}

      {/* ── Keep learning CTA ── */}
      {inProgress > 0 && (
        <Link to="/modules" className="card-lift" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px 20px',
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={20} style={{ color: 'var(--green)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Continue learning</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
              {inProgress} module{inProgress !== 1 ? 's' : ''} in progress — pick up where you left off
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--muted)' }} />
        </Link>
      )}

    </div>
  );
}
