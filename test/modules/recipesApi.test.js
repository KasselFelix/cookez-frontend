import { fetchRecipeResult, ApiError, putUserProfile } from '../../modules/recipesApi';

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const err = (status, body) => ({ ok: false, status, json: async () => body });
const args = { ingredients: [], filters: {}, allergy: [] };

describe('fetchRecipeResult error handling (Plan 006 B1)', () => {
  // No afterEach reset needed: test/setup.js reinstalls a default global.fetch
  // before each test, and each test below assigns its own fetch mock.

  it('throws ApiError carrying .status on a 500 (no silent {result:false})', async () => {
    global.fetch = jest.fn().mockResolvedValue(err(500, { result: false, error: 'boom' }));
    await expect(fetchRecipeResult(args)).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'boom',
    });
    expect(ApiError).toBeDefined();
  });

  it('returns the parsed body on a 200 (success convention unchanged)', async () => {
    const body = { result: true, recipes: [] };
    global.fetch = jest.fn().mockResolvedValue(ok(body));
    await expect(fetchRecipeResult(args)).resolves.toEqual(body);
  });
});

describe('fetchRecipeResult session token (plan 016, PR 3)', () => {
  it('sends the token in the Authorization header, never in the body', async () => {
    global.fetch = jest.fn().mockResolvedValue(ok({ result: true, recipes: [] }));
    await fetchRecipeResult({ ...args, token: 'session-token' });
    const [, init] = global.fetch.mock.calls[0];
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer session-token',
    });
    expect(JSON.parse(init.body)).not.toHaveProperty('token');
  });

  it('sends no Authorization header for a guest', async () => {
    global.fetch = jest.fn().mockResolvedValue(ok({ result: true, recipes: [] }));
    await fetchRecipeResult(args);
    const [, init] = global.fetch.mock.calls[0];
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
  });
});

describe('putUserProfile (plan 019)', () => {
  it('PUTs the updates to /users/profile with the token in the header only', async () => {
    const body = { result: true, updated: { firstname: 'Ana' } };
    global.fetch = jest.fn().mockResolvedValue(ok(body));
    await expect(
      putUserProfile({ token: 'session-token', updates: { firstname: 'Ana' } }),
    ).resolves.toEqual(body);
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/users\/profile$/);
    expect(init.method).toBe('PUT');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer session-token',
    });
    expect(JSON.parse(init.body)).toEqual({ firstname: 'Ana' });
  });

  it('returns the error body of a refused update as is', async () => {
    global.fetch = jest.fn().mockResolvedValue(err(400, { result: false, error: 'Invalid image' }));
    await expect(putUserProfile({ token: 't', updates: { image: 'x' } })).resolves.toEqual({
      result: false,
      error: 'Invalid image',
    });
  });
});
