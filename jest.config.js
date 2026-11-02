// Jest configuration for the Cookez Expo / React Native app.
//
// Stack: jest-expo (SDK 54 preset) + @testing-library/react-native.
// This mirrors the backend test architecture (cookez-backend/test) so the
// two projects share the same "reusable harness + reference suites" shape.
//
// Why these knobs:
//  - preset 'jest-expo' wires the RN/Expo babel transform, the haste config,
//    the jsdom-free RN environment and the default moduleNameMapper for
//    Expo assets. Do NOT replace it with a bare 'react-native' preset — the
//    Expo modules (expo-localization, expo-image, …) need the Expo preset.
//  - setupFilesAfterEnv: a single reusable setup file (test/setup.js) that
//    installs every native mock once, so individual suites stay clean.
//  - transformIgnorePatterns: by default Jest does NOT transform node_modules.
//    Most RN/Expo native packages ship untranspiled ESM/Flow, so we must
//    WHITELIST them (the `(?!...)` negative lookahead) so Babel transforms
//    them instead of choking on `import`/`export`/JSX in node_modules.

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',

  // Runs after the test framework is installed in each test file. This is
  // where every reusable native mock is wired (see test/setup.js).
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Where to find tests. Co-located `__tests__` folders and `*.test.js`.
  testMatch: [
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/**/__tests__/**/*.test.js',
  ],

  // testEnvironment is intentionally NOT overridden — `jest-expo` provides the
  // correct RN environment. Network safety comes from the global `fetch` mock
  // in test/setup.js, not from the environment.

  // Speed: ignore the heavy dirs.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.expo/',
    '/android/',
    '/ios/',
  ],

  // Transform node_modules that ship untranspiled ESM / Flow / JSX.
  // The negative lookahead lists every package the suite imports (directly
  // or transitively) that is NOT pre-compiled. Add to this list whenever a
  // new native dep causes an "Unexpected token 'export'" / "import" error.
  transformIgnorePatterns: [
    'node_modules/(?!' +
      [
        'react-native',
        '@react-native',
        '@react-native-community',
        'react-native-.*', // reanimated, gesture-handler, screens, svg, safe-area, worklets, popover, picker-select, animatable, web
        'react-redux',
        '@reduxjs/toolkit',
        'immer', // RTK transitive dep, ships ESM (immer.legacy-esm.js)
        'redux',
        'redux-thunk',
        'reselect',
        'expo',
        'expo-.*',
        '@expo',
        '@expo/.*',
        '@expo-google-fonts/.*',
        '@react-navigation',
        '@react-navigation/.*',
        '@gorhom/bottom-sheet',
        '@shopify/react-native-skia',
        'lucide-react-native',
        'lottie-react-native',
        '@lottiefiles/dotlottie-react',
        '@fortawesome/.*',
        'i18n-js',
      ].join('|') +
      ')',
  ],

  // Quieter, deterministic output. Clear mock state between tests so the
  // global `fetch` mock from one test never bleeds into the next.
  clearMocks: true,
  resetMocks: false, // keep our setup.js mock implementations installed

  collectCoverageFrom: [
    'reducers/**/*.js',
    'i18n/**/*.js',
    'contexts/**/*.js',
    '!**/node_modules/**',
  ],
};
