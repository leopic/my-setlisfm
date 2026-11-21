import { encode } from 'jpeg-js';
import { storeArtistPhotoColor } from '@/services/artistColorService';
import { dbOperations } from '@/database/operations';

jest.mock('@/database/operations', () => ({
  dbOperations: {
    getArtistImageColor: jest.fn(),
    updateArtistImageColor: jest.fn(),
  },
}));

const getColor = dbOperations.getArtistImageColor as jest.Mock;
const updateColor = dbOperations.updateArtistImageColor as jest.Mock;

const PHOTO = 'https://cdn-images.dzcdn.net/images/artist/abc/250x250-000000-80-0-0.jpg';

// A 4×4 JPEG in one color.
function jpeg(r: number, g: number, b: number) {
  const data = new Uint8Array(4 * 4 * 4);
  for (let i = 0; i < 16; i++) data.set([r, g, b, 255], i * 4);
  return new Uint8Array(encode({ data, width: 4, height: 4 }, 100).data);
}

const response = (bytes: Uint8Array, ok = true) => ({
  ok,
  arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
});

function respondWith(bytes: Uint8Array, ok = true) {
  global.fetch = jest.fn().mockResolvedValue(response(bytes, ok));
}

beforeEach(() => {
  jest.clearAllMocks();
  getColor.mockResolvedValue(null);
});

it("stores the main color of the artist's small photo", async () => {
  respondWith(jpeg(200, 40, 40));

  await storeArtistPhotoColor('artist-1', PHOTO);

  expect(global.fetch).toHaveBeenCalledWith(
    'https://cdn-images.dzcdn.net/images/artist/abc/56x56-000000-80-0-0.jpg',
    expect.anything(),
  );
  expect(updateColor).toHaveBeenCalledWith(
    'artist-1',
    PHOTO,
    expect.stringMatching(/^#[0-9a-f]{6}$/),
  );
});

it('stores an empty color for a photo without one, so it is not tried again', async () => {
  respondWith(jpeg(128, 128, 128));

  await storeArtistPhotoColor('artist-2', PHOTO);

  expect(updateColor).toHaveBeenCalledWith('artist-2', PHOTO, '');
});

it('stores an empty color for a photo it cannot read', async () => {
  respondWith(new Uint8Array([1, 2, 3]));

  await storeArtistPhotoColor('artist-3', PHOTO);

  expect(updateColor).toHaveBeenCalledWith('artist-3', PHOTO, '');
});

it.each([
  ['a stored color', '#c83232'],
  ['a stored "no color"', ''],
])('fetches nothing for an artist with %s', async (_case, stored) => {
  getColor.mockResolvedValue(stored);
  respondWith(jpeg(200, 40, 40));

  await storeArtistPhotoColor('artist-4', PHOTO);

  expect(global.fetch).not.toHaveBeenCalled();
  expect(updateColor).not.toHaveBeenCalled();
});

it('stores nothing when the download fails, and tries again on the next call', async () => {
  respondWith(new Uint8Array(), false);

  await storeArtistPhotoColor('artist-5', PHOTO);
  expect(updateColor).not.toHaveBeenCalled();

  respondWith(jpeg(200, 40, 40));
  await storeArtistPhotoColor('artist-5', PHOTO);
  expect(updateColor).toHaveBeenCalledWith('artist-5', PHOTO, expect.stringMatching(/^#/));
});

it('looks an artist up once when many rows ask at the same time', async () => {
  respondWith(jpeg(200, 40, 40));

  await Promise.all([1, 2, 3].map(() => storeArtistPhotoColor('artist-6', PHOTO)));

  expect(global.fetch).toHaveBeenCalledTimes(1);
});
