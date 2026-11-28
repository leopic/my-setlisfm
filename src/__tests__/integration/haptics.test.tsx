import { fireEvent, screen } from 'expo-router/testing-library';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as syncService from '@/services/syncService';
import { seedDatabase } from '../../../test/database';
import {
  findScreen,
  launchApp,
  openTab,
  pressHeaderButton,
  pressHeaderMenuItem,
} from '../../../test/screen';

let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

beforeEach(async () => {
  jest.spyOn(Haptics, 'selectionAsync');
  jest.spyOn(Haptics, 'notificationAsync');
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await launchApp();
});

afterEach(async () => {
  mockIsTablet = false;
  jest.restoreAllMocks();
  await syncService.setStoredUsername('e2e-seed');
});

// Taps a choice that is off, then taps it again: one tick, for the one change.
async function expectOneTick(press: () => Promise<unknown>) {
  await press();
  expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  await press();
  expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
}

it.each([
  ['Artists', '(artists)', 'artists-screen', 'Top'],
  ['Venues', '(venues)', 'venues-screen', 'Top'],
  ['Concerts', '(concerts)', 'concerts-screen', 'By Name'],
] as const)('ticks when a %s sort pill changes the sort', async (_tab, tab, testID, pill) => {
  // The pills are the iPad's and Android's; the iPhone's Sort By menu ticks by itself.
  mockIsTablet = true;
  await openTab(tab);
  const list = await findScreen(testID);
  await expectOneTick(() => fireEvent.press(list.getByText(pill)));
});

it('ticks when a sort pill on Countries changes the sort', async () => {
  await openTab('(venues)');
  await findScreen('venues-screen');
  await pressHeaderMenuItem('Browse by place', 'Countries');
  const countries = await findScreen('countries-screen');
  await expectOneTick(() => fireEvent.press(countries.getByText('Top')));
});

// The year sheet is the iPad's and Android's; the iPhone's native year menu ticks by itself.
it('ticks when the year list picks another year', async () => {
  mockIsTablet = true;
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  await expectOneTick(async () => {
    await fireEvent.press(
      concerts.queryByLabelText('Filter by year') ?? concerts.getByLabelText('Filtered by 2024'),
    );
    await fireEvent.press(await screen.findByRole('button', { name: '2024' }));
  });
});

it('ticks when the iPad year grid picks another year', async () => {
  mockIsTablet = true;
  await launchApp();
  await expectOneTick(async () =>
    fireEvent.press(await screen.findByRole('button', { name: '2024, 4 shows' })),
  );
});

const RESULTS = [
  ['success', { success: true, pagesProcessed: 1, newConcerts: 0 }],
  ['error', { success: false, pagesProcessed: 0, newConcerts: 0, error: 'offline' }],
] as const;

it.each(RESULTS)(
  'plays the %s pattern when a Dashboard sync ends that way',
  async (feedback, result) => {
    jest.spyOn(syncService, 'setStoredUsername').mockResolvedValue();
    jest.spyOn(syncService, 'syncConcertData').mockResolvedValue(result);

    await pressHeaderButton('Sync concert data');

    expect(syncService.syncConcertData).toHaveBeenCalled();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(feedback);
  },
);

it.each(RESULTS)(
  'plays the %s pattern when a Settings sync ends that way',
  async (feedback, result) => {
    jest.spyOn(syncService, 'syncConcertData').mockResolvedValue(result);
    await pressHeaderButton('Open settings');

    await fireEvent.press(await screen.findByLabelText('Sync now'));

    expect(syncService.syncConcertData).toHaveBeenCalled();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(feedback);
  },
);
