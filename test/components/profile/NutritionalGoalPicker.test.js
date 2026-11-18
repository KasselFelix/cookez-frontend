// NutritionalGoalPicker (plan 020): a failed save shows inside the modal,
// where a toast would stay hidden, and the modal stays open.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../../helpers/renderWithProviders';
import { mockFetchError, mockFetchJsonAlways } from '../../mocks/api';
import NutritionalGoalPicker from '../../../components/profile/NutritionalGoalPicker';

describe('NutritionalGoalPicker', () => {
  // Plan 019: the save goes through putUserProfile (modules/recipesApi.js).
  it('saves the goal by PUT /users/profile, stores the diff and closes', async () => {
    mockFetchJsonAlways({ result: true, updated: { nutritionalGoal: 'balanced' } });
    const onClose = jest.fn();
    const { store } = renderWithProviders(<NutritionalGoalPicker visible onClose={onClose} />, {
      withNavigation: false,
      preloadedState: {
        locale: { value: { lang: 'en' } },
        user: { value: { username: 'chef', token: 'tok', nutritionalGoal: null } },
      },
    });

    fireEvent.press(screen.getByLabelText('Balanced'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(store.getState().user.value.nutritionalGoal).toBe('balanced');
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.invalid/users/profile');
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({ nutritionalGoal: 'balanced' });
  });

  it('shows a network error inside the modal and keeps it open', async () => {
    mockFetchError();
    const onClose = jest.fn();
    renderWithProviders(<NutritionalGoalPicker visible onClose={onClose} />, {
      withNavigation: false,
      preloadedState: {
        locale: { value: { lang: 'en' } },
        user: { value: { username: 'chef', token: 'tok', nutritionalGoal: null } },
      },
    });

    fireEvent.press(screen.getByLabelText('Balanced'));

    expect(await screen.findByText('Network error. Please try again.')).toBeTruthy();
    expect(screen.getByTestId('goal-error')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
