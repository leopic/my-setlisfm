import type * as ExpoUpdates from 'expo-updates';
import { screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { launchApp, pressHeaderButton } from '../../../test/screen';

// What expo-updates reports about the JS the app runs; each test sets its own.
let mockUpdates: {
  isEnabled: boolean;
  currentlyRunning: Partial<ExpoUpdates.CurrentlyRunningInfo>;
};

jest.mock('expo-updates', () => ({
  get isEnabled() {
    return mockUpdates.isEnabled;
  },
  useUpdates: () => ({ currentlyRunning: mockUpdates.currentlyRunning }),
}));

async function findUpdateRow() {
  await launchApp();
  await pressHeaderButton('Open settings');
  return screen.findByTestId('settings-update');
}

beforeAll(seedDatabase);

const downloadedUpdate = {
  isEnabled: true,
  currentlyRunning: {
    isEmbeddedLaunch: false,
    // EAS update ids start with a timestamp, so only the end tells updates apart.
    updateId: '01a1dfbd-37c4-7c56-9e46-d098b3a487ad',
    channel: 'preview',
    // Ten minutes ago, so the row reads the same whenever the test runs.
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
  },
};

afterEach(() => {
  delete process.env.EXPO_PUBLIC_COMMIT;
});

it('shows the date, commit and channel of a downloaded update', async () => {
  // The ship workflow bundles the commit into the update.
  process.env.EXPO_PUBLIC_COMMIT = 'fefd511';
  mockUpdates = downloadedUpdate;

  const row = await findUpdateRow();
  expect(row).toHaveTextContent(/10 minutes ago/);
  expect(row).toHaveTextContent(/fefd511 · preview/);
});

it('falls back to the end of the update id when the update has no commit', async () => {
  mockUpdates = downloadedUpdate;

  expect(await findUpdateRow()).toHaveTextContent(/3a487ad · preview/);
});

it('says the JS is built in when no update has been downloaded', async () => {
  mockUpdates = {
    isEnabled: true,
    currentlyRunning: { isEmbeddedLaunch: true, channel: 'preview' },
  };

  expect(await findUpdateRow()).toHaveTextContent(/Built in/);
});

it('says the JS is built in when updates are off in a release build', async () => {
  // A release build whose updates storage failed: no embedded update is reported, but the
  // launched bundle is the built-in one.
  mockUpdates = {
    isEnabled: false,
    currentlyRunning: { isEmbeddedLaunch: false, createdAt: new Date(2026, 10, 15, 16, 5) },
  };

  expect(await findUpdateRow()).toHaveTextContent(/Built in/);
});

it('says it is a development build when a dev client runs Metro', async () => {
  // What a debug dev client reports: updates on, nothing embedded, no launched update.
  mockUpdates = { isEnabled: true, currentlyRunning: { isEmbeddedLaunch: false } };

  expect(await findUpdateRow()).toHaveTextContent(/Development build/);
});
