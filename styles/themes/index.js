// Theme registry — single source of truth for the available palettes.
//
// `THEMES` maps a stable key (used in AsyncStorage and the Settings UI)
// to a fully-resolved theme object that exposes the same shape as
// `styles/Global.js`. Consumers read this map via `useTheme()`.

import light from './light';
import dark from './dark';
import pastelMint from './pastelMint';
import pastelPeach from './pastelPeach';
import pastelLavender from './pastelLavender';

export const THEME_KEYS = ['light', 'dark', 'pastelMint', 'pastelPeach', 'pastelLavender'];

export const THEMES = {
  light,
  dark,
  pastelMint,
  pastelPeach,
  pastelLavender,
};

export const DEFAULT_THEME_KEY = 'light';

/**
 * Returns the theme object for `key`, falling back to light if unknown.
 */
export function resolveTheme(key) {
  if (key && THEMES[key]) return THEMES[key];
  return THEMES[DEFAULT_THEME_KEY];
}
