// Single source of truth for the diet/cuisine tag set offered by the
// filter UI and accepted by the backend's /recipes/result endpoint.
//
// Why centralize?
//   - The same vocabulary is referenced by the filter picker, the recap
//     screen badges, and (soon) the user-settings dietary preferences.
//     A single array prevents drift between those surfaces.
//   - i18n labels live next to the codes: keys follow
//     `recipe.tags.<code>` so missing translations fall back gracefully
//     to a humanised version of the slug.

export const TAG_VOCABULARY = [
  // Dietary
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  // Nutrition
  'high_protein',
  'low_calorie',
  // Time-of-day / course
  'quick',
  'breakfast',
  'dessert',
  'appetizer',
  'main_course',
  'savory',
];

// Translate a tag code to its localized label. Always returns a string;
// missing translations fall back to a Title-Cased version of the slug
// (e.g. `gluten_free` → `gluten free`) so the UI never shows a raw key.
export function getTagLabel(t, tag) {
  return t(`recipe.tags.${tag}`, { defaultValue: tag.replace(/_/g, ' ') });
}
