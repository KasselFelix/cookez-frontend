// Component-render reference suite — validates the full provider chain via
// `renderWithProviders`. Rather than couple this reference test to a specific
// screen/component (each pulls in native deps that would need bespoke mocks),
// we render a tiny in-test "probe" component that exercises BOTH cross-cutting
// providers the app relies on:
//   - useTheme()  → tokens from contexts/ThemeProvider
//   - useT()      → translations from i18n/useT, driven by the redux locale slice
//
// This proves the harness is wired correctly. To test a real component,
// follow the same pattern: `renderWithProviders(<MyComponent />, { preloadedState })`
// and assert on `screen.getByText(...)`. If a real component pulls an
// un-mocked native module, add the mock to test/setup.js (not here).

import React from 'react';
import { Text, View } from 'react-native';
import { screen } from '@testing-library/react-native';

import { useTheme } from '../../contexts/ThemeProvider';
import useT from '../../i18n/useT';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeUserState } from '../factories/user';

/** Minimal presentational component using both providers. */
function ThemedGreeting() {
  const css = useTheme();
  const t = useT();
  return (
    <View accessibilityRole="summary" style={{ padding: css.spacing?.md ?? 16 }}>
      <Text accessibilityRole="header">{t('common.home')}</Text>
      <Text testID="save-label">{t('common.save')}</Text>
    </View>
  );
}

describe('renderWithProviders harness', () => {
  it('renders a component that consumes useTheme() and useT() (default EN)', () => {
    renderWithProviders(<ThemedGreeting />);
    // Default locale mode is 'system' → resolves to 'en' (expo-localization mock).
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByTestId('save-label')).toHaveTextContent('Save');
  });

  it('honors a preloaded locale slice (FR) end-to-end', () => {
    renderWithProviders(<ThemedGreeting />, {
      preloadedState: { locale: { value: { lang: 'fr' } } },
    });
    expect(screen.getByText('Accueil')).toBeTruthy();
    expect(screen.getByTestId('save-label')).toHaveTextContent('Enregistrer');
  });

  it('accepts preloaded slice state (e.g. a logged-in user) without throwing', () => {
    const { store } = renderWithProviders(<ThemedGreeting />, {
      preloadedState: { user: makeUserState({ username: 'alex' }) },
    });
    expect(store.getState().user.value.username).toBe('alex');
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('renders without NavigationContainer when withNavigation=false', () => {
    renderWithProviders(<ThemedGreeting />, { withNavigation: false });
    expect(screen.getByText('Home')).toBeTruthy();
  });
});
