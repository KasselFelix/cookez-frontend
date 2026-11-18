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

  it.each([[undefined], [''], ['   ']])(
    'throws an explicit error without the variable (%p)',
    (value) => {
      setApiUrl(value);
      expect(() => load('../../modules/addressIp')).toThrow(/EXPO_PUBLIC_API_URL/);
    },
  );

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
    jest.spyOn(console, 'log').mockImplementation(() => {});
    setApiUrl('https://api.invalid');
    expect(load('../../metro.config')).toEqual({ resolver: {} });
    jest.restoreAllMocks();
  });

  // Plan 019, "Ensuite": the guard checks only that the variable is there, and
  // the front's local env file targets production. Metro now prints the URL it
  // bundles, and warns when that URL is the production API.
  describe('prints the API URL it bundles', () => {
    afterEach(() => jest.restoreAllMocks());

    const run = (value) => {
      const logged = jest.spyOn(console, 'log').mockImplementation(() => {});
      const warned = jest.spyOn(console, 'warn').mockImplementation(() => {});
      setApiUrl(value);
      load('../../metro.config');
      return { logged, warned };
    };

    it('prints the trimmed URL, without a warning for a non-production API', () => {
      const { logged, warned } = run('  http://10.0.2.2:3000 ');
      expect(logged).toHaveBeenCalledWith('Metro: EXPO_PUBLIC_API_URL = http://10.0.2.2:3000');
      expect(warned).not.toHaveBeenCalled();
    });

    it.each([
      ['https://cookez-backend.vercel.app'],
      ['https://cookez-backend.vercel.app/'],
      ['HTTPS://Cookez-Backend.Vercel.App'],
    ])('warns when the URL is the production API (%p)', (value) => {
      const { logged, warned } = run(value);
      expect(logged).toHaveBeenCalledWith(`Metro: EXPO_PUBLIC_API_URL = ${value}`);
      expect(warned).toHaveBeenCalledWith(expect.stringMatching(/^!! PRODUCTION API/));
    });

    it.each([
      ['https://cookez-backend.vercel.app.evil.com'],
      ['https://my-cookez-backend.vercel.app'],
      ['not a url'],
    ])('does not warn for another host or an invalid URL (%p)', (value) => {
      const { warned } = run(value);
      expect(warned).not.toHaveBeenCalled();
    });
  });
});
