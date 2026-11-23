import { screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, rowMenuActions } from '../../../test/screen';

beforeAll(seedDatabase);
beforeEach(launchApp);

// The dashboard's concert rows have the long-press menu too, which needs each concert's
// artist and venue id from the dashboard queries. Seed: the most recent show is The Strokes at
// Madison Square Garden (set-8); the first is Radiohead there (set-1).
const menuOf = async (label: RegExp) => rowMenuActions(await screen.findByLabelText(label));

it.each([
  [/^Most recent, The Strokes/, 'Open venue', 'venue-concerts-screen', 'Madison Square Garden'],
  [/^Most recent, The Strokes/, 'Open artist', 'artist-concerts-screen', 'The Strokes'],
  [/^First concert, Radiohead/, 'Open artist', 'artist-concerts-screen', 'Radiohead'],
])('%s: "%s" opens its screen', async (row, title, screenId, name) => {
  const actions = await menuOf(row);
  expect(actions.map((action) => action.title)).toEqual(['Open artist', 'Open venue']);
  await actions.find((action) => action.title === title)?.press();
  const opened = await findScreen(screenId);
  expect(opened.getAllByText(name).length).toBeGreaterThan(0);
});
