// The root layout initialises i18n; tests that render mock routes don't load it.
import '@/i18n';

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { setlistfmApiKey: 'test-api-key' } },
}));

// expo-asset 58.0.16 reads `AssetRegistry` from `react-native`, but jest-expo 58.0.11
// only mocks `react-native/asset-registry`, so vector-icons' font load finds an empty
// registry. Point the root export at jest-expo's mock; drop this once jest-expo does.
jest.mock('react-native/src/private/assets/AssetRegistry', () => ({
  AssetRegistry: jest.requireMock('react-native/asset-registry'),
}));

// The dev menu is a native module with no JS fallback.
jest.mock('expo-dev-client', () => ({ registerDevMenuItems: jest.fn() }));

// DatabaseManager logs its init steps through console.warn; they're noise here.
const warn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((message, ...rest) => {
  if (typeof message === 'string' && message.startsWith('Database ')) return;
  warn(message, ...rest);
});
