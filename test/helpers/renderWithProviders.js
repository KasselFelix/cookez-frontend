// Reusable render harness — the frontend analogue of the backend's test
// harness. Every component / hook test should go through `renderWithProviders`
// so the provider chain matches production (App.js):
//
//   Provider(store) → ThemeProvider → [NavigationContainer] → ui
//
// `makeStore(preloadedState)` rebuilds a real store from the actual reducers
// in `reducers/`, so preloaded `.value` state behaves exactly like runtime
// state. Pass `preloadedState` to seed a slice (e.g. a logged-in user, a
// chosen locale) before the component mounts.

import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { render } from '@testing-library/react-native';

import ThemeProvider from '../../contexts/ThemeProvider';

// Import the REAL reducers so the store under test matches App.js exactly.
import user from '../../reducers/user';
import recipe from '../../reducers/recipe';
import comment from '../../reducers/comment';
import ingredient from '../../reducers/ingredient';
import recipeFilters from '../../reducers/recipeFilters';
import appConfig from '../../reducers/appConfig';
import picture from '../../reducers/picture';
import locale from '../../reducers/locale';
import notifications from '../../reducers/notifications';
import follow from '../../reducers/follow';
import pantry from '../../reducers/pantry';

/**
 * The full reducer map — kept in one place so `makeStore` and any future
 * store-aware test util stay in sync with `App.js`.
 */
export const rootReducer = {
  user,
  recipe,
  comment,
  ingredient,
  recipeFilters,
  appConfig,
  picture,
  locale,
  notifications,
  follow,
  pantry,
};

/**
 * Build a real Redux store from the production reducers.
 *
 * @param {Record<string, any>} [preloadedState] - partial state keyed by
 *   slice name, each value shaped as `{ value: ... }`. Example:
 *   `makeStore({ locale: { value: { lang: 'fr' } } })`.
 * @returns {import('@reduxjs/toolkit').EnhancedStore}
 */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // Slices like `pantry` store plain JSON; nothing needs the default
    // serializable check relaxed, but tests sometimes seed Date-free
    // fixtures so we keep the defaults.
  });
}

/**
 * Render a component inside the Cookez provider chain.
 *
 * @param {React.ReactElement} ui - the element under test.
 * @param {object} [options]
 * @param {Record<string, any>} [options.preloadedState] - seed for `makeStore`.
 * @param {import('@reduxjs/toolkit').EnhancedStore} [options.store] - pass an
 *   existing store (e.g. to dispatch actions and assert re-renders). When
 *   omitted, a fresh store is built from `preloadedState`.
 * @param {boolean} [options.withNavigation=true] - wrap in NavigationContainer.
 *   Set to `false` for pure presentational components that don't use
 *   navigation hooks (slightly faster, fewer warnings).
 * @param {object} [options.renderOptions] - forwarded to RTL's `render`.
 * @returns {ReturnType<typeof render> & { store: import('@reduxjs/toolkit').EnhancedStore }}
 */
export function renderWithProviders(
  ui,
  {
    preloadedState,
    store = makeStore(preloadedState),
    withNavigation = true,
    ...renderOptions
  } = {},
) {
  function Wrapper({ children }) {
    const inner = withNavigation ? (
      <NavigationContainer>{children}</NavigationContainer>
    ) : (
      children
    );

    return (
      <Provider store={store}>
        <ThemeProvider>{inner}</ThemeProvider>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

export default renderWithProviders;
