import { waitFor } from 'expo-router/testing-library';
import { encode } from 'jpeg-js';
import { seedDatabase } from '../../../test/database';
import { getTestDatabase } from '../../../test/expoSqliteNode';
import { findScreen, launchApp, openTab } from '../../../test/screen';

beforeAll(seedDatabase);

// A 4×4 red JPEG, as Deezer's 56×56 photo.
function redJpeg() {
  const data = new Uint8Array(4 * 4 * 4);
  for (let i = 0; i < 16; i++) data.set([200, 40, 40, 255], i * 4);
  return new Uint8Array(encode({ data, width: 4, height: 4 }, 100).data);
}

// Deezer: the artist search finds a photo, and the photo itself is red.
beforeEach(() => {
  const photo = redJpeg();
  global.fetch = jest.fn(async (url: string) =>
    url.includes('/search/artist')
      ? {
          ok: true,
          json: async () => ({
            data: [{ picture_medium: 'https://cdn.example/artist/x/250x250-000000-80-0-0.jpg' }],
          }),
        }
      : { ok: true, arrayBuffer: async () => photo.buffer.slice(0) },
  ) as unknown as typeof fetch;
});

it("stores each artist's photo color once the artist list shows their photos", async () => {
  await launchApp();
  await openTab('(artists)');
  await findScreen('artists-screen');

  await waitFor(() => {
    const rows = getTestDatabase()
      .prepare(`SELECT imageColor FROM artists WHERE imageUrl <> ''`)
      .all() as { imageColor: string | null }[];
    expect(rows.length).toBeGreaterThan(0);
    for (const { imageColor } of rows) expect(imageColor).toMatch(/^#[0-9a-f]{6}$/);
  });
  expect(global.fetch).toHaveBeenCalledWith(
    'https://cdn.example/artist/x/56x56-000000-80-0-0.jpg',
    expect.anything(),
  );
});
