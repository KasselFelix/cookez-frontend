// Render tests for the RecipeVideoButton affordance (Plan 005 U-A16).
//
// When a recipe carries a `videoUrl`, the detail screen renders a "Watch video"
// button that opens the URL with the OS browser (Linking.openURL — the same
// project pattern as AmazonAffiliateButton). When videoUrl is null/empty the
// component renders nothing.

import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import RecipeVideoButton from '../../components/recipe/RecipeVideoButton';

describe('RecipeVideoButton', () => {
  beforeEach(() => {
    jest
      .spyOn(Linking, 'openURL')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a button when a videoUrl is present', () => {
    renderWithProviders(
      <RecipeVideoButton videoUrl="https://youtu.be/abc" />,
      { withNavigation: false },
    );
    expect(screen.getByRole('link')).toBeTruthy();
  });

  it('renders nothing when videoUrl is null', () => {
    const { toJSON } = renderWithProviders(
      <RecipeVideoButton videoUrl={null} />,
      { withNavigation: false },
    );
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when videoUrl is empty/whitespace', () => {
    const { toJSON } = renderWithProviders(
      <RecipeVideoButton videoUrl="   " />,
      { withNavigation: false },
    );
    expect(toJSON()).toBeNull();
  });

  it('opens the URL via Linking on press', () => {
    renderWithProviders(
      <RecipeVideoButton videoUrl="https://youtu.be/abc" />,
      { withNavigation: false },
    );
    fireEvent.press(screen.getByRole('link'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://youtu.be/abc');
  });

  it('exposes an accessibility label', () => {
    renderWithProviders(
      <RecipeVideoButton videoUrl="https://youtu.be/abc" />,
      { withNavigation: false },
    );
    const node = screen.getByRole('link');
    expect(node.props.accessibilityLabel).toBeTruthy();
  });
});
