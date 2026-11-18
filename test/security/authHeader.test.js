/* global describe, it, expect, __dirname */
// Plan 016, PR 3: the session token travels in the Authorization header only.
// Every call to an authenticated route builds its headers with
// modules/authHeaders.js, and no body carries a token. Plan 019, step 3.1: no
// authenticated body carries a `username` either (the backend reads the author
// from the token).
//
// The app sources are parsed (@babel/parser) and each fetch body is followed to
// the object literals it is built from: through variables, function parameters,
// wrapper calls (imported, namespace, local, useMemo / useCallback) and JSX props
// down to the component that calls them. A body that cannot be followed fails
// the test with its location: make it followable or extend the analysis below,
// never skip it. Each fetch must be classified as authenticated or public.
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ROOT = path.join(__dirname, '..', '..');
const SOURCE_DIRS = ['screens', 'components', 'modules', 'hooks', 'reducers', 'contexts'];
const HELPER_FILE = 'modules/authHeaders.js';

// Routes behind requireAuth or optionalAuth on the backend.
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

const HELPERS = ['jsonAuthHeaders', 'authHeaders'];
// token, authToken, sessionToken…, or a whole user object spread into the body.
const isTokenKey = (key) => /token/i.test(key) || /^\.\.\..*user$/i.test(key);
const MAX_DEPTH = 15;

const posix = (p) => p.split(path.sep).join('/');

const sourceFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return file.endsWith('.js') ? [file] : [];
  });
};

const appSources = () => {
  const files = [
    path.join(ROOT, 'App.js'),
    ...SOURCE_DIRS.flatMap((d) => sourceFiles(path.join(ROOT, d))),
  ];
  return Object.fromEntries(
    files.map((f) => [posix(path.relative(ROOT, f)), fs.readFileSync(f, 'utf8')]),
  );
};

const keyName = (node) => {
  if (!node || node.computed) return null;
  const key = node.key;
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'StringLiteral') return key.value;
  if (key.type === 'NumericLiteral') return String(key.value);
  return null;
};

const propName = (member) => {
  const { property, computed } = member.node;
  if (!computed && property.type === 'Identifier') return property.name;
  if (property.type === 'StringLiteral') return property.value;
  return null;
};

const calleeName = (call) => {
  const callee = call.get('callee');
  if (callee.isIdentifier()) return callee.node.name;
  if (callee.isMemberExpression()) return propName(callee);
  return null;
};

const isCallOf = (p, object, method) =>
  p.isCallExpression() &&
  p.get('callee').isMemberExpression() &&
  p.get('callee.object').isIdentifier({ name: object }) &&
  propName(p.get('callee')) === method;

const importedName = (spec) => spec.imported.name ?? spec.imported.value;

/**
 * Parses `sources` ({ 'screens/X.js': code }) and returns the fetch calls of the
 * app with their bodies followed to the keys they can carry.
 */
function analyze(sources) {
  const files = {};
  const byProgram = new Map();
  for (const [file, source] of Object.entries(sources)) {
    const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
    // The code without its comments, which mention Bearer and fetch() in prose.
    let code = source;
    for (const c of ast.comments)
      code = code.slice(0, c.start) + ' '.repeat(c.end - c.start) + code.slice(c.end);
    const entry = { file, source, code, program: null, imports: [], fetches: [], stringifies: [] };
    traverse(ast, {
      Program(p) {
        entry.program = p;
      },
      ImportDeclaration(p) {
        entry.imports.push(p);
      },
      CallExpression(p) {
        if (p.get('callee').isIdentifier({ name: 'fetch' }) && !p.scope.getBinding('fetch'))
          entry.fetches.push(p);
        if (isCallOf(p, 'JSON', 'stringify')) entry.stringifies.push(p);
      },
    });
    files[file] = entry;
    byProgram.set(entry.program.node, entry);
  }

  const entryOf = (p) => byProgram.get(p.scope.getProgramParent().block);
  const loc = (p) => `${entryOf(p).file}:${p.node.loc.start.line}`;
  const textOf = (p) => entryOf(p).source.slice(p.node.start, p.node.end);

  const resolveImport = (fromFile, spec) => {
    if (!spec.startsWith('.')) return null;
    const base = posix(path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec)));
    return [base, `${base}.js`, `${base}/index.js`].find((f) => files[f]) ?? null;
  };

  // A function, a name bound to one, or memo(fn) / forwardRef(fn).
  const functionOf = (p) => {
    if (!p || !p.node) return null;
    if (p.isFunction()) return p;
    if (p.isIdentifier()) {
      const binding = p.scope.getBinding(p.node.name);
      if (!binding) return null;
      if (binding.path.isFunctionDeclaration()) return binding.path;
      if (binding.path.isVariableDeclarator()) return functionOf(binding.path.get('init'));
      return null;
    }
    if (p.isCallExpression() && ['memo', 'forwardRef'].includes(calleeName(p))) {
      return functionOf(p.get('arguments')[0]);
    }
    return null;
  };

  const exportedFunction = (entry, name) => {
    for (const stmt of entry.program.get('body')) {
      if (name === 'default' && stmt.isExportDefaultDeclaration())
        return functionOf(stmt.get('declaration'));
      if (name === 'default' || !stmt.isExportNamedDeclaration() || stmt.node.source) continue;
      const decl = stmt.get('declaration');
      if (decl.isFunctionDeclaration() && decl.node.id.name === name) return decl;
      if (decl.isVariableDeclaration()) {
        const v = decl.get('declarations').find((d) => d.node.id.name === name);
        if (v) return functionOf(v.get('init'));
      }
      const spec = stmt
        .get('specifiers')
        .find((s) => (s.node.exported.name ?? s.node.exported.value) === name);
      if (spec) return functionOf(spec.get('local'));
    }
    return null;
  };

  // Names under which a top-level binding is exported.
  const exportNames = (binding) => {
    const entry = entryOf(binding.path);
    if (binding.scope !== entry.program.scope) return [];
    const name = binding.identifier.name;
    const holder = binding.path.isVariableDeclarator() ? binding.path.parentPath : binding.path;
    const names = [];
    if (holder.parentPath.isExportNamedDeclaration()) names.push(name);
    if (holder.parentPath.isExportDefaultDeclaration()) names.push('default');
    for (const stmt of entry.program.get('body')) {
      if (stmt.isExportNamedDeclaration() && !stmt.node.source) {
        for (const s of stmt.node.specifiers)
          if (s.local?.name === name) names.push(s.exported.name ?? s.exported.value);
      }
      if (stmt.isExportDefaultDeclaration() && stmt.get('declaration').isIdentifier({ name }))
        names.push('default');
    }
    return names;
  };

  // Every use of a binding, in its file and in the files that import it.
  const usesOf = (binding) => {
    const refs = [...binding.referencePaths];
    const problems = [];
    const names = exportNames(binding);
    if (names.length === 0) return { refs, problems };
    const home = entryOf(binding.path).file;
    for (const other of Object.values(files)) {
      for (const imp of other.imports) {
        if (resolveImport(other.file, imp.node.source.value) !== home) continue;
        for (const spec of imp.get('specifiers')) {
          const local = other.program.scope.getBinding(spec.node.local.name);
          if (!local) continue;
          if (spec.isImportSpecifier() && names.includes(importedName(spec.node)))
            refs.push(...local.referencePaths);
          if (spec.isImportDefaultSpecifier() && names.includes('default'))
            refs.push(...local.referencePaths);
          if (spec.isImportNamespaceSpecifier()) {
            for (const r of local.referencePaths) {
              if (r.parentPath.isMemberExpression() && r.key === 'object') {
                if (names.includes(propName(r.parentPath))) refs.push(r.parentPath);
              } else problems.push(`${loc(r)}: namespace import used as a value`);
            }
          }
        }
      }
    }
    return { refs, problems };
  };

  // The binding that names a function: its declaration, `const f = …`,
  // `const f = useCallback(fn, …)` or `const f = useMemo(() => fn, …)`.
  const isHookArg = (p, hook) =>
    p.parentPath.isCallExpression() &&
    p.listKey === 'arguments' &&
    p.key === 0 &&
    calleeName(p.parentPath) === hook;
  const bindingOfFunction = (fn) => {
    if (fn.isFunctionDeclaration() && fn.node.id)
      return fn.parentPath.scope.getBinding(fn.node.id.name);
    let p = fn;
    const returned = p.parentPath.isReturnStatement();
    if (returned || (p.parentPath.isArrowFunctionExpression() && p.key === 'body')) {
      const factory = returned ? p.parentPath.getFunctionParent() : p.parentPath;
      if (!factory || !isHookArg(factory, 'useMemo')) return null;
      p = factory.parentPath;
    } else if (isHookArg(p, 'useCallback')) p = p.parentPath;
    if (
      p.parentPath.isVariableDeclarator() &&
      p.key === 'init' &&
      p.parentPath.get('id').isIdentifier()
    ) {
      return p.parentPath.scope.getBinding(p.parentPath.node.id.name);
    }
    return null;
  };

  // The function a JSX element renders, from the app sources.
  const componentFunction = (opening) => {
    const name = opening.node.name;
    if (name.type !== 'JSXIdentifier') return null;
    const binding = opening.scope.getBinding(name.name);
    if (!binding) return null;
    if (binding.kind !== 'module')
      return functionOf(
        binding.path.isVariableDeclarator() ? binding.path.get('init') : binding.path,
      );
    const target =
      files[resolveImport(entryOf(opening).file, binding.path.parentPath.node.source.value)];
    if (!target) return null;
    const spec = binding.path.node;
    return exportedFunction(
      target,
      spec.type === 'ImportDefaultSpecifier' ? 'default' : importedName(spec),
    );
  };

  // Uses, inside the component, of the function passed as a JSX prop.
  const propUses = (attribute) => {
    const prop = attribute.node.name.name;
    const component = componentFunction(attribute.parentPath);
    if (!component)
      return {
        refs: [],
        problems: [`${loc(attribute)}: component of prop ${prop} not found in the app`],
      };
    const [first] = component.get('params');
    if (!first) return { refs: [], problems: [] };
    if (first.isIdentifier()) {
      const refs = [];
      const problems = [];
      for (const r of component.scope.getBinding(first.node.name).referencePaths) {
        if (r.parentPath.isMemberExpression() && r.key === 'object') {
          if (propName(r.parentPath) === prop) refs.push(r.parentPath);
        } else problems.push(`${loc(r)}: props used as a whole, ${prop} cannot be followed`);
      }
      return { refs, problems };
    }
    if (!first.isObjectPattern())
      return { refs: [], problems: [`${loc(first)}: props pattern cannot be followed`] };
    const property = first
      .get('properties')
      .find((p) => p.isObjectProperty() && keyName(p.node) === prop);
    if (!property) {
      const rest = first.get('properties').some((p) => p.isRestElement());
      return { refs: [], problems: rest ? [`${loc(first)}: ${prop} may go through ...rest`] : [] };
    }
    let value = property.get('value');
    if (value.isAssignmentPattern()) value = value.get('left');
    if (!value.isIdentifier())
      return { refs: [], problems: [`${loc(value)}: prop ${prop} pattern cannot be followed`] };
    return { refs: component.scope.getBinding(value.node.name).referencePaths, problems: [] };
  };

  // Calls of a function, through aliases and JSX props.
  const callsOfRefs = (refs, depth, seen) => {
    const calls = [];
    const problems = [];
    for (const r of refs) {
      // Babel also counts `export const f = …` as a reference of f: only names are uses.
      if (!(r.isIdentifier() || r.isMemberExpression() || r.isJSXIdentifier())) continue;
      if (seen.has(r.node)) continue;
      seen.add(r.node);
      const parent = r.parentPath;
      if ((parent.isCallExpression() || parent.isOptionalCallExpression()) && r.key === 'callee') {
        calls.push(parent);
        continue;
      }
      if (parent.isExportSpecifier() || parent.isExportDefaultDeclaration()) continue;
      if (depth > MAX_DEPTH) {
        problems.push(`${loc(r)}: too deep to follow`);
        continue;
      }
      let next = null;
      if (parent.isJSXExpressionContainer() && parent.parentPath.isJSXAttribute())
        next = propUses(parent.parentPath);
      else if (
        parent.isVariableDeclarator() &&
        r.key === 'init' &&
        parent.get('id').isIdentifier()
      ) {
        next = usesOf(parent.scope.getBinding(parent.node.id.name));
      }
      if (!next) {
        problems.push(`${loc(r)}: function used as a value, its calls cannot be followed`);
        continue;
      }
      problems.push(...next.problems);
      const sub = callsOfRefs(next.refs, depth + 1, seen);
      calls.push(...sub.calls);
      problems.push(...sub.problems);
    }
    return { calls, problems };
  };

  const callsOf = (fn, depth) => {
    const binding = bindingOfFunction(fn);
    if (!binding)
      return {
        calls: [],
        problems: [`${loc(fn)}: unnamed function, its calls cannot be followed`],
      };
    const uses = usesOf(binding);
    const sub = callsOfRefs(uses.refs, depth, new Set());
    return { calls: sub.calls, problems: [...uses.problems, ...sub.problems] };
  };

  // Where a parameter sits: index in the parameter list, and key if destructured.
  const paramPosition = (binding) => {
    const root = binding.path;
    let p = root;
    if (!root.isIdentifier() || root.node !== binding.identifier) {
      p = null;
      root.traverse({
        Identifier(q) {
          if (q.node === binding.identifier) {
            p = q;
            q.stop();
          }
        },
      });
      if (!p) return null;
    }
    let key = null;
    while (p !== root) {
      const parent = p.parentPath;
      if (parent.isAssignmentPattern() && p.key === 'left') p = parent;
      else if (
        parent.isObjectProperty() &&
        p.key === 'value' &&
        parent.parentPath.isObjectPattern() &&
        key === null
      ) {
        key = keyName(parent.node);
        p = parent.parentPath;
      } else return null;
    }
    if (root.listKey !== 'params') return null;
    return { fn: root.parentPath, index: root.key, key };
  };

  const argumentAt = (call, { index, key }) => {
    const args = call.get('arguments');
    if (args.slice(0, index + 1).some((a) => a.isSpreadElement()))
      return { problem: `${loc(call)}: spread arguments` };
    const arg = args[index];
    if (!arg) return {};
    if (key === null) return { path: arg };
    if (!arg.isObjectExpression())
      return { problem: `${loc(arg)}: argument is not an object literal` };
    const prop = arg.get('properties').find((p) => p.isObjectProperty() && keyName(p.node) === key);
    if (prop) return { path: prop.get('value') };
    if (arg.get('properties').some((p) => p.isSpreadElement()))
      return { problem: `${loc(arg)}: ${key} may come from a spread` };
    return {};
  };

  /** Keys a value can carry, and what could not be followed. */
  const keysOf = (expr, depth = 0, seen = new Set()) => {
    const out = { keys: [], problems: [] };
    if (!expr || !expr.node) return out;
    if (seen.has(expr.node)) return out;
    seen.add(expr.node);
    if (depth > MAX_DEPTH) {
      out.problems.push(`${loc(expr)}: too deep to follow`);
      return out;
    }
    const follow = (p) => {
      const r = keysOf(p, depth + 1, seen);
      out.keys.push(...r.keys);
      out.problems.push(...r.problems);
    };
    const fail = (why) => out.problems.push(`${loc(expr)}: ${why}`);

    if (expr.isObjectExpression()) {
      for (const prop of expr.get('properties')) {
        if (prop.isSpreadElement()) {
          const arg = prop.get('argument');
          if (arg.isIdentifier() && /user$/i.test(arg.node.name))
            out.keys.push({ key: `...${arg.node.name}`, at: loc(prop) });
          else follow(arg);
          continue;
        }
        const key = keyName(prop.node);
        if (key === null) {
          out.problems.push(`${loc(prop)}: computed key`);
          continue;
        }
        out.keys.push({ key, at: loc(prop) });
      }
    } else if (expr.isIdentifier()) {
      if (expr.node.name === 'undefined') return out;
      const binding = expr.scope.getBinding(expr.node.name);
      if (!binding) fail(`${expr.node.name} is not declared in the file`);
      else if (binding.kind === 'param') {
        const position = paramPosition(binding);
        if (!position) fail(`parameter pattern of ${expr.node.name} cannot be followed`);
        else {
          const { calls, problems } = callsOf(position.fn, depth);
          out.problems.push(...problems);
          for (const call of calls) {
            const arg = argumentAt(call, position);
            if (arg.problem) out.problems.push(arg.problem);
            else if (arg.path) follow(arg.path);
          }
        }
      } else if (binding.path.isVariableDeclarator() && binding.path.get('id').isIdentifier()) {
        follow(binding.path.get('init'));
        for (const change of binding.constantViolations) {
          if (change.isAssignmentExpression({ operator: '=' })) follow(change.get('right'));
          else
            out.problems.push(
              `${loc(change)}: ${expr.node.name} changed in a way that cannot be followed`,
            );
        }
      } else fail(`${expr.node.name} (${binding.kind}) cannot be followed`);
    } else if (expr.isLogicalExpression()) {
      follow(expr.get('left'));
      follow(expr.get('right'));
    } else if (expr.isConditionalExpression()) {
      follow(expr.get('consequent'));
      follow(expr.get('alternate'));
    } else if (isCallOf(expr, 'JSON', 'stringify')) {
      follow(expr.get('arguments')[0]);
    } else if (isCallOf(expr, 'Object', 'assign')) {
      for (const arg of expr.get('arguments')) follow(arg);
    } else if (expr.isNewExpression() && expr.get('callee').isIdentifier({ name: 'FormData' })) {
      // Multipart body: the keys are the names given to append().
      const holder = expr.parentPath;
      if (!holder.isVariableDeclarator() || !holder.get('id').isIdentifier())
        fail('FormData not held in a variable');
      else {
        for (const r of holder.scope.getBinding(holder.node.id.name).referencePaths) {
          const member = r.parentPath;
          if (
            member.isMemberExpression() &&
            propName(member) === 'append' &&
            member.parentPath.isCallExpression()
          ) {
            const [name] = member.parentPath.get('arguments');
            if (name?.isStringLiteral()) out.keys.push({ key: name.node.value, at: loc(name) });
            else out.problems.push(`${loc(member)}: FormData field name is not a string literal`);
          }
        }
      }
    } else if (!(
      expr.isNullLiteral() ||
      expr.isStringLiteral() ||
      expr.isTemplateLiteral() ||
      expr.isNumericLiteral()
    )) {
      fail(`${expr.node.type} cannot be followed`);
    }
    return out;
  };

  // An options object: a literal, or a name bound to one.
  const objectOf = (p) => {
    if (!p || !p.node) return null;
    if (p.isObjectExpression()) return p;
    if (p.isIdentifier()) {
      const binding = p.scope.getBinding(p.node.name);
      if (binding?.path.isVariableDeclarator()) return objectOf(binding.path.get('init'));
    }
    return null;
  };
  const valueOf = (object, name) =>
    object
      ?.get('properties')
      .find((p) => p.isObjectProperty() && keyName(p.node) === name)
      ?.get('value') ?? null;
  const urlText = (p) => {
    if (p?.isIdentifier()) {
      const binding = p.scope.getBinding(p.node.name);
      if (binding?.path.isVariableDeclarator()) return urlText(binding.path.get('init'));
    }
    return p?.node ? textOf(p) : '';
  };
  const callsHelper = (p) => {
    if (!p || !p.node) return false;
    if (p.isCallExpression() && HELPERS.includes(calleeName(p))) return true;
    let found = false;
    p.traverse({
      CallExpression(q) {
        if (HELPERS.includes(calleeName(q))) {
          found = true;
          q.stop();
        }
      },
    });
    return found;
  };

  const fetches = Object.values(files).flatMap((entry) =>
    entry.fetches.map((call) => {
      const [url, opts] = call.get('arguments');
      const options = objectOf(opts);
      const headers = valueOf(options, 'headers');
      const body = valueOf(options, 'body');
      const target = urlText(url);
      return {
        at: loc(call),
        target,
        auth: AUTH_ROUTES.some((r) => r.test(target)),
        public: PUBLIC_ROUTES.some((r) => r.test(target)),
        usesHelper: callsHelper(headers),
        headersText: headers?.node ? textOf(headers) : '',
        headersIsAuthHeaders:
          !!headers?.isCallExpression() && calleeName(headers) === 'authHeaders',
        body: keysOf(body),
      };
    }),
  );
  const stringified = Object.values(files).flatMap((entry) =>
    entry.stringifies.map((call) => keysOf(call.get('arguments')[0])),
  );
  return { fetches, stringified, sources: files };
}

const label = ({ at, target }) => `${at}: ${target.split('\n')[0]}`;
const keyLabels = (fetches, test) =>
  fetches.flatMap((f) =>
    f.body.keys.filter(({ key }) => test(key)).map(({ key, at }) => `${at}: ${key}`),
  );

describe('session token in the Authorization header only', () => {
  const app = analyze(appSources());
  const authCalls = app.fetches.filter((f) => f.auth);

  it('scans the app calls', () => {
    expect(app.fetches.length).toBeGreaterThan(30);
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
    const offenders = multipart.filter(
      (f) => !f.headersIsAuthHeaders || /Content-Type/i.test(f.headersText),
    );
    expect(offenders.map(label)).toEqual([]);
  });

  it('follows every authenticated body to the literals it is built from', () => {
    expect(authCalls.flatMap((f) => f.body.problems)).toEqual([]);
  });

  it('puts no token in a request body', () => {
    expect(keyLabels(app.fetches, isTokenKey)).toEqual([]);
    const inJson = app.stringified.flatMap((r) =>
      r.keys.filter(({ key }) => isTokenKey(key)).map(({ at, key }) => `${at}: ${key}`),
    );
    expect(inJson).toEqual([]);
  });

  it('sends no username in the body of an authenticated call', () => {
    expect(keyLabels(authCalls, (key) => key === 'username')).toEqual([]);
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
  const usernamesIn = (sources) =>
    keyLabels(
      analyze(sources).fetches.filter((f) => f.auth),
      (key) => key === 'username',
    );
  const problemsIn = (sources) =>
    analyze(sources)
      .fetches.filter((f) => f.auth)
      .flatMap((f) => f.body.problems);

  const wrapper = `${API}export const add = async (token, body) =>\n  fetch(\`\${addressIp}/inventory\`, { method: 'POST', headers: jsonAuthHeaders(token), body: JSON.stringify(body) });\n`;

  it('follows a wrapper called through a namespace import', () => {
    const sources = {
      'modules/api.js': wrapper,
      'screens/A.js':
        "import * as api from '../modules/api';\nexport default function A({ t }) {\n  return api.add(t, { username: 'u', q: 1 });\n}\n",
    };
    expect(usernamesIn(sources)).toEqual(['screens/A.js:3: username']);
  });

  it('follows a wrapper through an alias, a local handler and a JSX prop', () => {
    const sources = {
      'modules/api.js': wrapper,
      'components/Sheet.js':
        "export default function Sheet({ onSubmit }) {\n  const go = () => {\n    const payload = { qty: 1, username: 'u' };\n    onSubmit?.(payload);\n  };\n  return go;\n}\n",
      'screens/P.js':
        "import { add } from '../modules/api';\nimport Sheet from '../components/Sheet';\nexport default function P({ t }) {\n  const send = add;\n  const submit = async (payload) => send(t, payload);\n  return <Sheet onSubmit={submit} />;\n}\n",
    };
    expect(usernamesIn(sources)).toEqual(['components/Sheet.js:3: username']);
  });

  it('follows a useMemo-returned function and a destructured parameter', () => {
    const sources = {
      'modules/api.js': `${API}export async function patch({ token, partial }) {\n  return fetch(\`\${addressIp}/users/settings\`, { method: 'PATCH', headers: jsonAuthHeaders(token), body: JSON.stringify(partial) });\n}\n`,
      'screens/S.js':
        "import { useMemo } from 'react';\nimport { patch } from '../modules/api';\nexport default function S({ token }) {\n  const save = useMemo(() => {\n    return (partial) => patch({ token, partial });\n  }, [token]);\n  save({ tags: [] });\n  save({ username: 'u' });\n}\n",
    };
    expect(usernamesIn(sources)).toEqual(['screens/S.js:8: username']);
  });

  it('follows spreads, defaults and a body stringified before the fetch', () => {
    const sources = {
      'modules/api.js': `${API}function other() {\n  const body = { ok: 1 };\n  return body;\n}\nexport const add = async (token, body) =>\n  fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(token), body: JSON.stringify({ ...body, locale: 'fr' }) });\nexport const vote = async (token) => {\n  const body = JSON.stringify({ username: 'u' });\n  return fetch(\`\${addressIp}/recipes/vote/1\`, { headers: jsonAuthHeaders(token), body });\n};\n`,
      'screens/A.js': "import { add } from '../modules/api';\nadd('t', { username: 'u' } ?? {});\n",
    };
    expect(usernamesIn(sources).sort()).toEqual([
      'modules/api.js:10: username',
      'screens/A.js:2: username',
    ]);
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
      'modules/api.js': `${API}export const api = {\n  add(token, body) {\n    return fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(token), body: JSON.stringify(body) });\n  },\n};\nexport const add = (token, body) => fetch(\`\${addressIp}/inventory\`, { headers: jsonAuthHeaders(token), body: JSON.stringify(makeBody(body)) });\n`,
      'screens/A.js': "import { add } from '../modules/api';\nconst handlers = [add];\n",
    };
    const problems = problemsIn(sources);
    expect(problems.some((p) => p.startsWith('modules/api.js:4: unnamed function'))).toBe(true);
    expect(problems.some((p) => p.includes('CallExpression cannot be followed'))).toBe(true);
  });

  it('reports a wrapper passed around as a value', () => {
    const sources = {
      'modules/api.js': wrapper,
      'screens/A.js': "import { add } from '../modules/api';\nexport const handlers = [add];\n",
    };
    expect(problemsIn(sources)).toEqual([
      'screens/A.js:2: function used as a value, its calls cannot be followed',
    ]);
  });

  it('reads token keys, a spread user and FormData fields', () => {
    const sources = {
      'modules/api.js': `${API}export const up = (token, user) => {\n  const form = new FormData();\n  form.append('username', 'u');\n  fetch(\`\${addressIp}/upload/x\`, { headers: authHeaders(token), body: form });\n  return fetch(\`\${addressIp}/users/profile\`, { headers: jsonAuthHeaders(token), body: JSON.stringify({ ...currentUser, sessionToken: token }) });\n};\nconst currentUser = { a: 1 };\n`,
    };
    const { fetches } = analyze(sources);
    expect(keyLabels(fetches, isTokenKey)).toEqual([
      'modules/api.js:7: ...currentUser',
      'modules/api.js:7: sessionToken',
    ]);
    expect(keyLabels(fetches, (key) => key === 'username')).toEqual(['modules/api.js:5: username']);
  });
});
