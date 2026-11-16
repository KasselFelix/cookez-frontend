/* global describe, it, expect, jest, afterEach */
// Plan 019, step 3.1 (audit 2.15): editing a comment sends the message only,
// and deleting one sends no body at all. The backend reads the author from the
// token in the Authorization header.
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeUserState } from '../factories/user';
import { makeResponse } from '../mocks/api';
import CommentScreen from '../../screens/CommentScreen';

const TOKEN = 'a'.repeat(32);

const comment = {
  _id: 'c1',
  username: 'testuser',
  message: 'Tasty bowl',
  date: '2026-11-01T00:00:00.000Z',
  up: [],
  down: [],
  recipe: { _id: 'r1', name: 'Rice bowl' },
};

const nav = { navigate: jest.fn(), goBack: jest.fn() };

// GET /comments/:username lists the comment; every write succeeds.
const mockApi = () =>
  global.fetch.mockImplementation((url, init = {}) => {
    if (!init.method) {
      return Promise.resolve(makeResponse({ result: true, commentsByAuthor: [comment], stats: { totalComments: 1, totalLikesReceived: 0 } }));
    }
    return Promise.resolve(makeResponse({ result: true, comment: { ...comment, message: 'Even better' } }));
  });

const writeCalls = () => global.fetch.mock.calls.filter(([, init]) => init?.method);

const renderScreen = async () => {
  mockApi();
  renderWithProviders(<CommentScreen navigation={nav} />, {
    withNavigation: false,
    preloadedState: { user: makeUserState({ username: 'testuser' }), locale: { value: { lang: 'en' } } },
  });
  await screen.findByText('Tasty bowl');
};

describe('CommentScreen writes', () => {
  afterEach(() => jest.restoreAllMocks());

  it('edit: sends the new message, no username, with the token in the header', async () => {
    await renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Edit comment' }));
    fireEvent.changeText(screen.getByLabelText('Edit comment message'), 'Even better');
    fireEvent.press(screen.getByRole('button', { name: 'Save edited comment' }));

    await waitFor(() => expect(writeCalls()).toHaveLength(1));
    const [url, init] = writeCalls()[0];
    expect(url).toContain('/comments/update/c1');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ message: 'Even better' });
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('delete: sends no body, with the token in the header', async () => {
    // Confirm the dialog by pressing its "Delete" button.
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      buttons?.find((b) => b.text === 'Delete')?.onPress?.();
    });
    await renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Delete comment' }));

    await waitFor(() => expect(writeCalls()).toHaveLength(1));
    const [url, init] = writeCalls()[0];
    expect(url).toContain('/comments/delete/c1');
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Authorization: `Bearer ${TOKEN}` });
    await waitFor(() => expect(screen.queryByText('Tasty bowl')).toBeNull());
  });
});
