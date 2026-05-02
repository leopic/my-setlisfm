import { SetlistApiService } from '@/services/setlistApi';
import { DataProcessor } from '@/services/dataProcessor';
import { dbOperations } from '@/database/operations';
import { fetchAndStoreArtistImages } from '@/services/artistImageService';
import { generateSyncQuip, generatePhotoQuip } from '@/utils/quipGenerator';
import type { Setlist } from '@/types/api';

const setlistApi = new SetlistApiService();
const dataProcessor = new DataProcessor();

export interface SyncResult {
  success: boolean;
  pagesProcessed: number;
  newConcerts: number;
  error?: string;
}

export interface SyncProgress {
  phase: 'fetching' | 'images' | 'done';
  currentPage: number;
  totalPages: number;
  totalConcerts: number;
  newConcertsFound: number;
  quip?: string;
  imagesTotal?: number;
  imagesDone?: number;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

/**
 * Returns the stored username, or null if not configured.
 */
export async function getStoredUsername(): Promise<string | null> {
  return dbOperations.getMetadata('username');
}

/**
 * Stores the username in the metadata table.
 */
export async function setStoredUsername(username: string): Promise<void> {
  await dbOperations.upsertMetadata('username', username);
}

function computeQuipPages(totalPages: number): Set<number> {
  const step = Math.max(1, Math.ceil(totalPages / 4));
  const pages = new Set<number>();
  for (let p = 1; p <= totalPages; p += step) {
    if (pages.size < 4) pages.add(p);
  }
  return pages;
}

/**
 * Incrementally syncs attended concerts from the API.
 *
 * Per page:
 *  1. Fetch the concert page
 *  2. Insert all setlists
 *  3. Fetch archive.org images for any new artists on that page
 *
 * After all concert pages, any artists still missing images are caught up
 * in a final images phase.
 */
export async function syncConcertData(
  usernameOverride?: string,
  onProgress?: SyncProgressCallback,
): Promise<SyncResult> {
  try {
    const username = usernameOverride ?? (await getStoredUsername());

    if (!username) {
      return { success: false, pagesProcessed: 0, newConcerts: 0, error: 'No username configured' };
    }

    let currentPage = 1;
    let hasMorePages = true;
    let totalPagesProcessed = 0;
    let totalNewConcerts = 0;
    let totalPages = 0;
    let totalConcerts = 0;

    // Accumulated state for quip generation
    const allSetlists: Setlist[] = [];
    let quipPages: Set<number> | null = null;
    let quipIndex = 0;
    let currentQuip: string | undefined;

    while (hasMorePages) {
      const pageData = await setlistApi.getUserAttendedConcerts(username, currentPage);

      if (!pageData.setlist || pageData.setlist.length === 0) {
        break;
      }

      totalPages = Math.ceil(pageData.total / pageData.itemsPerPage);
      totalConcerts = pageData.total;

      // Compute quip checkpoint pages once we know the total
      if (!quipPages) {
        quipPages = computeQuipPages(totalPages);
      }

      // Accumulate setlists for quip generation
      for (const s of pageData.setlist) {
        allSetlists.push(s);
      }

      // Generate quip at checkpoint pages
      if (quipPages.has(currentPage)) {
        currentQuip = generateSyncQuip(allSetlists, quipIndex++);
      }

      onProgress?.({
        phase: 'fetching',
        currentPage,
        totalPages,
        totalConcerts,
        newConcertsFound: totalNewConcerts,
        quip: currentQuip,
      });

      const newOnThisPage = await dataProcessor.importSetlistsFromResponse(pageData);
      totalPagesProcessed++;
      totalNewConcerts += newOnThisPage;

      if (newOnThisPage === 0) {
        break;
      }

      if (currentPage >= totalPages) {
        hasMorePages = false;
      } else {
        currentPage++;
      }

      if (hasMorePages) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Images cleanup phase — catch any artists that were missed or failed
    const remainingArtists = await dbOperations.getArtistsWithoutImages();

    if (remainingArtists.length > 0) {
      let photoQuipIndex = 0;
      let photoQuipCheckpoint = -1;
      let currentPhotoQuip = generatePhotoQuip(remainingArtists, 0, 0, remainingArtists.length);

      onProgress?.({
        phase: 'images',
        currentPage: totalPagesProcessed,
        totalPages,
        totalConcerts,
        newConcertsFound: totalNewConcerts,
        quip: currentPhotoQuip,
        imagesTotal: remainingArtists.length,
        imagesDone: 0,
      });

      await fetchAndStoreArtistImages(remainingArtists, (done, total) => {
        // Rotate quip at every ~20 % interval (5 checkpoints total)
        const checkpoint = Math.floor((done / total) * 5);
        if (checkpoint !== photoQuipCheckpoint) {
          photoQuipCheckpoint = checkpoint;
          currentPhotoQuip = generatePhotoQuip(remainingArtists, photoQuipIndex++, done, total);
        }
        onProgress?.({
          phase: 'images',
          currentPage: totalPagesProcessed,
          totalPages,
          totalConcerts,
          newConcertsFound: totalNewConcerts,
          quip: currentPhotoQuip,
          imagesTotal: total,
          imagesDone: done,
        });
      });
    }

    await dbOperations.updateLastFetchedAt();

    onProgress?.({
      phase: 'done',
      currentPage: totalPagesProcessed,
      totalPages,
      totalConcerts,
      newConcertsFound: totalNewConcerts,
    });

    return { success: true, pagesProcessed: totalPagesProcessed, newConcerts: totalNewConcerts };
  } catch (error) {
    return {
      success: false,
      pagesProcessed: 0,
      newConcerts: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
