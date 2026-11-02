/* global describe, it, expect, jest, beforeEach, afterEach */
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import SettingsScreen from '../../screens/SettingsScreen';
import makeUserState from '../factories/user';
import { renderWithProviders } from '../helpers/renderWithProviders';

// The Reanimated test mock has no LinearTransition, and these rows are unrelated.
jest.mock('../../components/profile/ExpandableSettingsRow', () => () => null);

const profileCalls = () =>
  global.fetch.mock.calls.filter(([url]) => String(url).includes('/users/profile'));

async function openModal() {
  renderWithProviders(<SettingsScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />, {
    preloadedState: {
      user: makeUserState({ settings: { allergy: ['soy', 'kiwi'] } }),
    },
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Allergies'));
  });
}

describe('SettingsScreen, allergies modal', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async () => ({
      json: async () => ({ result: true, updated: {} }),
    }));
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('shows stored keys as chips and the rest as free text', async () => {
    await openModal();
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(1);
    expect(screen.getByLabelText(/Other allergies|Autres allergies/).props.value).toBe('kiwi');
  });

  it('saves the chips and the free text in one list', async () => {
    await openModal();
    fireEvent.press(screen.getAllByRole('checkbox', { checked: false })[0]);
    fireEvent.changeText(screen.getByLabelText(/Other allergies|Autres allergies/), 'kiwi, ananas');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /^(Save|Enregistrer)$/ }));
    });

    await waitFor(() => expect(profileCalls()).toHaveLength(1));
    const body = JSON.parse(profileCalls()[0][1].body);
    expect(body.settings.allergy).toEqual(['soy', 'gluten', 'kiwi', 'ananas']);
  });
});
