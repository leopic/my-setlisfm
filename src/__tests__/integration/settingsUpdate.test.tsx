import type * as ExpoUpdates from 'expo-updates';
import { fireEvent, screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { launchApp } from '../../../test/screen';

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
  await fireEvent.press(await screen.findByLabelText('Open settings'));
  return screen.findByTestId('settings-update');
}

beforeAll(seedDatabase);

it('shows the date, id and channel of a downloaded update', async () => {
  mockUpdates = {
    isEnabled: true,
    currentlyRunning: {
      isEmbeddedLaunch: false,
      updateId: 'a1b2c3d4-0000-4000-8000-000000000000',
      channel: 'preview',
      // Local time, so the text is the same in any time zone; 16:05 pins the 24-hour clock.
      createdAt: new Date(2026, 10, 15, 16, 5),
    },
  };

  const row = await findUpdateRow();
  expect(row).toHaveTextContent(/Nov 15, 16:05/);
  expect(row).toHaveTextContent(/a1b2c3d · preview/);
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
