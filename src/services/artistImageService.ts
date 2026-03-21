import { File, Directory, Paths } from 'expo-file-system';

const AUDIODB_BASE_URL = 'https://theaudiodb.com/api/v1/json/2';
const CACHE_DIR_NAME = 'artist-images';

interface AudioDBArtistResponse {
  artists: Array<{
    strArtistThumb?: string;
  }> | null;
}

function getCacheDir(): Directory {
  return new Directory(Paths.document, CACHE_DIR_NAME);
}

function getCachedFile(mbid: string): File {
  return new File(getCacheDir(), `${mbid}.jpg`);
}

/**
 * Fetches the artist thumbnail URL from TheAudioDB.
 * Returns null if the artist has no image.
 */
async function fetchArtistImageUrl(mbid: string): Promise<string | null> {
  try {
    const response = await fetch(`${AUDIODB_BASE_URL}/artist-mb.php?i=${mbid}`);
    if (!response.ok) return null;

    const data: AudioDBArtistResponse = await response.json();
    return data.artists?.[0]?.strArtistThumb || null;
  } catch {
    return null;
  }
}

/**
 * Returns a local file URI for the artist's image.
 * Downloads and caches on first call; returns cached path on subsequent calls.
 * Returns null if no image is available.
 */
export async function getArtistImageUri(mbid: string): Promise<string | null> {
  const cachedFile = getCachedFile(mbid);

  // Check cache first
  if (cachedFile.exists) {
    return cachedFile.uri;
  }

  // Fetch remote URL
  const remoteUrl = await fetchArtistImageUrl(mbid);
  if (!remoteUrl) return null;

  // Download and cache
  try {
    const dir = getCacheDir();
    if (!dir.exists) {
      dir.create({ intermediates: true });
    }
    const downloaded = await File.downloadFileAsync(remoteUrl, dir);
    // Rename to mbid-based filename
    downloaded.move(cachedFile);
    return cachedFile.uri;
  } catch {
    try {
      cachedFile.delete();
    } catch {
      // ignore cleanup errors
    }
    return null;
  }
}

/**
 * Clears the entire artist image cache.
 */
export function clearArtistImageCache(): void {
  try {
    getCacheDir().delete();
  } catch {
    // directory may not exist
  }
}
