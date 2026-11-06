/* global describe, it, expect, __dirname */
// Plan 010 (S6): a session token in a URL lands in the Vercel and morgan logs.
// The app sends it in the Authorization header only, never in an API URL.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SOURCE_DIRS = ['screens', 'components', 'modules', 'hooks', 'reducers', 'contexts'];

const sourceFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return file.endsWith('.js') ? [file] : [];
  });
};

// A template literal that starts with the API address and interpolates a token, or
// a concatenation from the API address that adds a token on the same line.
const TOKEN_IN_TEMPLATE = /`\$\{addressIp\}[^`]*\$\{[^}]*token[^}]*\}[^`]*`/i;
const TOKEN_IN_CONCAT = /\baddressIp\s*\+[^;\n]*\btoken\b/i;
const hasTokenInUrl = (source) => TOKEN_IN_TEMPLATE.test(source) || TOKEN_IN_CONCAT.test(source);

describe('session token never in an API URL', () => {
  const files = [path.join(ROOT, 'App.js'), ...SOURCE_DIRS.flatMap((d) => sourceFiles(path.join(ROOT, d)))];

  it('scans the app sources', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('finds no URL built with a token', () => {
    const offenders = files.filter((file) => hasTokenInUrl(fs.readFileSync(file, 'utf8')));
    expect(offenders.map((file) => path.relative(ROOT, file))).toEqual([]);
  });

  it('would catch the old /users/profile/:token call', () => {
    expect(hasTokenInUrl('fetch(`${addressIp}/users/profile/${token}`)')).toBe(true);
    expect(hasTokenInUrl('fetch(`${addressIp}/users/lastViewed/${user.token}`)')).toBe(true);
    expect(hasTokenInUrl("fetch(addressIp + '/users/badges/' + user.token)")).toBe(true);
    expect(hasTokenInUrl('fetch(`${addressIp}/users/me`, { headers: { Authorization: `Bearer ${token}` } })')).toBe(false);
  });
});
