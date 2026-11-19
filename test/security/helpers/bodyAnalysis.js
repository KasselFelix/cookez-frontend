// The analysis behind test/security/authHeader.test.js, kept apart from the
// tests so that a new test case can be seen red on the previous analysis
// (`git stash push -- test/security/helpers/bodyAnalysis.js`).
//
// The app sources are parsed (@babel/parser) and each fetch body is followed to
// the object literals it is built from: through variables (their mutations
// too), function parameters, wrapper calls (imported, re-exported, namespace,
// local, useMemo / useCallback) and JSX props down to the component that calls
// them, nested keys included. A body or an option object that cannot be
// followed fails the test with its location: make it followable or extend the
// analysis below, never skip it. Each fetch must be classified as authenticated
// or public.
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ROOT = path.join(__dirname, '..', '..', '..');
// Every folder of app code: an import into a folder left out would hide its wrappers.
const SOURCE_DIRS = [
  'screens',
  'components',
  'modules',
  'hooks',
  'reducers',
  'contexts',
  'i18n',
  'styles',
];
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
// `token`, `...user`, or a key labelled with its value: `auth: user.token`,
// `profile: user` (the whole user carries the token).
const isTokenKey = (key) =>
  /token/i.test(key) || /^\.\.\..*user$/i.test(key) || /^[^:]+: [\w.]*user$/i.test(key);
// `username`, or a key labelled with its value: `author: user.username`.
const isUsernameKey = (key) => key === 'username' || /^[^:]+: [\w.]*username$/i.test(key);
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

const isMember = (p) => p.isMemberExpression() || p.isOptionalMemberExpression();

const propName = (member) => {
  const { property, computed } = member.node;
  if (!computed && property.type === 'Identifier') return property.name;
  if (property.type === 'StringLiteral') return property.value;
  return null;
};

const calleeName = (call) => {
  const callee = call.get('callee');
  if (callee.isIdentifier()) return callee.node.name;
  if (isMember(callee)) return propName(callee);
  return null;
};

const isCallOf = (p, object, method) =>
  p.isCallExpression() &&
  isMember(p.get('callee')) &&
  p.get('callee.object').isIdentifier({ name: object }) &&
  propName(p.get('callee')) === method;

const exportedName = (spec) => spec.exported.name ?? spec.exported.value;
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
    for (const c of ast.comments) {
      code = code.slice(0, c.start) + ' '.repeat(c.end - c.start) + code.slice(c.end);
    }
    const entry = {
      file,
      source,
      code,
      program: null,
      fetches: [],
      stringifies: [],
      fetchAliases: [],
    };
    // `fetch`, or `globalThis.fetch` / `window.fetch` / `global.fetch`, unshadowed.
    const isGlobalFetch = (p) =>
      (p.isIdentifier({ name: 'fetch' }) && !p.scope.getBinding('fetch')) ||
      (isMember(p) &&
        propName(p) === 'fetch' &&
        p.get('object').isIdentifier() &&
        ['globalThis', 'window', 'global'].includes(p.node.object.name) &&
        !p.scope.getBinding(p.node.object.name));
    traverse(ast, {
      Program(p) {
        entry.program = p;
      },
      'Identifier|MemberExpression|OptionalMemberExpression'(p) {
        if (!isGlobalFetch(p) || (p.isIdentifier() && !p.isReferencedIdentifier())) return;
        if (isMember(p.parentPath) && p.key === 'property') return;
        const call = p.parentPath;
        if ((call.isCallExpression() || call.isOptionalCallExpression()) && p.key === 'callee') {
          entry.fetches.push(call);
        } else entry.fetchAliases.push(p);
      },
      CallExpression(p) {
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
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec));
    return [base, `${base}.js`, `${base}/index.js`].find((f) => files[f]) ?? null;
  };

  // Module statements that name another file of the app, with that file.
  const links = Object.values(files).flatMap((entry) =>
    entry.program
      .get('body')
      .filter((s) => (s.isImportDeclaration() || s.isExportDeclaration()) && s.node.source)
      .map((stmt) => ({
        entry,
        stmt,
        target: resolveImport(entry.file, stmt.node.source.value),
      })),
  );
  // Relative imports of code that no parsed file answers (JSON and assets are not code).
  const isCodeImport = (spec) => spec.startsWith('.') && !/\.(?!js$)[a-z0-9]+$/i.test(spec);
  const unresolvedImports = links
    .filter(({ stmt, target }) => !target && isCodeImport(stmt.node.source.value))
    .map(({ stmt }) => `${loc(stmt)}: ${stmt.node.source.value}`);

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

  const exportedFunction = (entry, name, seen = new Set()) => {
    if (seen.has(`${entry.file}#${name}`)) return null;
    seen.add(`${entry.file}#${name}`);
    for (const stmt of entry.program.get('body')) {
      if (name === 'default' && stmt.isExportDefaultDeclaration()) {
        return functionOf(stmt.get('declaration'));
      }
      if (!stmt.isExportNamedDeclaration()) continue;
      const spec = stmt.get('specifiers').find((s) => exportedName(s.node) === name);
      if (stmt.node.source) {
        const target = files[resolveImport(entry.file, stmt.node.source.value)];
        if (spec && target) return exportedFunction(target, spec.node.local.name, seen);
        continue;
      }
      if (spec) return functionOf(spec.get('local'));
      const decl = stmt.get('declaration');
      if (decl.isFunctionDeclaration() && decl.node.id.name === name) return decl;
      if (decl.isVariableDeclaration()) {
        const v = decl.get('declarations').find((d) => d.node.id.name === name);
        if (v) return functionOf(v.get('init'));
      }
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
          if (s.local?.name === name) names.push(exportedName(s));
      }
      if (stmt.isExportDefaultDeclaration() && stmt.get('declaration').isIdentifier({ name })) {
        names.push('default');
      }
    }
    return names;
  };

  // Uses of `names` exported by `home`, in the files that import them, directly
  // or through a re-export (`export { x } from`, `export * from`).
  const importedUses = (home, names, seen = new Set()) => {
    const refs = [];
    const problems = [];
    if (names.length === 0 || seen.has(`${home}#${names.join(',')}`)) return { refs, problems };
    seen.add(`${home}#${names.join(',')}`);
    const merge = (r) => {
      refs.push(...r.refs);
      problems.push(...r.problems);
    };
    for (const { entry, stmt, target } of links) {
      if (target !== home) continue;
      if (stmt.isExportAllDeclaration()) {
        merge(
          importedUses(
            entry.file,
            names.filter((n) => n !== 'default'),
            seen,
          ),
        );
        continue;
      }
      for (const spec of stmt.get('specifiers')) {
        if (stmt.isExportNamedDeclaration()) {
          if (spec.isExportNamespaceSpecifier()) {
            problems.push(`${loc(spec)}: namespace re-export cannot be followed`);
          } else if (names.includes(spec.node.local.name)) {
            merge(importedUses(entry.file, [exportedName(spec.node)], seen));
          }
          continue;
        }
        const local = entry.program.scope.getBinding(spec.node.local.name);
        if (!local) continue;
        if (spec.isImportSpecifier() && names.includes(importedName(spec.node))) {
          refs.push(...local.referencePaths);
        }
        if (spec.isImportDefaultSpecifier() && names.includes('default')) {
          refs.push(...local.referencePaths);
        }
        if (spec.isImportNamespaceSpecifier()) {
          for (const r of local.referencePaths) {
            if (isMember(r.parentPath) && r.key === 'object') {
              const member = propName(r.parentPath);
              if (member === null)
                problems.push(`${loc(r)}: computed access to a namespace import`);
              else if (names.includes(member)) refs.push(r.parentPath);
            } else problems.push(`${loc(r)}: namespace import used as a value`);
          }
        }
      }
    }
    return { refs, problems };
  };

  // Every use of a binding, in its file and in the files that import it.
  const usesOf = (binding) => {
    const imported = importedUses(entryOf(binding.path).file, exportNames(binding));
    return { refs: [...binding.referencePaths, ...imported.refs], problems: imported.problems };
  };

  // The binding that names a function: its declaration, `const f = …`,
  // `const f = useCallback(fn, …)` or `const f = useMemo(() => fn, …)`.
  const isHookArg = (p, hook) =>
    p.parentPath.isCallExpression() &&
    p.listKey === 'arguments' &&
    p.key === 0 &&
    calleeName(p.parentPath) === hook;
  const bindingOfFunction = (fn) => {
    if (fn.isFunctionDeclaration() && fn.node.id) {
      return fn.parentPath.scope.getBinding(fn.node.id.name);
    }
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
    if (binding.kind !== 'module') {
      return functionOf(
        binding.path.isVariableDeclarator() ? binding.path.get('init') : binding.path,
      );
    }
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
    if (!component) {
      return {
        refs: [],
        problems: [`${loc(attribute)}: component of prop ${prop} not found in the app`],
      };
    }
    const [first] = component.get('params');
    if (!first) return { refs: [], problems: [] };
    if (first.isIdentifier()) {
      const refs = [];
      const problems = [];
      for (const r of component.scope.getBinding(first.node.name).referencePaths) {
        if (isMember(r.parentPath) && r.key === 'object') {
          if (propName(r.parentPath) === prop) refs.push(r.parentPath);
        } else problems.push(`${loc(r)}: props used as a whole, ${prop} cannot be followed`);
      }
      return { refs, problems };
    }
    if (!first.isObjectPattern()) {
      return { refs: [], problems: [`${loc(first)}: props pattern cannot be followed`] };
    }
    const property = first
      .get('properties')
      .find((p) => p.isObjectProperty() && keyName(p.node) === prop);
    if (!property) {
      const rest = first.get('properties').some((p) => p.isRestElement());
      return { refs: [], problems: rest ? [`${loc(first)}: ${prop} may go through ...rest`] : [] };
    }
    let value = property.get('value');
    if (value.isAssignmentPattern()) value = value.get('left');
    if (!value.isIdentifier()) {
      return { refs: [], problems: [`${loc(value)}: prop ${prop} pattern cannot be followed`] };
    }
    return { refs: component.scope.getBinding(value.node.name).referencePaths, problems: [] };
  };

  // Calls of a function, through aliases and JSX props.
  const callsOfRefs = (refs, depth, seen) => {
    const calls = [];
    const problems = [];
    for (const r of refs) {
      if (seen.has(r.node)) continue;
      seen.add(r.node);
      if (!(r.isIdentifier() || isMember(r) || r.isJSXIdentifier())) {
        // Babel also counts `export const f = …` as a reference of f.
        if (!r.isDeclaration())
          problems.push(`${loc(r)}: ${r.node.type} reference cannot be followed`);
        continue;
      }
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
      if (parent.isJSXExpressionContainer() && parent.parentPath.isJSXAttribute()) {
        next = propUses(parent.parentPath);
      } else if (
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
    if (!binding) {
      return {
        calls: [],
        problems: [`${loc(fn)}: unnamed function, its calls cannot be followed`],
      };
    }
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
    const defaults = [];
    while (p !== root) {
      const parent = p.parentPath;
      if (parent.isAssignmentPattern() && p.key === 'left') {
        defaults.push(parent.get('right'));
        p = parent;
      } else if (
        parent.isObjectProperty() &&
        p.key === 'value' &&
        parent.parentPath.isObjectPattern() &&
        key === null
      ) {
        key = keyName(parent.node);
        p = parent.parentPath;
      } else return null;
    }
    if (root.isAssignmentPattern()) defaults.push(root.get('right'));
    if (root.listKey !== 'params') return null;
    return { fn: root.parentPath, index: root.key, key, defaults };
  };

  const argumentAt = (call, { index, key }) => {
    const args = call.get('arguments');
    if (args.slice(0, index + 1).some((a) => a.isSpreadElement())) {
      return { problem: `${loc(call)}: spread arguments` };
    }
    const arg = args[index];
    if (!arg) return {};
    if (key === null) return { path: arg };
    if (!arg.isObjectExpression())
      return { problem: `${loc(arg)}: argument is not an object literal` };
    const prop = arg.get('properties').find((p) => p.isObjectProperty() && keyName(p.node) === key);
    if (prop) return { path: prop.get('value') };
    if (arg.get('properties').some((p) => p.isSpreadElement())) {
      return { problem: `${loc(arg)}: ${key} may come from a spread` };
    }
    return {};
  };

  // `const [name, setName] = useState(init)`: the initial value and the setter.
  const stateOf = (binding, name) => {
    const declarator = binding.path;
    if (!declarator.isVariableDeclarator()) return null;
    const id = declarator.get('id');
    const init = declarator.get('init');
    if (!id.isArrayPattern() || !init.isCallExpression() || calleeName(init) !== 'useState') {
      return null;
    }
    const [value, setter] = id.get('elements');
    if (!value?.isIdentifier({ name })) return null;
    return { init: init.get('arguments')[0], setter: setter?.isIdentifier() ? setter : null };
  };
  // First argument of every call to the setter, through aliases and JSX props
  // (`<IngredientsList setIngredientsList={setIngredientsList} />`), as for a
  // function; a setter handed elsewhere (`onChangeText={setX}`) is a problem.
  const setterUses = (setter, depth) => {
    if (!setter) return { values: [], problems: [] };
    const binding = setter.scope.getBinding(setter.node.name);
    const { calls, problems } = callsOfRefs(binding.referencePaths, depth, new Set());
    return { values: calls.map((call) => call.get('arguments')[0]), problems };
  };
  // What a function returns: its expression body, or each `return` of its own.
  const returnsOf = (fn) => {
    const body = fn.get('body');
    if (!body.isBlockStatement()) return [body];
    const out = [];
    body.traverse({
      Function(p) {
        p.skip();
      },
      ReturnStatement(p) {
        out.push(p.get('argument'));
      },
    });
    return out;
  };
  // The `prev` of an updater `setX((prev) => …)`: the state itself, followed already.
  const previousStates = new Set();

  /** Keys a value can carry (nested ones too), and what could not be followed. */
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
    // A value inside a body: its literals, on each side of `??` or `? :`.
    // A value held in a variable can carry keys too: `{ location: payload }`
    // (a parameter, a constant, a state). It is followed as far as it goes,
    // and every key found on the way is checked. What it cannot follow stays
    // a leaf, as any nested value did before: a field or a call result (text
    // or numbers here), but also a setter handed to a prop (`onChangeText`)
    // or a handler passed as a value. Failing on those would flag some thirty
    // text inputs and callbacks; only the body itself is followed to the end.
    // Its own `seen` keeps that visit from hiding the variable from another path.
    const followNested = (p) => {
      if (p.isObjectExpression() || p.isArrayExpression()) follow(p);
      else if (p.isIdentifier()) out.keys.push(...keysOf(p, depth + 1, new Set(seen)).keys);
      else if (p.isLogicalExpression()) {
        followNested(p.get('left'));
        followNested(p.get('right'));
      } else if (p.isConditionalExpression()) {
        followNested(p.get('consequent'));
        followNested(p.get('alternate'));
      }
    };

    if (expr.isObjectExpression()) {
      for (const prop of expr.get('properties')) {
        if (prop.isSpreadElement()) {
          const arg = prop.get('argument');
          if (arg.isIdentifier() && /user$/i.test(arg.node.name)) {
            out.keys.push({ key: `...${arg.node.name}`, at: loc(prop) });
          } else follow(arg);
          continue;
        }
        const key = keyName(prop.node);
        if (key === null) {
          out.problems.push(`${loc(prop)}: computed key`);
          continue;
        }
        out.keys.push({ key, at: loc(prop) });
        if (!prop.isObjectProperty()) continue;
        const value = prop.get('value');
        followNested(value);
        // A token or a username under another name: `{ auth: user.token }`,
        // `{ author: user.username }`; or the whole user, token included:
        // `{ profile: user }`.
        const valueName = value.isIdentifier()
          ? value.node.name
          : isMember(value)
            ? propName(value)
            : null;
        const named =
          (/token/i.test(valueName) && !isTokenKey(key)) ||
          /user$/i.test(valueName) ||
          (/^username$/i.test(valueName) && !isUsernameKey(key));
        if (valueName && named) out.keys.push({ key: `${key}: ${textOf(value)}`, at: loc(prop) });
      }
    } else if (expr.isArrayExpression()) {
      for (const element of expr.get('elements')) {
        if (element.node) follow(element.isSpreadElement() ? element.get('argument') : element);
      }
    } else if (expr.isIdentifier()) {
      if (expr.node.name === 'undefined') return out;
      const binding = expr.scope.getBinding(expr.node.name);
      if (!binding) fail(`${expr.node.name} is not declared in the file`);
      else if (previousStates.has(binding)) return out;
      else if (binding.kind === 'param') {
        const position = paramPosition(binding);
        if (!position) fail(`parameter pattern of ${expr.node.name} cannot be followed`);
        else {
          for (const value of position.defaults) follow(value);
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
        // Keys added later: `x.key = …`, `x[k] = …`, `Object.assign(x, …)`.
        for (const r of binding.referencePaths) {
          const parent = r.parentPath;
          if (
            isMember(parent) &&
            r.key === 'object' &&
            parent.parentPath.isAssignmentExpression() &&
            parent.key === 'left'
          ) {
            const key = propName(parent);
            if (key === null)
              out.problems.push(`${loc(parent)}: computed key added to ${expr.node.name}`);
            else out.keys.push({ key, at: loc(parent) });
            followNested(parent.parentPath.get('right'));
          } else if (
            isCallOf(parent, 'Object', 'assign') &&
            r.listKey === 'arguments' &&
            r.key === 0
          ) {
            for (const arg of parent.get('arguments').slice(1)) follow(arg);
          }
        }
      } else if (stateOf(binding, expr.node.name)) {
        // A React state: `const [x, setX] = useState(init)`. Its values are the
        // initial one and those given to the setter; a lazy initializer or an
        // updater `(prev) => …` gives what it returns.
        const { init, setter } = stateOf(binding, expr.node.name);
        const uses = setterUses(setter, depth);
        out.problems.push(...uses.problems);
        for (const value of [init, ...uses.values]) {
          if (!value?.node) continue;
          if (!value.isFunction()) {
            follow(value);
            continue;
          }
          const [previous] = value.get('params');
          if (previous?.isIdentifier()) {
            previousStates.add(value.scope.getBinding(previous.node.name));
          } else if (previous) fail(`updater of ${expr.node.name} with a parameter pattern`);
          for (const returned of returnsOf(value)) follow(returned);
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
            isMember(member) &&
            propName(member) === 'append' &&
            member.parentPath.isCallExpression()
          ) {
            const [name] = member.parentPath.get('arguments');
            if (name?.isStringLiteral()) out.keys.push({ key: name.node.value, at: loc(name) });
            else out.problems.push(`${loc(member)}: FormData field name is not a string literal`);
          } else if (!(member.isObjectProperty() && keyName(member.node) === 'body')) {
            // set(), a helper that receives the form…: fields the guard would not see.
            out.problems.push(`${loc(r)}: FormData used other than by append() or as a body`);
          }
        }
      }
    } else if (expr.isTemplateLiteral()) {
      // A JSON body written by hand: its keys are text, not code.
      if (expr.node.expressions.length > 0)
        fail('template literal with expressions cannot be followed');
    } else if (!(expr.isNullLiteral() || expr.isStringLiteral() || expr.isNumericLiteral())) {
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
      if (binding?.path.isVariableDeclarator() && binding.constantViolations.length === 0) {
        return objectOf(binding.path.get('init'));
      }
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
  // Headers built by one of `names` (a conditional needs it on both sides).
  const builtBy = (p, names) => {
    if (!p || !p.node) return false;
    if (p.isIdentifier()) {
      const binding = p.scope.getBinding(p.node.name);
      return (
        !!binding?.path.isVariableDeclarator() &&
        binding.constantViolations.length === 0 &&
        builtBy(binding.path.get('init'), names)
      );
    }
    if (p.isConditionalExpression()) {
      return builtBy(p.get('consequent'), names) && builtBy(p.get('alternate'), names);
    }
    return p.isCallExpression() && names.includes(calleeName(p));
  };

  const fetches = Object.values(files).flatMap((entry) =>
    entry.fetches.map((call) => {
      const [url, opts] = call.get('arguments');
      const options = objectOf(opts);
      const problems = [];
      if (opts && !options) problems.push(`${loc(opts)}: fetch options cannot be followed`);
      for (const p of options?.get('properties') ?? []) {
        if (!p.isObjectProperty()) problems.push(`${loc(p)}: ${p.node.type} in fetch options`);
      }
      const headers = valueOf(options, 'headers');
      const body = keysOf(valueOf(options, 'body'));
      const target = urlText(url);
      return {
        at: loc(call),
        target,
        auth: AUTH_ROUTES.some((r) => r.test(target)),
        public: PUBLIC_ROUTES.some((r) => r.test(target)),
        usesHelper: builtBy(headers, HELPERS),
        multipartHeaders: builtBy(headers, ['authHeaders']),
        keys: body.keys,
        problems: [...problems, ...body.problems],
      };
    }),
  );
  const stringified = Object.values(files).flatMap((entry) =>
    entry.stringifies.flatMap((call) => keysOf(call.get('arguments')[0]).keys),
  );
  const fetchAliases = Object.values(files).flatMap((entry) =>
    entry.fetchAliases.map((p) => `${loc(p)}: fetch used as a value`),
  );
  return { fetches, stringified, sources: files, unresolvedImports, fetchAliases };
}

const label = ({ at, target }) => `${at}: ${target.split('\n')[0]}`;
const keyLabels = (keys, test) => [
  ...new Set(keys.filter(({ key }) => test(key)).map(({ key, at }) => `${at}: ${key}`)),
];
const fetchKeys = (fetches) => fetches.flatMap((f) => f.keys);

module.exports = {
  HELPER_FILE,
  analyze,
  appSources,
  fetchKeys,
  isTokenKey,
  isUsernameKey,
  keyLabels,
  label,
};
