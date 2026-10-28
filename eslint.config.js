// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const reactNative = require('eslint-plugin-react-native');

module.exports = defineConfig([
  globalIgnores([
    'dist/*',
    'ios/*',
    'android/*',
    'targets/**/*.swift',
    '.expo/*',
    'coverage/*',
    'drizzle/*',
    'design/**',
    'src/features/onboarding/components/splash/sceneData.ts',
    'src/design/components/Ghost/ghostData.ts',
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
  // Text goes through <Text> from src/design (it applies tokens + Dynamic Type caps).
  {
    files: ['src/app/**/*.tsx', 'src/features/**/*.tsx'],
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
        },
      ],
    },
  },
]);
