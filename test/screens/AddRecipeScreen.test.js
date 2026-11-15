/* global describe, it, expect, jest, beforeEach, afterEach */
// Plan 019, steps 3.1 and 3.2: publishing a recipe.
// - The name placed in the upload URL is encoded: a `?`, `#` or `/` in the
//   recipe name no longer cuts the path (the server cleans the name itself).
// - /recipes/add takes `picture` from the upload response, and its body holds
//   no username, date, votes or comments: the server sets them.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeUserState } from '../factories/user';
import { mockFetchSequence } from '../mocks/api';
import AddRecipeScreen from '../../screens/AddRecipeScreen';

const TOKEN = 'a'.repeat(32);
const STORED_ID = 'user_test_id_Tarte-Tatin-1731398400000';

const nav = { navigate: jest.fn(), goBack: jest.fn() };

describe('AddRecipeScreen publish', () => {
  const originalAlert = global.alert;
  beforeEach(() => { global.alert = jest.fn(); });
  afterEach(() => { global.alert = originalAlert; });

  it('encodes the upload name and publishes with the picture id the server gave', async () => {
    mockFetchSequence([
      { result: true, url: 'https://res.cloudinary.com/x.jpg', id: STORED_ID, picture: STORED_ID },
      { result: true },
    ]);
    renderWithProviders(<AddRecipeScreen navigation={nav} />, {
      withNavigation: false,
      preloadedState: { user: makeUserState(), picture: { value: 'file:///photo.jpg' } },
    });

    fireEvent.changeText(screen.getByPlaceholderText('name*'), ' Tarte?#/Tatin ');
    // MyButton runs its action when the release animation ends.
    fireEvent(screen.getByRole('button', { name: 'Add Recipe' }), 'pressOut');

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    const [[uploadUrl, uploadInit], [addUrl, addInit]] = global.fetch.mock.calls;

    expect(uploadUrl).toMatch(/\/upload\/Tarte%3F%23%2FTatin_\d+$/);
    expect(uploadInit.headers).toEqual({ Authorization: `Bearer ${TOKEN}` });

    expect(addUrl).toContain('/recipes/add');
    const body = JSON.parse(addInit.body);
    expect(body.picture).toBe(STORED_ID);
    expect(body.name).toBe(' Tarte?#/Tatin ');
    for (const key of ['username', 'date', 'votes', 'comments']) {
      expect(body).not.toHaveProperty(key);
    }
    await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Recipe successfully added!'));
    // The first render of this screen passes 5 s when the whole suite runs in
    // parallel; alone, it takes well under that.
  }, 15000);
});
