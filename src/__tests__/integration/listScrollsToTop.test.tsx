import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { ScrollView } from 'react-native';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp, openTab } from '../../../test/screen';

beforeAll(seedDatabase);

// Search, year and sort sit above the list. New results must start at the top, not where
// the user had scrolled to in the old ones.

// Under Jest, ScrollView is React Native's mock: every instance shares one scrollTo jest.fn,
// LegendList's inner ScrollView too.
const scrollTo = ScrollView.prototype.scrollTo as jest.Mock;

beforeEach(async () => {
  await launchApp();
  scrollTo.mockClear();
});

// Scroll the screen's list to y, as a drag would. The seed lists are short, so the
// content size is set by hand.
async function scrollDown(screenId: string, y: number) {
  const [list] = screen
    .getByTestId(screenId)
    .queryAll((n) => n.type === 'RCTScrollView' && !n.props.horizontal);
  await fireEvent.scroll(list, {
    nativeEvent: {
      contentOffset: { x: 0, y },
      contentSize: { width: 390, height: 20000 },
      layoutMeasurement: { width: 390, height: 844 },
    },
  });
}

const scrolledToTop = (animated: boolean) =>
  waitFor(() =>
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ y: 0, animated })),
  );

describe.each([
  ['concerts', '(concerts)', 'concerts-screen', 'By Name'],
  ['artists', '(artists)', 'artists-screen', 'Top'],
  ['venues', '(venues)', 'venues-screen', 'Top'],
] as const)('the %s list', (_name, tab, screenId, pill) => {
  it('animates back to the top when the sort changes near the top', async () => {
    await openTab(tab);
    const list = await findScreen(screenId);
    await scrollDown(screenId, 400);

    await fireEvent.press(list.getByText(pill));

    await scrolledToTop(true);
  });

  it('jumps instead of animating from more than two screens down', async () => {
    await openTab(tab);
    const list = await findScreen(screenId);
    await scrollDown(screenId, 3000);

    await fireEvent.press(list.getByText(pill));

    await scrolledToTop(false);
  });
});

describe.each([
  ['continents', 'nav-continents', 'continents-screen', 'Top'],
  ['countries', 'nav-countries', 'countries-screen', 'Top'],
  ['cities', 'nav-cities', 'cities-screen', 'Top'],
] as const)('the %s list', (_name, navId, screenId, pill) => {
  // A plain ScrollView draws every row, so it animates even from far down.
  it('animates back to the top when the sort changes', async () => {
    await openTab('(venues)');
    await fireEvent.press((await findScreen('venues-screen')).getByTestId(navId));
    const list = await findScreen(screenId);
    await scrollDown(screenId, 3000);

    await fireEvent.press(list.getByText(pill));

    await scrolledToTop(true);
  });
});

describe.each([
  ['concerts', '(concerts)', 'concerts-screen', 'Search by artist, venue, city...'],
  ['artists', '(artists)', 'artists-screen', 'Search artists...'],
  ['venues', '(venues)', 'venues-screen', 'Search venues, cities, countries...'],
] as const)('the %s list', (_name, tab, screenId, placeholder) => {
  it('goes back to the top when the search changes', async () => {
    await openTab(tab);
    const list = await findScreen(screenId);
    await scrollDown(screenId, 3000);

    await fireEvent.changeText(list.getByPlaceholderText(placeholder), 'a');

    await scrolledToTop(false);
  });
});

// Under its native large title the artists list rests above offset 0: iOS insets it by the
// bar and reports that offset once as it lays the list out. The top is there, not at 0, or
// the title collapses halfway.
describe('the artists list under its large title', () => {
  const REST = -168;

  beforeEach(async () => {
    await openTab('(artists)');
    await findScreen('artists-screen');
    await scrollDown('artists-screen', REST);
  });

  it('animates back to its top when the sort changes near the top', async () => {
    await scrollDown('artists-screen', 400);
    await fireEvent.press(screen.getByText('Top'));
    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ y: REST, animated: true }),
      ),
    );
  });

  // The list unmounts in the empty state ("Clear All Data") and a new one mounts after a sync.
  it('finds the top of a list that mounts again', async () => {
    const db = getTestDatabase();
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DELETE FROM setlists');
    await openTab('(concerts)');
    await openTab('(artists)');
    expect(await screen.findByText('No artists yet')).toBeOnTheScreen();
    await seedDatabase();
    await openTab('(concerts)');
    await openTab('(artists)');
    await screen.findByPlaceholderText('Search artists...');
    await scrollDown('artists-screen', REST);
    await scrollDown('artists-screen', 3000);

    await fireEvent.changeText(screen.getByPlaceholderText('Search artists...'), 'a');

    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ y: REST, animated: false }),
      ),
    );
  });

  it('jumps back to its top when the search changes far down', async () => {
    await scrollDown('artists-screen', 3000);
    await fireEvent.changeText(screen.getByPlaceholderText('Search artists...'), 'a');
    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ y: REST, animated: false }),
      ),
    );
  });
});

it('goes back to the top of the concerts when a year is picked', async () => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  await scrollDown('concerts-screen', 3000);

  await fireEvent.press(concerts.getByLabelText('Filter by year'));
  await fireEvent.press(await screen.findByRole('button', { name: '2024' }));

  expect(await concerts.findByLabelText('Filtered by 2024')).toBeOnTheScreen();
  await scrolledToTop(false);
});
