// Base URL of the Cookez API. No fallback (audit 2.9): a build or a CI run
// without the variable used to target production silently. In a bundle, the
// variable is inlined when Metro builds it, and metro.config.js already
// refuses to start without it; this error covers the other paths (Jest).
// Read literally (Metro inlines only `process.env.EXPO_PUBLIC_…`), then trimmed:
// a value made of spaces counts as missing.
const addressIp = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!addressIp) {
  throw new Error('EXPO_PUBLIC_API_URL is not set: give the API URL in .env or in the environment.');
}

export default addressIp;
