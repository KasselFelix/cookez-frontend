// Plan 016, PR 3: the session token travels in the Authorization header only.
// Every call to an authenticated route builds its headers with
// modules/authHeaders.js, and no body carries a token. Plan 019, step 3.1: no
// authenticated body carries a `username` either (the backend reads the author
// from the token).
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

const ROOT = path.join(__dirname, '..', '..');
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
    const followLiteral = (p) => {
      if (p.isObjectExpression() || p.isArrayExpression()) follow(p);
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
        followLiteral(value);
        // A token under another name: `{ auth: user.token }`, `{ auth: token }`.
        const valueName = value.isIdentifier()
          ? value.node.name
          : isMember(value)
            ? propName(value)
            : null;
        if (valueName && /token/i.test(valueName) && !isTokenKey(key))
          out.keys.push({ key: `${key}: ${textOf(value)}`, at: loc(prop) });
      }
    } else if (expr.isArrayExpression()) {
      for (const element of expr.get('elements')) {
        if (element.node) follow(element.isSpreadElement() ? element.get('argument') : element);
      }
    } else if (expr.isIdentifier()) {
      if (expr.node.name === 'undefined') return out;
      const binding = expr.scope.getBinding(expr.node.name);
      if (!binding) fail(`${expr.node.name} is not declared in the file`);
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
            followLiteral(parent.parentPath.get('right'));
          } else if (
            isCallOf(parent, 'Object', 'assign') &&
            r.listKey === 'arguments' &&
            r.key === 0
          ) {
            for (const arg of parent.get('arguments').slice(1)) follow(arg);
          }
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
    expect(keyLabels(fetchKeys(authCalls), (key) => key === 'username')).toEqual([]);
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
  const usernamesIn = (sources) =>
    keyLabels(fetchKeys(authOf(sources)), (key) => key === 'username');
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
