// Hook test for useT() — renders the hook through the provider chain with a
// preloaded `locale` slice and asserts a known translation key resolves to
// the right language.
//
// Why render through providers instead of renderHook with a bare wrapper?
// `useT()` calls `useSelector((s) => s.locale.value.lang)`, so it needs a real
// Redux Provider. `renderWithProviders` already supplies one seeded from
// `preloadedState`, so we reuse it and read the translator's output from the
// rendered tree.

import React from 'react';
import { Text } from 'react-native';
import { screen } from '@testing-library/react-native';

import useT from '../../i18n/useT';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../helpers/renderWithProviders';

/** Probe that surfaces a translated key into the tree for assertion. */
function TranslateProbe({ tKey, vars }) {
  const t = useT();
  return <Text testID="out">{t(tKey, vars)}</Text>;
}

describe('useT()', () => {
  it('resolves a known key in English by default (system → en)', () => {
    renderWithProviders(<TranslateProbe tKey="common.save" />, { withNavigation: false });
    expect(screen.getByTestId('out')).toHaveTextContent('Save');
  });

  it('resolves the same key in French when locale slice is preloaded to fr', () => {
    renderWithProviders(<TranslateProbe tKey="common.save" />, {
      withNavigation: false,
      preloadedState: { locale: { value: { lang: 'fr' } } },
    });
    expect(screen.getByTestId('out')).toHaveTextContent('Enregistrer');
    // The hook also syncs the i18n-js singleton to the effective locale.
    expect(i18n.locale).toBe('fr');
  });

  it('returns an empty string for a falsy key (defensive contract)', () => {
    renderWithProviders(<TranslateProbe tKey={null} />, { withNavigation: false });
    expect(screen.getByTestId('out')).toHaveTextContent('');
  });

  it('falls back to the key itself for an unknown key (defaultValue)', () => {
    renderWithProviders(<TranslateProbe tKey="totally.unknown.key" />, {
      withNavigation: false,
    });
    expect(screen.getByTestId('out')).toHaveTextContent('totally.unknown.key');
  });
});
