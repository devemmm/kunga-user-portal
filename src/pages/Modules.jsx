import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { modulesApi } from '../lib/api.js';
import { BookOpen, Search, ChevronRight, Loader, Lock } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';

// ── Module group icon ─────────────────────────────────────────────────────────
// Keyword-matched SVG icons — independent of whatever is stored in the DB.
function getIconConfig(title = '') {
  const t = title.toLowerCase();
  if (t.includes('speech') || t.includes('language') || t.includes('commun'))
    return {
      grad: ['#3b82f6','#6366f1'], shadow: '#6366f133',
      svg: (
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '55%', height: '55%' }}>
          <rect x="3" y="4" width="16" height="13" rx="4" fill="white" fillOpacity=".95"/>
          <path d="M5 17l-2 4 5-2" fill="white" fillOpacity=".95"/>
          <circle cx="8" cy="10.5" r="1.2" fill="#6366f1"/>
          <circle cx="11" cy="10.5" r="1.2" fill="#6366f1"/>
          <circle cx="14" cy="10.5" r="1.2" fill="#6366f1"/>
          <path d="M18 9h4a2 2 0 012 2v5a2 2 0 01-2 2h-1l2 3-4-3h-1a2 2 0 01-2-2v-1" stroke="white" strokeWidth="1.4" strokeLinejoin="round" fill="none" opacity=".8"/>
        </svg>
      ),
    };
  if (t.includes('calm') || t.includes('focus') || t.includes('attention') || t.includes('emotion'))
    return {
      grad: ['#8b5cf6','#a855f7'], shadow: '#a855f733',
      svg: (
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '55%', height: '55%' }}>
          <circle cx="14" cy="14" r="9" stroke="white" strokeWidth="1.5" strokeOpacity=".4" fill="none"/>
          <circle cx="14" cy="14" r="5.5" stroke="white" strokeWidth="1.5" strokeOpacity=".7" fill="none"/>
          <circle cx="14" cy="14" r="2.5" fill="white"/>
          <path d="M14 3v3M14 22v3M3 14h3M22 14h3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeOpacity=".55"/>
        </svg>
      ),
    };
  if (t.includes('movement') || t.includes('motor') || t.includes('physical') || t.includes('body'))
    return {
      grad: ['#10b981','#059669'], shadow: '#10b98133',
      svg: (
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '55%', height: '55%' }}>
          <circle cx="14" cy="6" r="2.5" fill="white"/>
          <path d="M14 9v7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 13l-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M14 13l4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M10 16l-2 5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M18 16l2 5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M7 10c1.5-1 4-1.5 7-1.5s5.5.5 7 1.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity=".5" fill="none"/>
        </svg>
      ),
    };
  if (t.includes('social') || t.includes('play') || t.includes('connect') || t.includes('friend'))
    return {
      grad: ['#f59e0b','#f97316'], shadow: '#f59e0b33',
      svg: (
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '55%', height: '55%' }}>
          <circle cx="10" cy="9" r="3.2" fill="white" fillOpacity=".95"/>
          <circle cx="19" cy="9" r="3.2" fill="white" fillOpacity=".7"/>
          <path d="M4 21c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <path d="M19 15c2.8.3 5 2.8 5 5.8" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" strokeOpacity=".7"/>
          <path d="M16 13.5c.9-.3 1.9-.5 3-.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity=".5"/>
        </svg>
      ),
    };
  if (t.includes('sensory') || t.includes('hearing') || t.includes('vision') || t.includes('touch'))
    return {
      grad: ['#ec4899','#db2777'], shadow: '#ec489933',
      svg: (
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '55%', height: '55%' }}>
          <path d="M4 14s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="white" strokeWidth="1.6" fill="white" fillOpacity=".15"/>
          <circle cx="14" cy="14" r="3.5" fill="white"/>
          <circle cx="15.2" cy="12.8" r="1.2" fill="#db2777"/>
        </svg>
      ),
    };
  // default — learning/books
  return {
    grad: ['#16a34a','#15803d'], shadow: '#16a34a33',
    svg: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '55%', height: '55%' }}>
        <rect x="5" y="5" width="12" height="16" rx="2.5" fill="white" fillOpacity=".9"/>
        <rect x="7" y="7" width="8" height="1.5" rx=".75" fill="#16a34a"/>
        <rect x="7" y="10" width="8" height="1.5" rx=".75" fill="#16a34a" opacity=".6"/>
        <rect x="7" y="13" width="5" height="1.5" rx=".75" fill="#16a34a" opacity=".4"/>
        <rect x="15" y="7" width="8" height="14" rx="2.5" fill="white" fillOpacity=".55"/>
        <path d="M5 21h18" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity=".4"/>
      </svg>
    ),
  };
}

function ModuleIcon({ title, isDone, size = 52 }) {
  const cfg = getIconConfig(title);
  const [g1, g2] = isDone ? ['#16a34a', '#15803d'] : cfg.grad;
  return (
    <div style={{
      width: size, height: size, borderRadius: 14, flexShrink: 0,
      background: `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: isDone ? '0 4px 14px #16a34a33' : `0 4px 14px ${cfg.shadow}`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* glass shine */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'48%', background:'rgba(255,255,255,.18)', borderRadius:'14px 14px 0 0', pointerEvents:'none' }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {cfg.svg}
      </div>
    </div>
  );
}

// Map app lang codes → DB translation keys
const LANG_KEY = { en: 'en', fr: 'fr', kin: 'rw' };

// Pick the best available translation; falls back to the base field
function loc(base, translations, lang) {
  if (!translations || lang === 'en') return base;
  const key = LANG_KEY[lang] ?? lang;
  return translations[key] ?? translations[lang] ?? base;
}

const FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed',   label: 'Completed' },
  { key: 'not-started', label: 'Not Started' },
];

export default function Modules() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [smartFilter, setSmartFilter] = useState(null);

  // Smart default: after data loads, pick the best starting tab if no filter is set in URL
  useEffect(() => {
    if (modules.length === 0) return;
    if (searchParams.get('filter')) return; // user already chose a filter
    const hasInProgress = modules.some(m => {
      const pct = m.progressPercent ?? m.watchedPercent ?? 0;
      return !m.isCompleted && !m.completed && pct > 0 && pct < 90;
    });
    if (hasInProgress) { setSmartFilter('in-progress'); return; }
    const hasCompleted = modules.some(m => m.isCompleted || m.completed || (m.progressPercent ?? 0) >= 90);
    if (hasCompleted) { setSmartFilter('not-started'); return; }
    setSmartFilter('all');
  }, [modules]);

  const activeFilter = searchParams.get('filter') ?? smartFilter ?? 'all';

  const isPremium = ['ACTIVE', 'TRIAL', 'active', 'trial'].includes(user?.subscriptionStatus);

  useEffect(() => {
    modulesApi.getGroups()
      .then(d => {
        const grps = Array.isArray(d) ? d : (d?.groups ?? []);
        setGroups(grps);
        // Flatten all modules from groups — these include progressPercent + isCompleted
        const all = grps.flatMap(g => g.modules ?? []);
        setModules(all);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = modules.filter(m => {
    const title = loc(m.title, m.titleTranslations, lang);
    const desc  = loc(m.description, m.descriptionTranslations, lang);
    const matchesSearch = !search
      || title?.toLowerCase().includes(search.toLowerCase())
      || desc?.toLowerCase().includes(search.toLowerCase());

    const pct = m.progressPercent ?? m.watchedPercent ?? 0;
    const isCompleted   = m.isCompleted || m.completed || pct >= 90;
    const isInProgress  = !isCompleted && pct > 0;
    const matchesFilter =
      activeFilter === 'all'         ? true :
      activeFilter === 'completed'   ? isCompleted :
      activeFilter === 'in-progress' ? isInProgress :
      activeFilter === 'not-started' ? (!isCompleted && pct === 0) :
      true;

    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('modules.title')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{t('modules.subtitle')}</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count = modules.filter(m => {
            const pct = m.progressPercent ?? m.watchedPercent ?? 0;
            const isDone = m.isCompleted || m.completed || pct >= 90;
            const isIP   = !isDone && pct > 0;
            if (f.key === 'all')         return true;
            if (f.key === 'completed')   return isDone;
            if (f.key === 'in-progress') return isIP;
            if (f.key === 'not-started') return !isDone && pct === 0;
            return true;
          }).length;
          const active = activeFilter === f.key;
          return (
            <button key={f.key}
              onClick={() => { setSmartFilter(f.key); setSearchParams({ filter: f.key }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all .2s',
                border: active ? '2px solid var(--green)' : '2px solid var(--border)',
                background: active ? 'var(--green)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--ink)',
                boxShadow: active ? '0 2px 10px rgba(22,163,74,.22)' : 'none',
              }}>
              {f.label}
              <span style={{
                fontSize: 11, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 99,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgba(255,255,255,.25)' : 'var(--border)',
                color: active ? '#fff' : 'var(--muted)',
                padding: '0 5px',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('modules.search')}
          style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
          <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: .4 }} />
          <div>{search ? t('modules.emptySearch') : t('modules.empty')}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(m => {
            const locked     = m.requiresSubscription && !isPremium;
            const vCount     = m.videos?.length ?? m.videoCount ?? 0;
            const title      = loc(m.title, m.titleTranslations, lang);
            const desc       = loc(m.description, m.descriptionTranslations, lang);
            const pct        = m.progressPercent ?? m.watchedPercent ?? 0;
            const isDone     = m.isCompleted || m.completed || pct >= 90;
            const isIP       = !isDone && pct > 0;
            return (
              <Link
                key={m.id}
                to={locked ? '/payments' : `/modules/${m.id}`}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 0,
                  background: 'var(--surface)',
                  border: locked ? '1px solid #f59e0b44' : isDone ? '1px solid #bbf7d0' : '1px solid var(--border)',
                  borderRadius: 12, overflow: 'hidden',
                  textDecoration: 'none', transition: 'box-shadow .15s',
                }}
              >
                {/* Premium banner — shown only when locked */}
                {locked && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 16px',
                    background: 'linear-gradient(90deg, #f59e0b11 0%, #f9731611 100%)',
                    borderBottom: '1px solid #f59e0b33',
                  }}>
                    <Lock size={12} style={{ color: '#d97706', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', flex: 1 }}>
                      Premium content — subscribe to access all resources
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#fff',
                      background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                      padding: '2px 10px', borderRadius: 99,
                    }}>Upgrade</span>
                  </div>
                )}

                {/* Main card row */}
                <div style={{ display: 'flex', gap: 14, padding: '14px 16px', alignItems: 'center' }}>
                  {/* Dimmed icon + lock overlay for locked modules */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ opacity: locked ? 0.5 : 1 }}>
                      <ModuleIcon title={m.name ?? m.title ?? ''} isDone={isDone} />
                    </div>
                    {locked && (
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,.18)',
                      }}>
                        <Lock size={18} color="#fff" />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{title}</div>
                    {desc && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{desc}</div>}

                    {/* Progress bar */}
                    {!locked && pct > 0 && (
                      <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: isDone ? '#16a34a' : '#f59e0b', borderRadius: 99, transition: 'width .3s' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {locked ? (
                        <span style={{ fontSize: 12, color: '#d97706', fontWeight: 500 }}>
                          🔒 Subscribe to access this module's resources
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
                          {vCount} {t('modules.videos')}
                        </span>
                      )}
                      {!locked && pct > 0 && !isDone && (
                        <>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>·</span>
                          <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>{pct}% done</span>
                        </>
                      )}
                      {!locked && isDone && (
                        <>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>·</span>
                          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Completed</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: locked ? '#f59e0b' : 'var(--muted)', flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
