// https://docs.expo.dev/guides/using-eslint/
//
// Cookez rules start as warnings (phase 3 of the workflow plan) and move to errors once the
// phase 6 codemods have cleaned the existing code. The react-native and i18next plugins are
// optional: their rules switch on as soon as the packages are installed
// (yarn add -D eslint-plugin-react-native eslint-plugin-i18next).
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

function optional(name) {
  try {
    return require(name);
  } catch {
    return null;
  }
}

const reactNative = optional('eslint-plugin-react-native');
const i18next = optional('eslint-plugin-i18next');

const cookezRules = {
  files: ['**/*.{js,jsx}'],
  ignores: ['test/**', '**/*.test.js', 'scripts/**', 'styles/**'],
  plugins: {
    ...(reactNative ? { 'react-native': reactNative } : {}),
    ...(i18next ? { i18next } : {}),
  },
  rules: {
    'no-restricted-imports': [
      'warn',
      {
        paths: [
          {
            name: 'lucide-react-native',
            message: "Importe chaque icône à part : import Check from 'lucide-react-native/icons/check' (D17).",
          },
          {
            name: 'lucide-react-native/icons',
            message: "Importe chaque icône à part : import Check from 'lucide-react-native/icons/check' (D17).",
          },
          { name: '@expo/vector-icons', message: 'Icônes : Lucide seul (D17).' },
          { name: 'react-native-animatable', message: 'Animations : Reanimated 4.' },
        ],
        patterns: [
          {
            group: ['**/styles/Global', '**/styles/Global.js'],
            message: 'Tokens via useTheme() de contexts/ThemeProvider, jamais Global.js en direct.',
          },
          { group: ['@fortawesome/*'], message: 'Icônes : Lucide seul (D17).' },
        ],
      },
    ],
    'no-restricted-syntax': [
      'warn',
      {
        selector: "Property[key.name='fontSize'][value.type='Literal']",
        message: 'fontSize en dur : utilise css.typography.*Size.',
      },
    ],
    ...(reactNative ? { 'react-native/no-color-literals': 'warn' } : {}),
    ...(i18next ? { 'i18next/no-literal-string': ['warn', { mode: 'jsx-text-only' }] } : {}),
  },
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  cookezRules,
]);
