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

const renderScreen = (shown = recipe, userOverrides = {}) =>
  renderWithProviders(<RecipeScreen route={{ params: { recipe: shown } }} navigation={nav} />, {
    withNavigation: false,
    preloadedState: {
      locale: { value: { lang: 'en' } },
      user: makeUserState(userOverrides),
      recipe: makeRecipeState([shown]),
    },
  });

describe('RecipeScreen vote', () => {
  it('sends the note, no username, with the token in the header', async () => {
    mockFetchJsonAlways({ result: true, votes: [{ user: 'user_test_id', note: 4 }] });
    renderScreen();

    fireEvent.press(await screen.findByLabelText(/^Rate this recipe/));
    fireEvent.press(await screen.findByRole('button', { name: 'Rate 4 out of 5' }));

    await waitFor(() => expect(voteCalls()).toHaveLength(1));
    const [url, init] = voteCalls()[0];
    expect(url).toContain('/recipes/vote/r1');
    expect(JSON.parse(init.body)).toEqual({ note: 4 });
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });
});

// Plan 021: the modal opens on the user's previous note, read from
// user.recipeVotes, or from votes[].user while the backend still sends it.
describe('RecipeScreen vote pre-fill, both backend shapes', () => {
  // How many stars of the modal are filled.
  const filledStars = () =>
    screen.queryAllByRole('button', { name: /^Rate [1-5] out of 5$/, selected: true }).length;

  const openModal = async () => {
    fireEvent.press(await screen.findByLabelText(/^Rate this recipe/));
    await screen.findByRole('button', { name: 'Rate 1 out of 5' });
  };

  it('new shape: public votes carry no user, the note comes from user.recipeVotes', async () => {
    renderScreen({ ...recipe, votes: [{ note: 2 }, { note: 4 }] }, { recipeVotes: { r1: 4 } });
    await openModal();
    expect(filledStars()).toBe(4);
    expect(voteCalls()).toHaveLength(0);
  });

  it('old shape: the note comes from votes[].user', async () => {
    renderScreen({
      ...recipe,
      votes: [
        { user: 'other', note: 1 },
        { user: 'user_test_id', note: 3 },
      ],
    });
    await openModal();
    expect(filledStars()).toBe(3);
  });

  it('null in user.recipeVotes means no vote, even if votes[].user names the user', async () => {
    renderScreen(
      { ...recipe, votes: [{ user: 'user_test_id', note: 3 }] },
      { recipeVotes: { r1: null } },
    );
    await openModal();
    expect(filledStars()).toBe(0);
  });

  it('a key missing from user.recipeVotes falls back on votes[].user', async () => {
    renderScreen(
      { ...recipe, votes: [{ user: 'user_test_id', note: 5 }] },
      { recipeVotes: { r9: 2 } },
    );
    await openModal();
    expect(filledStars()).toBe(5);
  });

  it('a vote records the note in user.recipeVotes', async () => {
    mockFetchJsonAlways({ result: true, votes: [{ note: 4 }] });
    const { store } = renderScreen();
    await openModal();

    fireEvent.press(screen.getByRole('button', { name: 'Rate 4 out of 5' }));

    await waitFor(() => expect(store.getState().user.value.recipeVotes).toEqual({ r1: 4 }));
  });
});
