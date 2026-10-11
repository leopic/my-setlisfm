jest.mock('expo-constants', () => ({
  expoConfig: { extra: { setlistfmApiKey: 'test-api-key' } },
}));

// The dev menu is a native module with no JS fallback.
jest.mock('expo-dev-client', () => ({ registerDevMenuItems: jest.fn() }));

// Reanimated and its worklet runtime are native; both ship JS mocks.
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

// DatabaseManager logs its init steps through console.warn; they're noise here.
const warn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((message, ...rest) => {
  if (typeof message === 'string' && message.startsWith('Database ')) return;
  warn(message, ...rest);
});
