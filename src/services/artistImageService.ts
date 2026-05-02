import { dbOperations } from '@/database/operations';

const FETCH_TIMEOUT_MS = 5000;
const BATCH_SIZE = 8;

/**
 * Fetches an artist thumbnail from the Wikipedia summary API using the artist name.
 * Returns null if no thumbnail is found or the page is a disambiguation page.
 */
async function fetchImageUrlFromWikipedia(artistName: string): Promise<string | null> {
  const slug = encodeURIComponent(artistName.trim().replace(/\s+/g, '_'));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.type === 'disambiguation') return null;
    return (data.thumbnail?.source as string | undefined) ?? null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Returns the image URL for an artist, checking the SQLite cache first.
 * On first access (or after a reset), fetches from Wikipedia and persists the result.
 * Returns null if no image exists for this artist.
 */
export async function getArtistImageUri(mbid: string): Promise<string | null> {
  const artist = await dbOperations.getArtistByMbid(mbid);

  // A non-null string in imageUrl means already resolved ('' = no image found).
  if (typeof artist?.imageUrl === 'string') {
    return artist.imageUrl || null;
  }

  // Not yet fetched — resolve via Wikipedia using the artist name.
  const name = artist?.name;
  if (!name) return null;

  const url = await fetchImageUrlFromWikipedia(name);
  await dbOperations.updateArtistImageUrl(mbid, url ?? '');
  return url;
}

/**
 * Batch-fetches and stores Wikipedia images for the given artists.
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
        const url = await fetchImageUrlFromWikipedia(name);
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
 * Fetches images for artists that don't have one yet (NULL) or had a previous failure ('').
 * Safe to fire-and-forget on app startup — runs silently in the background.
 */
export async function backfillMissingArtistImages(): Promise<void> {
  try {
    const artists = await dbOperations.getArtistsWithoutImages();
    if (artists.length > 0) {
      await fetchAndStoreArtistImages(artists);
    }
  } catch {
    // silently ignore — this is a best-effort background task
  }
}

/**
 * Resets all stored image URLs so they will be re-fetched on next access.
 */
export async function clearArtistImageCache(): Promise<void> {
  await dbOperations.clearAllArtistImages();
}
