// Plan 019: the avatar choice saves through putUserProfile
// (modules/recipesApi.js), like the other PUT /users/profile of the app.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import ProfileScreen from '../../screens/ProfileScreen';
import { makeUserState } from '../factories/user';
import { makeResponse } from '../mocks/api';
import { renderWithProviders } from '../helpers/renderWithProviders';

const TOKEN = 'a'.repeat(32);

// Every load of the screen (notifications, badges, pantry) gets an empty
// answer; the avatar save gets the diff the back sends.
const answer = (url) => {
  if (String(url).endsWith('/users/profile')) {
    return { result: true, updated: { image: 'avatar_M3' } };
  }
  if (String(url).includes('/notifications')) return { result: true, unread: 0 };
  if (String(url).includes('/badges')) return { result: true, badges: [] };
  return { result: true, items: [] };
};

describe('ProfileScreen, avatar', () => {
  it('saves the chosen avatar by PUT /users/profile and stores the diff', async () => {
    global.fetch.mockImplementation((url) => Promise.resolve(makeResponse(answer(url))));
    const navigation = { navigate: jest.fn(), setParams: jest.fn() };
    const { store } = renderWithProviders(<ProfileScreen navigation={navigation} />, {
      preloadedState: {
        user: makeUserState({ username: 'chef', token: TOKEN, image: 'avatar_F2' }),
        locale: { value: { lang: 'en' } },
      },
    });

    fireEvent.press(await screen.findByLabelText('Change avatar'));
    fireEvent.press(await screen.findByLabelText('Choose avatar_M3'));

    await waitFor(() => expect(store.getState().user.value.image).toBe('avatar_M3'));
    const saves = global.fetch.mock.calls.filter(([url]) => url.endsWith('/users/profile'));
    expect(saves).toHaveLength(1);
    const [url, init] = saves[0];
    expect(url).toBe('https://api.invalid/users/profile');
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(init.body)).toEqual({ image: 'avatar_M3' });
  });
});
