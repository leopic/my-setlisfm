import { router } from 'expo-router';
import { act, fireEvent, screen, within } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp, layOutLists, openTab } from '../../../test/screen';
import { formatDate } from '@/utils/date';

beforeAll(seedDatabase);

beforeEach(launchApp);

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
  expect(venues.getAllByText('Berlin, Berlin, Germany').length).toBeGreaterThan(0);
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
