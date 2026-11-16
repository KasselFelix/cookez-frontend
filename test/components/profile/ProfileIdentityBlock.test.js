/* global describe, it, expect */
// Plan 017, step 9: the diet pill of the profile reads `dietRestrictions[]`
// (written by DietMultiSelect), falls back to the legacy `settings.diet`
// string, and goes through i18n.
import React from 'react';
import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '../../helpers/renderWithProviders';
import ProfileIdentityBlock from '../../../components/profile/ProfileIdentityBlock';

const fr = { locale: { value: { lang: 'fr' } } };

function renderBlock(user) {
  return renderWithProviders(<ProfileIdentityBlock user={user} />, {
    withNavigation: false,
    preloadedState: fr,
  });
}

describe('ProfileIdentityBlock diet pill', () => {
  it('shows the restriction saved by DietMultiSelect', async () => {
    renderBlock({ username: 'chef', dietRestrictions: ['gluten_free'], settings: {} });
    expect(await screen.findByText('Sans gluten')).toBeTruthy();
  });

  it('shows the first restriction and how many more', async () => {
    renderBlock({
      username: 'chef',
      dietRestrictions: ['no_pork', 'no_nuts', 'dairy_free'],
      settings: { diet: '' },
    });
    expect(await screen.findByText('Sans porc +2')).toBeTruthy();
  });

  it('falls back to the legacy settings.diet string', async () => {
    renderBlock({ username: 'chef', dietRestrictions: [], settings: { diet: 'no_meat' } });
    expect(await screen.findByText('Sans viande')).toBeTruthy();
  });

  it('shows a translated empty state without any restriction', async () => {
    renderBlock({ username: 'chef', settings: {} });
    expect(await screen.findByText('Aucun régime')).toBeTruthy();
  });
});
