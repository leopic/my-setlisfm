import { dbOperations } from '@/database/operations';

const FETCH_TIMEOUT_MS = 5000;
const BATCH_SIZE = 8;
const IMAGE_SOURCE_VERSION = 'deezer-v1';

/**
 * Fetches an artist thumbnail from the Deezer search API using the artist name.
 * Returns null if no match is found or the artist has no photo on Deezer.
 */
async function fetchImageUrlFromDeezer(artistName: string): Promise<string | null> {
  const query = encodeURIComponent(artistName.trim());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(`https://api.deezer.com/search/artist?q=${query}&limit=1`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    const artist = data?.data?.[0];
    if (!artist) return null;
    // picture_medium is 250×250 — plenty for our circular avatars
    const url: string | undefined = artist.picture_medium;
    if (!url || url.includes('default')) return null;
    return url;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Returns the image URL for an artist, checking the SQLite cache first.
 * On first access, fetches from Deezer and persists the result.
 * Returns null if no image exists for this artist.
 */
export async function getArtistImageUri(mbid: string): Promise<string | null> {
  const artist = await dbOperations.getArtistByMbid(mbid);

  // A non-null string means already resolved ('' = tried, no image found).
  if (typeof artist?.imageUrl === 'string') {
    return artist.imageUrl || null;
  }

  // Not yet fetched — resolve via Deezer using the artist name.
  const name = artist?.name;
  if (!name) return null;

  const url = await fetchImageUrlFromDeezer(name);
  await dbOperations.updateArtistImageUrl(mbid, url ?? '');
  return url;
}

/**
 * Batch-fetches and stores Deezer images for the given artists.
 * Calls onBatchDone with a running (done, total) count after each batch.
 */
export async function fetchAndStoreArtistImages(
  artists: Array<{ mbid: string; name: string }>,
  onBatchDone?: (done: number, total: number) => void,
): Promise<void> {
  let done = 0;
  for (let i = 0; i < artists.length; i += BATCH_SIZE) {
    const batch = artists.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ mbid, name }) => {
        const url = await fetchImageUrlFromDeezer(name);
        await dbOperations.updateArtistImageUrl(mbid, url ?? '');
        done++;
      }),
    );
    onBatchDone?.(done, artists.length);
    if (i + BATCH_SIZE < artists.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
}

/**
 * Fetches images for any artists that don't have one yet or previously failed.
 * On first run after a source change, resets all existing images so they are
 * re-fetched from Deezer. Safe to fire-and-forget on app startup.
 */
export async function backfillMissingArtistImages(): Promise<void> {
  try {
    // One-time migration: clear images fetched from a previous source.
    const currentSource = await dbOperations.getMetadata('imageSource');
    if (currentSource !== IMAGE_SOURCE_VERSION) {
      await dbOperations.clearAllArtistImages();
      await dbOperations.upsertMetadata('imageSource', IMAGE_SOURCE_VERSION);
    }

    const artists = await dbOperations.getArtistsWithoutImages();
    if (artists.length > 0) {
      await fetchAndStoreArtistImages(artists);
    }
  } catch {
    // silently ignore — best-effort background task
  }
}

/**
 * Resets all stored image URLs so they will be re-fetched on next access.
 */
export async function clearArtistImageCache(): Promise<void> {
  await dbOperations.clearAllArtistImages();
  await dbOperations.upsertMetadata('imageSource', '');
}
