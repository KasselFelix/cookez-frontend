import { fetchRecipeResult, ApiError } from '../../modules/recipesApi';

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const err = (status, body) => ({ ok: false, status, json: async () => body });
const args = { ingredients: [], filters: {}, allergy: [] };

describe('fetchRecipeResult error handling (Plan 006 B1)', () => {
  // No afterEach reset needed: test/setup.js reinstalls a default global.fetch
  // before each test, and each test below assigns its own fetch mock.

  it('throws ApiError carrying .status on a 500 (no silent {result:false})', async () => {
    global.fetch = jest.fn().mockResolvedValue(err(500, { result: false, error: 'boom' }));
    await expect(fetchRecipeResult(args)).rejects.toMatchObject({
      name: 'ApiError', status: 500, message: 'boom',
    });
    expect(ApiError).toBeDefined();
  });

  it('returns the parsed body on a 200 (success convention unchanged)', async () => {
    const body = { result: true, recipes: [] };
    global.fetch = jest.fn().mockResolvedValue(ok(body));
    await expect(fetchRecipeResult(args)).resolves.toEqual(body);
  });
});
