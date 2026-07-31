import { createContext, useEffect, useMemo, useState } from 'react';
import { APP_CONFIG } from '../config/app.config.js';
import { localStorageService } from '../services/storage/LocalStorageService.js';

export const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'theme';
const VALID_THEMES = new Set(['light', 'dark', 'system']);

function getResolvedTheme(theme) {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }) {
  const storedTheme = localStorageService.get(
    THEME_STORAGE_KEY,
    APP_CONFIG.defaultTheme,
  );
  const [theme, setThemeState] = useState(
    VALID_THEMES.has(storedTheme) ? storedTheme : APP_CONFIG.defaultTheme,
  );
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    getResolvedTheme(theme),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const nextResolvedTheme = getResolvedTheme(theme);
      setResolvedTheme(nextResolvedTheme);
      document.documentElement.dataset.theme = nextResolvedTheme;
      document.documentElement.style.colorScheme = nextResolvedTheme;
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme(nextTheme) {
        if (!VALID_THEMES.has(nextTheme)) return;
        localStorageService.set(THEME_STORAGE_KEY, nextTheme);
        setThemeState(nextTheme);
      },
    }),
    [theme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
