import { fireEvent, renderHook, screen } from 'expo-router/testing-library';
import { useConcertMenu } from '@/components/concerts/useConcertMenu';
import { seedDatabase } from '../../../test/database';
import { findScreen, launchApp, layOutLists, openTab, rowMenuActions } from '../../../test/screen';

beforeAll(seedDatabase);
beforeEach(launchApp);

// A long press on a concert peeks at its setlist; the menu under the peek opens the
// concert's artist or venue. Seed: set-1 is Radiohead at Madison Square Garden.
it('offers the artist and the venue under a concert row', async () => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  const actions = rowMenuActions(concerts.getByTestId('concert-set-1'));
  expect(actions.map(({ title, icon }) => [title, icon])).toEqual([
    ['Open artist', 'music.mic'],
    ['Open venue', 'mappin.and.ellipse'],
  ]);
});

// "By Name" lists the concerts flat, through another row component.
it('offers them in the list sorted by name too', async () => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  await fireEvent.press(concerts.getByText('By Name'));
  await layOutLists();
  const actions = rowMenuActions(concerts.getByTestId('concert-set-1'));
  expect(actions.map(({ title }) => title)).toEqual(['Open artist', 'Open venue']);
});

it.each([
  ['Open artist', 'artist-concerts-screen', 'Radiohead'],
  ['Open venue', 'venue-concerts-screen', 'Madison Square Garden'],
])('"%s" opens its screen', async (title, screenId, name) => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  const action = rowMenuActions(concerts.getByTestId('concert-set-1')).find(
    (entry) => entry.title === title,
  );
  await action?.press();
  const opened = await findScreen(screenId);
  expect(opened.getAllByText(name).length).toBeGreaterThan(0);
  expect(screen).toHaveSegments(
    screenId === 'artist-concerts-screen'
      ? ['(tabs)', '(artists)', 'concerts']
      : ['(tabs)', '(venues)', 'concerts'],
  );
});

// A concert can miss its artist or venue id; offer only what can open.
it.each([
  [{ artistMbid: undefined, venueId: 'venue-1' }, ['Open venue']],
  [{ artistMbid: 'artist-1', venueId: undefined }, ['Open artist']],
  [{ artistMbid: undefined, venueId: undefined }, []],
])('offers only what a concert has (%o)', async (concert, titles) => {
  const { result } = await renderHook(() => useConcertMenu());
  expect(result.current(concert).map(({ label }) => label)).toEqual(titles);
});
