import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react-native';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeRecipeState } from '../factories/recipe';

// Mock the three external collaborators so we drive each terminal state.
jest.mock('../../modules/recipesApi', () => {
  class ApiError extends Error {
    constructor(message, { status } = {}) { super(message); this.name = 'ApiError'; this.status = status; }
  }
  return { __esModule: true, ApiError, fetchRecipeResult: jest.fn() };
});
jest.mock('../../hooks/useConnectivity', () => ({ useConnectivity: jest.fn() }));
jest.mock('../../modules/recipeCache', () => ({
  getCachedResult: jest.fn(),
  setCachedResult: jest.fn(),
  makeCacheKey: jest.fn(() => 'k'),
}));

import ResultScreen from '../../screens/ResultScreen';
import { fetchRecipeResult, ApiError } from '../../modules/recipesApi';
import { useConnectivity } from '../../hooks/useConnectivity';
import { getCachedResult } from '../../modules/recipeCache';

const preloadedState = {
  user: { value: {} },
  ingredient: { value: [{ data: { _id: 'ing1', display_name: 'apple', g_per_serving: 100, unit: 'g' } }] },
  recipeFilters: { value: { selectedTags: [], selectedOrigins: [], currentServings: 1 } },
  recipe: makeRecipeState(),
};
const nav = { navigate: jest.fn() };
const renderScreen = () =>
  renderWithProviders(<ResultScreen navigation={nav} />, { preloadedState, withNavigation: false });

beforeEach(() => { jest.clearAllMocks(); });

describe('ResultScreen error states (Plan 006 B2)', () => {
  it('shows ErrorScreen (not OfflineScreen) on a server 500 while online', async () => {
    useConnectivity.mockReturnValue({ isConnected: true, isInternetReachable: true });
    fetchRecipeResult.mockRejectedValue(new ApiError('boom', { status: 500 }));
    getCachedResult.mockResolvedValue(null);
    renderScreen();
    expect(await screen.findByTestId('result-error-screen')).toBeTruthy();
    expect(screen.queryByTestId('result-offline-screen')).toBeNull();
  });

  it('shows OfflineScreen when genuinely offline with no cache', async () => {
    useConnectivity.mockReturnValue({ isConnected: false, isInternetReachable: false });
    getCachedResult.mockResolvedValue(null);
    renderScreen();
    expect(await screen.findByTestId('result-offline-screen')).toBeTruthy();
  });

  it('falls back to stale cache on a server error when a cache exists', async () => {
    useConnectivity.mockReturnValue({ isConnected: true, isInternetReachable: true });
    fetchRecipeResult.mockRejectedValue(new ApiError('boom', { status: 500 }));
    getCachedResult.mockResolvedValue({ data: { recipes: [{ _id: 'r1', name: 'Cached Dish' }] }, stale: true });
    renderScreen();
    expect(await screen.findByText('Cached Dish')).toBeTruthy();
    expect(screen.queryByTestId('result-error-screen')).toBeNull();
  });

  it('shows ErrorScreen after the 15s timeout when the request hangs (online)', async () => {
    jest.useFakeTimers();
    useConnectivity.mockReturnValue({ isConnected: true, isInternetReachable: true });
    getCachedResult.mockResolvedValue(null);
    // Hang until aborted, then reject as AbortError — faithful to a real fetch.
    fetchRecipeResult.mockImplementation(({ signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => {
        const e = new Error('Aborted'); e.name = 'AbortError'; reject(e);
      });
    }));
    renderScreen();
    await jest.advanceTimersByTimeAsync(15000);
    expect(await screen.findByTestId('result-error-screen')).toBeTruthy();
    jest.useRealTimers(); // assert BEFORE restoring real timers (avoids flake)
  });

  it('re-fetches when Retry is pressed (online recovery)', async () => {
    useConnectivity.mockReturnValue({ isConnected: true, isInternetReachable: true });
    getCachedResult.mockResolvedValue(null);
    // 1st call fails (500 -> ErrorScreen); after Retry, 2nd call succeeds.
    fetchRecipeResult
      .mockRejectedValueOnce(new ApiError('boom', { status: 500 }))
      .mockResolvedValueOnce({ result: true, recipes: [{ _id: 'r9', name: 'Recovered Dish' }] });
    renderScreen();
    // The retry CTA of ErrorScreen (the result list also has a back button).
    const errorScreen = await screen.findByTestId('result-error-screen');
    const retry = within(errorScreen).getByRole('button');
    fireEvent.press(retry);
    expect(await screen.findByText('Recovered Dish')).toBeTruthy();
    expect(screen.queryByTestId('result-error-screen')).toBeNull();
  });
});
