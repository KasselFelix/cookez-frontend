import { countryByName, flagEmoji, localizedCountryName } from './countries';

/**
 * What a ResultScreen card shows of a recipe of POST /recipes/result.
 * Missing values stay null so the card hides them ("0 min", "votes: 0").
 *
 * @param {object} recipe
 * @param {string} [locale] i18n.locale, for the country names
 * @returns {{
 *   minutes: number|null, difficulty: number|null,
 *   rating: string|null, votes: number,
 *   match: number|null, missing: number, seasonal: boolean,
 *   origins: { flag: string|null, name: string }[],
 * }}
 */
export function toResultCard(recipe, locale) {
  const votes = Array.isArray(recipe?.votes) ? recipe.votes : [];
  const notes = votes.map((v) => Number(v?.note)).filter((n) => Number.isFinite(n));
  const rating = notes.length ? (notes.reduce((a, n) => a + n, 0) / notes.length).toFixed(1) : null;

  const rawOrigins = Array.isArray(recipe?.origin) ? recipe.origin : recipe?.origin ? [recipe.origin] : [];
  const origins = rawOrigins
    .filter((name) => typeof name === 'string' && name.trim())
    .slice(0, 2)
    .map((name) => {
      // A flag only for a known country; any other origin keeps its name alone.
      const country = countryByName(name);
      return {
        flag: country?.code ? flagEmoji(country.code) : null,
        name: localizedCountryName(name, locale),
      };
    });

  return {
    minutes: recipe?.preparationTime > 0 ? recipe.preparationTime : null,
    difficulty: recipe?.difficulty != null ? recipe.difficulty : null,
    rating,
    votes: notes.length,
    match: Number.isFinite(recipe?.matchRatio) ? Math.round(recipe.matchRatio) : null,
    missing: Array.isArray(recipe?.missingIngredients) ? recipe.missingIngredients.length : 0,
    seasonal: Boolean(recipe?.isSeasonal),
    origins,
  };
}

export default toResultCard;
