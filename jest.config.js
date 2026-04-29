module.exports = {
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      { presets: ['babel-preset-expo'] },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(expo-constants)/)'],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
