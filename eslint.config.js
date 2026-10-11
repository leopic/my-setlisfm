const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const i18nextPlugin = require('eslint-plugin-i18next');

module.exports = tseslint.config(
  js.configs.recommended,
  tseslint.configs.strict,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Formatting is an error, not a warning: ESLint exits 0 on warnings, so
      // as a warning this rule let ~2500 violations accumulate unnoticed.
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Test doubles mock only the fields under test, so a partial object cast
    // is deliberate here — widening the fixtures to satisfy the type would
    // couple each test to fields it does not exercise.
    files: ['src/__tests__/**/*.ts', 'src/__tests__/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Every user-facing string goes through t() (see CLAUDE.md). This catches copy written
    // straight into JSX, as text or as a string prop; strings outside JSX (Alert.alert,
    // plain helpers) are left to review.
    files: ['app/**/*.tsx', 'src/**/*.tsx'],
    ignores: ['src/__tests__/**'],
    plugins: { i18next: i18nextPlugin },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-only',
          // Only the props that carry copy; testID, edges, icon names and the like don't.
          'jsx-attributes': {
            include: [
              'title',
              'body',
              'description',
              'label',
              'message',
              'placeholder',
              'accessibilityLabel',
              'accessibilityHint',
            ],
          },
          // Strings without a letter (›, —, " · ", counts) aren't copy. The default list also
          // skips ALL-CAPS words, which would let section labels like "CONCERTS" through.
          words: { exclude: [/^[^\p{L}]*$/u] },
          'should-validate-template': true,
        },
      ],
    },
  },
  {
    ignores: [
      'node_modules/',
      '.expo/',
      '.agents/',
      'ios/',
      'android/',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'jest.setup.js',
      'eslint.config.js',
      'app.config.js',
    ],
  },
);
