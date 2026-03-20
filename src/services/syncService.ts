import { SetlistApiService } from './setlistApi';
import { DataProcessor } from './dataProcessor';
import { dbOperations } from '../database/operations';

const setlistApi = new SetlistApiService();
const dataProcessor = new DataProcessor();

export interface SyncResult {
  success: boolean;
  pagesProcessed: number;
  newConcerts: number;
  error?: string;
}

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

/**
 * Incrementally syncs attended concerts from the API.
 * Fetches page by page, stops early when an entire page contains
 * only setlists that already exist locally (i.e. we've caught up).
 */
export async function syncConcertData(usernameOverride?: string): Promise<SyncResult> {
  try {
    const username = usernameOverride ?? (await getStoredUsername());

    if (!username) {
      return { success: false, pagesProcessed: 0, newConcerts: 0, error: 'No username configured' };
    }

    let currentPage = 1;
    let hasMorePages = true;
    let totalPagesProcessed = 0;
    let totalNewConcerts = 0;

    while (hasMorePages) {
      const pageData = await setlistApi.getUserAttendedConcerts(username, currentPage);

      if (!pageData.setlist || pageData.setlist.length === 0) {
        break;
      }

      const newOnThisPage = await dataProcessor.importSetlistsFromResponse(pageData);
      totalPagesProcessed++;
      totalNewConcerts += newOnThisPage;

      // If no new setlists on this page, we've caught up — stop early
      if (newOnThisPage === 0) {
        break;
      }

      const totalPages = Math.ceil(pageData.total / pageData.itemsPerPage);
      if (currentPage >= totalPages) {
        hasMorePages = false;
      } else {
        currentPage++;
      }

      // Small delay between pages
      if (hasMorePages) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    await dbOperations.updateLastFetchedAt();

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
