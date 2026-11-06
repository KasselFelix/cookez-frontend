/* global describe, it, expect, __dirname */
// Plan 015 (S5): every third-party call goes through the backend, which keeps the
// keys. No EXPO_PUBLIC_*_KEY and no third-party API host in the app sources: a
// value read by the bundle is readable by anyone who has the app.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SOURCE_DIRS = ['screens', 'components', 'modules', 'hooks', 'reducers', 'contexts', 'i18n', 'styles'];
const ROOT_FILES = ['App.js', 'app.config.js', 'app.json', 'eas.json'];

const sourceFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(js|json)$/.test(entry.name) ? [file] : [];
  });
};

const FORBIDDEN = [
  /EXPO_PUBLIC_\w*KEY/,
  /foodvisor\.io/i,
  /pexels\.com/i,
  /unsplash\.com/i,
  /mistral\.ai/i,
];

const offences = (source) => FORBIDDEN.filter((pattern) => pattern.test(source)).map(String);

describe('no third-party key or API host in the app', () => {
  const files = [
    ...ROOT_FILES.map((file) => path.join(ROOT, file)).filter((file) => fs.existsSync(file)),
    ...SOURCE_DIRS.flatMap((dir) => sourceFiles(path.join(ROOT, dir))),
  ];

  it('scans the app sources', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('finds none', () => {
    const found = files
      .map((file) => ({ file: path.relative(ROOT, file), offences: offences(fs.readFileSync(file, 'utf8')) }))
      .filter((entry) => entry.offences.length > 0);
    expect(found).toEqual([]);
  });

  it('would catch the old Foodvisor call and key', () => {
    expect(offences("process.env.EXPO_PUBLIC_FOODVISOR_KEY")).not.toEqual([]);
    expect(offences('fetch("https://vision.foodvisor.io/api/1.0/en/analysis")')).not.toEqual([]);
    expect(offences('`https://api.pexels.com/v1/search?query=${name}`')).not.toEqual([]);
    expect(offences('https://api.eu.mistral.ai/v1/chat/completions')).not.toEqual([]);
    expect(offences('process.env.EXPO_PUBLIC_API_URL')).toEqual([]);
  });
});
