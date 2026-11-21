import { deezerPhotoUrl } from '@/utils/deezerPhoto';

it('asks Deezer for the same photo at another size', () => {
  expect(
    deezerPhotoUrl(
      'https://cdn-images.dzcdn.net/images/artist/6048ed89/250x250-000000-80-0-0.jpg',
      1000,
    ),
  ).toBe('https://cdn-images.dzcdn.net/images/artist/6048ed89/1000x1000-000000-80-0-0.jpg');
});
