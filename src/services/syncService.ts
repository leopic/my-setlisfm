import { SetlistApiService } from './setlistApi';
import { DataProcessor } from './dataProcessor';
import { dbOperations } from '../database/operations';

const setlistApi = new SetlistApiService();
const dataProcessor = new DataProcessor();

export interface SyncResult {
  success: boolean;
  pagesProcessed: number;
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
 * Fetches all attended concerts from the API and imports them into the local database.
 * Uses the stored username from metadata, or the provided override.
 */
export async function syncConcertData(usernameOverride?: string): Promise<SyncResult> {
  try {
    const username = usernameOverride ?? (await getStoredUsername());

    if (!username) {
      return { success: false, pagesProcessed: 0, error: 'No username configured' };
    }

    const allPages = await setlistApi.getAllUserAttendedConcerts(username);

    if (allPages.length === 0) {
      return { success: true, pagesProcessed: 0 };
    }

    await dataProcessor.importSetlistsFromPages(allPages);
    await dbOperations.updateLastFetchedAt();

    return { success: true, pagesProcessed: allPages.length };
  } catch (error) {
    return {
      success: false,
      pagesProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
