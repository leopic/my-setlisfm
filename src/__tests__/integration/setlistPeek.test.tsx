import { fireEvent } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, openTab } from '../../../test/screen';

// A long-press peek renders the setlist route inside expo-router's preview, where
// useIsPreview() is true. The native preview never renders under Jest, so flip the hook.
let mockIsPreview = false;
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useIsPreview: () => mockIsPreview,
}));

beforeAll(seedDatabase);

beforeEach(async () => {
  await launchApp();
  await openTab('(concerts)');
});

const openSetlist = async () => {
  await fireEvent.press((await findScreen('concerts-screen')).getByTestId('concert-set-8'));
  return findScreen('setlist-screen');
};

it('shows the back link on an opened setlist', async () => {
  mockIsPreview = false;
  const setlist = await openSetlist();
  expect(setlist.getByTestId('back-button')).toBeOnTheScreen();
});

it('shows no back link in a peek, only the artist', async () => {
  mockIsPreview = true;
  const setlist = await openSetlist();
  expect(setlist.queryByTestId('back-button')).not.toBeOnTheScreen();
  expect(setlist.getByText('The Strokes')).toBeOnTheScreen();
});
