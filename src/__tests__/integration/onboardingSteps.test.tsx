import { act, renderRouter, screen, fireEvent, waitFor } from 'expo-router/testing-library';
import * as Haptics from 'expo-haptics';
import { syncConcertData, setStoredUsername, type SyncProgress } from '@/services/syncService';

// The sync stands in for setlist.fm: each test drives its progress and its end by hand.
// Storing the username stays real, but spied on.
jest.mock('@/services/syncService', () => {
  const actual = jest.requireActual('@/services/syncService');
  return {
    ...actual,
    syncConcertData: jest.fn(),
    setStoredUsername: jest.fn(actual.setStoredUsername),
  };
});

// The real context, with its notify call spied on.
const mockNotifySyncComplete = jest.fn();
jest.mock('@/contexts/SyncContext', () => {
  const actual = jest.requireActual('@/contexts/SyncContext');
  return {
    ...actual,
    useSyncContext: () => {
      const context = actual.useSyncContext();
      return {
        ...context,
        notifySyncComplete: () => {
          mockNotifySyncComplete();
          context.notifySyncComplete();
        },
      };
    },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Haptics, 'notificationAsync');
});

type SyncResult = { success: true; newConcerts: number } | { success: false; error: string };

// Types the username and presses Get Started, then waits until the sync was called again.
async function pressGetStarted() {
  const callsBefore = jest.mocked(syncConcertData).mock.calls.length;
  await fireEvent.changeText(
    await screen.findByPlaceholderText('Your setlist.fm username'),
    'leopic',
  );
  // Not awaited: the press handler stays pending until the sync ends, and fireEvent waits for it.
  void fireEvent.press(screen.getByText('Get Started'));
  await waitFor(() => expect(syncConcertData).toHaveBeenCalledTimes(callsBefore + 1));
}

// Starts onboarding with a sync that reports progress on demand and ends when told to.
async function startSyncWithControls() {
  let report: (p: SyncProgress) => void = () => {};
  let finish: (result: SyncResult) => void = () => {};
  jest.mocked(syncConcertData).mockImplementation(
    (_username, onProgress) =>
      new Promise((resolve) => {
        report = onProgress as (p: SyncProgress) => void;
        finish = resolve as (result: SyncResult) => void;
      }),
  );

  await renderRouter('./app', { initialUrl: '/' });
  await pressGetStarted();
  return {
    report: (p: SyncProgress) => act(async () => report(p)),
    finish: (result: SyncResult) => act(async () => finish(result)),
  };
}

it('shows both steps waiting before a sync starts', async () => {
  await renderRouter('./app', { initialUrl: '/' });

  expect(await screen.findByText('Your concerts')).toBeOnTheScreen();
  expect(screen.getByText('Synced from setlist.fm')).toBeOnTheScreen();
  expect(screen.getByText('Artist photos')).toBeOnTheScreen();
  expect(screen.getByText("A face for every act you've seen")).toBeOnTheScreen();
});

it('shows page progress and the quip while concerts are fetched', async () => {
  const { report } = await startSyncWithControls();

  await report({
    phase: 'fetching',
    currentPage: 2,
    totalPages: 5,
    totalConcerts: 40,
    newConcertsFound: 40,
    quip: 'Tuning the guitars',
  });

  expect(await screen.findByText('Finding concerts…')).toBeOnTheScreen();
  expect(screen.getByText('Page 2 of 5  ·  40 total')).toBeOnTheScreen();
  expect(await screen.findByText('Tuning the guitars')).toBeOnTheScreen();
});

it('shows artist photo progress once the concerts are saved', async () => {
  const { report } = await startSyncWithControls();

  await report({
    phase: 'images',
    currentPage: 5,
    totalPages: 5,
    totalConcerts: 40,
    newConcertsFound: 40,
    imagesTotal: 8,
    imagesDone: 3,
  });

  expect(await screen.findByText('40 concerts')).toBeOnTheScreen();
  expect(screen.getByText('All saved ✓')).toBeOnTheScreen();
  expect(await screen.findByText('3 of 8 artists', {}, { timeout: 3000 })).toBeOnTheScreen();
});

it('shows the error with its haptic, then Try Again brings the input back', async () => {
  const { finish } = await startSyncWithControls();

  await finish({ success: false, error: 'User not found' });

  expect(await screen.findByText('Try Again')).toBeOnTheScreen();
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  expect(
    await screen.findByText(
      'Username not found on setlist.fm. Please check your username and try again.',
    ),
  ).toBeOnTheScreen();

  await fireEvent.press(screen.getByText('Try Again'));

  expect(await screen.findByText('Get Started')).toBeOnTheScreen();
  expect(screen.queryByText('Try Again')).not.toBeOnTheScreen();
});

it('forgets the old quip after Try Again', async () => {
  const { report, finish } = await startSyncWithControls();
  await report({
    phase: 'fetching',
    currentPage: 1,
    totalPages: 5,
    totalConcerts: 0,
    newConcertsFound: 0,
    quip: 'Tuning the guitars',
  });
  expect(await screen.findByText('Tuning the guitars')).toBeOnTheScreen();

  await finish({ success: false, error: 'User not found' });
  await fireEvent.press(await screen.findByText('Try Again'));
  await pressGetStarted();
  await report({
    phase: 'fetching',
    currentPage: 1,
    totalPages: 5,
    totalConcerts: 0,
    newConcertsFound: 0,
  });

  // Step 1 is active again, so a quip that was not reset would show.
  expect(await screen.findByText('Finding concerts…', {}, { timeout: 3000 })).toBeOnTheScreen();
  expect(screen.queryByText('Tuning the guitars')).not.toBeOnTheScreen();
});

it('starts the sync when the username is submitted from the keyboard', async () => {
  jest.mocked(syncConcertData).mockReturnValue(new Promise(() => {}));
  await renderRouter('./app', { initialUrl: '/' });
  const input = await screen.findByPlaceholderText('Your setlist.fm username');

  await fireEvent.changeText(input, 'leopic');
  void fireEvent(input, 'submitEditing');

  await waitFor(() => expect(syncConcertData).toHaveBeenCalledWith('leopic', expect.any(Function)));
});

it('disables Get Started while the username is empty', async () => {
  await renderRouter('./app', { initialUrl: '/' });
  const button = await screen.findByRole('button', { name: 'Get Started' });
  expect(button).toBeDisabled();

  await fireEvent.changeText(screen.getByPlaceholderText('Your setlist.fm username'), '   ');
  expect(button).toBeDisabled();

  await fireEvent.changeText(screen.getByPlaceholderText('Your setlist.fm username'), 'leopic');
  expect(button).toBeEnabled();
});

it('stores the username, notifies and plays success after a successful sync', async () => {
  const { finish } = await startSyncWithControls();

  await finish({ success: true, newConcerts: 12 });

  await waitFor(() => expect(setStoredUsername).toHaveBeenCalledWith('leopic'));
  await waitFor(() => expect(mockNotifySyncComplete).toHaveBeenCalledTimes(1));
  expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
});
