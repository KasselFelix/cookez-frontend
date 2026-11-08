// recipeDetail — makes RecipeScreen complete whatever screen opened it
// (plan 017, step 2).
//
// /recipes/result ships recipes with populated ingredient rows, per-serving
// nutrition and populated comments. /recipes/all, /recipes/search, the
// profile tiles and CommentScreen do not: their ingredient rows hold bare
// ids, so the kcal pill, unit conversion and shopping list are missing, and
// a recipe absent from the Redux slice shows no comments. RecipeScreen then
// loads GET /recipes/detail/:id and merges it into the slice.

import addressIp from './addressIp';

const isObject = (value) => typeof value === 'object' && value !== null;

/**
 * True when the recipe already carries what RecipeScreen reads: comments as
 * objects and every ingredient row with its populated canonical ingredient.
 *
 * @param {object} recipe
 * @returns {boolean}
 */
export function isRecipeComplete(recipe) {
  if (!recipe?._id) return false;
  if (!Array.isArray(recipe.comments) || !recipe.comments.every(isObject)) return false;
  if (!Array.isArray(recipe.ingredients)) return false;
  return recipe.ingredients.every((row) => isObject(row?.ingredient));
}

/**
 * Loads one recipe from GET /recipes/detail/:id.
 *
 * @param {string} recipeId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object|null>} the recipe, or null when the API refuses it.
 */
export async function fetchRecipeDetail(recipeId, { signal } = {}) {
  const response = await fetch(
    `${addressIp}/recipes/detail/${encodeURIComponent(recipeId)}`,
    { signal }
  );
  const data = await response.json();
  return data?.result && isObject(data.recipe) ? data.recipe : null;
}
