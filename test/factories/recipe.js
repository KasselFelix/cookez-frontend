// Recipe fixture factory — a minimal but realistic recipe document matching
// the backend `GET /recipes/all` / `/recipes/boot` shape (comments populated).
// Use it directly as a fixture, or seed the `recipe` slice with
// `makeRecipeState` below.

let seq = 0;

/**
 * @param {Partial<{
 *   _id: string,
 *   name: string,
 *   origin: string,
 *   author: object,
 *   ingredients: any[],
 *   steps: string[],
 *   votes: any[],
 *   comments: any[],
 *   image: string,
 * }>} [overrides]
 * @returns {object} a recipe document
 */
export function makeRecipe(overrides = {}) {
  seq += 1;
  return {
    _id: `recipe_${seq}`,
    name: `Test Recipe ${seq}`,
    origin: 'italian',
    author: { _id: 'author_id', username: 'chef' },
    ingredients: [
      { name: 'tomato', quantity: 2, unit: 'pcs' },
      { name: 'pasta', quantity: 200, unit: 'g' },
    ],
    steps: ['Boil water', 'Cook pasta', 'Serve'],
    votes: [],
    comments: [], // always populated by /recipes/boot — empty array, never undefined
    image: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
    ...overrides,
  };
}

/**
 * Build N recipes at once.
 * @param {number} n
 * @returns {object[]}
 */
export function makeRecipes(n = 3) {
  return Array.from({ length: n }, () => makeRecipe());
}

export default makeRecipe;

/**
 * Preloaded `recipe` slice: the table of known recipes plus the Dashboard
 * catalog and ResultScreen lists (ids). Without `catalog`, every recipe of
 * the table is in the catalog.
 *
 * @param {object[]} table
 * @param {{ catalog?: object[], results?: object[] }} [lists]
 * @returns {{ value: object[], catalogIds: string[], resultIds: string[] }}
 */
export function makeRecipeState(table = [], { catalog = table, results = [] } = {}) {
  return {
    value: table,
    catalogIds: catalog.map((r) => String(r._id)),
    resultIds: results.map((r) => String(r._id)),
  };
}
