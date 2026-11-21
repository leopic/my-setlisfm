import { getArtistImageUri } from '@/services/artistImageService';
import { dbOperations } from '@/database/operations';

jest.mock('@/database/operations', () => ({
  dbOperations: {
    getArtistByMbid: jest.fn(),
    updateArtistImageUrl: jest.fn(),
  },
}));

const PHOTO = 'https://cdn-images.dzcdn.net/images/artist/abc/250x250-000000-80-0-0.jpg';

beforeEach(() => {
  jest.clearAllMocks();
  // Not looked up yet.
  (dbOperations.getArtistByMbid as jest.Mock).mockResolvedValue({ mbid: 'a', name: 'Lagwagon' });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: [{ name: 'Lagwagon', picture_medium: PHOTO }] }),
  });
});

it('searches Deezer once when many rows ask for the same artist at once', async () => {
  const urls = await Promise.all([1, 2, 3].map(() => getArtistImageUri('a')));

  expect(urls).toEqual([PHOTO, PHOTO, PHOTO]);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(dbOperations.updateArtistImageUrl).toHaveBeenCalledTimes(1);
});

it('searches again on a later call', async () => {
  await getArtistImageUri('a');
  await getArtistImageUri('a');

  expect(global.fetch).toHaveBeenCalledTimes(2);
});
