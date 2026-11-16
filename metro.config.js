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

module.exports = getDefaultConfig(__dirname);
