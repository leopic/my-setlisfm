import { fireEvent } from 'expo-router/testing-library';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as syncService from '@/services/syncService';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, openTab, pressHeaderButton } from '../../../test/screen';

beforeAll(seedDatabase);

beforeEach(async () => {
  jest.spyOn(Haptics, 'selectionAsync');
  jest.spyOn(Haptics, 'notificationAsync');
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await launchApp();
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('ticks when a sort pill changes the sort, not when it is already on', async () => {
  await openTab('(artists)');
  const artists = await findScreen('artists-screen');

  await fireEvent.press(artists.getByLabelText('Top'));
  expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

  await fireEvent.press(artists.getByLabelText('Top'));
  expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
});

it.each([
  ['success', { success: true, pagesProcessed: 1, newConcerts: 0 }],
  ['error', { success: false, pagesProcessed: 0, newConcerts: 0, error: 'offline' }],
] as const)('plays the %s pattern when a sync ends that way', async (feedback, result) => {
  jest.spyOn(syncService, 'setStoredUsername').mockResolvedValue();
  jest.spyOn(syncService, 'syncConcertData').mockResolvedValue(result);

  await pressHeaderButton('Sync concert data');

  expect(syncService.syncConcertData).toHaveBeenCalled();
  expect(Haptics.notificationAsync).toHaveBeenCalledWith(feedback);
});
