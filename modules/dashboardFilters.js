// dashboardFilters — the Dashboard's "Community Favorites" list: category
// chip, tag and origin filters, then ranking. Pure, so it is tested without
// rendering the screen.

import { rankByPreparationTime, rankRecipes } from './recipeRanking';

export const DASHBOARD_FILTERS = ['All', 'Quick', 'Vegan', 'Dessert', 'Trending'];

// The list shows at most this many recipes.
export const COMMUNITY_LIMIT = 15;

const hasTag = (recipe, tag) => recipe.tags?.some?.((t) => t?.toLowerCase() === tag);

/**
 * Keeps the recipes matching one category chip.
 *
 * @param {object[]} recipes
 * @param {string} filter - one of DASHBOARD_FILTERS
 * @returns {object[]}
 */
export function applyCategoryFilter(recipes, filter) {
  switch (filter) {
    case 'Quick':
      return recipes.filter((r) => r.preparationTime <= 20);
    case 'Vegan':
      return recipes.filter((r) => hasTag(r, 'vegan'));
    case 'Dessert':
      return recipes.filter((r) => hasTag(r, 'dessert'));
    case 'Trending':
      return recipes.filter((r) => {
        const votes = r.votes ?? [];
        if (votes.length < 5) return false;
        const avg = votes.reduce((sum, v) => sum + (v?.note ?? 0), 0) / votes.length;
        return avg >= 4.0;
      });
    default:
      return recipes;
  }
}

/**
 * The recipes the Community Favorites section shows.
 *
 * @param {object[]} recipes - the catalog, or the server search hits
 * @param {{
 *   activeFilter: string,
 *   isSearching: boolean,
 *   requiredTags: string[],
 *   excludedTags: string[],
 *   requiredOrigins: string[],
 *   excludedOrigins: string[],
 * }} options
 * @returns {object[]}
 */
export function selectCommunityRecipes(recipes, {
  activeFilter,
  isSearching,
  requiredTags,
  excludedTags,
  requiredOrigins,
  excludedOrigins,
}) {
  let filtered = applyCategoryFilter(recipes, activeFilter);
  if (requiredTags.length > 0) {
    filtered = filtered.filter((r) => requiredTags.every((tag) => hasTag(r, tag)));
  }
  if (excludedTags.length > 0) {
    filtered = filtered.filter((r) => !excludedTags.some((tag) => hasTag(r, tag)));
  }
  // Origins: any required one matches; no excluded one may match.
  if (requiredOrigins.length > 0) {
    filtered = filtered.filter((r) => r.origin?.some((o) => requiredOrigins.includes(o)));
  }
  if (excludedOrigins.length > 0) {
    filtered = filtered.filter((r) => !r.origin?.some((o) => excludedOrigins.includes(o)));
  }
  // With a search, the name relevance wins over every filter's own order.
  if (isSearching || activeFilter === 'All' || activeFilter === 'Vegan' || activeFilter === 'Dessert') {
    return rankRecipes(filtered, { searching: isSearching }).slice(0, COMMUNITY_LIMIT);
  }
  if (activeFilter === 'Quick') {
    return rankByPreparationTime(filtered).slice(0, COMMUNITY_LIMIT);
  }
  return [...filtered].reverse().slice(0, COMMUNITY_LIMIT);
}
