/* global jest, describe, it, expect, beforeEach, afterEach */
// Plan 017, point 1 — back from ResultScreen (Android back gesture), the
// Dashboard showed "No recipe yet" and stayed there: ResultScreen had replaced
// the shared recipe list with its search results. The Dashboard keeps its
// catalog whatever the search returns, and shows the empty state only when
// the database has no recipe.
import React from 'react';
import { act, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeRecipeState } from '../factories/recipe';
import { setResultRecipes } from '../../reducers/recipe';

jest.mock('../../hooks/useTabBarHeight', () => ({ __esModule: true, default: () => 0 }));

import UserDashboardScreen from '../../screens/UserDashboardScreen';

const recipe = (id, name) => ({
  _id: id, name, votes: [], tags: [], origin: [], comments: [], ingredients: [], imageUrl: null,
});
const CATALOG = [recipe('c1', 'Golompke'), recipe('c2', 'Tarte Tatin')];

const json = (body, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) });
let allAnswer;

beforeEach(() => {
  allAnswer = () => json({ result: true, recipes: CATALOG });
  global.fetch = jest.fn((url) => (url.includes('/recipes/all') ? allAnswer() : json({ result: false })));
});

afterEach(() => {
  delete global.fetch;
});

const renderScreen = (recipeState) =>
  renderWithProviders(<UserDashboardScreen navigation={{ navigate: jest.fn() }} />, {
    preloadedState: { user: { value: {} }, recipe: recipeState },
  });

const shownRecipes = () =>
  screen.queryAllByLabelText(/^View recipe: /).map((node) => node.props.accessibilityLabel.replace('View recipe: ', ''));

describe('UserDashboardScreen and ResultScreen (plan 017, point 1)', () => {
  it('keeps the catalog when a search returns no recipe', async () => {
    const { store } = renderScreen(makeRecipeState(CATALOG));
    expect(await screen.findByLabelText('View recipe: Golompke')).toBeTruthy();

    // ResultScreen, still mounted above the Dashboard, stores an empty search.
    await act(async () => { store.dispatch(setResultRecipes([])); });

    expect(shownRecipes().sort()).toEqual(['Golompke', 'Tarte Tatin']);
    expect(screen.queryByText('No recipes yet')).toBeNull();
  });

  it('does not show the search results in place of the catalog', async () => {
    const { store } = renderScreen(makeRecipeState(CATALOG));
    await screen.findByLabelText('View recipe: Golompke');

    await act(async () => { store.dispatch(setResultRecipes([recipe('r1', 'Apple Salad')])); });

    expect(shownRecipes().sort()).toEqual(['Golompke', 'Tarte Tatin']);
  });

  it('shows the empty state only when the database has no recipe', async () => {
    // GET /recipes/all answers 200 { result: false } on an empty collection.
    allAnswer = () => json({ result: false, error: 'No recipe found' });
    renderScreen(makeRecipeState());
    expect(await screen.findByText('No recipes yet')).toBeTruthy();
  });

  it('shows the error state, not the empty one, when the catalog fails to load', async () => {
    allAnswer = () => json({ status: 'Internal server error' }, false);
    renderScreen(makeRecipeState());
    expect(await screen.findByLabelText('Retry loading recipes')).toBeTruthy();
    expect(screen.queryByText('No recipes yet')).toBeNull();
  });
});
