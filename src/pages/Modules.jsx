import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { modulesApi } from '../lib/api.js';
import { BookOpen, Search, ChevronRight, Loader, Lock } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';

// Map app lang codes → DB translation keys
const LANG_KEY = { en: 'en', fr: 'fr', kin: 'rw' };

// Pick the best available translation; falls back to the base field
function loc(base, translations, lang) {
  if (!translations || lang === 'en') return base;
  const key = LANG_KEY[lang] ?? lang;
  return translations[key] ?? translations[lang] ?? base;
}

export default function Modules() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [groups, setGroups] = useState([]);
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isPremium = ['ACTIVE', 'TRIAL', 'active', 'trial'].includes(user?.subscriptionStatus);

  useEffect(() => {
    Promise.all([
      modulesApi.getGroups().then(d => setGroups(Array.isArray(d) ? d : (d?.groups ?? []))),
      modulesApi.list().then(d => setModules(Array.isArray(d) ? d : (d?.modules ?? []))),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = modules.filter(m => {
    const title = loc(m.title, m.titleTranslations, lang);
    const desc  = loc(m.description, m.descriptionTranslations, lang);
    return !search
      || title?.toLowerCase().includes(search.toLowerCase())
      || desc?.toLowerCase().includes(search.toLowerCase());
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
            const locked  = m.requiresSubscription && !isPremium;
            const vCount  = m.videos?.length ?? m.videoCount ?? 0;
            const title   = loc(m.title, m.titleTranslations, lang);
            const desc    = loc(m.description, m.descriptionTranslations, lang);
            return (
              <Link
                key={m.id}
                to={locked ? '/payments' : `/modules/${m.id}`}
                style={{ display: 'flex', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', opacity: locked ? .7 : 1 }}
              >
                <div style={{ width: 50, height: 50, borderRadius: 10, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {m.emoji ?? '📚'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
                    {locked && <Lock size={13} style={{ color: 'var(--muted)' }} />}
                  </div>
                  {desc && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{desc}</div>}
                  <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 6, fontWeight: 500 }}>
                    {vCount} {t('modules.videos')}
                    {locked && ` · ${t('modules.locked')}`}
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--muted)', flexShrink: 0, alignSelf: 'center' }} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
