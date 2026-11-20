import { fireEvent } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, layOutLists, openTab } from '../../../test/screen';

// The detail panes only render on a wide layout (iPad, split view).
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: true, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

beforeEach(launchApp);

it("lists an artist's concerts in the pane, older year group included", async () => {
  await openTab('(artists)');
  const artists = await findScreen('artists-screen');
  await fireEvent.press(artists.getByTestId('artist-artist-1'));
  await layOutLists();

  // Radiohead: set-5 in 2025, set-1 in 2024 (the older group, further down the list).
  expect(await artists.findByText('2025')).toBeOnTheScreen();
  expect(await artists.findByText('2024')).toBeOnTheScreen();
  expect(await artists.findByText('In Rainbows Tour')).toBeOnTheScreen();
  expect(artists.getByText('Madison Square Garden')).toBeOnTheScreen();
  // VoiceOver reads a row's date, venue, place and tour, not its "›" arrow.
  expect(
    artists.getByRole('button', {
      name: 'Mar 15, 2024, Madison Square Garden, New York, United States, In Rainbows Tour',
    }),
  ).toBeOnTheScreen();
  expect(artists.queryAllByRole('button', { name: /›/ })).toHaveLength(0);
  expect(artists.getAllByText(/^20\d\d$/).map((node) => node.props.children)).toEqual([
    '2025',
    '2024',
  ]);
});

it("lists a venue's concerts in the pane, older year group included", async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  await fireEvent.press(venues.getByTestId('venue-venue-2'));
  await layOutLists();

  // Columbiahalle: set-5 and set-6 in 2025, set-2 in 2024 (the older group).
  expect(await venues.findByText('2025')).toBeOnTheScreen();
  expect(await venues.findByText('2024')).toBeOnTheScreen();
  expect(await venues.findByText('The New Abnormal Tour')).toBeOnTheScreen();
  // Every concert, not just one per year, and the years newest first.
  expect(venues.getByText('Radiohead')).toBeOnTheScreen();
  expect(venues.getByText('Kraftwerk')).toBeOnTheScreen();
  expect(venues.getByText('The Strokes')).toBeOnTheScreen();
  expect(venues.queryAllByRole('button', { name: /›/ })).toHaveLength(0);
  // Berlin is a city and a state; the name is said once.
  expect(venues.getAllByText('Berlin, Germany').length).toBeGreaterThan(0);
  expect(venues.queryByText('Berlin, Berlin, Germany')).not.toBeOnTheScreen();
  expect(venues.getAllByText(/^20\d\d$/).map((node) => node.props.children)).toEqual([
    '2025',
    '2024',
  ]);
});
