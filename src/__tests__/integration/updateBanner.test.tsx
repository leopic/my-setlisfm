import { useSyncExternalStore as mockUseSyncExternalStore } from 'react';
import { AppState, type AppStateStatus, StyleSheet } from 'react-native';
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import * as Updates from 'expo-updates';
import { seedDatabase } from '../../../test/database';
import { launchApp } from '../../../test/screen';

// What expo-updates reports; each test sets its own state.
let mockUpdates: {
  channel: string | null;
  isUpdatePending: boolean;
  isRestarting?: boolean;
  downloadedUpdate?: { updateId: string };
};

const mockListeners = new Set<() => void>();
function mockSubscribe(listener: () => void) {
  mockListeners.add(listener);
  return () => mockListeners.delete(listener);
}

// Changes what expo-updates reports while the app is open.
async function setUpdates(next: typeof mockUpdates) {
  await act(async () => {
    mockUpdates = next;
    for (const listener of mockListeners) listener();
  });
}

jest.mock('expo-updates', () => ({
  isEnabled: true,
  get channel() {
    return mockUpdates.channel;
  },
  // Re-renders on setUpdates, the way the real hook does on a state machine event.
  useUpdates: () => {
    mockUseSyncExternalStore(mockSubscribe, () => mockUpdates);
    return {
      currentlyRunning: { isEmbeddedLaunch: true },
      isUpdatePending: mockUpdates.isUpdatePending,
      isRestarting: mockUpdates.isRestarting ?? false,
      downloadedUpdate: mockUpdates.downloadedUpdate,
    };
  },
  reloadAsync: jest.fn(() => Promise.resolve()),
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isAvailable: true })),
  fetchUpdateAsync: jest.fn(() => Promise.resolve({ isNew: true })),
}));

// Brings the app back to the foreground, the way AppState reports it.
function captureAppStateListener() {
  const listeners: ((state: AppStateStatus) => void)[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((type, listener) => {
    if (type === 'change') listeners.push(listener as (state: AppStateStatus) => void);
    return { remove: jest.fn() };
  });
  return async () => {
    await act(async () => {
      for (const listener of listeners) listener('active');
    });
  };
}

beforeAll(seedDatabase);

beforeEach(() => {
  jest.mocked(Updates.reloadAsync).mockClear();
  jest.mocked(Updates.checkForUpdateAsync).mockClear();
  jest.mocked(Updates.fetchUpdateAsync).mockClear();
});

it('offers a restart once an update has downloaded', async () => {
  mockUpdates = { channel: 'preview', isUpdatePending: true, downloadedUpdate: { updateId: 'u1' } };
  await launchApp();

  expect(await screen.findByText('New version ready')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Restart' }));

  expect(Updates.reloadAsync).toHaveBeenCalledTimes(1);
});

it('floats above the tab bar, clear of the screen header', async () => {
  mockUpdates = { channel: 'preview', isUpdatePending: true, downloadedUpdate: { updateId: 'u1' } };
  await launchApp();

  const style = StyleSheet.flatten(screen.getByTestId('update-banner').props.style);
  expect(style.top).toBeUndefined();
  expect(style.bottom).toBeGreaterThan(0);
});

it('hides the banner when the update is put off', async () => {
  mockUpdates = { channel: 'preview', isUpdatePending: true, downloadedUpdate: { updateId: 'u1' } };
  await launchApp();

  await fireEvent.press(await screen.findByRole('button', { name: 'Later' }));

  expect(screen.queryByTestId('update-banner')).not.toBeOnTheScreen();
  expect(Updates.reloadAsync).not.toHaveBeenCalled();
});

it('shows the banner again for a newer update after one was put off', async () => {
  mockUpdates = { channel: 'preview', isUpdatePending: true, downloadedUpdate: { updateId: 'u1' } };
  await launchApp();
  await fireEvent.press(await screen.findByRole('button', { name: 'Later' }));

  expect(screen.queryByTestId('update-banner')).not.toBeOnTheScreen();

  // A newer update downloads while the app is open.
  await setUpdates({
    channel: 'preview',
    isUpdatePending: true,
    downloadedUpdate: { updateId: 'u2' },
  });

  expect(await screen.findByText('New version ready')).toBeOnTheScreen();
});

it('shows no banner while no update waits', async () => {
  mockUpdates = { channel: 'preview', isUpdatePending: false };
  await launchApp();

  expect(await screen.findByTestId('dashboard-screen')).toBeOnTheScreen();
  expect(screen.queryByTestId('update-banner')).not.toBeOnTheScreen();
});

it('looks for an update when the app comes back to the foreground', async () => {
  mockUpdates = { channel: 'preview', isUpdatePending: false };
  const foreground = captureAppStateListener();
  await launchApp();

  await foreground();

  await waitFor(() => expect(Updates.fetchUpdateAsync).toHaveBeenCalledTimes(1));
  expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
});

it('does not look for updates in a build without a channel', async () => {
  // A dev client or the E2E build: the update server rejects requests without a channel.
  mockUpdates = { channel: null, isUpdatePending: false };
  const foreground = captureAppStateListener();
  await launchApp();

  await foreground();

  expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
});
