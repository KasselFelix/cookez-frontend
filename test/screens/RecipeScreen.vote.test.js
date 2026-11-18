// Plan 019, step 3.1 (audit 2.15): a recipe vote sends the note only. The
// backend reads the voter from the token in the Authorization header.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeRecipeState } from '../factories/recipe';
import { makeUserState } from '../factories/user';
import { mockFetchJsonAlways } from '../mocks/api';
import RecipeScreen from '../../screens/RecipeScreen';

const TOKEN = 'a'.repeat(32);

// Shape of /recipes/result: complete, so the screen loads nothing on mount.
const recipe = {
  _id: 'r1',
  name: 'Rice bowl',
  servings: 2,
  votes: [],
  steps: ['Cook the rice'],
  origin: [],
  comments: [],
  ingredients: [
    {
      ingredient: { _id: 'i1', name: 'rice', quantity: 1, defaultUnit: 'g' },
      name: 'rice',
      quantity: 200,
      unit: 'g',
    },
  ],
  nutritionPerServing: { calories: 130 },
};

const nav = { navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() };

const voteCalls = () =>
  global.fetch.mock.calls.filter(([url]) => String(url).includes('/recipes/vote/'));

describe('RecipeScreen vote', () => {
  it('sends the note, no username, with the token in the header', async () => {
    mockFetchJsonAlways({ result: true, votes: [{ user: 'user_test_id', note: 4 }] });
    renderWithProviders(<RecipeScreen route={{ params: { recipe } }} navigation={nav} />, {
      withNavigation: false,
      preloadedState: {
        locale: { value: { lang: 'en' } },
        user: makeUserState(),
        recipe: makeRecipeState([recipe]),
      },
    });

    fireEvent.press(await screen.findByLabelText(/^Rate this recipe/));
    fireEvent.press(await screen.findByRole('button', { name: 'Rate 4 out of 5' }));

    await waitFor(() => expect(voteCalls()).toHaveLength(1));
    const [url, init] = voteCalls()[0];
    expect(url).toContain('/recipes/vote/r1');
    expect(JSON.parse(init.body)).toEqual({ note: 4 });
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });
});
