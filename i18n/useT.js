// useT — translation hook that reacts to the redux `locale` slice.
//
// We keep the i18n-js instance as a module singleton (see ./index.js),
// but the React tree needs to re-render when the user picks a new
// language. Subscribing to `state.locale.value.lang` does that without
// requiring a context — Redux already broadcasts changes everywhere.

import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { i18n, applyLocale, resolveLocale } from './index';

/**
 * Hook returning a memoized translator function.
 *
 * Usage:
 *   const t = useT();
 *   <Text>{t('settings.title')}</Text>
 *   <Text>{t('notifications.newRecipe', { username: 'alex', title: 'Pho' })}</Text>
 */
export default function useT() {
  // Falls back to 'system' so screens that mount before the slice
  // is fully hydrated still render.
  const mode = useSelector((state) => state?.locale?.value?.lang ?? 'system');

  // Keep the singleton in sync — a no-op when it already matches, but
  // covers the case where the slice rehydrates after first render.
  const effective = resolveLocale(mode);
  if (i18n.locale !== effective) {
    applyLocale(mode);
  }

  return useCallback((key, vars) => {
    if (!key) return '';
    const opts = vars
      ? { ...vars, defaultValue: vars.defaultValue ?? key }
      : { defaultValue: key };
    return i18n.t(key, opts);
  }, [effective]);
}

export { useT };
