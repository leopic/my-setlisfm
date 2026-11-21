import { fireEvent, screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, goBackFrom, inLinkPreview, launchApp, openTab } from '../../../test/screen';
import { Space } from '@/utils/spacing';
import { formatDate } from '@/utils/date';

// On a phone a concert row (Concerts tab, an artist's concerts, the dashboard timeline) opens
// its setlist through a Link with Link.Preview, so a long press peeks at the setlist. test/integration.setup.ts stands in a host element for the
// native preview view.
beforeAll(seedDatabase);

beforeEach(launchApp);

it.each([
  ['timeline', null],
  ['By Name', 'By Name'],
])('peeks at the setlist from a %s row and opens it once', async (_list, sort) => {
  await openTab('(concerts)');
  if (sort) await fireEvent.press((await findScreen('concerts-screen')).getByLabelText(sort));
  const row = (await findScreen('concerts-screen')).getByTestId('concert-set-8');
  expect(inLinkPreview(row)).toBe(true);
  // The Link keeps the row's own style (its padding) and its pressed look.
  expect(row).toHaveStyle({ paddingVertical: Space.s12, opacity: 1 });
  await fireEvent(row, 'pressIn');
  expect(row).toHaveStyle({ opacity: 0.7 });
  await fireEvent(row, 'pressOut');
  expect(row).toHaveStyle({ opacity: 1 });
  // VoiceOver reads it as a button, like every row that opens a screen, not as a link.
  expect(row.props.role).toBe('button');

  await fireEvent.press(row);
  expect((await findScreen('setlist-screen')).getByText('The Strokes')).toBeOnTheScreen();

  // One back reaches the list: the Link and the row did not both push the setlist.
  await goBackFrom('setlist-screen');
  expect(screen).toHaveSegments(['(tabs)', '(concerts)']);
});

it("peeks at the setlist from a row in an artist's concerts and opens it once", async () => {
  await openTab('(artists)');
  await fireEvent.press((await findScreen('artists-screen')).getByTestId('artist-artist-2'));
  const row = (await findScreen('artist-concerts-screen')).getByTestId('artist-concert-set-8');
  expect(inLinkPreview(row)).toBe(true);
  expect(row.props.role).toBe('button');

  await fireEvent.press(row);
  expect((await findScreen('setlist-screen')).getByText('Someday')).toBeOnTheScreen();

  // Two backs reach the artists list: one setlist and one artist screen were pushed.
  await goBackFrom('setlist-screen');
  await goBackFrom('artist-concerts-screen');
  expect(screen).toHaveSegments(['(tabs)', '(artists)']);
});

it('peeks at the setlist from a dashboard timeline row and opens it once', async () => {
  // The app opens on the dashboard.
  const row = await screen.findByLabelText(`Most recent, The Strokes, ${formatDate('10-05-2025')}`);
  expect(inLinkPreview(row)).toBe(true);
  expect(row.props.role).toBe('button');

  await fireEvent.press(row);
  expect((await findScreen('setlist-screen')).getByText('The Strokes')).toBeOnTheScreen();

  await goBackFrom('setlist-screen');
  expect(screen).toHaveSegments(['(tabs)', '(home)']);
});
