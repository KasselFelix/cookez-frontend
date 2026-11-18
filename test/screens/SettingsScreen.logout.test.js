// Plan 019, step 3.3 (audit 2.17): logging out empties the recipe filters, so
// the next account on the phone does not inherit the origins, tags and
// servings the previous one chose.
import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import SettingsScreen from '../../screens/SettingsScreen';
import { makeUserState } from '../factories/user';
import { renderWithProviders } from '../helpers/renderWithProviders';

// The Reanimated test mock has no LinearTransition, and these rows are unrelated.
jest.mock('../../components/profile/ExpandableSettingsRow', () => () => null);

describe('SettingsScreen, logout', () => {
  afterEach(() => jest.restoreAllMocks());

  it('empties the recipe filters and returns to Home', async () => {
    // Confirm the dialog by pressing its destructive button.
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    const navigation = { navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn() };
    const { store } = renderWithProviders(<SettingsScreen navigation={navigation} />, {
      preloadedState: {
        user: makeUserState(),
        locale: { value: { lang: 'en' } },
        recipeFilters: {
          value: { selectedOrigins: ['Italy'], selectedTags: ['vegan'], currentServings: 4 },
        },
      },
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Log out'));
    });

    await waitFor(() =>
      expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] }),
    );
    expect(store.getState().recipeFilters.value).toEqual({
      selectedOrigins: [],
      selectedTags: [],
      currentServings: 1,
    });
  });
});
