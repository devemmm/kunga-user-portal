import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { modulesApi, videosApi, progressApi } from '../lib/api.js';
import { ArrowLeft, Play, BookmarkPlus, FileText, Loader, CheckCircle, Clock, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';

const LANG_KEY = { en: 'en', fr: 'fr', kin: 'rw' };
function loc(base, translations, lang) {
  if (!translations || lang === 'en') return base;
  const key = LANG_KEY[lang] ?? lang;
  return translations[key] ?? translations[lang] ?? base;
}

function fmtDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ModuleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [module, setModule]       = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [streamUrl, setStreamUrl]       = useState('');
  const [streamLoading, setStreamLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [marking, setMarking] = useState(false);

  const isPremium = ['ACTIVE', 'TRIAL', 'active', 'trial'].includes(user?.subscriptionStatus);

  useEffect(() => {
    Promise.all([
      modulesApi.getById(id).then(d => {
        const mod = d.module ?? d;
        setModule(mod);
        setIsCompleted(mod.isCompleted || mod.completed || (mod.progressPercent ?? 0) >= 90);
      }),
      modulesApi.listResources(id)
        .then(d => setResources(Array.isArray(d) ? d : (d?.resources ?? [])))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  const videoRef       = useRef(null);
  const progressTimer  = useRef(null);
  const lastReported   = useRef(0);

  // Report progress every 10 seconds while video is playing
  const reportProgress = (pct) => {
    const rounded = Math.round(pct);
    if (rounded <= lastReported.current) return;
    lastReported.current = rounded;
    if (rounded >= 90) {
      progressApi.markComplete(id).then(() => setIsCompleted(true)).catch(() => {});
    } else {
      progressApi.updateProgress(id, rounded).catch(() => {});
    }
  };

  const onTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const pct = (el.currentTime / el.duration) * 100;
    reportProgress(pct);
  };

  const onVideoEnded = () => {
    reportProgress(100);
    setIsCompleted(true);
  };

  // Clean up interval on unmount
  useEffect(() => () => clearInterval(progressTimer.current), []);

  const playVideo = async (video) => {
    if (!isPremium && !module?.isPreview) return;
    setPlayingVideo(video);
    setStreamUrl('');
    setStreamLoading(true);
    try {
      const data = await videosApi.getStreamUrl(video.id);
      const url = data.url ?? data.streamUrl ?? data.signedUrl ?? '';
      setStreamUrl(url);
      // Request fullscreen after the video element loads the new src
      if (url) {
        setTimeout(() => {
          const el = videoRef.current;
          if (!el) return;
          if (el.requestFullscreen)            el.requestFullscreen();
          else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
          else if (el.webkitEnterFullscreen)   el.webkitEnterFullscreen(); // iOS Safari
        }, 300);
      }
    } catch {
      setStreamUrl('');
    } finally {
      setStreamLoading(false);
    }
  };

  const markComplete = async () => {
    if (marking || isCompleted) return;
    setMarking(true);
    try {
      await progressApi.markComplete(id);
      setIsCompleted(true);
    } catch {}
    finally { setMarking(false); }
  };

  const toggleBookmark = async (videoId, e) => {
    e.stopPropagation(); e.preventDefault();
    try {
      await videosApi.bookmark(videoId);
      setBookmarked(b => ({ ...b, [videoId]: !b[videoId] }));
    } catch {}
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!module) return (
    <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>Module not found</div>
  );

  const videos    = module.videos ?? [];
  const canAccess = isPremium || module.isPreview;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Back */}
      <Link to="/modules" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>
        <ArrowLeft size={16} /> {t('module.backToModules')}
      </Link>

      {/* Module header */}
      <div className="fade-up" style={{ background: 'linear-gradient(130deg,var(--green-dark),var(--green))', borderRadius: 'var(--radius-lg)', padding: '24px 24px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{module.emoji ?? '📚'}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -.4, marginBottom: 8 }}>{loc(module.title, module.titleTranslations, lang)}</h1>
          {module.description && (
            <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 12 }}>{loc(module.description, module.descriptionTranslations, lang)}</p>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Play size={12} /> {videos.length} video{videos.length !== 1 ? 's' : ''}
            </span>
            {resources.length > 0 && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileText size={12} /> {resources.length} resource{resources.length !== 1 ? 's' : ''}
              </span>
            )}
            {module.isPreview && (
              <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,.2)', color: '#fff', borderRadius: 20, padding: '2px 10px' }}>
                {t('module.freePreview')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* What to expect */}
      {module.whatToExpect && (
        <div className="fade-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>{t('module.whatYoullLearn')}</div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65 }}>{loc(module.whatToExpect, module.whatToExpectTranslations, lang)}</p>
        </div>
      )}

      {/* Locked state */}
      {!canAccess && (
        <div className="fade-up" style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)', borderRadius: 'var(--radius)', padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 3 }}>{t('module.premiumContent')}</div>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>{t('module.premiumDesc')}</div>
          </div>
          <Link to="/payments" style={{ background: '#fff', color: '#7C3AED', borderRadius: 20, padding: '8px 16px', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {t('module.upgrade')}
          </Link>
        </div>
      )}

      {/* Mark as Completed / Completed banner */}
      {canAccess && (
        isCompleted ? (
          <div className="fade-up" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--green-light)', border: '1.5px solid var(--green)',
            borderRadius: 'var(--radius)', padding: '14px 18px',
          }}>
            <CheckCircle size={22} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>{t('moduleDetail.moduleCompleted')}</div>
              <div style={{ fontSize: 12.5, color: 'var(--green)', opacity: .75, marginTop: 2 }}>{t('moduleDetail.completedDesc') || 'Great work! This module is marked as complete.'}</div>
            </div>
          </div>
        ) : (
          <button onClick={markComplete} disabled={marking} className="fade-up" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '13px 20px',
            background: marking ? 'var(--border)' : 'var(--green)',
            color: marking ? 'var(--muted)' : '#fff',
            border: 'none', borderRadius: 'var(--radius)',
            fontWeight: 700, fontSize: 15, cursor: marking ? 'not-allowed' : 'pointer',
            transition: 'all .15s',
          }}>
            <CheckCircle size={17} />
            {marking ? 'Saving…' : t('moduleDetail.markComplete')}
          </button>
        )
      )}

      {/* Video player */}
      {playingVideo && (
        <div className="scale-in" style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {streamLoading ? (
            <Loader size={32} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
          ) : streamUrl ? (
            <video ref={videoRef} src={streamUrl} controls autoPlay
              onTimeUpdate={onTimeUpdate}
              onEnded={onVideoEnded}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, textAlign: 'center', padding: 24 }}>
              <Lock size={28} style={{ margin: '0 auto 10px', opacity: .5 }} />
              <div>{t('module.streamUnavailable')}</div>
            </div>
          )}
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="fade-up">
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: -.2, marginBottom: 12 }}>
            {t('module.videos')} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>({videos.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {videos.map((v, i) => {
              const isPlaying = playingVideo?.id === v.id;
              const isLocked  = !canAccess;
              return (
                <div key={v.id} onClick={() => !isLocked && playVideo(v)}
                  className="card-lift"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: isPlaying ? 'var(--green-light)' : 'var(--surface)',
                    border: `1.5px solid ${isPlaying ? 'var(--green)' : isLocked ? '#C4B5FD' : 'var(--border)'}`,
                    borderRadius: 12, padding: '14px 16px',
                    cursor: isLocked ? 'default' : 'pointer',
                    transition: 'all .15s',
                    position: 'relative', overflow: 'hidden',
                  }}>

                  {/* Watermark overlay for locked videos */}
                  {isLocked && (
                    <>
                      {/* Diagonal watermark text */}
                      <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        {/* Faint tiled watermark */}
                        <div style={{
                          position: 'absolute', inset: -20,
                          display: 'flex', flexWrap: 'wrap', gap: '0 24px',
                          alignItems: 'center', justifyContent: 'center',
                          transform: 'rotate(-20deg)',
                          opacity: .07,
                        }}>
                          {Array.from({ length: 6 }).map((_, k) => (
                            <span key={k} style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', whiteSpace: 'nowrap', letterSpacing: 1, textTransform: 'uppercase' }}>
                              🔒 {t('module.premiumOnly')}
                            </span>
                          ))}
                        </div>
                        {/* Centered "Subscribe" pill */}
                        <div style={{
                          background: 'linear-gradient(135deg,rgba(124,58,237,.92),rgba(147,51,234,.92))',
                          color: '#fff', fontSize: 10, fontWeight: 800,
                          borderRadius: 20, padding: '3px 10px',
                          letterSpacing: .6, textTransform: 'uppercase',
                          display: 'flex', alignItems: 'center', gap: 4,
                          boxShadow: '0 2px 8px rgba(124,58,237,.35)',
                          position: 'absolute', top: 8, right: 8,
                        }}>
                          <Lock size={9} /> {t('module.subscribe')}
                        </div>
                      </div>
                      {/* Purple tint overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(124,58,237,.04)', borderRadius: 12, pointerEvents: 'none', zIndex: 1 }} />
                    </>
                  )}

                  {/* Index / play icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: isPlaying ? 'var(--green)' : isLocked ? '#EDE9FE' : 'var(--green-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 3,
                  }}>
                    {isPlaying
                      ? <CheckCircle size={16} color="#fff" />
                      : isLocked
                        ? <Lock size={14} style={{ color: 'var(--muted)' }} />
                        : <Play size={14} fill="var(--green)" color="var(--green)" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: isPlaying ? 'var(--green)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i + 1}. {loc(v.title, v.titleTranslations, lang)}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                      {fmtDuration(v.durationSecs) && (
                        <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} /> {fmtDuration(v.durationSecs)}
                        </span>
                      )}
                      {v.type && (
                        <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--border-light)', borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>
                          {v.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isLocked && (
                    <button onClick={e => toggleBookmark(v.id, e)}
                      style={{ background: 'none', border: 'none', color: bookmarked[v.id] ? 'var(--green)' : 'var(--muted)', display: 'flex', padding: 4, borderRadius: 6, flexShrink: 0, cursor: 'pointer' }}>
                      <BookmarkPlus size={16} fill={bookmarked[v.id] ? 'var(--green)' : 'none'} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {videos.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '40px 20px', textAlign: 'center' }}>
          <Play size={32} style={{ color: 'var(--muted)', margin: '0 auto 12px', opacity: .4 }} />
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)' }}>{t('module.noVideos')}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, opacity: .7 }}>{t('module.noVideosDesc')}</div>
        </div>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <div className="fade-up">
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: -.2, marginBottom: 12 }}>
            {t('module.resources')} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>({resources.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resources.map(r => (
              <a key={r.id} href={r.url ?? r.fileUrl ?? '#'} target="_blank" rel="noopener noreferrer"
                className="card-lift"
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--sky-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} style={{ color: 'var(--sky)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title ?? r.name}</div>
                  {r.type && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{r.type}</div>}
                </div>
                <ChevronRight size={15} style={{ color: 'var(--muted)', opacity: .5 }} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
