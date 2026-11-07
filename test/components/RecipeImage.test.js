/* global describe, it, expect */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import RecipeImage from '../../components/recipe/RecipeImage';
import recipeImages from '../../modules/images';
import { PLACEHOLDER_IMAGE_KEY } from '../../modules/recipeImage';

const render = (ui) => renderWithProviders(ui, { withNavigation: false });

describe('RecipeImage', () => {
  it('shows the photo when the source is usable', () => {
    render(<RecipeImage source={{ uri: 'https://example.com/a.jpg' }} accessibilityLabel="Ratatouille" />);
    expect(screen.getByTestId('recipe-image')).toBeTruthy();
    expect(screen.queryByTestId('recipe-image-placeholder')).toBeNull();
  });

  it.each([
    ['null', null],
    ['an empty uri', { uri: '' }],
    ['the bundled placeholder file', recipeImages[PLACEHOLDER_IMAGE_KEY]],
  ])('shows the themed placeholder for %s', (_label, source) => {
    render(<RecipeImage source={source} />);
    expect(screen.getByTestId('recipe-image-placeholder')).toBeTruthy();
    expect(screen.queryByTestId('recipe-image')).toBeNull();
  });

  it('falls back to the placeholder when the photo fails to load', () => {
    render(<RecipeImage source={{ uri: 'https://example.com/missing.jpg' }} />);
    fireEvent(screen.getByTestId('recipe-image'), 'error', { nativeEvent: { error: 'HTTP 404' } });
    expect(screen.getByTestId('recipe-image-placeholder')).toBeTruthy();
  });
});
