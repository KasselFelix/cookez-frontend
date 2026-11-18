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
      return Promise.resolve(
        makeResponse({
          result: true,
          commentsByAuthor: [comment],
          stats: { totalComments: 1, totalLikesReceived: 0 },
        }),
      );
    }
    return Promise.resolve(
      makeResponse({ result: true, comment: { ...comment, message: 'Even better' } }),
    );
  });

const writeCalls = () => global.fetch.mock.calls.filter(([, init]) => init?.method);

const renderScreen = async () => {
  mockApi();
  renderWithProviders(<CommentScreen navigation={nav} />, {
    withNavigation: false,
    preloadedState: {
      user: makeUserState({ username: 'testuser' }),
      locale: { value: { lang: 'en' } },
    },
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

  it('edit: shows a failed save inside the modal, cleared by typing', async () => {
    await renderScreen();
    global.fetch.mockImplementation((url, init = {}) =>
      init.method
        ? Promise.reject(new Error('Network request failed'))
        : Promise.resolve(makeResponse({ result: true })),
    );
    jest.spyOn(console, 'error').mockImplementation(() => {});

    fireEvent.press(screen.getByRole('button', { name: 'Edit comment' }));
    fireEvent.changeText(screen.getByLabelText('Edit comment message'), 'Even better');
    fireEvent.press(screen.getByRole('button', { name: 'Save edited comment' }));

    expect(await screen.findByText('Network error: your changes were not saved.')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Edit comment message'), 'Even better!');
    expect(screen.queryByTestId('comment-edit-error')).toBeNull();
  });

  it('delete: keeps the confirmation dialog and shows a failure in a toast', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      buttons?.find((b) => b.text === 'Delete')?.onPress?.();
    });
    await renderScreen();
    global.fetch.mockImplementation(() =>
      Promise.resolve(makeResponse({ result: false, error: 'Not your comment' })),
    );

    fireEvent.press(screen.getByRole('button', { name: 'Delete comment' }));

    expect(alert).toHaveBeenCalledWith('Delete review?', expect.any(String), expect.any(Array));
    expect(await screen.findByTestId('toast')).toHaveTextContent('Not your comment');
    expect(screen.getByText('Tasty bowl')).toBeTruthy();
  });
});
