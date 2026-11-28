import { Platform } from 'react-native';
import { seedDatabase } from '../../../test/database';
import { findScreen, headerMenuActions, launchApp, openTab, pickSort } from '../../../test/screen';

// Flipped per test: the phone layout is the default.
let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

afterEach(() => {
  mockIsTablet = false;
});

const TABS = [
  ['Concerts', '(concerts)', 'concerts-screen', ['Most Recent', 'Artist']],
  ['Artists', '(artists)', 'artists-screen', ['Most Recent', 'Most Concerts', 'Name']],
  ['Venues', '(venues)', 'venues-screen', ['Most Recent', 'Most Visits', 'Name']],
] as const;

// On an iPhone the order is picked from one Sort By menu in the bar, like the Music app's
// library, and no pills sit above the list.
it.each(TABS)('puts the %s order in a Sort By menu', async (_name, tab, screenId, titles) => {
  await launchApp();
  await openTab(tab);
  const list = await findScreen(screenId);

  expect(headerMenuActions('Sort By')).toEqual(
    titles.map((title, index) => ({ title, subtitle: undefined, on: index === 0 })),
  );
  expect(list.queryByText('By Name')).not.toBeOnTheScreen();

  const last = titles[titles.length - 1];
  await pickSort(last);
  expect(headerMenuActions('Sort By').filter((action) => action.on)).toEqual([
    { title: last, subtitle: undefined, on: true },
  ]);
});

// The iPad has no native header, and Android no native menu without '@expo/ui'.
describe.each([
  ['the iPad', true, 'ios'],
  ['Android', false, 'android'],
] as const)('on %s', (_layout, tablet, os) => {
  it.each(TABS)('keeps the %s sort pills', async (_name, tab, screenId) => {
    mockIsTablet = tablet;
    const platform = jest.replaceProperty(Platform, 'OS', os);
    try {
      await launchApp();
      await openTab(tab);
      const list = await findScreen(screenId);
      expect(list.getByText('By Name')).toBeOnTheScreen();
      expect(headerMenuActions('Sort By')).toEqual([]);
    } finally {
      platform.restore();
    }
  });
});
