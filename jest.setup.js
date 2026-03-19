// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      setlistfmApiKey: 'test-api-key',
    },
  },
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));
