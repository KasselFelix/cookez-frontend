// Order of the community recipes on the dashboard (plan 013).
//
// Without a search: Bayesian vote score, then name. With a search: the name
// relevance computed by GET /recipes/search (`matchRank`) comes first, the vote
// score only breaks ties, then the shortest name, then the alphabet. The name tie-break keeps the same list
// in the same order on every render.

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

export function recipeAvgNote(votes) {
  if (!Array.isArray(votes) || votes.length === 0) return 0;
  return votes.reduce((sum, v) => sum + (v?.note ?? 0), 0) / votes.length;
}

/**
 * Bayesian-weighted score: combines rating quality and vote volume so a
 * 5★/1-vote recipe doesn't outrank a 4★/50-votes one. See IMDb Top 250.
 * @param {object[]} recipes
 * @param {number} [m] votes needed before a recipe's own rating dominates
 * @returns {Map<object, number>} score per recipe
 */
export function bayesianScores(recipes, m = 3) {
  const rated = recipes.filter((r) => Array.isArray(r.votes) && r.votes.length > 0);
  const C = rated.length
    ? rated.reduce((sum, r) => sum + recipeAvgNote(r.votes), 0) / rated.length
    : 0;
  return new Map(
    recipes.map((r) => {
      const v = r.votes?.length ?? 0;
      const R = recipeAvgNote(r.votes);
      return [r, v + m === 0 ? 0 : (v / (v + m)) * R + (m / (v + m)) * C];
    })
  );
}

// Same rule as the server within a match tier: fewer words, then fewer letters.
const fold = (text) => String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const byShortness = (a, b) => {
  const fa = fold(a?.name);
  const fb = fold(b?.name);
  const words = (s) => s.split(/[^a-z0-9]+/).filter(Boolean).length;
  return words(fa) - words(fb) || fa.length - fb.length;
};

const byName = (a, b) =>
  collator.compare(a?.name ?? '', b?.name ?? '') || String(a?._id ?? '').localeCompare(String(b?._id ?? ''));

/**
 * @param {object[]} recipes
 * @param {{ searching?: boolean }} [options] `searching`: rank by `matchRank` first
 * @returns {object[]} a new array
 */
export function rankRecipes(recipes, { searching = false } = {}) {
  const scores = bayesianScores(recipes);
  const rank = (r) => (Number.isInteger(r?.matchRank) ? r.matchRank : Number.MAX_SAFE_INTEGER);
  return [...recipes].sort(
    (a, b) =>
      (searching ? rank(a) - rank(b) : 0) ||
      scores.get(b) - scores.get(a) ||
      (searching ? byShortness(a, b) : 0) ||
      byName(a, b)
  );
}

/**
 * Quick filter: shortest preparation first, then name.
 * @param {object[]} recipes
 * @returns {object[]}
 */
export function rankByPreparationTime(recipes) {
  return [...recipes].sort(
    (a, b) => (a.preparationTime ?? Infinity) - (b.preparationTime ?? Infinity) || byName(a, b)
  );
}
