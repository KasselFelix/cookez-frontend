// Metro configuration: Expo's default, plus one guard (plan 019, audit 2.9).
// EXPO_PUBLIC_API_URL is inlined into the bundle when Metro builds it. Without
// it, the app would throw at launch on every device of a channel (eas update)
// or of a build. Metro reads this file for `expo start`, `expo export`,
// `eas update` and the bundle of a release build, so all of them stop here.
// Expo CLI loads .env before this file runs.
const { getDefaultConfig } = require('expo/metro-config');

// A value made of spaces counts as missing.
if (!process.env.EXPO_PUBLIC_API_URL?.trim()) {
  const message =
    'EXPO_PUBLIC_API_URL is not set: Metro refuses to bundle an app without its API URL. ' +
    'Set it in .env, in the environment, or in the eas.json build profile.';
  // Printed as well: when require() fails, Metro retries with import(), and on
  // Windows that second error (ERR_UNSUPPORTED_ESM_URL_SCHEME) hides this one.
  console.error(message);
  throw new Error(message);
}

// The guard above checks only that the variable is there, and the front's
// local env file targets production: print the URL this bundle will call, and
// warn when it is the production API (plan 019). Nothing is blocked, since
// eas update and a device on the production API use it on purpose.
const PRODUCTION_API_HOST = 'cookez-backend.vercel.app';
const apiUrl = process.env.EXPO_PUBLIC_API_URL.trim();
let apiHost = '';
let printedUrl = apiUrl;
try {
  const url = new URL(apiUrl);
  // Lowercased by hand: Expo's URL polyfill, which Jest loads, keeps the case.
  // A final dot (fully qualified name) reaches the same host.
  apiHost = url.hostname.toLowerCase().replace(/\.$/, '');
  // The log never carries credentials, a query or a fragment.
  if (url.username || url.password || url.search || url.hash) {
    printedUrl = `${url.protocol}//${url.host}${url.pathname}`;
  }
} catch {
  // Not a URL: printed as is, no warning.
}
console.log(`Metro: EXPO_PUBLIC_API_URL = ${printedUrl}`);
if (apiHost === PRODUCTION_API_HOST) {
  console.warn('!! PRODUCTION API: every action writes to the production database');
}

module.exports = getDefaultConfig(__dirname);
