/**
 * Kunga Basics User Portal — Theme Provider
 * Modes: "light" | "dark" | "system"
 *
 * Usage:
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 */

import { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext(null);

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.setAttribute('data-theme', resolved);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('kb_theme') ?? 'system'
  );

  // Apply on mount + whenever theme changes
  useEffect(() => { applyTheme(theme); }, [theme]);

  // Watch system changes when in system mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (mode) => {
    setThemeState(mode);
    localStorage.setItem('kb_theme', mode);
    applyTheme(mode);
  };

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() must be used inside <ThemeProvider>');
  return ctx;
}
