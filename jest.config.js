const alias = { '^@/(.*)$': '<rootDir>/src/$1' };

// The app runs through React Compiler (app.config.js), which Metro turns on per bundle
// through Babel's caller. Jest has no such caller, so add it to jest-expo's JS transform:
// the integration tests then render the code the app runs.
const expoPreset = require('jest-expo/ios/jest-preset');
const integrationTransform = Object.fromEntries(
  Object.entries(expoPreset.transform).map(([pattern, transformer]) =>
    Array.isArray(transformer) && transformer[0].includes('babel-jest')
      ? [
          pattern,
          [
            transformer[0],
            {
              ...transformer[1],
              caller: { ...transformer[1].caller, supportsReactCompiler: true },
            },
          ],
        ]
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
      // Reanimated and Worklets run their web implementation under Jest; their
      // resolver picks it over the native one.
      resolver: 'react-native-reanimated/jest/resolver',
      moduleNameMapper: {
        ...alias,
        '^expo-sqlite$': '<rootDir>/test/expoSqliteNode.ts',
      },
    },
  ],
};
