import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authApi, preferencesApi, setToken, getToken, isLoggedIn } from './api.js';

const AuthContext = createContext(null);

// Helpers to apply theme & lang from preferences without importing the contexts
// (which would cause circular deps). We call these directly on the DOM/localStorage.
function applyThemeFromPrefs(prefs) {
  if (!prefs) return;
  const mode = prefs.darkMode ?? 'system';
  localStorage.setItem('kb_theme', mode);
  const resolved = mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  document.documentElement.setAttribute('data-theme', resolved);
}

function applyLangFromPrefs(prefs) {
  if (!prefs) return;
  const lang = prefs.language ?? 'en';
  localStorage.setItem('kb_lang', lang);
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  // Core session refresh — re-fetches /auth/me and updates user state.
  // /auth/me returns { user, childProfile, subscription, preferences }
  // so we always extract .user to stay consistent with the login flow.
  const doRefresh = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const res = await authApi.me();
      setUser(res?.user ?? res);
    } catch { /* network error — keep stale state */ }
  }, []);

  // On mount: restore session + preferences
  useEffect(() => {
    if (isLoggedIn()) {
      Promise.allSettled([
        authApi.me(),
        preferencesApi.get(),
      ]).then(([userRes, prefsRes]) => {
        if (userRes.status === 'fulfilled') {
          // /auth/me returns { user, childProfile, subscription, preferences }
          // extract .user so the shape matches what login stores
          const res = userRes.value;
          setUser(res?.user ?? res);
        } else setUser(null);
        if (prefsRes.status === 'fulfilled') {
          const p = prefsRes.value?.preferences ?? null;
          setPrefs(p);
          applyThemeFromPrefs(p);
          applyLangFromPrefs(p);
        }
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Auto-refresh subscription status:
  // 1. Every 5 minutes while the tab is open
  // 2. Every time the user switches back to this tab
  // This ensures subscription changes made in the admin portal
  // are reflected without requiring a logout/login.
  const intervalRef = useRef(null);
  useEffect(() => {
    const FIVE_MIN = 5 * 60 * 1000;

    intervalRef.current = setInterval(doRefresh, FIVE_MIN);

    const onVisible = () => {
      if (document.visibilityState === 'visible') doRefresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [doRefresh]);

  const _afterLogin = async (data) => {
    setToken(data.accessToken, data.refreshToken);
    setUser(data.user);
    // Load and apply preferences right after login
    try {
      const p = await preferencesApi.get();
      const prefs = p?.preferences ?? null;
      setPrefs(prefs);
      applyThemeFromPrefs(prefs);
      applyLangFromPrefs(prefs);
    } catch { /* non-critical */ }
  };

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    // MFA flow: don't set tokens yet, let caller handle challenge
    if (data.mfaRequired) return data;
    await _afterLogin(data);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    await _afterLogin(data);
    return data;
  };

  const googleSignIn = async (idToken) => {
    const data = await authApi.googleAuth(idToken);
    await _afterLogin(data);
    return data;
  };

  // Called after successful MFA verify
  const completeMfaLogin = async (data) => {
    await _afterLogin(data);
  };

  const logout = () => {
    setToken(null, null);
    setUser(null);
    setPrefs(null);
  };

  const refreshUser = async () => {
    const res = await authApi.me();
    const u = res?.user ?? res;
    setUser(u);
    return u;
  };

  const refreshPrefs = async () => {
    try {
      const p = await preferencesApi.get();
      const prefs = p?.preferences ?? null;
      setPrefs(prefs);
      applyThemeFromPrefs(prefs);
      applyLangFromPrefs(prefs);
      return prefs;
    } catch { return null; }
  };

  const updatePrefs = async (data) => {
    const p = await preferencesApi.update(data);
    const updated = p?.preferences ?? null;
    setPrefs(updated);
    if (data.darkMode !== undefined) applyThemeFromPrefs(updated);
    if (data.language !== undefined) applyLangFromPrefs(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{
      user, prefs, loading,
      login, register, googleSignIn, completeMfaLogin, logout,
      refreshUser, refreshPrefs, updatePrefs,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
