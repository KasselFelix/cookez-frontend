// Render-resilience tests for the Recipe card (Plan 005 U-A16).
//
// The card is shared by ResultScreen + FavoriteScreen and now receives
// imported catalog recipes with null-heavy shapes. It must render without
// crashing and never surface literal "null"/"undefined" text.

import React from 'react';
import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import Recipe from '../../components/Recipe';

const navigation = { navigate: jest.fn() };

const baseProps = {
  _id: 'r1',
  name: 'Imported Dish',
  navigation,
};

function renderCard(extra = {}) {
  return renderWithProviders(<Recipe {...baseProps} {...extra} />, {
    withNavigation: false,
  });
}

describe('Recipe card resilience', () => {
  it('renders the name with a fully null-heavy recipe', () => {
    renderCard({
      description: null,
      origin: [],
      difficulty: null,
      preparationTime: null,
      votes: undefined,
      picture: null,
      imageUrl: null,
    });
    expect(screen.getByText('Imported Dish')).toBeTruthy();
  });

  it('never renders literal "null" or "undefined" text', () => {
    renderCard({
      difficulty: null,
      preparationTime: null,
      origin: null,
      votes: null,
      picture: null,
      imageUrl: null,
    });
    expect(screen.queryAllByText(/null/i)).toHaveLength(0);
    expect(screen.queryAllByText(/undefined/i)).toHaveLength(0);
  });

  it('does not render the difficulty/time row when both are missing', () => {
    renderCard({ difficulty: null, preparationTime: null });
    // No "/5" difficulty and no trailing "m" minutes literal.
    expect(screen.queryByText(/\/5/)).toBeNull();
  });

  it('renders difficulty and prep time when present', () => {
    renderCard({ difficulty: 3, preparationTime: 25 });
    expect(screen.getByText(/3\/5/)).toBeTruthy();
    expect(screen.getByText(/25/)).toBeTruthy();
  });

  it('renders an image even when picture/imageUrl are null (placeholder fallback)', () => {
    renderCard({ picture: null, imageUrl: null });
    // The card image carries a stable testID so we can assert it mounted with
    // a non-empty source (placeholder).
    const img = screen.getByTestId('recipe-card-image');
    const source = img.props.source;
    // local require resolves to a number/object, never { uri: '' }
    if (source && typeof source === 'object' && 'uri' in source) {
      expect(source.uri).toBeTruthy();
    } else {
      expect(source).toBeDefined();
    }
  });

  it('uses the http imageUrl directly when present', () => {
    renderCard({ imageUrl: 'https://images.pexels.com/p/1.jpg', picture: null });
    const img = screen.getByTestId('recipe-card-image');
    expect(img.props.source).toEqual({
      uri: 'https://images.pexels.com/p/1.jpg',
    });
  });
});
