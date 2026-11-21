import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { dbOperations } from '@/database/operations';
import * as syncService from '@/services/syncService';
import { seedDatabase } from '../../../test/database';
import { launchApp } from '../../../test/screen';

beforeAll(seedDatabase);

beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  jest
    .spyOn(syncService, 'syncConcertData')
    .mockResolvedValue({ success: true, pagesProcessed: 1, newConcerts: 0 });
});

afterEach(async () => {
  jest.restoreAllMocks();
  await syncService.setStoredUsername('e2e-seed');
});

async function openSettings() {
  await launchApp();
  await fireEvent.press(await screen.findByLabelText('Open settings'));
  await screen.findByText('Settings');
}

it('shows the account, sync, about and data sections', async () => {
  await openSettings();

  for (const label of ['Account', 'Sync', 'About', 'Data']) {
    expect(await screen.findByText(label)).toBeOnTheScreen();
  }
  expect(await screen.findByText('e2e-seed')).toBeOnTheScreen();
  expect(screen.getByText('Last synced')).toBeOnTheScreen();
  expect(screen.queryByText('Never')).not.toBeOnTheScreen();
  expect(screen.getByText('setlist.fm')).toBeOnTheScreen();
});

it('syncs the stored username from the sync row and reports the result', async () => {
  await openSettings();
  await screen.findByText('e2e-seed');

  await fireEvent.press(screen.getByLabelText('Sync now'));

  await waitFor(() => expect(syncService.syncConcertData).toHaveBeenCalledWith('e2e-seed'));
  await waitFor(() =>
    expect(Alert.alert).toHaveBeenCalledWith('Up to Date', 'No new concerts found.'),
  );
});

it('saves a changed username and syncs with it', async () => {
  await openSettings();
  await screen.findByText('e2e-seed');

  await fireEvent.press(screen.getByText('Change'));
  await fireEvent.changeText(screen.getByDisplayValue('e2e-seed'), '  other-user ');
  await fireEvent.press(screen.getByText('Save'));

  expect(await screen.findByText('other-user')).toBeOnTheScreen();
  await waitFor(() => expect(syncService.syncConcertData).toHaveBeenCalledWith('other-user'));
  expect(await syncService.getStoredUsername()).toBe('other-user');
  expect(screen.queryByDisplayValue('other-user')).not.toBeOnTheScreen();
});

it('leaves the username alone when the edit is cancelled', async () => {
  await openSettings();
  await screen.findByText('e2e-seed');

  await fireEvent.press(screen.getByText('Change'));
  await fireEvent.changeText(screen.getByDisplayValue('e2e-seed'), 'discarded');
  await fireEvent.press(screen.getByLabelText('Cancel'));

  expect(await screen.findByText('e2e-seed')).toBeOnTheScreen();
  expect(screen.queryByDisplayValue('discarded')).not.toBeOnTheScreen();
  expect(syncService.syncConcertData).not.toHaveBeenCalled();
});

it('goes back to the dashboard from the header', async () => {
  await openSettings();

  await fireEvent.press(screen.getByLabelText('Go back'));

  await waitFor(() => expect(screen.queryByText('Account')).not.toBeOnTheScreen());
  expect(screen.getByTestId('dashboard-screen')).toBeOnTheScreen();
});

it('disables the sync button while a sync runs', async () => {
  let finishSync: (result: syncService.SyncResult) => void = () => undefined;
  jest.spyOn(syncService, 'syncConcertData').mockReturnValue(
    new Promise((resolve) => {
      finishSync = resolve;
    }),
  );
  await openSettings();
  await screen.findByText('e2e-seed');

  await fireEvent.press(screen.getByLabelText('Sync now'));

  expect(await screen.findByText('Syncing…')).toBeOnTheScreen();
  expect(screen.getByLabelText('Sync now')).toBeDisabled();
  await fireEvent.press(screen.getByLabelText('Sync now'));
  expect(syncService.syncConcertData).toHaveBeenCalledTimes(1);

  await act(async () => finishSync({ success: true, pagesProcessed: 1, newConcerts: 0 }));
  await waitFor(() =>
    expect(Alert.alert).toHaveBeenCalledWith('Up to Date', 'No new concerts found.'),
  );
  expect(await screen.findByText('Sync Now')).toBeOnTheScreen();
  expect(screen.getByLabelText('Sync now')).toBeEnabled();
});

it('saves the username from the keyboard Done key', async () => {
  await openSettings();
  await screen.findByText('e2e-seed');

  await fireEvent.press(screen.getByText('Change'));
  const input = screen.getByDisplayValue('e2e-seed');
  await fireEvent.changeText(input, 'other-user');
  await fireEvent(input, 'submitEditing');

  await waitFor(() => expect(syncService.syncConcertData).toHaveBeenCalledWith('other-user'));
  expect(await screen.findByText('other-user')).toBeOnTheScreen();
});

it('does not save an empty username', async () => {
  await openSettings();
  await screen.findByText('e2e-seed');

  await fireEvent.press(screen.getByText('Change'));
  await fireEvent.changeText(screen.getByDisplayValue('e2e-seed'), '   ');
  await fireEvent.press(screen.getByText('Save'));

  expect(screen.getByDisplayValue('   ')).toBeOnTheScreen();
  expect(syncService.syncConcertData).not.toHaveBeenCalled();
  expect(await syncService.getStoredUsername()).toBe('e2e-seed');
});

it('shows an alert when the sync fails', async () => {
  jest
    .spyOn(syncService, 'syncConcertData')
    .mockResolvedValue({ success: false, pagesProcessed: 0, newConcerts: 0, error: 'Boom' });
  await openSettings();
  await screen.findByText('e2e-seed');

  await fireEvent.press(screen.getByLabelText('Sync now'));

  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Sync Failed', 'Boom'));
});

it('updates "Last synced" after a sync', async () => {
  await openSettings();
  await screen.findByText('e2e-seed');

  jest
    .spyOn(dbOperations, 'getLastFetchedAt')
    .mockResolvedValue(new Date(Date.now() - 5 * 60 * 1000));
  await fireEvent.press(screen.getByLabelText('Sync now'));

  expect(await screen.findByText('5 minutes ago')).toBeOnTheScreen();
});
