/**
 * ingredientGroups.js
 *
 * Pure utility for grouping recipe ingredient rows that share a non-null
 * `altGroup` value into a single "X or Y" display row.
 *
 * BACKGROUND
 * ----------
 * The backend models "butter or margarine"-style alternatives as separate
 * recipe-ingredient rows that share a recipe-local `altGroup` integer. Rows
 * with `altGroup: null` (or missing) are standalone and pass through unchanged.
 * Today NO recipe has `altGroup` populated, so this function is strictly
 * forward-compatible: an all-null input reproduces the input array exactly.
 *
 * GROUPING CONTRACT
 * -----------------
 * - Rows within the same `altGroup` are collapsed into ONE output row.
 * - The output row is placed at the position of the FIRST member in the
 *   original list (list order is preserved).
 * - The first member's `displayQuantity` and `displayUnit` are used for the
 *   group (other members carry null quantity per the backend contract).
 * - `displayName` on the output row is the joined names: "butter or margarine".
 *   The connector string ("or") must be supplied by the caller so this module
 *   stays locale-free.
 * - `isAltGroup: true` is set on merged rows so the renderer can apply a
 *   distinct `accessibilityLabel`.
 *
 * @module ingredientGroups
 */

/**
 * Group alternative-ingredient rows by `altGroup`.
 *
 * @param {Array<object>} scaledIngredients - the already-scaled ingredient
 *   array from RecipeScreen. Each item has at minimum: `{ name, displayQuantity,
 *   displayUnit, altGroup }`. `altGroup` is an integer or null/undefined.
 * @param {string} connector - localised connector inserted between names,
 *   e.g. "or" (en) or "ou" (fr). Never hardcoded here.
 * @returns {Array<object>} Flat array preserving original order, with grouped
 *   rows collapsed. Each item carries all original fields, plus:
 *   - `displayName` {string} — joined names (equals `name` for standalone rows)
 *   - `isAltGroup` {boolean} — true only for multi-member groups
 */
/**
 * The rows to buy from: without the group members /recipes/result flagged with
 * `blockedByAllergy`. The quantity of a group sits on its first member, so a safe
 * member takes over the quantity of the blocked one.
 *
 * @param {Array<object>} ingredients - raw `recipe.ingredients`
 * @returns {Array<object>}
 */
export function withoutBlockedMembers(ingredients = []) {
  return ingredients
    .filter((row) => !row.blockedByAllergy)
    .map((row) => {
      if (row.altGroup == null || row.quantity) return row;
      const blocked = ingredients.find((r) => r.blockedByAllergy && r.altGroup === row.altGroup);
      return blocked ? { ...row, quantity: blocked.quantity, unit: blocked.unit } : row;
    });
}

export function groupIngredients(scaledIngredients, connector) {
  if (!Array.isArray(scaledIngredients) || scaledIngredients.length === 0) {
    return [];
  }

  // Pass 1 — collect group members keyed by altGroup, tracking insertion index.
  // We use a Map to preserve first-seen order.
  /** @type {Map<number, { firstIndex: number, members: Array<object> }>} */
  const groups = new Map();
  /** @type {Set<number>} altGroup values that have appeared more than once */
  const seen = new Set();

  scaledIngredients.forEach((ing, idx) => {
    const key = ing.altGroup;
    if (key == null) return; // standalone — skip

    if (!groups.has(key)) {
      groups.set(key, { firstIndex: idx, members: [] });
    }
    groups.get(key).members.push(ing);
    seen.add(key);
  });

  // Pass 2 — build output in original order, replacing each group with a
  // single merged row at the position of its first member.
  const output = [];
  /** @type {Set<number>} altGroup keys already emitted */
  const emitted = new Set();

  scaledIngredients.forEach((ing) => {
    const key = ing.altGroup;

    if (key == null) {
      // Standalone row — pass through as-is, add displayName for uniformity.
      output.push({ ...ing, displayName: ing.name, isAltGroup: false });
      return;
    }

    if (emitted.has(key)) {
      // Already collapsed into a merged row — skip subsequent members.
      return;
    }

    emitted.add(key);
    const { members } = groups.get(key);

    if (members.length === 1) {
      // Only one member — treat as standalone (forward-compat safety net).
      output.push({ ...members[0], displayName: members[0].name, isAltGroup: false });
      return;
    }

    // Merge: first member supplies quantity/unit; all members supply names.
    const first = members[0];
    const joinedName = members.map((m) => m.name).join(` ${connector} `);
    output.push({
      ...first,
      displayName: joinedName,
      isAltGroup: true,
    });
  });

  return output;
}
