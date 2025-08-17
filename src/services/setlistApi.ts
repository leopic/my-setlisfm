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

    // Rate limiting: max 2 requests per second
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < 500) { // 500ms = 2 requests/second
      await new Promise(resolve => setTimeout(resolve, 500 - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;

    return fetch(url, {
      headers: {
        'Accept': 'application/json',
        'x-api-key': API_KEY,
      },
    });
  }

  async getUserAttendedConcerts(username: string, page: number = 1): Promise<SetlistsResponse> {
    const url = `${API_BASE_URL}/user/${username}/attended?p=${page}`;
    
    try {
      const response = await this.makeRequest(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user attended concerts:', error);
      throw error;
    }
  }

  async getAllUserAttendedConcerts(username: string): Promise<SetlistsResponse[]> {
    const allPages: SetlistsResponse[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    
    console.log(`Starting to fetch all pages for user: ${username}`);
    
    while (hasMorePages) {
      try {
        console.log(`Fetching page ${currentPage}...`);
        const pageData = await this.getUserAttendedConcerts(username, currentPage);
        
        if (pageData.setlist && pageData.setlist.length > 0) {
          allPages.push(pageData);
          console.log(`Page ${currentPage}: ${pageData.setlist.length} concerts`);
          
          // Check if there are more pages
          if (pageData.setlist.length < 20) { // Setlist.fm typically returns 20 items per page
            hasMorePages = false;
            console.log(`Page ${currentPage} has fewer than 20 items, assuming it's the last page`);
          } else {
            currentPage++;
          }
        } else {
          console.log(`Page ${currentPage} is empty, stopping`);
          hasMorePages = false;
        }
        
        // Add a small delay between pages to be respectful to the API
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error);
        hasMorePages = false;
      }
    }
    
    console.log(`Finished fetching all pages. Total pages: ${allPages.length}`);
    return allPages;
  }

  async getSetlistById(setlistId: string): Promise<any> {
    const url = `${API_BASE_URL}/setlist/${setlistId}`;
    
    try {
      const response = await this.makeRequest(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching setlist:', error);
      throw error;
    }
  }

  async getArtistByMbid(mbid: string): Promise<any> {
    const url = `${API_BASE_URL}/artist/${mbid}`;
    
    try {
      const response = await this.makeRequest(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching artist:', error);
      throw error;
    }
  }

  async getVenueById(venueId: string): Promise<any> {
    const url = `${API_BASE_URL}/venue/${venueId}`;
    
    try {
      const response = await this.makeRequest(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching venue:', error);
      throw error;
    }
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
