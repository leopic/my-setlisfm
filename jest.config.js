module.exports = {
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-constants)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
