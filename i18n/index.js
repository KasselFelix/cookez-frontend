// i18n bootstrap.
//
// Why a thin wrapper around i18n-js?
//  - Cookez supports two languages today (EN/FR) and three locale modes
//    (`en`, `fr`, `system`). The 'system' mode falls back to whatever
//    expo-localization reports for the device.
//  - We persist the user-selected mode under AsyncStorage `userLocale`
//    so the boot is instant on next launch (before redux rehydration).
//  - The UI subscribes to changes via the redux `locale` slice + `useT`
//    hook — this module owns the *side effect* of mutating
//    `i18n.locale` and writing AsyncStorage.

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './translations/en.json';
import fr from './translations/fr.json';

export const SUPPORTED_LOCALES = ['en', 'fr', 'system'];
const STORAGE_KEY = 'userLocale';

// i18n-js v4 instance — single source of truth across the app.
export const i18n = new I18n({ en, fr });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

/**
 * Best-effort detection of the device language as a 2-letter code.
 * expo-localization exposes a `getLocales()` array (>= v17) and a
 * `locale` string fallback on older versions.
 */
export function detectSystemLocale() {
  try {
    const locales = Localization.getLocales?.();
    if (Array.isArray(locales) && locales.length > 0 && locales[0]?.languageCode) {
      return locales[0].languageCode;
    }
  } catch {
    // fall through
  }
  const raw = Localization.locale || 'en';
  return String(raw).split(/[-_]/)[0];
}

/**
 * Resolve a stored mode (`en` | `fr` | `system`) to an effective
 * 2-letter locale supported by the bundle.
 */
export function resolveLocale(modeOrLocale) {
  if (modeOrLocale === 'fr' || modeOrLocale === 'en') return modeOrLocale;
  // 'system' (or anything else) → device default, clamped to bundled set
  const sys = detectSystemLocale();
  return sys === 'fr' ? 'fr' : 'en';
}

/**
 * Apply a mode to the i18n singleton (does not persist).
 */
export function applyLocale(modeOrLocale) {
  i18n.locale = resolveLocale(modeOrLocale);
}

/**
 * Persist + apply. Used by the Settings UI when the user picks a language.
 */
export async function setLocale(mode) {
  const safe = SUPPORTED_LOCALES.includes(mode) ? mode : 'system';
  applyLocale(safe);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, safe);
  } catch {
    // AsyncStorage failures are non-fatal — just log.
    console.warn('[i18n] Could not persist userLocale.');
  }
  return safe;
}

/**
 * Read persisted mode (or `'system'` if absent / corrupted).
 */
export async function loadStoredLocaleMode() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return 'system';
}

/**
 * Boot helper — call once during app init. Returns the *mode* used so the
 * caller can hydrate the redux slice with the same value.
 */
export async function setupI18n() {
  const mode = await loadStoredLocaleMode();
  applyLocale(mode);
  return mode;
}

/**
 * Translate by key. Wraps i18n.t with a safe default and merges optional
 * interpolation vars.
 */
export function t(key, vars) {
  if (!key) return '';
  const opts = vars ? { ...vars, defaultValue: vars.defaultValue ?? key } : { defaultValue: key };
  return i18n.t(key, opts);
}

export default i18n;
