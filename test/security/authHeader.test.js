/* global describe, it, expect, __dirname */
// Plan 016, PR 3: the session token travels in the Authorization header only.
// No API body carries it, and every call to an authenticated route builds its
// headers with modules/authHeaders.js. Each fetch of the app must be classified
// below as authenticated or public, so a new call cannot slip through unchecked.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SOURCE_DIRS = ['screens', 'components', 'modules', 'hooks', 'reducers', 'contexts'];
const HELPER_FILE = 'modules/authHeaders.js';

// Wrappers that send a body they receive as a parameter (plan 019, "Ensuite"): the fetch
// text only shows `JSON.stringify(body)`, so the keys are checked where the body is
// written. `callers`: the only files that may call the wrapper. `built`: where its body is
// written, as every `const <object> = { … }` of the file, or the arguments of every
// `<call>(…)`. A new wrapper or a new caller fails the tests below until it is listed here.
const PANTRY_BODY = {
  callers: ['screens/ProfileScreen.js'], // handleSubmit, passed as onSubmit to InventoryAddSheet
  built: [{ file: 'components/inventory/InventoryAddSheet.js', object: 'payload' }],
};
const WRAPPER_BODIES = {
  addPantryItem: PANTRY_BODY,
  updatePantryItem: PANTRY_BODY,
  patchUserSettings: {
    callers: ['screens/SettingsScreen.js'],
    built: [{ file: 'screens/SettingsScreen.js', call: 'debouncedSave' }],
  },
  putUpdate: {
    callers: ['screens/SettingsScreen.js'],
    built: [{ file: 'screens/SettingsScreen.js', call: 'putUpdate' }],
  },
};

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
  /\/recipes\/(all|search|origins|detail)\b/,
  /\/ingredients\//,
  /\/users\/(public|recipes)\//,
  /\/users\/(signin|signup)\b/,
  /\/comments\/\$\{user\.username\}/, // GET /comments/:username
];

// Comments mention fetch() in prose. A line comment starts a line or follows
// a space: `//` in a URL ('http://') or a string ('//') is kept.
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

/** Text from `open` (index of a `(` or a `{`) to its matching closer, both included. */
const balanced = (source, open) => {
  const [opener, closer] = source[open] === '{' ? ['{', '}'] : ['(', ')'];
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === opener) depth += 1;
    else if (source[i] === closer) {
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
      const defs = [
        ...source
          .slice(0, open)
          .matchAll(new RegExp(`\\b(?:const|let)\\s+${ident[1]}\\s*=\\s*([^;]+);`, 'g')),
      ];
      if (defs.length) target = defs[defs.length - 1][1];
    }
    calls.push({ index: open, text, target });
  }
  return calls;
};

/** Object literal of every `const|let <name> = { … }` of a source. */
const objectLiterals = (source, name) =>
  [...source.matchAll(new RegExp(`\\b(?:const|let)\\s+${name}\\s*=\\s*\\{`, 'g'))].map((m) =>
    balanced(source, m.index + m[0].length - 1),
  );

/** Argument list, parentheses included, of every `<name>(…)` call of a source. */
const callArgs = (source, name) =>
  [...source.matchAll(new RegExp(`(^|[^.\\w$])${name}\\s*\\(`, 'g'))].map((m) =>
    balanced(source, m.index + m[0].length - 1),
  );

/**
 * Every JSON.stringify(...) of a source, with the index of its parenthesis.
 * JSON.stringify(payload) also yields the object literal of the last
 * `const payload = { … }` before it.
 */
const stringifyArgsAt = (source) =>
  [...source.matchAll(/JSON\.stringify\s*\(/g)].map((m) => {
    const open = m.index + m[0].length - 1;
    const arg = balanced(source, open);
    const ident = /^\(\s*([A-Za-z_$][\w$]*)\s*[,)]/.exec(arg);
    if (!ident) return { index: open, arg };
    const defs = [
      ...source
        .slice(0, open)
        .matchAll(new RegExp(`\\b(?:const|let)\\s+${ident[1]}\\s*=\\s*\\{`, 'g')),
    ];
    if (!defs.length) return { index: open, arg };
    const last = defs[defs.length - 1];
    return { index: open, arg: `${arg} ${balanced(source, last.index + last[0].length - 1)}` };
  });

const stringifyArgs = (source) => stringifyArgsAt(source).map(({ arg }) => arg);

/** Bodies of a fetch call, resolved against the whole source it sits in. */
const bodiesOf = (source, call) =>
  stringifyArgsAt(source)
    .filter(({ index }) => index > call.index && index < call.index + call.text.length)
    .map(({ arg }) => arg);

// A body that is only a name, unresolved in the file: a parameter of the enclosing function.
const PASSED_BODY = /^\(\s*[A-Za-z_$][\w$]*\s*\)$/;

// `const name = async (a, b) =>`, `const name = x =>`, `function name(`, exported or not.
const FUNCTION_DECL =
  /\b(?:const|let)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^()]*\)|[\w$]+)\s*=>|\bfunction\s+([\w$]+)\s*\(/g;

/** Name of the last function declared before `index`: the one a wrapper's fetch sits in. */
const enclosingFunctionAt = (source, index) => {
  const decls = [...source.slice(0, index).matchAll(FUNCTION_DECL)];
  const last = decls[decls.length - 1];
  return last ? last[1] || last[2] : null;
};

const USES_HELPER = /\b(jsonAuthHeaders|authHeaders)\s*\(/;
// token, authToken, "token"…: any key that names a token, bare or quoted;
// or a whole user object spread into the body.
const TOKEN_KEY = /(^|[{,\s])["']?\w*token["']?\s*[:,}]|\.\.\.\s*\w*user\b/i;
// A `username` key, bare or quoted; `${user.username}` in a URL does not match.
const USERNAME_KEY = /(^|[{,\s])["']?username["']?\s*[:,}]/;

describe('session token in the Authorization header only', () => {
  const files = [
    path.join(ROOT, 'App.js'),
    ...SOURCE_DIRS.flatMap((d) => sourceFiles(path.join(ROOT, d))),
  ];
  const sources = files.map((file) => ({
    file: path.relative(ROOT, file).split(path.sep).join('/'),
    source: stripComments(fs.readFileSync(file, 'utf8')),
  }));
  const sourceOf = Object.fromEntries(sources.map(({ file, source }) => [file, source]));
  const calls = sources.flatMap(({ file, source }) =>
    fetchCalls(source).map((call) => ({ file, ...call, bodies: bodiesOf(source, call) })),
  );
  const authCalls = calls.filter(({ target }) => AUTH_ROUTES.some((r) => r.test(target)));
  // Authenticated calls whose body is a parameter, by wrapper name.
  const passThrough = authCalls
    .filter(({ bodies }) => bodies.some((arg) => PASSED_BODY.test(arg)))
    .map(({ file, index }) => ({ file, name: enclosingFunctionAt(sourceOf[file], index) }));
  const label = ({ file, target }) => `${file}: ${target.split('\n')[0]}`;

  it('scans the app calls', () => {
    expect(calls.length).toBeGreaterThan(30);
  });

  it('classifies every fetch as authenticated or public', () => {
    const unknown = calls.filter(
      ({ target }) =>
        !AUTH_ROUTES.some((r) => r.test(target)) && !PUBLIC_ROUTES.some((r) => r.test(target)),
    );
    expect(unknown.map(label)).toEqual([]);
  });

  it('calls every authenticated route with the shared helper', () => {
    const offenders = calls.filter(
      ({ target, text }) => AUTH_ROUTES.some((r) => r.test(target)) && !USES_HELPER.test(text),
    );
    expect(offenders.map(label)).toEqual([]);
  });

  it('keeps the multipart uploads free of a JSON Content-Type', () => {
    // jsonAuthHeaders would override the boundary fetch sets for a FormData body.
    const multipart = calls.filter(({ target }) => /\/(upload|vision)\//.test(target));
    expect(multipart.length).toBeGreaterThanOrEqual(2);
    const offenders = multipart.filter(
      ({ text }) =>
        /jsonAuthHeaders\s*\(|Content-Type/i.test(text) || !/\bauthHeaders\s*\(/.test(text),
    );
    expect(offenders.map(label)).toEqual([]);
  });

  it('puts no token in a request body', () => {
    const inFetch = calls.filter(({ text }) => /\bbody\s*:[^\n]*\btoken\b/i.test(text));
    const inJson = sources.filter(({ source }) =>
      stringifyArgs(source).some((arg) => TOKEN_KEY.test(arg)),
    );
    expect([...inFetch.map(label), ...inJson.map(({ file }) => file)]).toEqual([]);
  });

  it('sends no username in the body of an authenticated call', () => {
    // Plan 019, step 3.1 (audit 2.15): the backend reads the author from the
    // token. A username in the body is ignored today and misleads a reader.
    const offenders = authCalls.filter(({ bodies }) =>
      bodies.some((arg) => USERNAME_KEY.test(arg)),
    );
    expect(offenders.map(label)).toEqual([]);
  });

  it('lists every wrapper that sends a body received as a parameter', () => {
    const unlisted = passThrough.filter(({ name }) => !Object.hasOwn(WRAPPER_BODIES, name));
    expect(unlisted.map(({ file, name }) => `${file}: ${name}`)).toEqual([]);
    // A listed wrapper that no longer exists means the table is stale.
    const stale = Object.keys(WRAPPER_BODIES).filter(
      (name) => !passThrough.some((w) => w.name === name),
    );
    expect(stale).toEqual([]);
  });

  it('calls those wrappers from the listed files only', () => {
    const unlisted = Object.entries(WRAPPER_BODIES).flatMap(([name, { callers }]) => {
      const definer = passThrough.find((w) => w.name === name)?.file;
      return sources
        .filter(({ file, source }) => file !== definer && callArgs(source, name).length > 0)
        .filter(({ file }) => !callers.includes(file))
        .map(({ file }) => `${file}: ${name}`);
    });
    expect(unlisted).toEqual([]);
  });

  it('builds the bodies of those wrappers without a username or a token', () => {
    const bodies = Object.entries(WRAPPER_BODIES).flatMap(([name, { built }]) =>
      built.map(({ file, object, call }) => {
        const source = sourceOf[file] ?? '';
        const literals = object ? objectLiterals(source, object) : callArgs(source, call);
        return { where: `${name} ← ${file}: ${object || call}`, literals };
      }),
    );
    // A listed builder that no longer writes anything means the table is stale.
    expect(
      bodies.filter(({ literals }) => literals.length === 0).map(({ where }) => where),
    ).toEqual([]);
    const offenders = bodies.filter(({ literals }) =>
      literals.some((l) => USERNAME_KEY.test(l) || TOKEN_KEY.test(l)),
    );
    expect(offenders.map(({ where }) => where)).toEqual([]);
  });

  it('would find a wrapper body and a username written where the body is built', () => {
    const wrapper =
      'export const addItem = async (token, body) => {\n  const res = await fetch(`${addressIp}/inventory`, { headers: jsonAuthHeaders(token), body: JSON.stringify(body) });\n};';
    const [call] = fetchCalls(wrapper);
    const bodies = bodiesOf(wrapper, call);
    expect(bodies.some((arg) => PASSED_BODY.test(arg))).toBe(true);
    expect(enclosingFunctionAt(wrapper, call.index)).toBe('addItem');
    const local =
      'const putUpdate = async (overrides) => {\n  await fetch(`${addressIp}/users/profile`, { body: JSON.stringify(overrides) });\n};';
    expect(enclosingFunctionAt(local, fetchCalls(local)[0].index)).toBe('putUpdate');

    // Resolved in the file, a payload written before the fetch is not a pass-through.
    const vote =
      'const payload = {\n  username,\n  note,\n};\nfetch(`${addressIp}/recipes/vote/${id}`, { body: JSON.stringify(payload) });';
    const [localBody] = bodiesOf(vote, fetchCalls(vote)[0]);
    expect(PASSED_BODY.test(localBody)).toBe(false);
    expect(USERNAME_KEY.test(localBody)).toBe(true);

    const sheet =
      'const payload = {\n  ingredientId: id,\n  username: user.username,\n};\nonSubmit?.(payload);';
    expect(objectLiterals(sheet, 'payload').some((l) => USERNAME_KEY.test(l))).toBe(true);
    expect(callArgs('save({ tags: v }); x.save({ username });', 'save')).toEqual(['({ tags: v })']);
  });

  it('would catch a username key in a body, not a username in a URL', () => {
    const inBody = (text) => stringifyArgs(text).some((arg) => USERNAME_KEY.test(arg));
    expect(inBody('fetch(u, { body: JSON.stringify({ username: user.username, note }) })')).toBe(
      true,
    );
    expect(inBody('fetch(u, { body: JSON.stringify({\n  username,\n  _id }) })')).toBe(true);
    expect(
      inBody('fetch(`${addressIp}/users/${path}/${username}`, { headers: authHeaders(t) })'),
    ).toBe(false);
    expect(inBody('fetch(u, { body: JSON.stringify({ note }) })')).toBe(false);
  });

  it('writes the Bearer scheme in the helper only', () => {
    const offenders = sources.filter(
      ({ file, source }) => file !== HELPER_FILE && /Bearer\s/.test(source),
    );
    expect(sources.some(({ file }) => file === HELPER_FILE)).toBe(true);
    expect(offenders.map(({ file }) => file)).toEqual([]);
  });

  it('would catch a token in a body or a bare header', () => {
    const [legacy] = fetchCalls(
      "fetch(`${addressIp}/users/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: user.token, image }) })",
    );
    expect(USES_HELPER.test(legacy.text)).toBe(false);
    expect(TOKEN_KEY.test(stringifyArgs(legacy.text)[0])).toBe(true);
    expect(TOKEN_KEY.test('({ ids, token })')).toBe(true);
    expect(TOKEN_KEY.test('({ sessionToken: t, ids })')).toBe(true);
    expect(TOKEN_KEY.test('({ "token": user.token })')).toBe(true);
    expect(TOKEN_KEY.test('({ ...currentUser, ids })')).toBe(true);
    expect(TOKEN_KEY.test('({ message, recipe: recipeId })')).toBe(false);
    // The pre-PR 3 /recipes/result: the token sat in a payload stringified later.
    const [payload] = stringifyArgs(
      'const payload = {\n  token: token || undefined,\n  origins: [],\n};\nfetch(u, { body: JSON.stringify(payload) });',
    );
    expect(TOKEN_KEY.test(payload)).toBe(true);
    expect(stripComments("fetch('//x', a); // note")).toBe("fetch('//x', a); ");

    const [viaVariable] = fetchCalls(
      'const url = `${addressIp}/notifications?limit=1`;\nfetch(url, { headers: authHeaders(token) })',
    );
    expect(viaVariable.target).toContain('/notifications');
    expect(USES_HELPER.test(viaVariable.text)).toBe(true);
  });
});
