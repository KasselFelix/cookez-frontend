import addressIp from './addressIp';

/**
 * Restores the session of a stored token through GET /users/me, token in the
 * Authorization header only.
 *
 * @param {string} token Session token kept on the phone.
 * @returns {Promise<{ status: 'ok', user: object } | { status: 'invalid' } | { status: 'error' }>}
 *   `ok`: the user, with the token put back (the route does not echo it);
 *   `invalid`: 401, the server does not know the token, forget it;
 *   `error`: network or server failure, keep the token for the next launch.
 */
export async function fetchSessionUser(token) {
  try {
    const response = await fetch(`${addressIp}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) return { status: 'invalid' };
    const data = await response.json();
    if (data.result && data.user) return { status: 'ok', user: { ...data.user, token } };
    return { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

/**
 * Records a viewed recipe through POST /users/me/last-viewed. Best effort: a
 * failure never reaches the screen.
 *
 * @param {string} token Session token, sent in the Authorization header only.
 * @param {string} recipeId Viewed recipe.
 * @returns {Promise<void>}
 */
export async function recordRecipeView(token, recipeId) {
  try {
    await fetch(`${addressIp}/users/me/last-viewed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ recipeId }),
    });
  } catch {
    // Silent: the recently viewed list is a convenience.
  }
}
