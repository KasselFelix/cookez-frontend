/* global describe, it, expect, __dirname */
// Plan 016, PR 3: the session token travels in the Authorization header only.
// No API body carries it, and every call to an authenticated route builds its
// headers with modules/authHeaders.js. Each fetch of the app must be classified
// below as authenticated or public, so a new call cannot slip through unchecked.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SOURCE_DIRS = ['screens', 'components', 'modules', 'hooks', 'reducers', 'contexts'];
const HELPER_FILE = path.join('modules', 'authHeaders.js');

const sourceFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return file.endsWith('.js') ? [file] : [];
  });
};

// Routes behind requireAuth or optionalAuth on the backend, or that will be
// (S1 in PR 4, S3 for the upload).
const AUTH_ROUTES = [
  /\/upload\//,
  /\/recipes\/(add|result|vote\/)/,
  /\/comments\/(add|upvote|downvote|update\/|delete\/)/,
  /\/users\/(profile|settings|preferences|me\b|favorites\/|follow\/|unfollow\/)/,
  /\/users\/\$\{path\}\//, // PublicProfileScreen: path is 'follow' or 'unfollow'
  /\/notifications/,
  /\/inventory/,
  /\/vision\//,
];

const PUBLIC_ROUTES = [
  /\/recipes\/(all|search|origins)\b/,
  /\/ingredients\//,
  /\/users\/(public|recipes)\//,
  /\/users\/(signin|signup)\b/,
  /\/comments\/\$\{user\.username\}/, // GET /comments/:username
];

// Comments mention fetch() in prose; `//` after a colon is a URL, kept.
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');

/** Text from `open` (index of a `(`) to its matching `)`, both included. */
const balanced = (source, open) => {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '(') depth += 1;
    else if (source[i] === ')') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return source.slice(open);
};

/** Every fetch(...) call of a source, with its URL argument resolved. */
const fetchCalls = (source) => {
  const calls = [];
  const re = /(^|[^.\w])fetch\s*\(/g;
  let match;
  while ((match = re.exec(source))) {
    const open = match.index + match[0].length - 1;
    const text = balanced(source, open);
    let target = text.slice(1).trim();
    // fetch(url, …): use the last `const url = …` written before the call.
    const ident = /^([A-Za-z_$][\w$]*)\s*[,)]/.exec(target);
    if (ident) {
      const defs = [...source.slice(0, open).matchAll(new RegExp(`\\b(?:const|let)\\s+${ident[1]}\\s*=\\s*([^;]+);`, 'g'))];
      if (defs.length) target = defs[defs.length - 1][1];
    }
    calls.push({ text, target });
  }
  return calls;
};

/** Arguments of every JSON.stringify(...) of a source. */
const stringifyArgs = (source) =>
  [...source.matchAll(/JSON\.stringify\s*\(/g)].map((m) => balanced(source, m.index + m[0].length - 1));

const USES_HELPER = /\b(jsonAuthHeaders|authHeaders)\s*\(/;
const TOKEN_KEY = /(^|[{,\s])token\s*[:,}]/;

describe('session token in the Authorization header only', () => {
  const files = [path.join(ROOT, 'App.js'), ...SOURCE_DIRS.flatMap((d) => sourceFiles(path.join(ROOT, d)))];
  const sources = files.map((file) => ({
    file: path.relative(ROOT, file),
    source: stripComments(fs.readFileSync(file, 'utf8')),
  }));
  const calls = sources.flatMap(({ file, source }) => fetchCalls(source).map((call) => ({ file, ...call })));
  const label = ({ file, target }) => `${file}: ${target.split('\n')[0]}`;

  it('scans the app calls', () => {
    expect(calls.length).toBeGreaterThan(30);
  });

  it('classifies every fetch as authenticated or public', () => {
    const unknown = calls.filter(
      ({ target }) => !AUTH_ROUTES.some((r) => r.test(target)) && !PUBLIC_ROUTES.some((r) => r.test(target)),
    );
    expect(unknown.map(label)).toEqual([]);
  });

  it('calls every authenticated route with the shared helper', () => {
    const offenders = calls.filter(
      ({ target, text }) => AUTH_ROUTES.some((r) => r.test(target)) && !USES_HELPER.test(text),
    );
    expect(offenders.map(label)).toEqual([]);
  });

  it('puts no token in a request body', () => {
    const inFetch = calls.filter(({ text }) => /\bbody\s*:[^\n]*\btoken\b/i.test(text));
    const inJson = sources.filter(({ source }) => stringifyArgs(source).some((arg) => TOKEN_KEY.test(arg)));
    expect([...inFetch.map(label), ...inJson.map(({ file }) => file)]).toEqual([]);
  });

  it('writes the Bearer scheme in the helper only', () => {
    const offenders = sources.filter(({ file, source }) => file !== HELPER_FILE && /Bearer\s/.test(source));
    expect(offenders.map(({ file }) => file)).toEqual([]);
  });

  it('would catch a token in a body or a bare header', () => {
    const [legacy] = fetchCalls(
      "fetch(`${addressIp}/users/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: user.token, image }) })",
    );
    expect(USES_HELPER.test(legacy.text)).toBe(false);
    expect(TOKEN_KEY.test(stringifyArgs(legacy.text)[0])).toBe(true);
    expect(TOKEN_KEY.test('({ ids, token })')).toBe(true);
    expect(TOKEN_KEY.test('({ message, recipe: recipeId })')).toBe(false);

    const [viaVariable] = fetchCalls('const url = `${addressIp}/notifications?limit=1`;\nfetch(url, { headers: authHeaders(token) })');
    expect(viaVariable.target).toContain('/notifications');
    expect(USES_HELPER.test(viaVariable.text)).toBe(true);
  });
});
