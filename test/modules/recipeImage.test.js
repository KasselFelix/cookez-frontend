// Unit tests for the recipe image-source resolver (Plan 005 U-A16).
//
// The backend now serves imported catalog recipes whose picture field varies:
//   - `imageUrl`: a full http(s) URL (Pexels, Spoonacular, Tasty…) or null
//   - `picture`: a bare Cloudinary public_id, a local-asset key, or null
//
// `resolveRecipeImageSource` must NEVER produce a broken <Image> source
// (no `{ uri: '' }` / `{ uri: undefined }`). It falls back to a themed local
// placeholder image when nothing usable is present.

import imageRecipe from '../../modules/images';
import {
  isPlaceholderSource,
  resolveRecipeImageSource,
  PLACEHOLDER_IMAGE_KEY,
} from '../../modules/recipeImage';

const CLOUDINARY_BASE =
  'https://res.cloudinary.com/dnym6kt4p/image/upload';

describe('resolveRecipeImageSource', () => {
  it('uses imageUrl as-is when it is an absolute http(s) URL', () => {
    const src = resolveRecipeImageSource({
      imageUrl: 'https://images.pexels.com/photos/1/food.jpg',
    });
    expect(src).toEqual({ uri: 'https://images.pexels.com/photos/1/food.jpg' });
  });

  it('uses an http imageUrl even when a picture public_id is also present', () => {
    const src = resolveRecipeImageSource({
      imageUrl: 'http://example.com/x.jpg',
      picture: 'some_public_id',
    });
    expect(src).toEqual({ uri: 'http://example.com/x.jpg' });
  });

  it('returns the local require when picture maps to a bundled asset', () => {
    const src = resolveRecipeImageSource({ picture: 'ratatouille' });
    expect(src).toBe(imageRecipe['ratatouille.jpg']);
  });

  it('builds a Cloudinary URL for a bare public_id with no local asset', () => {
    const src = resolveRecipeImageSource({ picture: 'unknown_public_id' });
    expect(src).toEqual({
      uri: `${CLOUDINARY_BASE}/unknown_public_id.jpg`,
    });
  });

  it('treats a picture that is itself an http URL as a direct source', () => {
    const src = resolveRecipeImageSource({
      picture: 'https://cdn.tasty.co/abc.jpg',
    });
    expect(src).toEqual({ uri: 'https://cdn.tasty.co/abc.jpg' });
  });

  it('falls back to the placeholder when imageUrl is null and picture is null', () => {
    const src = resolveRecipeImageSource({ imageUrl: null, picture: null });
    expect(src).toBe(imageRecipe[PLACEHOLDER_IMAGE_KEY]);
  });

  it('falls back to the placeholder when both fields are missing/empty', () => {
    expect(resolveRecipeImageSource({})).toBe(
      imageRecipe[PLACEHOLDER_IMAGE_KEY],
    );
    expect(resolveRecipeImageSource({ imageUrl: '', picture: '   ' })).toBe(
      imageRecipe[PLACEHOLDER_IMAGE_KEY],
    );
  });

  it('falls back to the placeholder for a null/undefined recipe', () => {
    expect(resolveRecipeImageSource(null)).toBe(
      imageRecipe[PLACEHOLDER_IMAGE_KEY],
    );
    expect(resolveRecipeImageSource(undefined)).toBe(
      imageRecipe[PLACEHOLDER_IMAGE_KEY],
    );
  });

  it('never returns a source with an empty or undefined uri', () => {
    const cases = [
      {},
      { imageUrl: '' },
      { picture: '' },
      { imageUrl: null, picture: null },
      null,
    ];
    cases.forEach((recipe) => {
      const src = resolveRecipeImageSource(recipe);
      if (src && typeof src === 'object' && 'uri' in src) {
        expect(src.uri).toBeTruthy();
      } else {
        // a local require() resolves to a number (or object) — always defined
        expect(src).toBeDefined();
      }
    });
  });

  it('exposes a placeholder key that exists in the image map', () => {
    expect(imageRecipe[PLACEHOLDER_IMAGE_KEY]).toBeDefined();
  });

  it('tells the placeholder apart from a real image', () => {
    expect(isPlaceholderSource(resolveRecipeImageSource({ picture: null, imageUrl: null }))).toBe(true);
    expect(isPlaceholderSource(resolveRecipeImageSource({ imageUrl: 'https://images.pexels.com/p/1.jpg' }))).toBe(false);
    expect(isPlaceholderSource(resolveRecipeImageSource({ picture: 'abc123' }))).toBe(false);
  });
});
