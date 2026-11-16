/* global describe, it, expect, jest */
// Plan 017, step 9: emptying the list must not bring back the legacy
// single `settings.diet`, which readDietRestrictions falls back to.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../../helpers/renderWithProviders';
import { mockFetchJsonAlways } from '../../mocks/api';
import DietMultiSelect from '../../../components/profile/DietMultiSelect';

describe('DietMultiSelect', () => {
  it('clears the legacy diet when the user unticks every restriction', async () => {
    mockFetchJsonAlways({ result: true, updated: { dietRestrictions: [], settings: { diet: '' } } });
    const onClose = jest.fn();
    renderWithProviders(<DietMultiSelect visible onClose={onClose} />, {
      withNavigation: false,
      preloadedState: {
        locale: { value: { lang: 'en' } },
        user: { value: { username: 'chef', token: 'tok', dietRestrictions: [], settings: { diet: 'gluten_free' } } },
      },
    });

    fireEvent.press(await screen.findByLabelText('Gluten free'));
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [, init] = global.fetch.mock.calls.find(([url]) => String(url).includes('/users/profile'));
    expect(JSON.parse(init.body)).toEqual({ dietRestrictions: [], diet: '' });
  });
});
