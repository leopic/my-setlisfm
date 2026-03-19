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
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: [
      'node_modules/',
      '.expo/',
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
