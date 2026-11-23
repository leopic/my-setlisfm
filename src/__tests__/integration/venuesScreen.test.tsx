import { router } from 'expo-router';
import { act, fireEvent, screen, within } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import {
  findNativeHeader,
  findScreen,
  launchApp,
  layOutLists,
  openTab,
} from '../../../test/screen';
import { formatDate } from '@/utils/date';

// Flipped per test: the phone layout is the default, the tablet one shows the detail pane.
let mockIsTablet = false;
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: mockIsTablet, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

beforeEach(launchApp);

afterEach(() => {
  mockIsTablet = false;
});

// The list keeps rows in the same containers when the order changes and moves them by their
// `top` offset, so the visible order is the order of that offset, not of the rendered tree.
const rowIds = (venues: Awaited<ReturnType<typeof findScreen>>) => {
  const rows = venues
    .getAllByTestId(/^venue-venue-/)
    .map((node) => ({ id: node.props.testID, top: node.parent?.props.style[1].top }));
  // A missing offset would make the sort below a no-op, so the order check would prove nothing.
  rows.forEach((row) => expect(typeof row.top).toBe('number'));
  return rows.sort((a, b) => a.top - b.top).map((row) => row.id);
};

it('shows location, last show, artists and visit count on a row', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');

  // Columbiahalle: three concerts, the latest on 14-02-2025.
  expect(venues.getByText('Columbiahalle')).toBeOnTheScreen();
  // Berlin is a city and a state; the name is said once.
  expect(venues.getAllByText('Berlin, Germany').length).toBeGreaterThan(0);
  expect(venues.queryByText('Berlin, Berlin, Germany')).not.toBeOnTheScreen();
  expect(venues.getByText(`Last show: ${formatDate('14-02-2025')}`)).toBeOnTheScreen();
  expect(venues.getByText(/Kraftwerk/)).toBeOnTheScreen();
  expect(venues.getByText('3')).toBeOnTheScreen();
  expect(venues.getByLabelText('Columbiahalle, 3 visits')).toBeOnTheScreen();
});

it('says "visit" for a venue seen once', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');

  // Astra: one concert.
  const astra = venues.getByTestId('venue-venue-4');
  expect(astra.props.accessibilityLabel).toBe('Astra, 1 visit');
  expect(within(astra).getByText('visit')).toBeOnTheScreen();
  expect(within(venues.getByTestId('venue-venue-2')).getByText('visits')).toBeOnTheScreen();
});

it('says "visit" for a venue seen once on the city screen', async () => {
  await act(async () =>
    router.navigate({
      pathname: '/(venues)/city-detail',
      params: { city: 'Berlin', country: 'Germany' },
    }),
  );

  const astra = await screen.findByLabelText('Astra, 1 visit');
  expect(within(astra).getByText('visit')).toBeOnTheScreen();
  expect(screen.getByLabelText('Columbiahalle, 3 visits')).toBeOnTheScreen();
  // Berlin is a city and a state; the name is said once.
  expect(within(astra).getByText('Berlin, Germany')).toBeOnTheScreen();
});

it('reads the continent count as venues, as the row shows', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  await fireEvent.press(venues.getByTestId('nav-continents'));

  const continents = await findScreen('continents-screen');
  // Europe: Columbiahalle and Astra in Berlin, O2 Arena in London.
  expect(continents.getByTestId('continent-Europe').props.accessibilityLabel).toBe(
    'Europe, 2 countries, 2 cities, 3 venues',
  );
});

it('sorts by the pill pressed and words the subtitle to match', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');

  expect(venues.getByText('4 venues (sorted by most recent)')).toBeOnTheScreen();
  expect(rowIds(venues)).toEqual([
    'venue-venue-1',
    'venue-venue-3',
    'venue-venue-2',
    'venue-venue-4',
  ]);

  await fireEvent.press(venues.getByText('Top'));
  await layOutLists();
  expect(venues.getByText('4 venues (sorted by visit count)')).toBeOnTheScreen();
  expect(rowIds(venues)[0]).toBe('venue-venue-2');

  await fireEvent.press(venues.getByText('By Name'));
  await layOutLists();
  expect(venues.getByText('4 venues')).toBeOnTheScreen();
  expect(rowIds(venues)).toEqual([
    'venue-venue-4',
    'venue-venue-2',
    'venue-venue-1',
    'venue-venue-3',
  ]);
});

it('filters rows by the search text and says so when nothing matches', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  const search = venues.getByPlaceholderText('Search venues, cities, countries...');

  await fireEvent.changeText(search, 'berlin');
  await layOutLists();
  expect(rowIds(venues).sort()).toEqual(['venue-venue-2', 'venue-venue-4']);
  // The subtitle counts all venues, not the filtered ones.
  expect(venues.getByText('4 venues (sorted by most recent)')).toBeOnTheScreen();

  await fireEvent.changeText(search, 'zzz-no-such-venue');
  await layOutLists();
  expect(await venues.findByText('No venues match your search')).toBeOnTheScreen();
});

it('reloads the list when the list is pulled to refresh', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  expect(venues.queryByText('Refresh Hall')).not.toBeOnTheScreen();

  // Other tabs stay mounted with their own RefreshControl, so take the scroll view that holds venue rows.
  // The scroll view holds its RefreshControl element as a prop.
  const onRefresh = () => {
    const scrollView = screen.container.queryAll(
      (n) =>
        !!n.props.refreshControl &&
        n.queryAll((child) => child.props.testID === 'venue-venue-1').length > 0,
    )[0];
    if (!scrollView) throw new Error('No RefreshControl on the venue list');
    return scrollView.props.refreshControl.props.onRefresh as () => Promise<void>;
  };

  const db = getTestDatabase();
  db.exec(`
    INSERT INTO venues (id, name, cityId, url) VALUES ('venue-refresh', 'Refresh Hall', 'city-2', 'https://www.setlist.fm/venue/refresh-hall.html');
    INSERT INTO setlists (id, artistMbid, venueId, eventDate, url) VALUES ('set-refresh', 'artist-1', 'venue-refresh', '01-01-2025', 'https://www.setlist.fm/setlist/set-refresh.html');
  `);
  try {
    await act(async () => {
      await onRefresh()();
    });
    await layOutLists();
    expect(await venues.findByText('Refresh Hall')).toBeOnTheScreen();
    expect(venues.getByText('5 venues (sorted by most recent)')).toBeOnTheScreen();
  } finally {
    db.exec(`
      DELETE FROM setlists WHERE id = 'set-refresh';
      DELETE FROM venues WHERE id = 'venue-refresh';
    `);
  }
});

describe('the large title', () => {
  it('is the native large title on a phone, with the list under it', async () => {
    await openTab('(venues)');
    const venues = await findScreen('venues-screen');
    // It collapses into the bar as the list scrolls.
    expect(findNativeHeader('Venues')?.props).toMatchObject({ largeTitle: true, hidden: false });
    expect(venues.getByText('4 venues (sorted by most recent)')).toBeOnTheScreen();
    // Without the automatic inset the list starts under the bar and the title never collapses.
    // Without overflow scrolling React Native stops a scroll to the list's top at 0.
    const list = venues.getByTestId('venues-list');
    expect(list).toHaveProp('contentInsetAdjustmentBehavior', 'automatic');
    expect(list).toHaveProp('scrollToOverflowEnabled', true);
    // The geo strip and the pills are in the list, so they take a tap while the keyboard is up.
    expect(list).toHaveProp('keyboardShouldPersistTaps', 'handled');
  });

  // A screen's header options outlive the branch that set them, so the tablet layout turns
  // the phone's large title off again. Its own header sits above the sidebar list.
  it('drops the large title when the layout turns into the tablet one', async () => {
    await openTab('(venues)');
    await findScreen('venues-screen');
    expect(findNativeHeader('Venues')?.props.hidden).toBe(false);
    mockIsTablet = true;
    await openTab('(artists)');
    await openTab('(venues)');
    const venues = await findScreen('venues-screen');

    expect(await venues.findByText('Venues')).toBeOnTheScreen();
    expect(findNativeHeader('Venues')?.props.hidden).toBe(true);
    const list = venues.getByTestId('venues-list');
    expect(list).not.toHaveProp('contentInsetAdjustmentBehavior', 'automatic');
    expect(list).not.toHaveProp('scrollToOverflowEnabled', true);
  });

  // The same for the empty state, as after "Clear All Data". Deletes the setlists of the
  // shared DB and never restores them: keep this test last.
  it('drops the large title when the last venue goes away', async () => {
    await openTab('(venues)');
    await findScreen('venues-screen');
    expect(findNativeHeader('Venues')?.props.hidden).toBe(false);
    const db = getTestDatabase();
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DELETE FROM setlists');
    db.exec('PRAGMA foreign_keys = ON');
    await openTab('(artists)');
    await openTab('(venues)');

    expect(await screen.findByText('No venues yet')).toBeOnTheScreen();
    expect(screen.getByText('Venues')).toBeOnTheScreen();
    expect(findNativeHeader('Venues')?.props.hidden).toBe(true);
  });
});
