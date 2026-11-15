import { renderRouter, screen } from 'expo-router/testing-library';

// An update has downloaded, but the app has no username yet.
jest.mock('expo-updates', () => ({
  isEnabled: true,
  channel: 'preview',
  useUpdates: () => ({
    currentlyRunning: { isEmbeddedLaunch: true },
    isUpdatePending: true,
    isRestarting: false,
    downloadedUpdate: { updateId: 'u1' },
  }),
  reloadAsync: jest.fn(() => Promise.resolve()),
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(() => Promise.resolve({ isNew: false })),
}));

it('keeps the banner off onboarding, where it would cover the buttons', async () => {
  await renderRouter('./app', { initialUrl: '/' });

  expect(await screen.findByText('Get Started')).toBeOnTheScreen();
  expect(screen.queryByTestId('update-banner')).not.toBeOnTheScreen();
});
