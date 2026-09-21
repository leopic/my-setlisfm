const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

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
