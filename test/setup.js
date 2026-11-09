// Global Jest setup — runs once per test file via `setupFilesAfterEnv`.
//
// This is the REUSABLE native-mock layer. Every native module that the app
// imports on boot (or that a screen pulls in) is stubbed here so that:
//   1. tests run in plain Node — no device, no emulator, no Metro;
//   2. no test ever hits the real network (the `fetch` mock below);
//   3. animation / GPU / storage side-effects are inert and deterministic.
//
// Add a new mock here (not in individual suites) whenever a shared native
// dependency starts breaking renders — that keeps the per-test files clean.

/* eslint-disable global-require */

// @testing-library/react-native v13 auto-registers its jest matchers on import
// of the main entry — the legacy `/extend-expect` subpath was removed, so no
// explicit matcher import is needed here.

// ---------------------------------------------------------------------------
// react-native-gesture-handler — official jest setup. Must run before any
// component that imports gesture-handler (App.js wraps everything in
// GestureHandlerRootView).
// ---------------------------------------------------------------------------
import 'react-native-gesture-handler/jestSetup';

// ---------------------------------------------------------------------------
// react-native-reanimated v4 — the package ships its own Jest mock. In v4
// the worklet runtime lives in `react-native-worklets`; requiring the bundled
// mock installs no-op animation drivers.
//
// NOTE (reanimated 3 → 4): the bundled mock path moved around between minor
// versions of the v4 line. We try the canonical `react-native-reanimated/mock`
// first and fall back to a hand-rolled inert mock if that entry isn't present,
// so the suite never hard-fails on a path change. If you upgrade reanimated
// and animations misbehave under test, re-check this block against the docs:
// https://docs.swmansion.com/react-native-reanimated/docs/guides/testing
// ---------------------------------------------------------------------------
jest.mock('react-native-reanimated', () => {
  try {
    // Preferred: the library's own jest mock (no-op animation drivers).
    // eslint-disable-next-line global-require
    const Reanimated = require('react-native-reanimated/mock');
    if (Reanimated.default) Reanimated.default.call = () => {};
    // The bundled mock lacks the scroll handler RecipeScreen uses.
    if (!Reanimated.useAnimatedScrollHandler) {
      Reanimated.useAnimatedScrollHandler = () => () => {};
    }
    return Reanimated;
  } catch (e) {
    // Fallback: minimal inert mock covering the APIs the app uses.
    const React = require('react');
    const View = require('react-native').View;
    const passthrough = (Component) => Component;
    return {
      __esModule: true,
      default: {
        View,
        Text: require('react-native').Text,
        Image: require('react-native').Image,
        ScrollView: require('react-native').ScrollView,
        createAnimatedComponent: passthrough,
        call: () => {},
      },
      useSharedValue: (v) => ({ value: v }),
      useAnimatedStyle: (fn) => (typeof fn === 'function' ? fn() : {}),
      useDerivedValue: (fn) => ({ value: typeof fn === 'function' ? fn() : undefined }),
      useAnimatedRef: () => ({ current: null }),
      useAnimatedScrollHandler: () => () => {},
      withTiming: (v) => v,
      withSpring: (v) => v,
      withDelay: (_, v) => v,
      withRepeat: (v) => v,
      withSequence: (...vals) => vals[vals.length - 1],
      cancelAnimation: () => {},
      runOnJS: (fn) => fn,
      runOnUI: (fn) => fn,
      interpolate: () => 0,
      Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
      Easing: new Proxy({}, { get: () => () => 0 }),
      FadeIn: {},
      FadeOut: {},
      SlideInDown: {},
      Layout: {},
      createAnimatedComponent: passthrough,
      View,
    };
  }
});
// Silence the worklets init that reanimated 4 expects on the global.
global.__reanimatedWorkletInit = () => {};

// ---------------------------------------------------------------------------
// react-native-worklets — reanimated 4 split the worklet runtime out into
// this package. Stub the runOnUI / runOnJS bridge so worklet code is just
// called synchronously on the JS thread under test.
// ---------------------------------------------------------------------------
jest.mock('react-native-worklets', () => ({
  runOnUI: (fn) => fn,
  runOnJS: (fn) => fn,
  createWorkletRuntime: () => ({}),
  useRunOnJS: (fn) => fn,
  scheduleOnUI: (fn) => (typeof fn === 'function' ? fn() : undefined),
  scheduleOnRN: (fn, ...args) => (typeof fn === 'function' ? fn(...args) : undefined),
}));

// ---------------------------------------------------------------------------
// @shopify/react-native-skia — Skia touches the GPU and a native canvas;
// it cannot run in Node. Stub every export as an inert component / no-op so
// any screen that imports Skia still renders a tree.
// ---------------------------------------------------------------------------
jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  const Noop = (props) => React.createElement('skia-noop', props, props && props.children);
  return new Proxy(
    {
      Canvas: Noop,
      Group: Noop,
      Path: Noop,
      Rect: Noop,
      Circle: Noop,
      Skia: { Path: { Make: () => ({}) } },
      // Value constructors, called at module scope (NutritionPill): plain objects, not components.
      rect: (x, y, width, height) => ({ x, y, width, height }),
      rrect: (r, rx, ry) => ({ rect: r, rx, ry }),
      vec: (x = 0, y = x) => ({ x, y }),
      useFont: () => null,
      useImage: () => null,
      Shader: Noop,
      Fill: Noop,
      Blur: Noop,
    },
    {
      // Any export we forgot resolves to an inert component.
      get: (target, prop) => (prop in target ? target[prop] : Noop),
    },
  );
});

// ---------------------------------------------------------------------------
// @gorhom/bottom-sheet — official mock: its real module calls Reanimated APIs
// the Reanimated mock does not provide. Sheets render their children inline.
// The mock is CommonJS without __esModule: flag it so `import BottomSheet` gets
// its `default` export instead of the whole module object.
// ---------------------------------------------------------------------------
jest.mock('@gorhom/bottom-sheet', () => ({
  __esModule: true,
  ...require('@gorhom/bottom-sheet/mock'),
}));

// ---------------------------------------------------------------------------
// react-native-safe-area-context — official mock: zero insets on a 320×640
// frame, so useSafeAreaInsets works without a SafeAreaProvider (App.js has one).
// ---------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// ---------------------------------------------------------------------------
// AsyncStorage — official in-memory mock. ThemeProvider + i18n read/write it
// on boot, so without this every render logs an unmocked-module warning.
// ---------------------------------------------------------------------------
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// ---------------------------------------------------------------------------
// expo-localization — `getLocales()` drives the i18n 'system' mode. Pin it
// to English so 'system' resolves deterministically in tests.
// ---------------------------------------------------------------------------
jest.mock('expo-localization', () => ({
  getLocales: () => [
    { languageCode: 'en', languageTag: 'en-US', regionCode: 'US', textDirection: 'ltr' },
  ],
  getCalendars: () => [{ calendar: 'gregory', timeZone: 'UTC' }],
  locale: 'en-US',
}));

// ---------------------------------------------------------------------------
// @react-native-community/netinfo — boot-time connectivity probe. Default to
// "connected" so any NetInfo.fetch()/addEventListener call is inert.
// ---------------------------------------------------------------------------
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() =>
      Promise.resolve({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
    ),
    addEventListener: jest.fn(() => jest.fn()), // returns an unsubscribe fn
    useNetInfo: () => ({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
  },
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: () => ({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
}));

// ---------------------------------------------------------------------------
// Lottie animations — both the legacy native player and the dotlottie web
// player are rendered as inert views.
// ---------------------------------------------------------------------------
jest.mock('lottie-react-native', () => {
  const React = require('react');
  return (props) => React.createElement('lottie-noop', props, props && props.children);
});
jest.mock('@lottiefiles/dotlottie-react', () => {
  const React = require('react');
  return {
    DotLottieReact: (props) =>
      React.createElement('dotlottie-noop', props, props && props.children),
  };
});

// ---------------------------------------------------------------------------
// FontAwesome — the SVG core occasionally trips Jest's ESM handling; render
// the icon component as an inert view.
// ---------------------------------------------------------------------------
jest.mock('@fortawesome/react-native-fontawesome', () => {
  const React = require('react');
  return {
    FontAwesomeIcon: (props) => React.createElement('fa-icon-noop', props),
  };
});

// ---------------------------------------------------------------------------
// react-native-popover-view — portal-based popover that needs measurement;
// render children inline.
// ---------------------------------------------------------------------------
jest.mock('react-native-popover-view', () => {
  const React = require('react');
  const Popover = (props) => React.createElement('popover-noop', props, props && props.children);
  Popover.Mode = { TOOLTIP: 'tooltip', RN_MODAL: 'rn-modal', JS_MODAL: 'js-modal' };
  return { __esModule: true, default: Popover, Popover };
});

// ---------------------------------------------------------------------------
// GLOBAL fetch mock — the single most important guard. App.js calls
// `fetch(addressIp + '/recipes/all')` and `/users/me` on boot.
// We replace global.fetch with a jest.fn that resolves an empty-but-valid
// JSON envelope by default. Individual tests override it via the
// `mockFetchResponse` helper (see test/mocks/api.js). A test that needs to
// assert a network call can read `global.fetch.mock.calls`.
// ---------------------------------------------------------------------------
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ result: true }),
    text: () => Promise.resolve(''),
  }),
);

// Reset the fetch mock implementation before every test so each suite starts
// from the same neutral baseline (clearMocks in jest.config clears calls).
beforeEach(() => {
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result: true }),
        text: () => Promise.resolve(''),
      }),
    );
  }
});

// Silence the noisy boot-time console.* the app emits (addressIp banner,
// auto-login logs) so the test output stays readable. Comment this block out
// when debugging a suite.
const origWarn = console.warn;
console.warn = (...args) => {
  const msg = String(args[0] ?? '');
  if (msg.includes('[ThemeProvider]') || msg.includes('[i18n]')) return;
  origWarn(...args);
};
