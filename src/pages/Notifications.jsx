import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi, announcementsApi } from '../lib/api.js';
import { useLang } from '../lib/i18n.jsx';
import {
  Bell, MessageCircle, Award, BookOpen, Calendar,
  Megaphone, Star, Heart, Loader, CheckCheck, ChevronRight,
} from 'lucide-react';

// ── Type metadata ─────────────────────────────────────────────────────────────
const TYPE_META = {
  ask_gad_response: { Icon: MessageCircle, color: '#0d9488', bg: '#f0fdfa',   accent: '#14b8a6', route: '/ask-gad'  },
  milestone:        { Icon: Award,          color: '#d97706', bg: '#fffbeb',   accent: '#f59e0b', route: '/progress' },
  module:           { Icon: BookOpen,       color: '#0d9488', bg: '#f0fdfa',   accent: '#14b8a6', route: '/modules'  },
  routine:          { Icon: Calendar,       color: '#7c3aed', bg: '#f5f3ff',   accent: '#8b5cf6', route: '/routine'  },
  announcement:     { Icon: Megaphone,      color: '#b45309', bg: '#fffbeb',   accent: '#f59e0b', route: '/notifications' },
  subscription:     { Icon: Star,           color: '#be185d', bg: '#fdf2f8',   accent: '#ec4899', route: '/payments' },
  donation:         { Icon: Heart,          color: '#dc2626', bg: '#fef2f2',   accent: '#ef4444', route: null        },
  general:          { Icon: Bell,           color: 'var(--muted)', bg: 'var(--border-light)', accent: 'var(--muted)', route: null },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const diffMs  = Date.now() - new Date(ts).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1)  return 'Yesterday';
  if (diffD < 7)    return `${diffD}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Local read-state — persisted in sessionStorage per page load
const STORAGE_KEY = 'kb_read_notif_ids';
function getLocalReadIds() {
  try { return new Set(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]')); }
  catch { return new Set(); }
}
function saveLocalReadIds(set) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch {}
}

// ── NotificationCard ──────────────────────────────────────────────────────────
function NotifCard({ item, onPress }) {
  const meta  = TYPE_META[item.type] ?? TYPE_META.general;
  const Icon  = meta.Icon;
  const isRead = item.read;

  return (
    <button
      onClick={() => onPress(item)}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 16px', background: 'var(--surface)',
        border: `1px solid var(--border)`,
        borderLeft: isRead ? '1px solid var(--border)' : `3px solid ${meta.accent}`,
        borderRadius: 'var(--radius)', marginBottom: 8,
        cursor: 'pointer', textAlign: 'left',
        opacity: isRead ? .75 : 1, transition: 'opacity .15s, box-shadow .15s',
        boxShadow: isRead ? 'none' : '0 2px 10px rgba(0,0,0,.06)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,0,0,.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = isRead ? 'none' : '0 2px 10px rgba(0,0,0,.06)'}
    >
      {/* Icon */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} style={{ color: meta.color }} />
        </div>
        {!isRead && (
          <div style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: meta.accent, border: '2px solid var(--surface)' }} />
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ fontWeight: isRead ? 500 : 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.time}</div>
        </div>
        {item.body && (
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.body}
          </div>
        )}
      </div>

      <ChevronRight size={14} style={{ color: 'var(--muted)', flexShrink: 0, alignSelf: 'center', opacity: .5 }} />
    </button>
  );
}

// ── Announcement Banner ───────────────────────────────────────────────────────
function AnnouncementCard({ ann, onDismiss }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #FCD34D',
      borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 12,
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: 22, flexShrink: 0 }}>📣</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#78350F', marginBottom: 4 }}>{ann.title}</div>
        <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>{ann.body}</div>
      </div>
      <button
        onClick={() => onDismiss(ann.id)}
        style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', padding: 4, flexShrink: 0, opacity: .7, fontSize: 18 }}
        title="Dismiss"
      >×</button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Notifications() {
  const { t }   = useLang();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const localReadIds = getLocalReadIds();

  const load = useCallback(async () => {
    try {
      const [notifRes, annRes] = await Promise.all([
        notificationsApi.list().catch(() => ({ notifications: [] })),
        announcementsApi.getActive().catch(() => []),
      ]);

      const items = (notifRes?.notifications ?? []).map(n => ({
        id:    n.id,
        type:  n.type ?? 'general',
        title: n.title,
        body:  n.body ?? '',
        time:  timeAgo(n.timestamp ?? n.createdAt),
        read:  localReadIds.has(String(n.id)) || n.read === true,
        data:  n.data,
      }));
      setNotifications(items);

      const anns = Array.isArray(annRes) ? annRes : (annRes?.announcements ?? []);
      setAnnouncements(anns);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const markRead = (item) => {
    localReadIds.add(String(item.id));
    saveLocalReadIds(localReadIds);
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));

    // Navigate to relevant page
    const route = (TYPE_META[item.type] ?? TYPE_META.general).route;
    if (route && route !== '/notifications') navigate(route);
  };

  const markAllRead = () => {
    const newSet = new Set(notifications.map(n => String(n.id)));
    saveLocalReadIds(newSet);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissAnnouncement = async (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    try { await announcementsApi.dismiss(id); } catch {}
  };

  const unread  = notifications.filter(n => !n.read);
  const read    = notifications.filter(n =>  n.read);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.3, marginBottom: 4 }}>{t('notifications.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {unread.length > 0
              ? `${unread.length} ${t('notifications.unread')}`
              : t('notifications.empty')}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green-light)', border: 'none', borderRadius: 20, padding: '8px 14px', color: 'var(--green)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            <CheckCheck size={14} /> {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── Announcements ── */}
      {!loading && announcements.length > 0 && (
        <div>
          {announcements.map(ann => (
            <AnnouncementCard key={ann.id} ann={ann} onDismiss={dismissAnnouncement} />
          ))}
        </div>
      )}

      {/* ── Notifications ── */}
      {!loading && notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Bell size={30} style={{ color: 'var(--green)' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{t('notifications.empty')}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{t('notifications.emptyDesc')}</div>
        </div>
      )}

      {!loading && unread.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('notifications.new')}
            </span>
            <div style={{ background: 'var(--green)', borderRadius: 99, padding: '2px 8px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{unread.length}</span>
            </div>
          </div>
          {unread.map(item => <NotifCard key={item.id} item={item} onPress={markRead} />)}
        </div>
      )}

      {!loading && read.length > 0 && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t('notifications.earlier')}
            </span>
          </div>
          {read.map(item => <NotifCard key={item.id} item={item} onPress={markRead} />)}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
