// Plan 020: a simple message never opens a system dialog. `alert(text)` shows
// a dialog titled "Alert" (react-native/Libraries/Core/setUpAlert.js), which
// worries users. Messages go through useToast() or InlineMessage; Alert.alert
// is kept for real choices only, listed below by name.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
// Every top-level folder of the app, so a new one (navigation/, utils/...) is
// scanned too; only tooling, tests and generated code are left out.
const NOT_APP = new Set([
  'node_modules',
  'test',
  'android',
  'ios',
  'scripts',
  'assets',
  'coverage',
  'dist',
]);
const SOURCE_DIRS = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !NOT_APP.has(entry.name))
  .map((entry) => entry.name);
const ROOT_FILES = ['App.js'];

// The only dialogs left: each one asks the user to choose.
const ALLOWED_DIALOGS = {
  'screens/SettingsScreen.js': 1, // log out? Cancel / Log out
  'screens/CommentScreen.js': 1, // delete review? Cancel / Delete
};

const sourceFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.js$/.test(entry.name) ? [file] : [];
  });
};

// `alert(` not preceded by a dot or a word character (excludes Alert.alert()),
// or called on the global object.
const BARE_ALERT = /(^|[^.\w])alert\(|\b(window|globalThis|global)\.alert\(/gm;
const DIALOG = /\bAlert\.alert\(/g;

const count = (source, pattern) => (source.match(pattern) || []).length;

describe('no bare alert, and dialogs only for choices', () => {
  const files = [
    ...ROOT_FILES.map((file) => path.join(ROOT, file)).filter((file) => fs.existsSync(file)),
    ...SOURCE_DIRS.flatMap((dir) => sourceFiles(path.join(ROOT, dir))),
  ].map((file) => ({
    file: path.relative(ROOT, file).split(path.sep).join('/'),
    source: fs.readFileSync(file, 'utf8'),
  }));

  it('scans the app sources', () => {
    expect(files.length).toBeGreaterThan(20);
    expect(SOURCE_DIRS).toEqual(expect.arrayContaining(['screens', 'components', 'contexts']));
  });

  it('finds no bare alert()', () => {
    const found = files
      .filter(({ source }) => count(source, BARE_ALERT) > 0)
      .map(({ file }) => file);
    expect(found).toEqual([]);
  });

  it('keeps Alert.alert to the listed choices', () => {
    const dialogs = Object.fromEntries(
      files.map(({ file, source }) => [file, count(source, DIALOG)]).filter(([, n]) => n > 0),
    );
    expect(dialogs).toEqual(ALLOWED_DIALOGS);
  });

  it('would catch an alert and spare Alert.alert', () => {
    expect(count("alert('Recipe successfully added!')", BARE_ALERT)).toBe(1);
    expect(count('  } else { alert(data.error) }', BARE_ALERT)).toBe(1);
    expect(count("Alert.alert('Delete review?', msg, buttons)", BARE_ALERT)).toBe(0);
    expect(count('showAlert(x)', BARE_ALERT)).toBe(0);
    expect(count("window.alert('Saved')", BARE_ALERT)).toBe(1);
    expect(count("globalThis.alert('Saved')", BARE_ALERT)).toBe(1);
  });
});
