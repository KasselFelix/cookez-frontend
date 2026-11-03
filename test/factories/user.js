// User-state factory — produces a `{ value: {...} }` object matching the
// shape stored by `reducers/user.js`. Use it to seed `preloadedState.user`
// when a component needs a logged-in user.
//
//   renderWithProviders(<Profile />, {
//     preloadedState: { user: makeUserState({ username: 'alex' }) },
//   });

/**
 * @param {Partial<{
 *   _id: string,
 *   username: string,
 *   token: string,
 *   email: string,
 *   favorites: any[],
 *   recipes: any[],
 *   allergy: string[],
 * }>} [overrides]
 * @returns {{ value: object }} a redux-ready user slice value
 */
export function makeUserState(overrides = {}) {
  return {
    value: {
      _id: 'user_test_id',
      username: 'testuser',
      token: 'a'.repeat(32), // uid2 tokens are 32 chars
      email: 'test@cookez.app',
      favorites: [],
      recipes: [],
      allergy: [],
      ...overrides,
    },
  };
}

/**
 * The "logged out" user slice value — mirrors the reducer's reset shape.
 * @returns {{ value: { username: null, token: null } }}
 */
export function makeLoggedOutUserState() {
  return { value: { username: null, token: null } };
}

export default makeUserState;
