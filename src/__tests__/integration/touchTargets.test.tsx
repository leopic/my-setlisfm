import { StyleSheet, type ViewStyle } from 'react-native';
import { act, fireEvent, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, openTab } from '../../../test/screen';

beforeAll(seedDatabase);

beforeEach(launchApp);

type Element = ReturnType<typeof screen.getByText>;

// Apple's Human Interface Guidelines: 44 × 44 pt. Not TOUCH_TARGET, so a smaller constant fails.
const MIN = 44;

// Jest has no layout, so check the size each control asks for. `agent-device audit` checks
// the real frames on a simulator.
const expectTouchTarget = (node: Element) => {
  const style = StyleSheet.flatten(node.props.style as ViewStyle) ?? {};
  const height = Math.max(Number(style.height ?? 0), Number(style.minHeight ?? 0));
  expect(height).toBeGreaterThanOrEqual(MIN);
  if (style.width !== undefined) expect(Number(style.width)).toBeGreaterThanOrEqual(MIN);
};

it('gives the dashboard icons 44 pt targets', async () => {
  const dashboard = await findScreen('dashboard-screen');
  expectTouchTarget(dashboard.getByLabelText('Sync concert data'));
  expectTouchTarget(dashboard.getByLabelText('Open settings'));
});

it('gives the concerts search, year filter and sort pills 44 pt targets', async () => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  expectTouchTarget(concerts.getByPlaceholderText('Search by artist, venue, city...'));
  for (const label of ['Filter by year', 'Most Recent', 'By Name']) {
    expectTouchTarget(concerts.getByLabelText(label));
  }
});

it('gives the artists search and sort pills 44 pt targets', async () => {
  await openTab('(artists)');
  const artists = await findScreen('artists-screen');
  expectTouchTarget(artists.getByPlaceholderText('Search artists...'));
  for (const label of ['Most Recent', 'Top', 'By Name']) {
    expectTouchTarget(artists.getByLabelText(label));
  }
});

it('gives the venues geo buttons, search and sort pills 44 pt targets', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  for (const name of ['2 continents', '3 countries', '3 cities', 'Most Recent', 'Top', 'By Name']) {
    expectTouchTarget(venues.getByRole('button', { name }));
  }
  expectTouchTarget(venues.getByPlaceholderText('Search venues, cities, countries...'));
});

it('gives back buttons and the venue link 44 pt targets', async () => {
  await openTab('(venues)');
  await fireEvent.press((await findScreen('venues-screen')).getByTestId('venue-venue-1'));
  const venue = await findScreen('venue-concerts-screen');
  expectTouchTarget(venue.getByTestId('back-button'));
  expectTouchTarget(venue.getByTestId('venue-setlistfm-link'));

  await act(async () =>
    router.navigate({ pathname: '/(artists)/concerts', params: { artist: 'artist-1' } }),
  );
  expectTouchTarget((await findScreen('artist-concerts-screen')).getByTestId('back-button'));
});

it('gives the settings back button and "Change" 44 pt targets', async () => {
  await fireEvent.press(await screen.findByLabelText('Open settings'));
  expectTouchTarget(await screen.findByTestId('back-button'));
  expectTouchTarget(screen.getByText('Change').parent as Element);
});

it('gives the username edit field, Save and Cancel 44 pt targets', async () => {
  await fireEvent.press(await screen.findByLabelText('Open settings'));
  await fireEvent.press(await screen.findByText('Change'));
  expectTouchTarget(await screen.findByDisplayValue('e2e-seed'));
  expectTouchTarget(screen.getByRole('button', { name: 'Save' }));
  expectTouchTarget(screen.getByLabelText('Cancel'));
});

it('gives the clear-search button a 44 pt target', async () => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  await fireEvent.changeText(
    concerts.getByPlaceholderText('Search by artist, venue, city...'),
    'x',
  );
  expectTouchTarget(await concerts.findByLabelText('Clear search'));
});

it('gives the recognition badge on a setlist a 44 pt target', async () => {
  await openTab('(concerts)');
  await fireEvent.press((await findScreen('concerts-screen')).getByTestId('concert-set-1'));
  const setlist = await findScreen('setlist-screen');
  expectTouchTarget(setlist.getByTestId('back-button'));
  expectTouchTarget(await setlist.findByTestId('recognition-badge'));
});
