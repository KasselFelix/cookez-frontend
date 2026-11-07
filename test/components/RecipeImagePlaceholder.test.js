import React from 'react';
import { StyleSheet } from 'react-native';
import { screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { renderWithProviders } from '../helpers/renderWithProviders';
import { THEMES, THEME_KEYS } from '../../styles/themes';
import RecipeImagePlaceholder from '../../components/recipe/RecipeImagePlaceholder';

describe('RecipeImagePlaceholder', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it.each(THEME_KEYS)('uses the %s theme surface, with an accessible label', async (themeKey) => {
    await AsyncStorage.setItem('userTheme', themeKey);
    renderWithProviders(<RecipeImagePlaceholder />, { withNavigation: false });

    await waitFor(() => {
      const root = StyleSheet.flatten(screen.getByTestId('recipe-image-placeholder').props.style);
      expect(root.backgroundColor).toBe(THEMES[themeKey].card.tagBg);
    });
    expect(screen.getByLabelText('No photo for this recipe yet')).toBeTruthy();
  });
});
