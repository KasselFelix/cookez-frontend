/* global describe, it, expect */
// Plan 015: a scanned ingredient the analysis was unsure of carries a "To confirm"
// pill; tapping it accepts the ingredient.
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import ConfirmPill from '../../components/kickoff/ConfirmPill';

const cheddar = { data: { display_name: 'Cheddar cheese', toConfirm: true }, quantity: 1 };

describe('ConfirmPill', () => {
  it('confirms the ingredient when tapped', async () => {
    const { store } = renderWithProviders(<ConfirmPill name="Cheddar cheese" />, {
      withNavigation: false,
      preloadedState: { ingredient: { value: [cheddar] } },
    });
    fireEvent.press(await screen.findByLabelText('Confirm Cheddar cheese'));
    expect(store.getState().ingredient.value[0].data.toConfirm).toBe(false);
  });
});
