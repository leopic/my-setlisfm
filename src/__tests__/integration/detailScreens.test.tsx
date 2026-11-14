import { router } from 'expo-router';
import { act, fireEvent, screen } from 'expo-router/testing-library';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp, openTab } from '../../../test/screen';

beforeAll(async () => {
  await seedDatabase();
  // What a sync adds that the seed lacks: a tape intro, a guest, a song heard at two
  // Radiohead concerts, and a last-edit stamp.
  getTestDatabase().exec(`
    UPDATE songs SET tape = 1 WHERE setId = 1 AND name = '15 Step';
    UPDATE songs SET withArtistMbid = 'artist-2' WHERE setId = 1 AND name = 'Nude';
    INSERT INTO songs (setId, name, songOrder) VALUES (6, 'Bodysnatchers', 3);
    UPDATE setlists SET lastUpdated = '2024-03-20T10:00:00.000+0000' WHERE id = 'set-1';
  `);
});

beforeEach(launchApp);

it('shows the tape, guests, month strip and repeat songs on a setlist', async () => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  await fireEvent.press(concerts.getByTestId('concert-set-1'));

  const setlist = await findScreen('setlist-screen');
  expect(setlist.getByText('Tape')).toBeOnTheScreen();
  expect(setlist.getByText('With The Strokes')).toBeOnTheScreen();
  // 15 March: 14 days before, 16 after.
  expect(setlist.getByText(`${'·'.repeat(14)}●${'·'.repeat(16)}`)).toBeOnTheScreen();
  expect(await setlist.findByText('heard 2×')).toBeOnTheScreen();
});

it('shows where an artist is filed and when a setlist was edited', async () => {
  await openTab('(artists)');
  const artists = await findScreen('artists-screen');
  await fireEvent.press(artists.getByTestId('artist-artist-2'));

  const artistConcerts = await findScreen('artist-concerts-screen');
  expect(artistConcerts.getByText('Filed under S')).toBeOnTheScreen();

  await act(async () =>
    router.navigate({ pathname: '/(artists)/concerts', params: { artist: 'artist-1' } }),
  );
  expect(await screen.findByText('Setlist edited Mar 2024')).toBeOnTheScreen();
});

it('shows the venue initials and its setlist.fm page', async () => {
  await openTab('(venues)');
  const venues = await findScreen('venues-screen');
  await fireEvent.press(venues.getByTestId('venue-venue-1'));

  const venue = await findScreen('venue-concerts-screen');
  expect(venue.getByText('MSG')).toBeOnTheScreen();
  expect(venue.getByText('setlist.fm/venue/madison-square-garden.html')).toBeOnTheScreen();
});

it('shows city coordinates and the country flag', async () => {
  await act(async () =>
    router.navigate({
      pathname: '/(venues)/city-detail',
      params: { city: 'New York', country: 'United States' },
    }),
  );
  expect(await screen.findByText('40.71°N, 74.01°W')).toBeOnTheScreen();

  await act(async () =>
    router.navigate({ pathname: '/(venues)/country-detail', params: { country: 'Germany' } }),
  );
  expect(await screen.findByText('🇩🇪 Germany')).toBeOnTheScreen();
});
