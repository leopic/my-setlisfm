import { dbOperations } from '@/database/operations';
import { pickPhotoColor } from '@/utils/photoColor';
import { deezerPhotoUrl } from '@/utils/deezerPhoto';

const FETCH_TIMEOUT_MS = 5000;

// 56×56 is plenty to find a color.
const smallPhotoUrl = (url: string) => deezerPhotoUrl(url, 56);

// The same artist shows up in many rows at once: one lookup each.
const inFlight = new Map<string, Promise<void>>();

type ColorListener = (mbid: string) => void;
const listeners = new Set<ColorListener>();

/** Calls `listener` with the artist's mbid each time a photo color is stored. */
export function subscribeArtistPhotoColor(listener: ColorListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function fetchPhotoColor(imageUrl: string): Promise<string | null | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(smallPhotoUrl(imageUrl), { signal: controller.signal });
    if (!resp.ok) return undefined;
    const bytes = new Uint8Array(await resp.arrayBuffer());
    try {
      return pickPhotoColor(bytes);
    } catch {
      return null; // not a readable JPEG: treat it as a photo without a color
    }
  } catch {
    return undefined; // network trouble: try again another time
  } finally {
    clearTimeout(timer);
  }
}

async function storeColor(mbid: string, imageUrl: string): Promise<void> {
  // A string means already resolved ('' = tried, no clear color).
  if (typeof (await dbOperations.getArtistImageColor(mbid)) === 'string') return;
  const color = await fetchPhotoColor(imageUrl);
  if (color === undefined) return;
  await dbOperations.updateArtistImageColor(mbid, imageUrl, color ?? '');
  for (const listener of listeners) listener(mbid);
}

/**
 * Finds the main color of an artist's photo and stores it next to the photo URL, once.
 * Best effort: failures are retried on a later call.
 */
export function storeArtistPhotoColor(mbid: string, imageUrl: string): Promise<void> {
  const pending = inFlight.get(mbid);
  if (pending) return pending;
  const run = storeColor(mbid, imageUrl)
    .catch(() => {})
    .finally(() => inFlight.delete(mbid));
  inFlight.set(mbid, run);
  return run;
}
