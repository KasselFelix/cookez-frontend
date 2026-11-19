// Plan 016, PR 3: the session token travels in the Authorization header only.
// Every call to an authenticated route builds its headers with
// modules/authHeaders.js, and no body carries a token. Plan 019, step 3.1: no
// authenticated body carries a `username` either (the backend reads the author
// from the token).
//
// The analysis lives in helpers/bodyAnalysis.js. A body or an option object
// that cannot be followed fails the test with its location: make it followable
// or extend the analysis, never skip it.
const {
  HELPER_FILE,
  analyze,
  appSources,
  fetchKeys,
  isTokenKey,
  isUsernameKey,
  keyLabels,
  label,
} = require('./helpers/bodyAnalysis');

describe('session token in the Authorization header only', () => {
  const app = analyze(appSources());
  const authCalls = app.fetches.filter((f) => f.auth);

  it('scans the app calls and resolves every relative import', () => {
    expect(app.fetches.length).toBeGreaterThan(30);
    expect(app.unresolvedImports).toEqual([]);
    // A fetch passed around (`const f = fetch`) would hide its calls from the guard.
    expect(app.fetchAliases).toEqual([]);
  });

  it('classifies every fetch as authenticated or public', () => {
    expect(app.fetches.filter((f) => !f.auth && !f.public).map(label)).toEqual([]);
  });

  it('calls every authenticated route with the shared helper', () => {
    expect(authCalls.filter((f) => !f.usesHelper).map(label)).toEqual([]);
  });

  it('keeps the multipart uploads free of a JSON Content-Type', () => {
    // jsonAuthHeaders would override the boundary fetch sets for a FormData body.
    const multipart = app.fetches.filter(({ target }) => /\/(upload|vision)\//.test(target));
    expect(multipart.length).toBeGreaterThanOrEqual(2);
    expect(multipart.filter((f) => !f.multipartHeaders).map(label)).toEqual([]);
  });

  it('follows every request body to the literals it is built from', () => {
    expect(app.fetches.flatMap((f) => f.problems)).toEqual([]);
  });

  it('puts no token in a request body', () => {
    // JSON.stringify outside a fetch too: a body may be stringified before the call.
    expect(keyLabels([...fetchKeys(app.fetches), ...app.stringified], isTokenKey)).toEqual([]);
  });

  it('sends no username in the body of an authenticated call', () => {
    expect(keyLabels(fetchKeys(authCalls), isUsernameKey)).toEqual([]);
  });

  it('writes the Bearer scheme in the helper only', () => {
    expect(app.sources[HELPER_FILE]).toBeDefined();
    const offenders = Object.values(app.sources).filter(
      ({ file, code }) => file !== HELPER_FILE && /Bearer\s/.test(code),
    );
    expect(offenders.map(({ file }) => file)).toEqual([]);
  });
});

describe('the analysis behind the guard', () => {
  const API =
    "import { jsonAuthHeaders, authHeaders } from './authHeaders';\nconst addressIp = 'x';\n";
  const HELPER = 'export const jsonAuthHeaders = (t) => t;\nexport const authHeaders = (t) => t;\n';
  const authOf = (sources) =>
    analyze({ 'modules/authHeaders.js': HELPER, ...sources }).fetches.filter((f) => f.auth);
  const usernamesIn = (sources) => keyLabels(fetchKeys(authOf(sources)), isUsernameKey);
  const tokensIn = (sources) => keyLabels(fetchKeys(authOf(sources)), isTokenKey);
  const problemsIn = (sources) => authOf(sources).flatMap((f) => f.problems);

  const wrapper = `${API}export const add = async (token, body) =>\n  fetch(\`\${addressIp}/inventory\`, { method: 'POST', headers: jsonAuthHeaders(token), body: JSON.stringify(body) });\n`;

  it('follows a wrapper called through a namespace import', () => {
    const sources = {
      'modules/api.js': wrapper,
      'screens/A.js':
        "import * as api from '../modules/api';\nexport default function A({ t }) {\n  return api.add(t, { username: 'u', q: 1 });\n}\n",
    };
    expect(usernamesIn(sources)).toEqual(['screens/A.js:3: username']);
  });

  it('follows a wrapper re-exported by a barrel file', () => {
    const sources = {
      'modules/api.js': wrapper,
      'modules/index.js': "export { add as addItem } from './api';\nexport * from './api';\n",
      'screens/A.js':
        "import { addItem, add } from '../modules';\naddItem('t', { username: 'a' });\nadd('t', { username: 'b' });\n",
    };
    expect(usernamesIn(sources).sort()).toEqual([
      'screens/A.js:2: username',
      'screens/A.js:3: username',
    ]);
  });

  it('follows a wrapper through an alias, a local handler and a JSX prop', () => {
    const sources = {
      'modules/api.js': wrapper,
      'components/Sheet.js':
        "export default function Sheet({ onSubmit }) {\n  const go = () => {\n    const payload = { qty: 1, username: 'u' };\n    onSubmit?.(payload);\n  };\n  return go;\n}\n",
      'components/Other.js':
        "export default function Other(props) {\n  props?.onSubmit?.({ username: 'v' });\n}\n",
      'screens/P.js':
        "import { add } from '../modules/api';\nimport Sheet from '../components/Sheet';\nimport Other from '../components/Other';\nexport default function P({ t }) {\n  const send = add;\n  const submit = async (payload) => send(t, payload);\n  return [<Sheet onSubmit={submit} />, <Other onSubmit={submit} />];\n}\n",
    };
    expect(usernamesIn(sources).sort()).toEqual([
      'components/Other.js:2: username',
      'components/Sheet.js:3: username',
    ]);
  });

  // Security review of the cookez-frontend#25 ship: `{ location: payload }`
  // left the guard green with a username in `payload`.
  it('follows a value held in a variable inside a body: parameter or constant', () => {
    const sources = {
      'modules/api.js': `${API}export async function put({ token, updates }) {\n  return fetch(\`\${addressIp}/users/profile\`, { method: 'PUT', headers: jsonAuthHeaders(token), body: JSON.stringify(updates) });\n}\n`,
      'components/Toggle.js':
        "import { useState } from 'react';\nimport { put } from '../modules/api';\nexport default function Toggle({ token, name, state }) {\n  const persist = (payload) => put({ token, updates: { location: payload } });\n  persist({ consent: false, username: name });\n  const extra = { username: 'u' };\n  const [picked, setPicked] = useState({ username: 'a' });\n  setPicked({ username: 'b' });\n  setPicked((prev) => prev);\n  put({ token, updates: { data: extra, picked, label: name.trim(), value: state.value } });\n}\n",
    };
    expect(usernamesIn(sources).sort()).toEqual([
      'components/Toggle.js:5: username',
      'components/Toggle.js:6: username',
      'components/Toggle.js:7: username',
      'components/Toggle.js:8: username',
    ]);
    // A leaf it cannot follow (a parameter field, a call) is not a problem.
    expect(problemsIn(sources)).toEqual([]);
  });

  // Reviews of the fix/019-authheader-nested ship: a state set by an updater
  // or by a child component, and a setter handed where it cannot be followed.
  it('follows a state through its updaters and a setter passed as a prop', () => {
    const put = `${API}export async function put({ token, updates }) {\n  return fetch(\`\${addressIp}/users/profile\`, { method: 'PUT', headers: jsonAuthHeaders(token), body: JSON.stringify(updates) });\n}\n`;
    const sources = {
      'modules/api.js': put,
      'components/List.js':
        "export default function List({ items, setItems }) {\n  setItems([...items, { username: 'child' }]);\n}\n",
      'components/Form.js':
        "import { useState } from 'react';\nimport { put } from '../modules/api';\nimport List from './List';\nexport default function Form({ token }) {\n  const [picked, setPicked] = useState(() => ({ username: 'lazy' }));\n  setPicked((prev) => ({ ...prev, username: 'updater' }));\n  const [items, setItems] = useState([]);\n  put({ token, updates: { picked, items } });\n  return <List items={items} setItems={setItems} />;\n}\n",
    };
    expect(usernamesIn(sources).sort()).toEqual([
      'components/Form.js:5: username',
      'components/Form.js:6: username',
      'components/List.js:2: username',
    ]);

    // As the body itself, a state whose setter goes to a component outside the
    // app (`onChangeText`) cannot be followed.
    const box = {
      'modules/api.js': put,
      'components/Box.js':
        "import { useState } from 'react';\nimport { TextInput } from 'react-native';\nimport { put } from '../modules/api';\nexport default function Box({ token }) {\n  const [draft, setDraft] = useState({});\n  put({ token, updates: draft });\n  return <TextInput onChangeText={setDraft} />;\n}\n",
    };
    expect(problemsIn(box)).toEqual([
      'components/Box.js:7: component of prop onChangeText not found in the app',
    ]);
  });

  it('reads a value by its name and both sides of a nested ?? or ? :', () => {
    const sources = {
      'modules/api.js': `${API}export async function put({ token, updates }) {\n  return fetch(\`\${addressIp}/users/profile\`, { method: 'PUT', headers: jsonAuthHeaders(token), body: JSON.stringify(updates) });\n}\n`,
      'components/C.js':
        "import { put } from '../modules/api';\nexport default function C({ token, user, ok, payload }) {\n  put({\n    token,\n    updates: {\n      profile: user,\n      author: user.username,\n      data: ok ? { username: 'a' } : null,\n      location: payload ?? { username: 'b' },\n    },\n  });\n}\n",
    };
    expect(usernamesIn(sources).sort()).toEqual([
      'components/C.js:7: author: user.username',
      'components/C.js:8: username',
      'components/C.js:9: username',
    ]);
    // The whole user carries its token.
    expect(tokensIn(sources)).toEqual(['components/C.js:6: profile: user']);
  });

  it('follows a useMemo-returned function and a destructured parameter', () => {
    const sources = {
      'modules/api.js': `${API}export async function patch({ token, partial }) {\n  return fetch(\`\${addressIp}/users/settings\`, { method: 'PATCH', headers: jsonAuthHeaders(token), body: JSON.stringify(partial) });\n}\n`,
      'screens/S.js':
        "import { useMemo } from 'react';\nimport { patch } from '../modules/api';\nexport default function S({ token }) {\n  const save = useMemo(() => {\n    return (partial) => patch({ token, partial });\n  }, [token]);\n  save({ tags: [] });\n  save({ username: 'u' });\n}\n",
    };
    expect(usernamesIn(sources)).toEqual(['screens/S.js:8: username']);
  });

  it('follows spreads, defaults, nested keys, mutations and a body stringified before the fetch', () => {
    const sources = {
      'modules/api.js': `${API}function other() {\n  const body = { ok: 1 };\n  return body;\n}\nexport const add = async (token, body) =>\n  fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(token), body: JSON.stringify({ ...body, locale: 'fr' }) });\nexport const vote = async (token) => {\n  const body = JSON.stringify({ data: { username: 'u' } });\n  return fetch(\`\${addressIp}/recipes/vote/1\`, { headers: jsonAuthHeaders(token), body });\n};\nexport const put = async (token) => {\n  const payload = { q: 1 };\n  payload.username = 'u';\n  Object.assign(payload, { sessionToken: token });\n  return fetch(\`\${addressIp}/users/profile\`, { headers: jsonAuthHeaders(token), body: JSON.stringify([payload]) });\n};\n`,
      'screens/A.js': "import { add } from '../modules/api';\nadd('t', { username: 'u' } ?? {});\n",
    };
    const auth = authOf(sources);
    expect(keyLabels(fetchKeys(auth), (key) => key === 'username').sort()).toEqual([
      'modules/api.js:10: username',
      'modules/api.js:15: username',
      'screens/A.js:2: username',
    ]);
    expect(keyLabels(fetchKeys(auth), isTokenKey)).toEqual(['modules/api.js:16: sessionToken']);
    expect(auth.flatMap((f) => f.problems)).toEqual([]);
  });

  it('keeps homonymous wrappers of two modules apart', () => {
    const sources = {
      'modules/a.js': wrapper,
      'modules/b.js': wrapper,
      'screens/A.js': "import { add } from '../modules/a';\nadd('t', { q: 1 });\n",
      'screens/B.js': "import { add } from '../modules/b';\nadd('t', { username: 'u' });\n",
    };
    expect(usernamesIn(sources)).toEqual(['screens/B.js:2: username']);
  });

  it('reports what it cannot follow instead of passing it', () => {
    const sources = {
      'modules/api.js': `${API}export const api = {\n  add(token, body) {\n    return fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(token), body: JSON.stringify(body) });\n  },\n};\nexport const add = (token, body) => fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(token), body: JSON.stringify(makeBody(body)) });\nexport const send = (opts) => fetch(\`\${addressIp}/inventory\`, opts);\nexport const spread = (token, extra) => fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(token), ...extra });\n`,
    };
    expect(problemsIn(sources)).toEqual([
      'modules/api.js:4: unnamed function, its calls cannot be followed',
      'modules/api.js:8: CallExpression cannot be followed',
      'modules/api.js:9: fetch options cannot be followed',
      'modules/api.js:10: SpreadElement in fetch options',
    ]);
  });

  it('reports a wrapper passed around as a value, and an import it cannot find', () => {
    const sources = {
      'modules/api.js': wrapper,
      'screens/A.js':
        "import { add } from '../modules/api';\nimport x from './missing';\nexport const handlers = [add, x];\n",
    };
    expect(problemsIn(sources)).toEqual([
      'screens/A.js:3: function used as a value, its calls cannot be followed',
    ]);
    expect(analyze({ 'modules/authHeaders.js': HELPER, ...sources }).unresolvedImports).toEqual([
      'screens/A.js:2: ./missing',
    ]);
  });

  it('reads token keys, a spread user and FormData fields', () => {
    const sources = {
      'modules/api.js': `${API}export const up = (token, user) => {\n  const form = new FormData();\n  form.append('username', 'u');\n  fetch(\`\${addressIp}/upload/x\`, { headers: authHeaders(token), body: form });\n  return fetch(\`\${addressIp}/users/profile\`, { headers: jsonAuthHeaders(token), body: JSON.stringify({ ...currentUser, sessionToken: token }) });\n};\nconst currentUser = { a: 1 };\n`,
    };
    const fetches = authOf(sources);
    expect(keyLabels(fetchKeys(fetches), isTokenKey)).toEqual([
      'modules/api.js:7: ...currentUser',
      'modules/api.js:7: sessionToken',
    ]);
    expect(keyLabels(fetchKeys(fetches), (key) => key === 'username')).toEqual([
      'modules/api.js:5: username',
    ]);
  });

  it('reads token values, parameter defaults, and reports hand-written bodies', () => {
    const sources = {
      'modules/api.js': `${API}export const a = (t, user) => fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(t), body: JSON.stringify({ auth: user.token, k: t }) });\nexport const b = (t, body = { username: 'd' }) => fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(t), body: JSON.stringify(body) });\nexport const c = (t) => fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(t), body: \`{"token":"\${t}"}\` });\nexport const d = (t) => {\n  const form = new FormData();\n  form.set('token', t);\n  return fetch(\`\${addressIp}/upload/x\`, { headers: authHeaders(t), body: form });\n};\n`,
    };
    const auth = authOf(sources);
    expect(keyLabels(fetchKeys(auth), isTokenKey)).toEqual(['modules/api.js:3: auth: user.token']);
    expect(keyLabels(fetchKeys(auth), (key) => key === 'username')).toEqual([
      'modules/api.js:4: username',
    ]);
    expect(auth.flatMap((f) => f.problems)).toEqual([
      'modules/api.js:5: template literal with expressions cannot be followed',
      'modules/api.js:8: FormData used other than by append() or as a body',
    ]);
  });

  it('finds fetch through globalThis, and reports it passed around or a computed namespace call', () => {
    const sources = {
      'modules/api.js': `${wrapper}export const a = (t) => globalThis.fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(t), body: JSON.stringify({ username: 'g' }) });\nexport const get = fetch;\n`,
      'screens/A.js':
        "import * as api from '../modules/api';\nconst name = 'add';\napi[name]('t', { username: 'c' });\n",
    };
    const result = analyze({ 'modules/authHeaders.js': HELPER, ...sources });
    expect(keyLabels(fetchKeys(result.fetches), (key) => key === 'username')).toEqual([
      'modules/api.js:5: username',
    ]);
    expect(result.fetchAliases).toEqual(['modules/api.js:6: fetch used as a value']);
    expect(result.fetches.flatMap((f) => f.problems)).toEqual([
      'screens/A.js:3: computed access to a namespace import',
    ]);
  });

  it('checks how the headers are built', () => {
    const sources = {
      'modules/api.js': `${API}export const a = (t) => fetch(\`\${addressIp}/inventory\`, { headers: { Authorization: t } });\nexport const b = (t, c) => fetch(\`\${addressIp}/inventory\`, { headers: c ? jsonAuthHeaders(t) : { x: 1 } });\nexport const c = (t) => {\n  const h = authHeaders(t);\n  return fetch(\`\${addressIp}/upload/x\`, { headers: h });\n};\nexport const d = (t) => fetch(\`\${addressIp}/vision/x\`, { headers: jsonAuthHeaders(t) });\n`,
    };
    const byLine = Object.fromEntries(authOf(sources).map((f) => [f.at.split(':')[1], f]));
    expect(byLine[3]).toMatchObject({ usesHelper: false });
    expect(byLine[4]).toMatchObject({ usesHelper: false });
    expect(byLine[7]).toMatchObject({ usesHelper: true, multipartHeaders: true });
    expect(byLine[9]).toMatchObject({ usesHelper: true, multipartHeaders: false });
  });

  it('blanks comments before looking for the Bearer scheme', () => {
    const { sources } = analyze({
      'a.js': '// Bearer in prose\nconst x = 1; /* Bearer */\n',
      'b.js': "const h = { Authorization: 'Bearer ' + t };\n",
    });
    expect(/Bearer\s/.test(sources['a.js'].code)).toBe(false);
    expect(/Bearer\s/.test(sources['b.js'].code)).toBe(true);
  });
});
