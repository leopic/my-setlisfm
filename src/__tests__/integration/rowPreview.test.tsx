import { fireEvent, screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, goBackFrom, inLinkPreview, launchApp, openTab } from '../../../test/screen';
import { Space } from '@/utils/spacing';

// On a phone a concert row opens its setlist through a Link with Link.Preview, so a long
// press peeks at the setlist. test/integration.setup.ts stands in a host element for the
// native preview view.
beforeAll(seedDatabase);

beforeEach(async () => {
  await launchApp();
  await openTab('(concerts)');
});

it.each([
  ['timeline', null],
  ['By Name', 'By Name'],
])('peeks at the setlist from a %s row and opens it once', async (_list, sort) => {
  if (sort) await fireEvent.press((await findScreen('concerts-screen')).getByLabelText(sort));
  const row = (await findScreen('concerts-screen')).getByTestId('concert-set-8');
  expect(inLinkPreview(row)).toBe(true);
  // The Link keeps the row's own style (its padding) and its pressed look.
  expect(row).toHaveStyle({ paddingVertical: Space.s12, opacity: 1 });
  await fireEvent(row, 'pressIn');
  expect(row).toHaveStyle({ opacity: 0.7 });
  await fireEvent(row, 'pressOut');

  await fireEvent.press(row);
  expect((await findScreen('setlist-screen')).getByText('The Strokes')).toBeOnTheScreen();

  // One back reaches the list: the Link and the row did not both push the setlist.
  await goBackFrom('setlist-screen');
  expect(screen).toHaveSegments(['(tabs)', '(concerts)']);
});
