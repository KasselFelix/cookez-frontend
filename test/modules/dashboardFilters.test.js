/* global describe, it, expect */
// The Dashboard's Community Favorites filters, moved out of the screen
// (plan 017, point 1).
import { applyCategoryFilter, COMMUNITY_LIMIT, selectCommunityRecipes } from '../../modules/dashboardFilters';

const recipe = (id, extra = {}) => ({ _id: id, name: id, votes: [], tags: [], origin: [], ...extra });
const ids = (recipes) => recipes.map((r) => r._id);
const noFilter = {
  activeFilter: 'All',
  isSearching: false,
  requiredTags: [],
  excludedTags: [],
  requiredOrigins: [],
  excludedOrigins: [],
};

describe('applyCategoryFilter', () => {
  const recipes = [
    recipe('quick', { preparationTime: 15 }),
    recipe('slow', { preparationTime: 90, tags: ['Vegan'] }),
    recipe('cake', { tags: ['dessert'] }),
    recipe('loved', { votes: Array.from({ length: 5 }, () => ({ note: 5 })) }),
    recipe('few', { votes: [{ note: 5 }] }),
  ];

  it('keeps each chip to its recipes', () => {
    expect(ids(applyCategoryFilter(recipes, 'Quick'))).toEqual(['quick']);
    expect(ids(applyCategoryFilter(recipes, 'Vegan'))).toEqual(['slow']);
    expect(ids(applyCategoryFilter(recipes, 'Dessert'))).toEqual(['cake']);
    // Trending needs five votes or more.
    expect(ids(applyCategoryFilter(recipes, 'Trending'))).toEqual(['loved']);
    expect(applyCategoryFilter(recipes, 'All')).toHaveLength(5);
  });
});

describe('selectCommunityRecipes', () => {
  it('applies required and excluded tags and origins', () => {
    const recipes = [
      recipe('a', { tags: ['dessert'], origin: ['France'] }),
      recipe('b', { tags: ['dessert', 'nuts'], origin: ['France'] }),
      recipe('c', { tags: ['dessert'], origin: ['Japan'] }),
    ];
    const shown = selectCommunityRecipes(recipes, {
      ...noFilter,
      requiredTags: ['dessert'],
      excludedTags: ['nuts'],
      excludedOrigins: ['Japan'],
    });
    expect(ids(shown)).toEqual(['a']);
  });

  it(`shows at most ${COMMUNITY_LIMIT} recipes`, () => {
    const recipes = Array.from({ length: 30 }, (_, i) => recipe(`r${i}`));
    expect(selectCommunityRecipes(recipes, noFilter)).toHaveLength(COMMUNITY_LIMIT);
  });
});
