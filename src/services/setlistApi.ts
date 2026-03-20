// Setlist.fm API service with rate limiting
import type { SetlistsResponse } from '../types/api';
import Constants from 'expo-constants';

const API_BASE_URL = 'https://api.setlist.fm/rest/1.0';
const API_KEY = Constants.expoConfig?.extra?.setlistfmApiKey || '';

if (!API_KEY) {
  throw new Error('SETLISTFM_API_KEY environment variable is required');
}

export class SetlistApiService {
  private requestQueue: Array<() => void> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private dailyResetTime = new Date().setHours(0, 0, 0, 0);

  private static MAX_RETRIES = 3;
  private static INITIAL_BACKOFF_MS = 1000;

  private async makeRequest(url: string): Promise<Response> {
    // Check daily limit
    const now = new Date();
    if (now.getTime() > this.dailyResetTime + 24 * 60 * 60 * 1000) {
      this.requestCount = 0;
      this.dailyResetTime = now.setHours(0, 0, 0, 0);
    }

    if (this.requestCount >= 1440) {
      throw new Error('Daily API limit exceeded (1440 requests)');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < SetlistApiService.MAX_RETRIES; attempt++) {
      // Rate limiting: max 1 request per second (conservative to avoid 429s)
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLastRequest));
      }

      this.lastRequestTime = Date.now();
      this.requestCount++;

      try {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'x-api-key': API_KEY,
          },
        });

        // 429 Too Many Requests — wait and retry
        if (response.status === 429) {
          lastError = new Error('Rate limited by API (429)');
          const backoff = SetlistApiService.INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        // Other 4xx errors are client errors — don't retry
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        // 5xx errors are server errors — retry
        if (response.status >= 500) {
          lastError = new Error(`API request failed: ${response.status} ${response.statusText}`);
          const backoff = SetlistApiService.INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry client errors that were thrown above
        if (lastError.message.startsWith('API request failed:')) {
          throw lastError;
        }

        // Network errors — retry with backoff
        if (attempt < SetlistApiService.MAX_RETRIES - 1) {
          const backoff = SetlistApiService.INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  async getUserAttendedConcerts(username: string, page: number = 1): Promise<SetlistsResponse> {
    const url = `${API_BASE_URL}/user/${username}/attended?p=${page}`;
    const response = await this.makeRequest(url);
    return response.json();
  }

  async getAllUserAttendedConcerts(username: string): Promise<SetlistsResponse[]> {
    const allPages: SetlistsResponse[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        const pageData = await this.getUserAttendedConcerts(username, currentPage);

        if (pageData.setlist && pageData.setlist.length > 0) {
          allPages.push(pageData);

          const totalPages = Math.ceil(pageData.total / pageData.itemsPerPage);
          if (currentPage >= totalPages) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        } else {
          hasMorePages = false;
        }

        // Add a small delay between pages to be respectful to the API
        if (hasMorePages) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error);
        hasMorePages = false;
      }
    }

    return allPages;
  }

  async getSetlistById(setlistId: string): Promise<any> {
    const url = `${API_BASE_URL}/setlist/${setlistId}`;
    const response = await this.makeRequest(url);
    return response.json();
  }

  async getArtistByMbid(mbid: string): Promise<any> {
    const url = `${API_BASE_URL}/artist/${mbid}`;
    const response = await this.makeRequest(url);
    return response.json();
  }

  async getVenueById(venueId: string): Promise<any> {
    const url = `${API_BASE_URL}/venue/${venueId}`;
    const response = await this.makeRequest(url);
    return response.json();
  }

  // Get current rate limiting status
  getRateLimitStatus(): {
    requestsToday: number;
    requestsRemaining: number;
    lastRequestTime: Date;
  } {
    return {
      requestsToday: this.requestCount,
      requestsRemaining: 1440 - this.requestCount,
      lastRequestTime: new Date(this.lastRequestTime),
    };
  }
}

// Singleton instance
export const setlistApi = new SetlistApiService();
