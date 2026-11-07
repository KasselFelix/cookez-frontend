import React from 'react';
import { StyleSheet } from 'react-native';
import { screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { THEMES, THEME_KEYS } from '../../styles/themes';
import DevGalleryScreen from '../../screens/DevGalleryScreen';

const SECTIONS = ['tokens', 'buttons', 'chips', 'cards', 'fields', 'states', 'nutrition', 'sheets', 'sandbox'];

describe('DevGalleryScreen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it.each(THEME_KEYS)('renders every section in the %s theme', async (themeKey) => {
    // ThemeProvider hydrates the stored key after mount, like the app does.
    await AsyncStorage.setItem('userTheme', themeKey);
    renderWithProviders(<DevGalleryScreen />);

    await waitFor(() => {
      const root = StyleSheet.flatten(screen.getByTestId('gallery-screen').props.style);
      expect(root.backgroundColor).toBe(THEMES[themeKey].palette.background);
    });
    for (const id of SECTIONS) {
      expect(screen.getByTestId(`gallery-section-${id}`)).toBeTruthy();
    }
    expect(screen.getByText('Shakshuka')).toBeTruthy();
    expect(screen.getByText('Tomato')).toBeTruthy();
    expect(screen.getByTestId('test-screen')).toBeTruthy();
  });
});
