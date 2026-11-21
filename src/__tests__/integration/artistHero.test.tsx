import { act, fireEvent, waitFor } from 'expo-router/testing-library';
import * as artistImageService from '@/services/artistImageService';
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

async function openArtist(mbid: string) {
  await openTab('(artists)');
  await fireEvent.press((await findScreen('artists-screen')).getByTestId(`artist-${mbid}`));
  return findScreen('artist-concerts-screen');
}

it("shows the artist's photo, large, behind the top of the artist screen", async () => {
  const screen = await openArtist('artist-1');

  const photo = await screen.findByTestId('artist-hero-photo', { includeHiddenElements: true });
  expect(JSON.stringify(photo.props.source)).toContain(
    'https://cdn.example/artist/x/1000x1000-000000-80-0-0.jpg',
  );
  expect(screen.getByTestId('back-pill')).toBeOnTheScreen();
  // The big photo shows who it is: no small one next to the name, as on the setlist.
  expect(screen.getByText('Radiohead')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Radiohead')).not.toBeOnTheScreen();
});

it('keeps the small photo and a plain back link for an artist without a photo', async () => {
  const lookup = jest.spyOn(artistImageService, 'getArtistImageUri');
  const screen = await openArtist('artist-3');

  // Wait for the photo lookup to end, so a photo that would come late is on the screen.
  await waitFor(() => expect(lookup).toHaveBeenCalledWith('artist-3'));
  await act(async () => {
    await Promise.all(lookup.mock.results.map((result) => result.value));
  });
  expect(screen.getByLabelText('Daft Punk')).toBeOnTheScreen();
  expect(screen.queryByTestId('back-pill')).not.toBeOnTheScreen();
  expect(screen.queryByTestId('artist-hero', { includeHiddenElements: true })).toBeNull();
});
