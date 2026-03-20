import Constants from 'expo-constants';
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
 * Fetches all attended concerts from the API and imports them into the local database.
 * Skips setlists that already exist locally.
 */
export async function syncConcertData(): Promise<SyncResult> {
  try {
    const username = Constants.expoConfig?.extra?.setlistfmTestUsername || 'leopic';
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
