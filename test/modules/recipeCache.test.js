/* global describe, it, expect */
import { makeCacheKey } from '../../modules/recipeCache';

const input = { userId: 'u1', ingredientIds: ['b', 'a'], origins: [], tags: [], servings: 2 };

describe('recipeCache.makeCacheKey', () => {
  it('changes with the allergies: a cached result must not outlive a new allergy', () => {
    expect(makeCacheKey({ ...input, allergy: ['soy'] })).not.toBe(makeCacheKey({ ...input, allergy: [] }));
  });

  it('ignores the order of the allergies', () => {
    expect(makeCacheKey({ ...input, allergy: ['soy', 'nuts'] }))
      .toBe(makeCacheKey({ ...input, allergy: ['nuts', 'soy'] }));
  });

  it('treats a missing list as an empty one', () => {
    expect(makeCacheKey(input)).toBe(makeCacheKey({ ...input, allergy: [] }));
  });
});
