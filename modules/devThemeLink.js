// Parses the development deep link that switches the theme from a Maestro flow:
//   cookez-dev://dev/theme?name=<themeKey>
// Only the scheme of the dev variant (app.config.js, APP_VARIANT=development) is accepted, so a
// production build can never be driven by it.
import { THEME_KEYS } from '../styles/themes';

const DEV_THEME_URL = /^cookez-dev:\/\/dev\/theme\?(?:.*&)?name=([A-Za-z]+)(?:&|$)/;

/**
 * @param {string | null | undefined} url
 * @returns {string | null} a valid theme key, or null when the URL is not a dev theme link
 */
export function parseDevThemeUrl(url) {
  const match = typeof url === 'string' ? url.match(DEV_THEME_URL) : null;
  return match && THEME_KEYS.includes(match[1]) ? match[1] : null;
}
