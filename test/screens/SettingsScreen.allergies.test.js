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

  it('warns about unknown terms inside the modal, which stays open until Close', async () => {
    global.fetch = jest.fn(async () => ({
      json: async () => ({ result: true, updated: {}, unrecognizedAllergies: ['kiwi'] }),
    }));
    await openModal();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /^(Save|Enregistrer)$/ }));
    });

    const warning = await screen.findByTestId('settings-modal-message');
    expect(warning).toHaveTextContent(/kiwi/);
    // Saved: only Close is left, and the modal is still there.
    expect(screen.queryByRole('button', { name: /^(Save|Enregistrer)$/ })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: /^(Close|Fermer)$/ }));
    expect(screen.queryByTestId('settings-modal-message')).toBeNull();
    expect(screen.queryByLabelText(/Other allergies|Autres allergies/)).toBeNull();
  });

  it('closes the modal when every term is known', async () => {
    await openModal();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /^(Save|Enregistrer)$/ }));
    });

    await waitFor(() => expect(profileCalls()).toHaveLength(1));
    expect(screen.queryByTestId('settings-modal-message')).toBeNull();
    expect(screen.queryByLabelText(/Other allergies|Autres allergies/)).toBeNull();
  });

  it('shows a failed save inside the modal, cleared by the next edit', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('Network request failed');
    });
    await openModal();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: /^(Save|Enregistrer)$/ }));
    });

    expect(await screen.findByText('Network error. Please try again.')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText(/Other allergies|Autres allergies/), 'kiwi, mango');
    expect(screen.queryByTestId('settings-modal-message')).toBeNull();
  });
});

describe('SettingsScreen, rows not built yet', () => {
  it('shows "Coming soon" in a toast, closed by touch', async () => {
    renderWithProviders(
      <SettingsScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />,
      {
        preloadedState: { user: makeUserState() },
      },
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Security & password'));
    });

    expect(screen.getByTestId('toast')).toHaveTextContent('Coming soon');
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('toast')).toBeNull();
  });
});
