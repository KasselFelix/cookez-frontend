/* global describe, it, expect, jest, afterEach, require */
// Plan 019, step 3.5 (audit 2.9): no silent fallback to the production API.
// Without EXPO_PUBLIC_API_URL, modules/addressIp.js throws, and metro.config.js
// refuses to start, so `expo start`, `expo export`, `eas update` and release
// builds stop before any bundle. Under Jest, babel-preset-expo does not inline
// the variable: it is read when the module loads (test/setupEnv.js sets it).

const saved = process.env.EXPO_PUBLIC_API_URL;

/** @param {string | undefined} value */
const setApiUrl = (value) => {
  if (value === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = value;
};

afterEach(() => setApiUrl(saved));

const load = (path) => {
  let mod;
  jest.isolateModules(() => {
    mod = require(path);
  });
  return mod;
};

describe('modules/addressIp', () => {
  it('is the API URL the environment gives', () => {
    setApiUrl('http://10.0.2.2:3000');
    expect(load('../../modules/addressIp').default).toBe('http://10.0.2.2:3000');
  });

  it.each([[undefined], [''], ['   ']])('throws an explicit error without the variable (%p)', (value) => {
    setApiUrl(value);
    expect(() => load('../../modules/addressIp')).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it('is set for the whole suite by test/setupEnv.js', () => {
    expect(saved).toBe('https://api.invalid');
  });
});

describe('metro.config.js', () => {
  jest.mock('expo/metro-config', () => ({ getDefaultConfig: () => ({ resolver: {} }) }));

  it.each([[undefined], [''], ['   ']])('refuses to start without the variable (%p)', (value) => {
    const printed = jest.spyOn(console, 'error').mockImplementation(() => {});
    setApiUrl(value);
    expect(() => load('../../metro.config')).toThrow(/EXPO_PUBLIC_API_URL/);
    // Printed too, since Metro's import() retry hides the error on Windows.
    expect(printed).toHaveBeenCalledWith(expect.stringMatching(/^EXPO_PUBLIC_API_URL is not set/));
    printed.mockRestore();
  });

  it('returns the Expo default config when the variable is set', () => {
    setApiUrl('https://api.invalid');
    expect(load('../../metro.config')).toEqual({ resolver: {} });
  });
});
