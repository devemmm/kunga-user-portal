import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import { notificationsApi, announcementsApi } from '../lib/api.js';
import {
  Home, BookOpen, TrendingUp, MessageCircle, User, LogOut,
  Menu, X, Star, ChevronRight, Sparkles, PanelLeftClose, PanelLeftOpen,
  CreditCard, Settings, Bell, CheckSquare, ClipboardList,
} from 'lucide-react';

// NAV keys — labels resolved at render time via t()
const NAV_ITEMS = [
  { to: '/',         icon: Home,         tKey: 'nav.home',        end: true },
  { to: '/modules',  icon: BookOpen,      tKey: 'nav.modules' },
  { to: '/progress', icon: TrendingUp,    tKey: 'nav.progress' },
  { to: '/routine',  icon: CheckSquare,   tKey: 'nav.routine' },
  { to: '/assessment', icon: ClipboardList, tKey: 'nav.assessment' },
  { to: '/ask-gad',  icon: MessageCircle, tKey: 'nav.askGad' },
  { to: '/payments', icon: CreditCard,    tKey: 'nav.payments' },
  { to: '/profile',  icon: User,          tKey: 'nav.profile' },
  { to: '/settings', icon: Settings,      tKey: 'nav.settings' },
];

function Avatar({ name, photoUrl, size = 36, isPremium }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';
  const [imgErr, setImgErr] = useState(false);
  const showImg = photoUrl && !imgErr;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isPremium
        ? 'linear-gradient(135deg,#D97706,#F59E0B)'
        : 'linear-gradient(135deg,#1B5E3B,#2D7A52)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
      boxShadow: '0 2px 8px rgba(0,0,0,.18)', letterSpacing: .5,
      overflow: 'hidden', position: 'relative',
    }}>
      {showImg
        ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} onError={() => setImgErr(true)} />
        : initials}
    </div>
  );
}

function SidebarContent({ user, isPremium, onClose, onLogout, collapsed, onToggleCollapse, isDesktop }) {
  const { t } = useLang();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Brand */}
      <div style={{ padding: collapsed ? '18px 0' : '20px 20px 18px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        {!collapsed && (
          <>
            <img src="/logo.png" alt="Kunga Basics"
              style={{ width: 38, height: 38, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,.15)', flexShrink: 0 }}
              onError={e => e.target.style.display = 'none'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--green)', letterSpacing: -.2 }}>Kunga Basics</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>Learning Portal</div>
            </div>
          </>
        )}
        {collapsed && (
          <img src="/logo.png" alt="Kunga Basics"
            style={{ width: 34, height: 34, borderRadius: 9, boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}
            onError={e => e.target.style.display = 'none'} />
        )}
        {onClose && !isDesktop && (
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', display: 'flex', padding: 4, borderRadius: 6, marginLeft: 'auto' }}>
            <X size={18} />
          </button>
        )}
        {isDesktop && (
          <button onClick={onToggleCollapse}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', display: 'flex', padding: 4, borderRadius: 6, cursor: 'pointer', marginLeft: collapsed ? 0 : 'auto', opacity: .7 }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>

      {/* User card — hide when collapsed */}
      {!collapsed && (
        <Link to="/profile" style={{ margin: '0 12px 8px', padding: '12px 14px', borderRadius: 12, display: 'block',
          background: isPremium ? 'linear-gradient(135deg,#FEF3C7,#FDE68A)' : 'var(--green-light)',
          border: `1px solid ${isPremium ? '#FCD34D' : 'var(--border)'}`,
          transition: 'opacity .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={user?.name} photoUrl={user?.photoUrl ?? user?.avatarUrl ?? user?.avatar} size={38} isPremium={isPremium} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                {user?.name ?? 'User'}
              </div>
              <div style={{ fontSize: 11, marginTop: 1, display: 'flex', alignItems: 'center', gap: 3,
                color: isPremium ? '#92400E' : 'var(--green-mid)', fontWeight: 600 }}>
                {isPremium ? <><Star size={10} fill="currentColor" /> {t('nav.premium')}</> : t('nav.freePlan')}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Collapsed user avatar */}
      {collapsed && (
        <Link to="/profile" style={{ display: 'flex', justifyContent: 'center', margin: '0 0 8px', padding: '6px 0' }}>
          <Avatar name={user?.name} photoUrl={user?.photoUrl ?? user?.avatarUrl ?? user?.avatar} size={36} isPremium={isPremium} />
        </Link>
      )}

      {/* Nav section label */}
      {!collapsed && (
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-light)', letterSpacing: 1, textTransform: 'uppercase', padding: '8px 20px 4px' }}>
          {t('nav.menu')}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '4px 8px' : '4px 12px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, tKey, end }) => {
          const label = t(tKey);
          return (
          <NavLink key={to} to={to} end={end}
            onClick={onClose}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 11,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '9px 10px',
              borderRadius: 10, marginBottom: 2, fontWeight: isActive ? 700 : 500,
              fontSize: 13.5, transition: 'all .14s',
              color: isActive ? 'var(--green)' : 'var(--text-2)',
              background: isActive ? 'var(--green-light)' : 'transparent',
            })}>
            {({ isActive }) => (
              <>
                <span style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: isActive ? 'var(--green)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--muted)',
                  transition: 'all .14s',
                }}>
                  <Icon size={16} />
                </span>
                {!collapsed && <>{label}{isActive && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: .5 }} />}</>}
              </>
            )}
          </NavLink>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: collapsed ? '10px 8px 16px' : '10px 12px 16px', borderTop: '1px solid var(--border-light)' }}>
        <button onClick={onLogout} title={collapsed ? 'Sign out' : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : 10,
            padding: collapsed ? '10px 0' : '9px 10px', borderRadius: 10, background: 'none', border: 'none',
            color: 'var(--muted)', fontWeight: 500, fontSize: 13.5,
            transition: 'background .14s, color .14s', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--rose-light)'; e.currentTarget.style.color = 'var(--rose)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}
        >
          <span style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={16} />
          </span>
          {!collapsed && t('nav.signOut')}
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [collapsed, setCollapsed]         = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [banner, setBanner]               = useState(null); // active announcement banner
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const isPremium = ['ACTIVE', 'TRIAL'].includes(user?.subscriptionStatus);
  const handleLogout = () => { logout(); navigate('/login'); };

  // Fetch unread notification count + active banner on mount
  const loadMeta = useCallback(async () => {
    try {
      const [notifRes, bannerRes] = await Promise.all([
        notificationsApi.list().catch(() => null),
        announcementsApi.getBanner().catch(() => null),
      ]);
      if (notifRes?.notifications) {
        const stored = (() => { try { return new Set(JSON.parse(sessionStorage.getItem('kb_read_notif_ids') ?? '[]')); } catch { return new Set(); } })();
        const unread = notifRes.notifications.filter(n => !stored.has(String(n.id)) && n.read !== true).length;
        setUnreadCount(unread);
      }
      if (bannerRes?.id) setBanner(bannerRes);
    } catch {}
  }, []);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const activeItem = NAV_ITEMS.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));
  const pageLabel = activeItem ? t(activeItem.tKey) : '';
  const sidebarW = collapsed ? 64 : 252;

  return (
    <>
      <style>{`
        @media (min-width: 900px) {
          .kb-sidebar-desktop { display: flex !important; }
          .kb-main { margin-left: ${sidebarW}px !important; }
          .kb-menu-btn { display: none !important; }
        }
        @media (max-width: 899px) {
          .kb-sidebar-desktop { display: none !important; }
          .kb-main { margin-left: 0 !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Desktop sidebar */}
        <aside className="kb-sidebar-desktop" style={{
          display: 'none', position: 'fixed', top: 0, left: 0, bottom: 0,
          width: sidebarW, background: 'var(--surface)', borderRight: '1px solid var(--border)',
          flexDirection: 'column', zIndex: 50,
          transition: 'width .22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
        }}>
          <SidebarContent user={user} isPremium={isPremium} onLogout={handleLogout}
            collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} isDesktop={true} />
        </aside>

        {/* Mobile overlay */}
        {drawerOpen && (
          <div onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60, backdropFilter: 'blur(2px)' }} />
        )}

        {/* Mobile drawer */}
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 252,
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          zIndex: 70, display: 'flex', flexDirection: 'column',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .26s cubic-bezier(.4,0,.2,1)',
          boxShadow: drawerOpen ? 'var(--shadow-lg)' : 'none',
        }}>
          <SidebarContent user={user} isPremium={isPremium}
            onClose={() => setDrawerOpen(false)} onLogout={handleLogout}
            collapsed={false} isDesktop={false} />
        </aside>

        {/* Main */}
        <div className="kb-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'margin-left .22s cubic-bezier(.4,0,.2,1)' }}>

          {/* Top bar */}
          <header style={{
            height: 'var(--topbar-h)', background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
            position: 'sticky', top: 0, zIndex: 30,
          }}>
            <button className="kb-menu-btn" onClick={() => setDrawerOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text)', display: 'flex', padding: 6, borderRadius: 8 }}>
              <Menu size={20} />
            </button>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: -.2 }}>{pageLabel}</div>
            <div style={{ flex: 1 }} />

            {isPremium && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--gold-light)', border: '1px solid #FCD34D', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#92400E' }}>
                <Sparkles size={11} /> {t('nav.premium')}
              </div>
            )}

            {/* Notification bell */}
            <Link to="/notifications" title={t('nav.notifications')}
              onClick={() => setUnreadCount(0)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'var(--border-light)', border: '1px solid var(--border)', color: 'var(--text)', transition: 'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, borderRadius: 99, background: 'var(--green)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid var(--surface)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar → navigates to /profile */}
            <Link to="/profile" title="My profile"
              style={{ display: 'flex', borderRadius: '50%', transition: 'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <Avatar name={user?.name} photoUrl={user?.photoUrl ?? user?.avatarUrl ?? user?.avatar} size={34} isPremium={isPremium} />
            </Link>
          </header>

          {/* Announcement banner */}
          {banner && !bannerDismissed && (
            <div style={{ background: 'linear-gradient(90deg,#fffbeb,#fef3c7)', borderBottom: '1px solid #FCD34D', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>📣</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#78350F' }}>{banner.title}</span>
                {banner.body && <span style={{ fontSize: 12, color: '#92400E', marginLeft: 8 }}>{banner.body}</span>}
              </div>
              <button
                onClick={async () => {
                  setBannerDismissed(true);
                  try { await announcementsApi.dismiss(banner.id); } catch {}
                }}
                style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', fontSize: 18, padding: 4, opacity: .7, flexShrink: 0 }}
                title="Dismiss"
              >×</button>
            </div>
          )}

          {/* Content */}
          <main style={{ flex: 1, padding: '28px 24px', maxWidth: 960, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
