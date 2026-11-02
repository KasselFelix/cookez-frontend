// The 14 allergens regulated in the EU, by the key stored in `settings.allergy`.
// The backend allergen lexicon maps each key onto its filter category.
export const ALLERGEN_KEYS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soy',
  'dairy',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
];

const KNOWN_KEYS = new Set(ALLERGEN_KEYS);

/**
 * Split a stored allergy list into the chips it selects and the free text left.
 * @param {string[]} [allergy]
 * @returns {{ keys: string[], other: string }}
 */
export function splitAllergies(allergy = []) {
  return {
    keys: allergy.filter((term) => KNOWN_KEYS.has(term)),
    other: allergy.filter((term) => !KNOWN_KEYS.has(term)).join(', '),
  };
}

/**
 * Build the list to store from the selected chips and the free text.
 * @param {string[]} [keys]
 * @param {string} [other] comma-separated terms
 * @returns {string[]}
 */
export function joinAllergies(keys = [], other = '') {
  const terms = other
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
  return [...new Set([...keys, ...terms])];
}
