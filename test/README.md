# Frontend test architecture

Reusable test harness for the Cookez Expo / React Native app. Mirrors the
backend's `cookez-backend/test` architecture: one reusable harness + a set of
reference suites you copy from.

**Stack:** `jest-expo` (SDK 54 preset) + `@testing-library/react-native`.

## Running tests

```bash
npm test            # one-shot run
npm run test:watch  # watch mode
npm run test:coverage  # HTML report in coverage/index.html, all app code (untested files at 0 %)
```

(Use `yarn test` if the repo standardises on Yarn — there is currently only an
npm lockfile, so `npm` is the default. Do not introduce a second lockfile.)

Tests run in plain Node — **no device, no emulator, no Metro**, and **no
network** (the global `fetch` is mocked, see below).

## Directory layout

```
test/
  setup.js                       # global native mocks + fetch mock (jest setupFilesAfterEnv)
  helpers/renderWithProviders.js # makeStore + renderWithProviders (THE harness)
  factories/
    user.js                      # makeUserState / makeLoggedOutUserState
    recipe.js                    # makeRecipe / makeRecipes
  mocks/
    api.js                       # mockFetchJson / mockFetchError / ...
  reducers/pantry.test.js        # reference: pure reducer unit test
  components/renderWithProviders.test.js  # reference: component render via harness
  hooks/useT.test.js             # reference: hook test with preloaded locale
```

## Writing a reducer test (cheapest, most stable)

No renderer, no providers. Import the default reducer + named actions and
assert state transitions directly.

```js
import reducer, { setPantry } from '../../reducers/pantry';

const initial = reducer(undefined, { type: '@@INIT' });
const next = reducer(initial, setPantry([{ _id: 'a' }]));
expect(next.value.items).toHaveLength(1);
```

See `test/reducers/pantry.test.js`.

## Writing a component test

Always render through the harness so the provider chain matches `App.js`
(`Provider → ThemeProvider → [NavigationContainer]`). Seed slices via
`preloadedState` — each slice value is shaped `{ value: ... }`.

```js
import { renderWithProviders } from '../helpers/renderWithProviders';
import { makeUserState } from '../factories/user';
import { screen } from '@testing-library/react-native';

renderWithProviders(<Profile />, {
  preloadedState: { user: makeUserState({ username: 'alex' }) },
});
expect(screen.getByText('alex')).toBeTruthy();
```

`renderWithProviders(ui, options)` options:

| option           | default                     | meaning                                                                       |
| ---------------- | --------------------------- | ----------------------------------------------------------------------------- |
| `preloadedState` | `undefined`                 | partial state keyed by slice name (`{ value: ... }`)                          |
| `store`          | built from `preloadedState` | pass an existing store to dispatch + assert re-renders                        |
| `withNavigation` | `true`                      | wrap in `NavigationContainer`; set `false` for pure presentational components |

It returns RTL's render result plus the `store`, so you can
`store.dispatch(...)` and `store.getState()` in assertions.

If a real component pulls in an **un-mocked native module** (Skia, Lottie,
a new native dep), add the mock to `test/setup.js` — never inline in a suite.
That keeps the mock reusable for every future test.

## Writing a hook test

Render the hook through a tiny probe component (so `useSelector` has a real
Provider), seed `locale` via `preloadedState`, and read the output from the
tree.

```js
function Probe({ k }) {
  const t = useT();
  return <Text testID="out">{t(k)}</Text>;
}

renderWithProviders(<Probe k="common.save" />, {
  withNavigation: false,
  preloadedState: { locale: { value: { lang: 'fr' } } },
});
expect(screen.getByTestId('out')).toHaveTextContent('Enregistrer');
```

See `test/hooks/useT.test.js`.

## The fetch mock (network safety)

`test/setup.js` replaces `global.fetch` with a `jest.fn()` that resolves
`{ result: true }` by default, and re-installs that baseline before every test.
Tests that need a specific payload use `test/mocks/api.js`:

```js
import { mockFetchJson, mockFetchError } from '../mocks/api';

mockFetchJson({ result: true, recipes: makeRecipes(2) }); // next fetch
// ...trigger code that calls fetch...
expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/recipes/all'));

mockFetchError(); // next fetch rejects → exercise the error path
```

Helpers: `mockFetchJson`, `mockFetchJsonAlways`, `mockFetchSequence`,
`mockFetchError`, `makeResponse`.

## Animations (Reanimated mock)

The Reanimated mock in `test/setup.js` ends every `withTiming` / `withSpring`
at once and runs its end callback right away. To test a race with a running
animation (a tap during a fade-out), hold the end callbacks with
`test/helpers/animations.js`:

```js
import { finishAnimations, holdAnimations } from '../helpers/animations';

holdAnimations(); // end callbacks wait
fireEvent.press(closeButton); // the fade-out stays running
// ...act and assert while it runs...
act(() => finishAnimations()); // the end callbacks run now
```

The hold is cleared after each test. Example: `test/contexts/ToastProvider.test.js`.

`addressIp` reads `process.env.EXPO_PUBLIC_API_URL` and throws without it:
there is no fallback to the Vercel URL. `test/setupEnv.js` (Jest
`setupFiles`, run before any module loads) sets it to `https://api.invalid`,
a non-routable URL. **No test should ever construct a real request** — the
fetch mock intercepts every call regardless of the base URL.

## The AsyncStorage mock

`@react-native-async-storage/async-storage` is mocked with the package's
official in-memory jest mock. `ThemeProvider` and the i18n bootstrap both read
it on mount; the mock makes those reads resolve instantly and deterministically.

## Native mocks installed in `test/setup.js`

`react-native-gesture-handler/jestSetup`, `react-native-reanimated` (v4 mock) +
`react-native-worklets`, `@shopify/react-native-skia`, AsyncStorage, expo-
localization (pinned to `en`), `@react-native-community/netinfo`,
`lottie-react-native` + `@lottiefiles/dotlottie-react`,
`@fortawesome/react-native-fontawesome`, `react-native-popover-view`, and the
global `fetch`.
