// Recipe image-source resolver — Plan 005 U-A16 (frontend resilience).
//
// Imported catalog recipes come from many providers, so a recipe's picture
// can be any of:
//   - `imageUrl`  : a full http(s) URL (Pexels / Spoonacular / Tasty…) or null
//                   (backend contract: string-when-present, else null)
//   - `picture`   : a bare Cloudinary public_id, a bundled local-asset key,
//                   an http(s) URL, or null (legacy user-created recipes)
//
// This module funnels every image-build site (Recipe card, RecipeScreen hero)
// through ONE pure function so the fallback logic stays consistent and testable.
// It NEVER returns a broken source (`{ uri: '' }` / `{ uri: undefined }`):
// when nothing usable exists, it returns a bundled placeholder require().

import imageRecipe from './images';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dnym6kt4p/image/upload';

/** Key into `modules/images.js` for the neutral fallback image. */
export const PLACEHOLDER_IMAGE_KEY = 'placeholder.png';

/** @param {*} value @returns {string} trimmed string, or '' for non-strings */
function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** @param {string} value @returns {boolean} */
function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

/**
 * Resolve a usable image source for a recipe.
 *
 * Resolution order:
 *   1. `imageUrl` if it is an absolute http(s) URL  → `{ uri }`
 *   2. `picture` that is itself an http(s) URL      → `{ uri }`
 *   3. `picture` mapped to a bundled local asset    → require()
 *   4. `picture` as a bare Cloudinary public_id     → built Cloudinary `{ uri }`
 *   5. nothing usable                               → local placeholder require()
 *
 * @param {{ imageUrl?: string|null, picture?: string|null }|null|undefined} recipe
 * @returns {{ uri: string } | number} an Image-ready source — never empty.
 */
export function resolveRecipeImageSource(recipe) {
  const imageUrl = clean(recipe?.imageUrl);
  if (imageUrl && isHttpUrl(imageUrl)) {
    return { uri: imageUrl };
  }

  const picture = clean(recipe?.picture);
  if (picture) {
    if (isHttpUrl(picture)) {
      return { uri: picture };
    }
    // Local bundled asset (keys in modules/images.js carry the `.jpg` suffix).
    const localKey = `${picture}.jpg`;
    if (imageRecipe[localKey]) {
      return imageRecipe[localKey];
    }
    // Otherwise treat it as a Cloudinary public_id.
    return { uri: `${CLOUDINARY_BASE}/${picture}.jpg` };
  }

  return imageRecipe[PLACEHOLDER_IMAGE_KEY];
}

/**
 * Whether a resolved source is the bundled placeholder, i.e. the recipe has no usable image.
 * Screens then render `RecipeImagePlaceholder` instead of the placeholder file.
 * @param {{ uri: string } | number} source
 * @returns {boolean}
 */
export function isPlaceholderSource(source) {
  return source === imageRecipe[PLACEHOLDER_IMAGE_KEY];
}

export default resolveRecipeImageSource;
