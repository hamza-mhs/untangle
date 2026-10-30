// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const reactNative = require('eslint-plugin-react-native');

module.exports = defineConfig([
  globalIgnores([
    'dist/*',
    'android/*',
    '.expo/*',
    'coverage/*',
    'drizzle/*',
    'docs/**',
    'design/**',
    'src/features/onboarding/components/splash/sceneData.ts',
  ]),
  expoConfig,
  prettierRecommended,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-haptics',
              message: 'Use src/lib/haptics.ts so the user setting is respected.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/lib/haptics.ts', '**/__tests__/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  // CODE_STANDARDS › Styling: no raw colours and no inline style literals — tokens only.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/design/tokens/**', '**/__tests__/**', '**/*.test.{ts,tsx}'],
    plugins: { 'react-native': reactNative },
    rules: {
      'react-native/no-color-literals': 'error',
      'react-native/no-inline-styles': 'error',
    },
  },
  // Screens and features: design system only (00-foundations §9). Text through <Text>, haptics
  // through lib/haptics, other features only through their index.ts, no raw colours or sizes.
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'expo-haptics',
              message: 'Use src/lib/haptics.ts so the user setting is respected.',
            },
            {
              name: 'react-native',
              importNames: ['Text'],
              message: 'Use <Text variant tone> from @/design/components.',
            },
          ],
          patterns: [
            {
              group: ['@/features/*/**'],
              message: "Import another feature only through its index.ts ('@/features/<name>').",
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
          message: 'No hex colours in screens or features: use color tokens from @/design/tokens.',
        },
        {
          selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{6}/]',
          message: 'No hex colours in screens or features: use color tokens from @/design/tokens.',
        },
        {
          selector: "Property[key.name='fontSize'] > Literal",
          message: 'No raw font sizes: use a type role (<Text variant>).',
        },
      ],
    },
  },
  // Game engine and boards are imperative loops by design (a pause-aware clock, refs read while
  // a round runs, mutable per-round state), so the React Compiler purity rules don't apply.
  {
    files: ['src/features/games/engine/**/*.{ts,tsx}', 'src/features/games/list/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/globals': 'off',
    },
  },
]);
