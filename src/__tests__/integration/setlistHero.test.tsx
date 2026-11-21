import { fireEvent } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp, openTab } from '../../../test/screen';

const PHOTO = 'https://cdn.example/artist/x/250x250-000000-80-0-0.jpg';

beforeAll(async () => {
  await seedDatabase();
  // Radiohead have a photo, Daft Punk have none. The photo source is current, so the launch
  // keeps these instead of fetching them again.
  getTestDatabase().exec(`
    INSERT OR REPLACE INTO metadata (key, value) VALUES ('imageSource', 'deezer-v1');
    UPDATE artists SET imageUrl = '', imageColor = '';
    UPDATE artists SET imageUrl = '${PHOTO}' WHERE mbid = 'artist-1';
  `);
});

beforeEach(async () => {
  global.fetch = jest.fn(async () => ({ ok: false })) as unknown as typeof fetch;
  await launchApp();
});

async function openSetlist(id: string) {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  await fireEvent.press(concerts.getByTestId(`concert-${id}`));
  return findScreen('setlist-screen');
}

it("shows the artist's photo, large, behind the top of the setlist", async () => {
  const screen = await openSetlist('set-1');

  const photo = await screen.findByTestId('artist-hero-photo', { includeHiddenElements: true });
  expect(JSON.stringify(photo.props.source)).toContain(
    'https://cdn.example/artist/x/1000x1000-000000-80-0-0.jpg',
  );
  // Decoration: VoiceOver skips it.
  expect(screen.queryByTestId('artist-hero')).not.toBeOnTheScreen();
});

it('shows no photo for an artist without one', async () => {
  const screen = await openSetlist('set-3');

  expect(await screen.findByText('Daft Punk')).toBeOnTheScreen();
  expect(screen.queryByTestId('artist-hero', { includeHiddenElements: true })).toBeNull();
});
