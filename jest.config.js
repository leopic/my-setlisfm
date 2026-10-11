const alias = { '^@/(.*)$': '<rootDir>/src/$1' };

// The repo has no babel config (Expo's default applies), so hand jest-expo's
// JS transform the Expo preset explicitly.
const expoPreset = require('jest-expo/ios/jest-preset');
const integrationTransform = Object.fromEntries(
  Object.entries(expoPreset.transform).map(([pattern, transformer]) =>
    Array.isArray(transformer) && transformer[0] === 'babel-jest'
      ? [pattern, ['babel-jest', { ...transformer[1], presets: ['babel-preset-expo'] }]]
      : [pattern, transformer],
  ),
);

module.exports = {
  projects: [
    // Pure logic: services, queries, data processing.
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/__tests__/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
      },
      transformIgnorePatterns: ['node_modules/(?!(expo-constants)/)'],
      setupFiles: ['./jest.setup.js'],
      moduleNameMapper: alias,
    },
    // Headless app: renders the real app/ routes with expo-router's testing
    // library, on an in-memory SQLite database.
    {
      displayName: 'integration',
      preset: 'jest-expo/ios',
      transform: integrationTransform,
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.tsx'],
      setupFiles: ['./test/integration.setup.ts'],
      setupFilesAfterEnv: ['./test/integration.timeout.ts'],
      moduleNameMapper: {
        ...alias,
        '^expo-sqlite$': '<rootDir>/test/expoSqliteNode.ts',
      },
    },
  ],
};
