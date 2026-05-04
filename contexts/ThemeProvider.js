// ThemeProvider — exposes the active theme palette to the React tree.
//
// Why a context instead of redux? Because:
//  - Themes are deeply structured objects (palette/typography/spacing/…)
//    and only the visual layer cares — broadcasting them through redux
//    would force every selector subscriber to re-evaluate on a switch.
//  - The provider also owns the AsyncStorage side-effect (persistence).
//  - The 14 unmigrated screens still import the static `Global.js`, so
//    isolating the dynamic surface here keeps the blast radius small.
//
// Pattern: at boot we synchronously render with the default theme, then
// hydrate from AsyncStorage and re-render once. This avoids the splash
// "flash of light theme" only after a noticeable delay — an acceptable
// trade-off for a 3-screen pilot.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_THEME_KEY,
  THEME_KEYS,
  resolveTheme,
} from '../styles/themes';

const STORAGE_KEY = 'userTheme';

const ThemeContext = createContext({
  themeKey: DEFAULT_THEME_KEY,
  theme: resolveTheme(DEFAULT_THEME_KEY),
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);

  // Hydrate once after mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && stored && THEME_KEYS.includes(stored)) {
          setThemeKey(stored);
        }
      } catch {
        // Non-fatal: keep default theme.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback(async (nextKey) => {
    const safe = THEME_KEYS.includes(nextKey) ? nextKey : DEFAULT_THEME_KEY;
    setThemeKey(safe);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, safe);
    } catch {
      console.warn('[ThemeProvider] Could not persist userTheme.');
    }
  }, []);

  const value = useMemo(
    () => ({ themeKey, theme: resolveTheme(themeKey), setTheme }),
    [themeKey, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the active theme object — same shape as `styles/Global.js`.
 *
 * Pilot screens (Profile, Settings, PublicProfile, Notifications) use
 * this in place of `import css from '../styles/Global'`. Other screens
 * keep the static import — see plan 001 (dette explicite).
 */
export function useTheme() {
  return useContext(ThemeContext).theme;
}

/**
 * Companion hook — returns `{ themeKey, setTheme }` for the picker UI.
 */
export function useThemeControls() {
  const { themeKey, setTheme } = useContext(ThemeContext);
  return { themeKey, setTheme };
}

export default ThemeProvider;
