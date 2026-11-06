/* global jest, describe, it, expect, beforeEach, afterEach */
// Plan 013 — the dashboard search asks the server, debounced, ranks by name
// relevance then votes, and never shows the answer to an older query.
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';

// The harness has no SafeAreaProvider; the tab bar height is irrelevant here.
jest.mock('../../hooks/useTabBarHeight', () => ({ __esModule: true, default: () => 0 }));

import UserDashboardScreen from '../../screens/UserDashboardScreen';

const recipe = (id, name, extra = {}) => ({
  _id: id,
  name,
  votes: [],
  tags: [],
  origin: [],
  comments: [],
  ingredients: [],
  imageUrl: null,
  ...extra,
});

const LOADED = [recipe('r1', 'Golompke'), recipe('r2', 'Tarte Tatin')];

const json = (body) => Promise.resolve({ json: () => Promise.resolve(body) });

// Answers per search query; a query listed in `held` waits until released.
let answers;
let held;
let searchCalls;

beforeEach(() => {
  answers = {};
  held = {};
  searchCalls = [];
  global.fetch = jest.fn((url) => {
    if (url.includes('/recipes/all')) return json({ result: true, recipes: LOADED });
    if (url.includes('/recipes/search')) {
      const q = new URL(url).searchParams.get('q');
      searchCalls.push(q);
      const body = { result: true, recipes: answers[q] || [] };
      if (held[q]) return new Promise((resolve) => { held[q] = () => resolve({ json: () => Promise.resolve(body) }); });
      return json(body);
    }
    return json({ result: false });
  });
});

afterEach(() => {
  delete global.fetch;
});

const renderScreen = () =>
  renderWithProviders(<UserDashboardScreen navigation={{ navigate: jest.fn() }} />, {
    preloadedState: { user: { value: {} }, recipe: { value: LOADED } },
  });

const typeSearch = (text) => fireEvent.changeText(screen.getByLabelText('Search recipes...'), text);

const shownRecipes = () =>
  screen.queryAllByLabelText(/^View recipe: /).map((node) => node.props.accessibilityLabel.replace('View recipe: ', ''));

describe('UserDashboardScreen search (plan 013)', () => {
  it('finds a recipe the dashboard did not load, exact name first', async () => {
    answers.japchae = [
      recipe('s2', 'Easy Japchae', { matchRank: 2, votes: [{ username: 'a', note: 5 }] }),
      recipe('s1', 'Japchae', { matchRank: 0 }),
    ];
    renderScreen();
    typeSearch('japchae');

    expect(await screen.findByText('Search results')).toBeTruthy();
    await screen.findByLabelText('View recipe: Japchae');
    expect(shownRecipes().filter((n) => n.includes('Japchae'))).toEqual(['Japchae', 'Easy Japchae']);
    expect(shownRecipes()).not.toContain('Golompke');
  });

  it('waits for the typing to stop before asking the server', async () => {
    renderScreen();
    typeSearch('ja');
    typeSearch('jap');
    typeSearch('japc');
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
    expect(searchCalls).toEqual(['japc']);
  });

  it('never shows the answer to an older query', async () => {
    held.jap = true;
    answers.jap = [recipe('old', 'Old Jap Answer', { matchRank: 1 })];
    answers.japchae = [recipe('new', 'Japchae', { matchRank: 0 })];
    renderScreen();

    typeSearch('jap');
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    typeSearch('japchae');
    await screen.findByLabelText('View recipe: Japchae');

    await act(async () => { held.jap(); await new Promise((r) => setTimeout(r, 50)); });
    expect(shownRecipes()).not.toContain('Old Jap Answer');
    expect(shownRecipes()).toContain('Japchae');
  });

  it('loads the recently viewed recipes with the token in the header, not the URL (plan 010)', async () => {
    renderWithProviders(<UserDashboardScreen navigation={{ navigate: jest.fn() }} />, {
      preloadedState: { user: { value: { token: 'session-token' } }, recipe: { value: LOADED } },
    });
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    const call = global.fetch.mock.calls.find(([url]) => url.includes('/users/me/last-viewed'));
    expect(call).toBeTruthy();
    expect(call[0]).not.toContain('session-token');
    expect(call[1].headers.Authorization).toBe('Bearer session-token');
  });

  it('does not search with one letter', async () => {
    renderScreen();
    typeSearch('j');
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
    expect(searchCalls).toEqual([]);
  });
});
