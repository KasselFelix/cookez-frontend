// API-response mock helpers — drive the global `fetch` mock installed in
// test/setup.js. Tests NEVER hit the live API (addressIp); instead they set
// the next fetch resolution(s) with these helpers.
//
//   import { mockFetchJson } from '../mocks/api';
//   mockFetchJson({ result: true, recipes: makeRecipes(2) });
//   // ...code under test calls fetch()...
//   expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/recipes/all'));

/**
 * Build a Response-like object that `await response.json()` resolves to `body`.
 * @param {any} body - the JSON payload the response should return.
 * @param {object} [init]
 * @param {number} [init.status=200]
 * @param {boolean} [init.ok=true]
 * @returns {object} a minimal Response stub
 */
export function makeResponse(body, { status = 200, ok = true } = {}) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

/**
 * Make the NEXT `fetch` call resolve with `body` as JSON. Subsequent calls
 * fall back to the default setup.js implementation unless chained.
 * @param {any} body
 * @param {object} [init] - forwarded to makeResponse.
 */
export function mockFetchJson(body, init) {
  global.fetch.mockResolvedValueOnce(makeResponse(body, init));
}

/**
 * Make ALL subsequent `fetch` calls resolve with `body` (until reset).
 * Useful when the code under test fires several requests on mount.
 * @param {any} body
 * @param {object} [init]
 */
export function mockFetchJsonAlways(body, init) {
  global.fetch.mockImplementation(() => Promise.resolve(makeResponse(body, init)));
}

/**
 * Queue an ordered sequence of JSON bodies — one per fetch call, in order.
 * @param {Array<any | { body: any, init?: object }>} bodies
 */
export function mockFetchSequence(bodies) {
  bodies.forEach((entry) => {
    if (entry && typeof entry === 'object' && 'body' in entry) {
      global.fetch.mockResolvedValueOnce(makeResponse(entry.body, entry.init));
    } else {
      global.fetch.mockResolvedValueOnce(makeResponse(entry));
    }
  });
}

/**
 * Make the next `fetch` call reject (network failure path).
 * @param {Error|string} [error]
 */
export function mockFetchError(error = new Error('Network request failed')) {
  global.fetch.mockRejectedValueOnce(typeof error === 'string' ? new Error(error) : error);
}

export default mockFetchJson;
