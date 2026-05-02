import { dbOperations } from '@/database/operations';

const ARCHIVE_BASE = 'https://archive.org';
const FETCH_TIMEOUT_MS = 5000;
const BATCH_SIZE = 8;

async function fetchImageUrlFromArchive(mbid: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(`${ARCHIVE_BASE}/metadata/mbid-${mbid}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = await resp.json();
    const files: Array<{ name: string }> = data.files ?? [];
    const thumb = files.find((f) => f.name.endsWith('_thumb250.jpg'));
    if (!thumb) return null;
    return `${ARCHIVE_BASE}/download/mbid-${mbid}/${thumb.name}`;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * Returns the image URL for an artist, checking the SQLite cache first.
 * On first access, fetches from archive.org and persists the result.
 * Returns null if no image exists for this artist.
 */
export async function getArtistImageUri(mbid: string): Promise<string | null> {
  const artist = await dbOperations.getArtistByMbid(mbid);

  if (artist?.imageUrl !== undefined && artist.imageUrl !== null) {
    // Already resolved — either a real URL or empty string (no image found)
    return artist.imageUrl || null;
  }

  // First access — fetch and cache
  const url = await fetchImageUrlFromArchive(mbid);
  await dbOperations.updateArtistImageUrl(mbid, url ?? '');
  return url;
}

/**
 * Batch-fetches and stores archive.org images for the given MBIDs.
 * Calls onBatchDone with a running (done, total) count after each batch.
 */
export async function fetchAndStoreArtistImages(
  mbids: string[],
  onBatchDone?: (done: number, total: number) => void,
): Promise<void> {
  let done = 0;
  for (let i = 0; i < mbids.length; i += BATCH_SIZE) {
    const batch = mbids.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (mbid) => {
        const url = await fetchImageUrlFromArchive(mbid);
        await dbOperations.updateArtistImageUrl(mbid, url ?? '');
        done++;
      }),
    );
    onBatchDone?.(done, mbids.length);
    if (i + BATCH_SIZE < mbids.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }
}

/**
 * Resets all stored image URLs so they will be re-fetched on next access.
 */
export async function clearArtistImageCache(): Promise<void> {
  await dbOperations.clearAllArtistImages();
}
