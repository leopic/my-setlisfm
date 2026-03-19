import { SetlistApiService } from '../services/setlistApi';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

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
      (api as any).requestCount = 1440;

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ setlist: [] }),
      });

      await expect(api.getUserAttendedConcerts('testuser')).rejects.toThrow(
        'Daily API limit exceeded',
      );
    });

    it('should delay requests to respect 2 req/sec limit', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ setlist: [], type: '', itemsPerPage: 20, page: 1, total: 0 }),
      });

      // First request should go through immediately
      const promise1 = api.getUserAttendedConcerts('testuser');
      jest.advanceTimersByTime(0);
      await promise1;

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request should be delayed
      const promise2 = api.getUserAttendedConcerts('testuser');
      // Advance past the 500ms rate limit window
      jest.advanceTimersByTime(500);
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

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => page1 })
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await api.getAllUserAttendedConcerts('testuser');

      expect(result).toHaveLength(1);
    });
  });
});
