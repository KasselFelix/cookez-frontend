// Recipe video resolver — Plan 005 U-A16 (frontend resilience).
//
// Imported recipes may carry a `videoUrl` (YouTube embed, Tasty mp4…) or null
// (backend contract: string-when-present, else null). These pure helpers
// normalise the value and classify the provider so the UI can decide how to
// label / open it, without ever rendering a player for a missing video.

/** @param {*} value @returns {string} trimmed string, or '' for non-strings */
function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Return a usable video URL for a recipe, or null.
 * Only absolute http(s) URLs are accepted — anything else is treated as
 * "no video" so the UI renders nothing rather than a dead affordance.
 *
 * @param {{ videoUrl?: string|null }|null|undefined} recipe
 * @returns {string|null}
 */
export function resolveVideoUrl(recipe) {
  const url = clean(recipe?.videoUrl);
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

/**
 * Whether a URL points at YouTube (youtube.com or youtu.be, any subdomain).
 * Used purely to label the affordance — both kinds open in the OS browser.
 *
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
  const u = clean(url);
  if (!u) return false;
  return /(?:^|\/\/|\.)(?:youtube\.com|youtu\.be)\b/i.test(u);
}

export default resolveVideoUrl;
