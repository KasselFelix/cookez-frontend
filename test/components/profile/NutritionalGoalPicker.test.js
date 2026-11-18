// NutritionalGoalPicker (plan 020): a failed save shows inside the modal,
// where a toast would stay hidden, and the modal stays open.
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '../../helpers/renderWithProviders';
import { mockFetchError } from '../../mocks/api';
import NutritionalGoalPicker from '../../../components/profile/NutritionalGoalPicker';

describe('NutritionalGoalPicker', () => {
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
