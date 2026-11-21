import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { act, fireEvent, waitFor, within } from 'expo-router/testing-library';
import { encode } from 'jpeg-js';
import { artistTint } from '@/utils/artistTint';
import { chronicleLight } from '@/utils/colors';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp, openTab } from '../../../test/screen';

const PHOTO = 'https://cdn.example/artist/x/250x250-000000-80-0-0.jpg';
const WINE = '#942130';

// A 4×4 red JPEG, as Deezer's 56×56 photo.
function redJpeg() {
  const data = new Uint8Array(4 * 4 * 4);
  for (let i = 0; i < 16; i++) data.set([200, 40, 40, 255], i * 4);
  return new Uint8Array(encode({ data, width: 4, height: 4 }, 100).data);
}

beforeAll(async () => {
  await seedDatabase();
  // Radiohead's photo color is known, The Strokes' photo has none, Daft Punk's is not found yet.
  // The photo source is current, so the launch keeps these photos instead of fetching them again.
  getTestDatabase().exec(`
    INSERT OR REPLACE INTO metadata (key, value) VALUES ('imageSource', 'deezer-v1');
    UPDATE artists SET imageUrl = '';
    UPDATE artists SET imageUrl = '${PHOTO}', imageColor = '${WINE}' WHERE mbid = 'artist-1';
    UPDATE artists SET imageUrl = '${PHOTO}', imageColor = '' WHERE mbid = 'artist-2';
    UPDATE artists SET imageUrl = '${PHOTO}', imageColor = NULL WHERE mbid = 'artist-3';
  `);
});

beforeEach(async () => {
  const photo = redJpeg();
  global.fetch = jest.fn(async () => ({
    ok: true,
    arrayBuffer: async () => photo.buffer.slice(0),
  })) as unknown as typeof fetch;
  await launchApp();
});

// Tests run with the light color scheme.
const theme = () => chronicleLight;

type Queries = Awaited<ReturnType<typeof findScreen>>;
const backColor = (screen: Queries) =>
  StyleSheet.flatten(within(screen.getByTestId('back-button')).getByText('← Back').props.style)
    .color;

async function openArtist(mbid: string) {
  await openTab('(artists)');
  const artists = await findScreen('artists-screen');
  await fireEvent.press(artists.getByTestId(`artist-${mbid}`));
  return findScreen('artist-concerts-screen');
}

it("tints the artist screen with the artist's photo color", async () => {
  const accent = artistTint(WINE, theme()).accent;
  expect(accent).not.toBe(theme().accent);

  const screen = await openArtist('artist-1');

  expect(await screen.findByTestId('artist-glow')).toBeOnTheScreen();
  expect(backColor(screen)).toBe(accent);
  const date = StyleSheet.flatten(screen.getByText('Mar 15, 2024').props.style);
  expect(date.color).toBe(accent);
});

it('tints the setlist screen too', async () => {
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  await fireEvent.press(concerts.getByTestId('concert-set-1'));
  const screen = await findScreen('setlist-screen');

  expect(await screen.findByTestId('artist-glow')).toBeOnTheScreen();
  expect(backColor(screen)).toBe(artistTint(WINE, theme()).accent);
  const tour = StyleSheet.flatten(screen.getByText('In Rainbows Tour').props.style);
  expect(tour.color).toBe(artistTint(WINE, theme()).accent);
  // The color is the only trace of the photo: the header shows the name without it.
  expect(screen.getByText('Radiohead')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Radiohead')).not.toBeOnTheScreen();
});

// Arctic Monkeys have no photo, so no color is ever stored for them.
it("drops one artist's color on the next artist's screen", async () => {
  const screen = await openArtist('artist-1');
  expect(await screen.findByTestId('artist-glow')).toBeOnTheScreen();

  await act(async () =>
    router.navigate({ pathname: '/(artists)/concerts', params: { artist: 'artist-4' } }),
  );

  const next = await findScreen('artist-concerts-screen');
  expect(await next.findByText('Filed under A')).toBeOnTheScreen();
  expect(next.queryByTestId('artist-glow')).not.toBeOnTheScreen();
  expect(backColor(next)).toBe(theme().accent);
});

// The setlist header shows no photo, so the screen itself must ask for the color.
it('finds the color for a setlist opened before any photo asked for it', async () => {
  getTestDatabase().exec(
    `UPDATE artists SET imageUrl = '${PHOTO}', imageColor = NULL WHERE mbid = 'artist-5'`,
  );
  await openTab('(concerts)');
  const concerts = await findScreen('concerts-screen');
  await fireEvent.press(concerts.getByTestId('concert-set-6'));
  const screen = await findScreen('setlist-screen');

  await waitFor(() => expect(screen.getByTestId('artist-glow')).toBeOnTheScreen());
});

it('keeps the theme colors for a photo without a clear color', async () => {
  const screen = await openArtist('artist-2');

  expect(backColor(screen)).toBe(theme().accent);
  expect(screen.queryByTestId('artist-glow')).not.toBeOnTheScreen();
});

it('tints the screen once the photo color is found while it is open', async () => {
  // Earlier tests showed Daft Punk in the artist list, which found the color: forget it, and
  // hold the photo download until the screen is open.
  getTestDatabase().exec(`UPDATE artists SET imageColor = NULL WHERE mbid = 'artist-3'`);
  let releasePhoto = () => {};
  const held = new Promise<void>((resolve) => {
    releasePhoto = resolve;
  });
  const photo = redJpeg();
  global.fetch = jest.fn(async () => {
    await held;
    return { ok: true, arrayBuffer: async () => photo.buffer.slice(0) };
  }) as unknown as typeof fetch;

  const screen = await openArtist('artist-3');
  expect(screen.queryByTestId('artist-glow')).not.toBeOnTheScreen();

  await act(async () => releasePhoto());
  await waitFor(() => expect(screen.getByTestId('artist-glow')).toBeOnTheScreen());
  expect(backColor(screen)).not.toBe(theme().accent);
});
