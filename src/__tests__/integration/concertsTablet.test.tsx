import { StyleSheet } from 'react-native';
import { fireEvent } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, inLinkPreview, launchApp, openTab } from '../../../test/screen';

// The detail pane only renders on a wide layout (iPad, split view).
jest.mock('@/utils/tablet', () => ({
  useTabletLayout: () => ({ isTablet: true, sidebarWidth: 360 }),
}));

beforeAll(seedDatabase);

beforeEach(async () => {
  await launchApp();
  await openTab('(concerts)');
});

it('shows the pressed concert in the detail pane instead of navigating', async () => {
  const concerts = await findScreen('concerts-screen');
  expect(concerts.queryByText('15 Step')).not.toBeOnTheScreen();

  await fireEvent.press(concerts.getByTestId('concert-set-1'));

  // set-1 is Radiohead's show: its main set opens with "15 Step".
  expect(await concerts.findByText('15 Step')).toBeOnTheScreen();
});

it('gives a row no Link preview: the pane already shows the setlist', async () => {
  const concerts = await findScreen('concerts-screen');
  expect(inLinkPreview(concerts.getByTestId('concert-set-1'))).toBe(false);
});

const rowBackground = (row: { props: { style?: unknown } }) =>
  StyleSheet.flatten(row.props.style as never)?.backgroundColor;

// LegendList redraws a row only when its data changes or it moves, so each test changes
// the list (search text, sort) after the tap before it reads the row style.
it('highlights the pressed concert in the timeline', async () => {
  const concerts = await findScreen('concerts-screen');
  await fireEvent.press(concerts.getByTestId('concert-set-1'));
  expect(await concerts.findByText('15 Step')).toBeOnTheScreen();

  // Both Radiohead shows (set-1, set-5) stay; the year groups they sit in get new data.
  await fireEvent.changeText(
    concerts.getByPlaceholderText('Search by artist, venue, city...'),
    'radiohead',
  );
  const list = await findScreen('concerts-screen');

  const selected = rowBackground(list.getByTestId('concert-set-1'));
  const other = rowBackground(list.getByTestId('concert-set-5'));
  expect(selected).toBeDefined();
  expect(other).toBeUndefined();
});

it('highlights the pressed concert in the By Name list', async () => {
  const concerts = await findScreen('concerts-screen');
  await fireEvent.press(concerts.getByLabelText('By Name'));
  await fireEvent.press((await findScreen('concerts-screen')).getByTestId('concert-set-8'));
  expect(await concerts.findByText('Hard to Explain')).toBeOnTheScreen();

  await fireEvent.changeText(
    concerts.getByPlaceholderText('Search by artist, venue, city...'),
    'the',
  );
  const list = await findScreen('concerts-screen');

  const selected = rowBackground(list.getByTestId('concert-set-8'));
  expect(selected).toBeDefined();
  expect(list.queryAllByTestId(/^concert-set-\d+$/).length).toBeGreaterThan(1);
  for (const row of list.queryAllByTestId(/^concert-set-\d+$/)) {
    if (row.props.testID !== 'concert-set-8') expect(rowBackground(row)).toBeUndefined();
  }
});
