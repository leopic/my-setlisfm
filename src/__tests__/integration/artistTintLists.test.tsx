import { StyleSheet } from 'react-native';
import { screen, waitFor, within } from 'expo-router/testing-library';
import { artistTint } from '@/utils/artistTint';
import { chronicleLight } from '@/utils/colors';
import { formatDate } from '@/utils/date';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp, openTab } from '../../../test/screen';

const PHOTO = 'https://cdn.example/artist/x/250x250-000000-80-0-0.jpg';
const WINE = '#942130';
const TEAL = '#0f4458';
// Tests run with the light color scheme.
const tinted = (color: string) => artistTint(color, chronicleLight).accent;

// A Radiohead show on this day two years ago, so the dashboard shows "On this day". A seed show
// on the same day of the year would compete with it, so the setup removes any.
const today = new Date();
const dayAndMonth = [
  String(today.getDate()).padStart(2, '0'),
  String(today.getMonth() + 1).padStart(2, '0'),
].join('-');
const twoYearsAgo = `${dayAndMonth}-${today.getFullYear() - 2}`;

beforeAll(async () => {
  await seedDatabase();
  // Radiohead and The Strokes have a photo color, nobody else has one. The photo source is
  // current, so the launch keeps these instead of fetching them again.
  getTestDatabase().exec(`
    INSERT OR REPLACE INTO metadata (key, value) VALUES ('imageSource', 'deezer-v1');
    UPDATE artists SET imageUrl = '', imageColor = '';
    UPDATE artists SET imageUrl = '${PHOTO}', imageColor = '${WINE}' WHERE mbid = 'artist-1';
    UPDATE artists SET imageUrl = '${PHOTO}', imageColor = '${TEAL}' WHERE mbid = 'artist-2';
    DELETE FROM setlists WHERE eventDate LIKE '${dayAndMonth}-%';
    INSERT INTO setlists (id, artistMbid, venueId, eventDate, url)
    VALUES ('set-otd', 'artist-1', 'venue-1', '${twoYearsAgo}', 'https://www.setlist.fm/setlist/otd.html');
  `);
});

beforeEach(async () => {
  global.fetch = jest.fn(async () => ({ ok: false })) as unknown as typeof fetch;
  await launchApp();
});

const color = (node: ReturnType<typeof screen.getByText>) =>
  StyleSheet.flatten(node.props.style).color;

it("colors the On this day card with the artist's photo color", async () => {
  const card = await screen.findByLabelText('On this day 2 years ago: Radiohead');

  await waitFor(() => expect(color(within(card).getByText(/^ON THIS DAY/))).toBe(tinted(WINE)));
  expect(StyleSheet.flatten(card.props.style).borderColor).toBe(tinted(WINE));
});

it("colors a timeline date with the artist's photo color", async () => {
  const entry = await screen.findByLabelText(
    `Most recent, The Strokes, ${formatDate('10-05-2025')}`,
  );

  await waitFor(() =>
    expect(color(within(entry).getByText(formatDate('10-05-2025')))).toBe(tinted(TEAL)),
  );
});

it('rings the photo of an artist with a photo color in the artist list', async () => {
  await openTab('(artists)');
  const artists = await findScreen('artists-screen');

  const radiohead = artists.getByTestId('artist-artist-1');
  await waitFor(() => expect(within(radiohead).getByTestId('artist-ring')).toBeOnTheScreen());
  expect(
    StyleSheet.flatten(within(radiohead).getByTestId('artist-ring').props.style).borderColor,
  ).toBe(tinted(WINE));
  expect(within(artists.getByTestId('artist-artist-3')).queryByTestId('artist-ring')).toBeNull();
});
