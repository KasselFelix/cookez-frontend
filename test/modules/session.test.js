/* global jest, describe, it, expect, beforeEach, afterEach */
// Plan 010 (S6): the session token goes in the Authorization header only, and the
// auto-login forgets a stored token on a 401 only.
import { fetchSessionUser, recordRecipeView } from '../../modules/session';

const respond = (status, body) =>
  Promise.resolve({ status, json: () => Promise.resolve(body) });

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  delete global.fetch;
});

describe('fetchSessionUser', () => {
  it('calls GET /users/me with the token in the header, not the URL', async () => {
    global.fetch.mockReturnValue(respond(200, { result: true, user: { username: 'cook' } }));
    await fetchSessionUser('stored-token');
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/users\/me$/);
    expect(url).not.toContain('stored-token');
    expect(init.headers.Authorization).toBe('Bearer stored-token');
  });

  it('puts the stored token back on the user, since the route does not echo it', async () => {
    global.fetch.mockReturnValue(respond(200, { result: true, user: { username: 'cook' } }));
    expect(await fetchSessionUser('stored-token')).toEqual({
      status: 'ok',
      user: { username: 'cook', token: 'stored-token' },
    });
  });

  it('reports an unknown token on a 401', async () => {
    global.fetch.mockReturnValue(respond(401, { result: false, error: 'Invalid token' }));
    expect(await fetchSessionUser('stale')).toEqual({ status: 'invalid' });
  });

  it.each([
    ['a server failure', () => respond(500, { result: false, error: 'Internal server error' })],
    ['a backend without the route', () => respond(404, {})],
    ['a non-JSON error page', () => Promise.resolve({ status: 502, json: () => Promise.reject(new Error('html')) })],
    ['a network failure', () => Promise.reject(new Error('offline'))],
  ])('keeps the token on %s', async (_label, reply) => {
    global.fetch.mockImplementation(reply);
    expect(await fetchSessionUser('stored-token')).toEqual({ status: 'error' });
  });
});

describe('recordRecipeView', () => {
  it('posts the recipe id with the token in the header, never in the body', async () => {
    global.fetch.mockReturnValue(respond(200, { result: true }));
    await recordRecipeView('stored-token', 'recipe-1');
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/users\/me\/last-viewed$/);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer stored-token');
    expect(JSON.parse(init.body)).toEqual({ recipeId: 'recipe-1' });
  });

  it('swallows a network failure', async () => {
    global.fetch.mockReturnValue(Promise.reject(new Error('offline')));
    await expect(recordRecipeView('stored-token', 'recipe-1')).resolves.toBeUndefined();
  });
});
