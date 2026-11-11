/* global describe, it, expect, jest */
// Plan 017, step 2: RecipeScreen shows the same thing whatever screen opened
// it. A recipe from the Dashboard (/recipes/all), the profile or CommentScreen
// lacks its populated ingredients and comments: the screen loads
// GET /recipes/detail/:id. A recipe from ResultScreen is already complete.
import React from 'react';
import { screen, waitFor } from '@testing-library/react-native';

import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeRecipeState } from '../factories/recipe';
import { mockFetchJsonAlways } from '../mocks/api';
import RecipeScreen from '../../screens/RecipeScreen';

const comment = {
  _id: 'c1',
  username: 'chef',
  message: 'Tasty bowl',
  date: '2026-11-01T00:00:00.000Z',
  up: [],
  down: [],
  usersAlreadyUpVoted: [],
  usersAlreadyDownVoted: [],
};

const base = {
  _id: 'r1',
  name: 'Rice bowl',
  servings: 2,
  votes: [],
  steps: ['Cook the rice'],
  origin: [],
};

// Shape of /recipes/all: ingredient rows hold bare ids, no nutrition.
const listRecipe = {
  ...base,
  comments: [comment],
  ingredients: [{ ingredient: 'i1', name: 'rice', quantity: 200, unit: 'g' }],
};

// Shape of /recipes/detail/:id and /recipes/result.
const fullRecipe = {
  ...base,
  comments: [comment],
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

function renderRecipe({ navRecipe, stored }) {
  return renderWithProviders(
    <RecipeScreen route={{ params: { recipe: navRecipe } }} navigation={nav} />,
    {
      withNavigation: false,
      preloadedState: {
        locale: { value: { lang: 'en' } },
        recipe: makeRecipeState(stored),
      },
    },
  );
}

const detailCalls = () =>
  global.fetch.mock.calls.filter(([url]) => String(url).includes('/recipes/detail/'));

describe('RecipeScreen by screen of origin', () => {
  it('from the Dashboard: loads the detail and shows the kcal pill', async () => {
    mockFetchJsonAlways({ result: true, recipe: fullRecipe });
    renderRecipe({ navRecipe: listRecipe, stored: [listRecipe] });

    expect(await screen.findByText('130 kcal')).toBeTruthy();
    expect(detailCalls()).toHaveLength(1);
    expect(detailCalls()[0][0]).toContain('/recipes/detail/r1');
    expect(screen.getByText('Tasty bowl')).toBeTruthy();
  });

  it('from the profile or CommentScreen: shows the comments of a recipe absent from the slice', async () => {
    mockFetchJsonAlways({ result: true, recipe: fullRecipe });
    // Profile tiles pass a partial recipe whose comments are ids.
    renderRecipe({
      navRecipe: { ...base, comments: ['c1'], ingredients: listRecipe.ingredients },
      stored: [],
    });

    expect(await screen.findByText('Tasty bowl')).toBeTruthy();
    expect(screen.getByText('130 kcal')).toBeTruthy();
  });

  it('from ResultScreen: the complete recipe is not loaded again', async () => {
    renderRecipe({ navRecipe: fullRecipe, stored: [fullRecipe] });

    expect(await screen.findByText('130 kcal')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Tasty bowl')).toBeTruthy());
    expect(detailCalls()).toHaveLength(0);
  });

  it('when the detail fails: keeps the partial recipe without crashing', async () => {
    mockFetchJsonAlways({ result: false, error: 'Recipe not found' });
    renderRecipe({ navRecipe: listRecipe, stored: [listRecipe] });

    await waitFor(() => expect(detailCalls()).toHaveLength(1));
    expect((await screen.findAllByText('Rice bowl')).length).toBeGreaterThan(0);
    expect(screen.queryByText('130 kcal')).toBeNull();
  });

  it('when the detail fails for a recipe without a name: shows "Recipe not found."', async () => {
    mockFetchJsonAlways({ result: false, error: 'Recipe not found' });
    renderRecipe({ navRecipe: { _id: 'gone' }, stored: [] });

    expect(await screen.findByText('Recipe not found.')).toBeTruthy();
  });
});
