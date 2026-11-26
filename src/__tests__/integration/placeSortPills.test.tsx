import { fireEvent } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, openTab, pressHeaderMenuItem } from '../../../test/screen';

beforeAll(seedDatabase);
beforeEach(launchApp);

// VoiceOver reads each sort pill as a button with its name, and says which one is on.
it.each([
  ['Continents', 'continents-screen', 'Most Recent', 'Top'],
  ['Countries', 'countries-screen', 'By Name', 'Top'],
  ['Cities', 'cities-screen', 'By Name', 'Top'],
] as const)(
  'names the %s sort pills and marks the one that is on',
  async (place, testID, on, off) => {
    await openTab('(venues)');
    await findScreen('venues-screen');
    await pressHeaderMenuItem('Browse by place', place);
    const list = await findScreen(testID);

    expect(list.getByRole('button', { name: on })).toBeSelected();
    expect(list.getByRole('button', { name: off })).not.toBeSelected();

    await fireEvent.press(list.getByRole('button', { name: off }));

    expect(list.getByRole('button', { name: off })).toBeSelected();
    expect(list.getByRole('button', { name: on })).not.toBeSelected();
  },
);
