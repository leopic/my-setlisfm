import { SetlistApiService } from '../services/setlistApi';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to access private members for testing
function setPrivateField<T>(obj: T, field: string, value: unknown): void {
  (obj as Record<string, unknown>)[field] = value;
}

describe('SetlistApiService', () => {
  let api: SetlistApiService;

  beforeEach(() => {
    api = new SetlistApiService();
    mockFetch.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rate limiting', () => {
    it('should track request count and remaining requests', () => {
      const status = api.getRateLimitStatus();
      expect(status.requestsToday).toBe(0);
      expect(status.requestsRemaining).toBe(1440);
    });

    it('should throw when daily limit is exceeded', async () => {
      // Manually set request count to the limit
      setPrivateField(api, 'requestCount', 1440);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ setlist: [] }),
      });

      await expect(api.getUserAttendedConcerts('testuser')).rejects.toThrow(
        'Daily API limit exceeded',
      );
    });

    it('should delay requests to respect 1 req/sec limit', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ setlist: [], type: '', itemsPerPage: 20, page: 1, total: 0 }),
      });

      // First request should go through immediately
      const promise1 = api.getUserAttendedConcerts('testuser');
      jest.advanceTimersByTime(0);
      await promise1;

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request should be delayed by 1 second
      const promise2 = api.getUserAttendedConcerts('testuser');
      jest.advanceTimersByTime(1000);
      await promise2;

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserAttendedConcerts', () => {
    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ setlist: [], type: '', itemsPerPage: 20, page: 1, total: 0 }),
      });

      await api.getUserAttendedConcerts('leopic', 2);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.setlist.fm/rest/1.0/user/leopic/attended?p=2',
        expect.objectContaining({
          headers: {
            Accept: 'application/json',
            'x-api-key': 'test-api-key',
          },
        }),
      );
    });

    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(api.getUserAttendedConcerts('testuser')).rejects.toThrow(
        'API request failed: 404 Not Found',
      );
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    it('should retry on 5xx errors with exponential backoff', async () => {
      mockFetch
        .mockResolvedValueOnce({ status: 503, statusText: 'Service Unavailable' })
        .mockResolvedValueOnce({ status: 503, statusText: 'Service Unavailable' })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ setlist: [] }),
        });

      const result = await api.getUserAttendedConcerts('testuser');
      expect(result).toEqual({ setlist: [] });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on 4xx errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(api.getUserAttendedConcerts('testuser')).rejects.toThrow(
        'API request failed: 400 Bad Request',
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw after exhausting all retries', async () => {
      mockFetch.mockResolvedValue({ status: 500, statusText: 'Internal Server Error' });

      await expect(api.getUserAttendedConcerts('testuser')).rejects.toThrow(
        'API request failed: 500 Internal Server Error',
      );
      expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should retry on network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ setlist: [] }),
      });

      const result = await api.getUserAttendedConcerts('testuser');
      expect(result).toEqual({ setlist: [] });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAllUserAttendedConcerts', () => {
    beforeEach(() => {
      // These tests need real timers since they involve multiple async ticks
      // interleaved with setTimeout that are hard to coordinate with fake timers
      jest.useRealTimers();
    });

    it('should paginate until fewer than 20 results are returned', async () => {
      const page1 = {
        setlist: Array(20).fill({ id: 'test' }),
        type: '',
        itemsPerPage: 20,
        page: 1,
        total: 25,
      };
      const page2 = {
        setlist: Array(5).fill({ id: 'test' }),
        type: '',
        itemsPerPage: 20,
        page: 2,
        total: 25,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => page1 })
        .mockResolvedValueOnce({ ok: true, json: async () => page2 });

      const result = await api.getAllUserAttendedConcerts('testuser');

      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should stop on empty response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ setlist: [], type: '', itemsPerPage: 20, page: 1, total: 0 }),
      });

      const result = await api.getAllUserAttendedConcerts('testuser');
      expect(result).toHaveLength(0);
    });

    it('should stop on error and return pages fetched so far', async () => {
      const page1 = {
        setlist: Array(20).fill({ id: 'test' }),
        type: '',
        itemsPerPage: 20,
        page: 1,
        total: 40,
      };

      // Page 1 succeeds, then page 2 fails with a 4xx (no retry)
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => page1 })
        .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });

      const result = await api.getAllUserAttendedConcerts('testuser');

      expect(result).toHaveLength(1);
    }, 15000);
  });
});
