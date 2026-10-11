// The root layout initialises i18n; tests that render mock routes don't load it.
import '@/i18n';

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { setlistfmApiKey: 'test-api-key' } },
}));

// The dev menu is a native module with no JS fallback.
jest.mock('expo-dev-client', () => ({ registerDevMenuItems: jest.fn() }));

// DatabaseManager logs its init steps through console.warn; they're noise here.
const warn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((message, ...rest) => {
  if (typeof message === 'string' && message.startsWith('Database ')) return;
  warn(message, ...rest);
});
