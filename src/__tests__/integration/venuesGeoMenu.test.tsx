import { Platform } from 'react-native';
import { screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findNativeHeader, findScreen, launchApp, openTab } from '../../../test/screen';

let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

type MenuItem = {
  accessibilityLabel?: string;
  icon?: { name?: string };
  menu?: { items: { title?: string; subtitle?: string }[] };
};

/** The globe menu in the Venues header, as the native header gets it. */
const globeMenu = () =>
  (
    (findNativeHeader('Venues')?.props.headerRightBarButtonItems as MenuItem[] | undefined) ?? []
  ).find((item) => item.accessibilityLabel === 'Browse by place');

const stripButtons = () =>
  ['nav-continents', 'nav-countries', 'nav-cities'].filter((id) => screen.queryByTestId(id));

// The three ways into places looked like the sort chips under them. On an iPhone they're one
// globe menu in the bar; the seed has 2 continents, 3 countries and 3 cities.
it('puts continents, countries and cities in a header menu on an iPhone', async () => {
  mockIsTablet = false;
  await launchApp();
  await openTab('(venues)');
  await findScreen('venues-screen');
  expect(globeMenu()?.menu?.items.map(({ title, subtitle }) => [title, subtitle])).toEqual([
    ['Continents', '2'],
    ['Countries', '3'],
    ['Cities', '3'],
  ]);
  expect(stripButtons()).toEqual([]);
});

// The iPad has no native header, and Android no native menu without '@expo/ui'.
it.each([
  ['the iPad', true, 'ios'],
  ['Android', false, 'android'],
] as const)('keeps the buttons in the list on %s', async (_name, tablet, os) => {
  mockIsTablet = tablet;
  const platform = jest.replaceProperty(Platform, 'OS', os);
  try {
    await launchApp();
    await openTab('(venues)');
    await findScreen('venues-screen');
    expect(stripButtons()).toEqual(['nav-continents', 'nav-countries', 'nav-cities']);
    expect(globeMenu()).toBeUndefined();
  } finally {
    platform.restore();
  }
});
