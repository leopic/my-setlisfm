import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, openTab } from '../../../test/screen';
import { formatDate } from '@/utils/date';

beforeAll(seedDatabase);

beforeEach(async () => {
  await launchApp();
  await openTab('(concerts)');
});

// Seed: 4 shows in 2024 and 4 in 2025, five artists.
type Screen = Awaited<ReturnType<typeof findScreen>>;

const concertIds = (concerts: Screen) =>
  concerts.queryAllByTestId(/^concert-set-\d+$/).map((node) => node.props.testID as string);

it('groups the timeline by year with each entry showing its details', async () => {
  const concerts = await findScreen('concerts-screen');

  expect(concerts.getByText('My Concerts')).toBeOnTheScreen();
  expect(concerts.getByText('8 concerts grouped by year')).toBeOnTheScreen();
  expect(concerts.getAllByText(/^20\d\d$/).map((node) => node.props.children)).toEqual([
    '2025',
    '2024',
  ]);
  expect(concerts.getAllByText('4 concerts')).toHaveLength(2);

  const row = concerts.getByTestId('concert-set-1');
  expect(row.props.accessibilityLabel).toBe(
    `Radiohead, Madison Square Garden, ${formatDate('15-03-2024')}`,
  );
  expect(row.props.accessibilityHint).toBe('View concert details');
  expect(concerts.getByText('In Rainbows Tour')).toBeOnTheScreen();
  expect(concerts.getByText(formatDate('15-03-2024'))).toBeOnTheScreen();
});

it('lists the concerts flat by artist name when sorted by name', async () => {
  const concerts = await findScreen('concerts-screen');

  await fireEvent.press(concerts.getByLabelText('By Name'));

  expect(concerts.getByText('8 concerts (alphabetical by artist)')).toBeOnTheScreen();
  expect(concerts.queryByText('2025')).not.toBeOnTheScreen();
  const ids = concertIds(await findScreen('concerts-screen'));
  expect(ids.slice().sort()).toEqual(
    ['set-1', 'set-2', 'set-3', 'set-4', 'set-5', 'set-6', 'set-7', 'set-8'].map(
      (id) => `concert-${id}`,
    ),
  );
  // Arctic Monkeys, Daft Punk, Kraftwerk, Radiohead, The Strokes; the newer show first within an artist.
  expect(ids.map((id) => id.replace('concert-', ''))).toEqual([
    'set-7',
    'set-4',
    'set-3',
    'set-6',
    'set-5',
    'set-1',
    'set-8',
    'set-2',
  ]);
});

it('filters by search text and shows the no-match state', async () => {
  const concerts = await findScreen('concerts-screen');
  const search = concerts.getByPlaceholderText('Search by artist, venue, city...');

  await fireEvent.changeText(search, 'kraftwerk');
  expect(concertIds(concerts)).toEqual(['concert-set-6']);

  await fireEvent.changeText(search, 'no such band');
  expect(concertIds(concerts)).toEqual([]);
  expect(await concerts.findByText('No matches found')).toBeOnTheScreen();
});

it('filters by year through the year picker', async () => {
  const concerts = await findScreen('concerts-screen');

  await fireEvent.press(concerts.getByLabelText('Filter by year'));
  expect(await concerts.findByText('All')).toBeOnTheScreen();
  await fireEvent.press(concerts.getByRole('button', { name: '2024' }));

  expect(await concerts.findByLabelText('Filtered by 2024')).toBeOnTheScreen();
  expect(concertIds(concerts).sort()).toEqual([
    'concert-set-1',
    'concert-set-2',
    'concert-set-3',
    'concert-set-4',
  ]);
});

const ALL_CONCERT_IDS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `concert-set-${n}`);

it('closes the year sheet after a year is picked', async () => {
  const concerts = await findScreen('concerts-screen');

  await fireEvent.press(concerts.getByLabelText('Filter by year'));
  expect(await screen.findByText('All')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: '2024' }));

  expect(await concerts.findByLabelText('Filtered by 2024')).toBeOnTheScreen();
  expect(screen.queryByText('All')).not.toBeOnTheScreen();
});

it('clears the year filter when All is picked', async () => {
  const concerts = await findScreen('concerts-screen');

  await fireEvent.press(concerts.getByLabelText('Filter by year'));
  await fireEvent.press(await screen.findByRole('button', { name: '2024' }));
  await fireEvent.press(await concerts.findByLabelText('Filtered by 2024'));
  await fireEvent.press(await screen.findByText('All'));

  expect(await concerts.findByLabelText('Filter by year')).toBeOnTheScreen();
  expect(concerts.queryByLabelText('Filtered by 2024')).not.toBeOnTheScreen();
  expect(concertIds(await findScreen('concerts-screen')).sort()).toEqual(ALL_CONCERT_IDS);
});

// Jest renders the sheet's Modal as a host node that keeps its props.
const findYearSheet = () => {
  const [modal] = screen.container.queryAll((node) => node.props.onRequestClose !== undefined);
  return modal;
};

it('closes the year sheet when the overlay is tapped', async () => {
  const concerts = await findScreen('concerts-screen');

  await fireEvent.press(concerts.getByLabelText('Filter by year'));
  expect(await screen.findByText('All')).toBeOnTheScreen();
  // The overlay is the sheet's outermost child: the dark area around the year list.
  await fireEvent.press(findYearSheet().children[0] as Parameters<typeof fireEvent.press>[0]);

  await waitFor(() => expect(screen.queryByText('All')).not.toBeOnTheScreen());
});

it('closes the year sheet on Android back', async () => {
  const concerts = await findScreen('concerts-screen');

  await fireEvent.press(concerts.getByLabelText('Filter by year'));
  expect(await screen.findByText('All')).toBeOnTheScreen();
  await act(async () => findYearSheet().props.onRequestClose());

  await waitFor(() => expect(screen.queryByText('All')).not.toBeOnTheScreen());
});

it('opens the setlist when a row in the By Name list is tapped', async () => {
  const concerts = await findScreen('concerts-screen');

  await fireEvent.press(concerts.getByLabelText('By Name'));
  await fireEvent.press((await findScreen('concerts-screen')).getByTestId('concert-set-8'));

  const setlist = await findScreen('setlist-screen');
  expect(setlist.getByText('The Strokes')).toBeOnTheScreen();
});

it('marks the picked year as selected when the sheet reopens', async () => {
  const concerts = await findScreen('concerts-screen');

  await fireEvent.press(concerts.getByLabelText('Filter by year'));
  await fireEvent.press(await screen.findByRole('button', { name: '2024' }));
  await fireEvent.press(await concerts.findByLabelText('Filtered by 2024'));

  const year2024 = await screen.findByRole('button', { name: '2024' });
  expect(year2024.props.accessibilityState.selected).toBe(true);
  expect(screen.getByRole('button', { name: '2025' }).props.accessibilityState.selected).toBe(
    false,
  );
});
