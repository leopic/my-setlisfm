import { DatabaseOperations } from '@/database/operations';

// Mock the database manager so we can control SQL results without SQLite
jest.mock('@/database/database', () => ({
  databaseManager: {
    getDatabase: jest.fn(),
  },
}));

import { databaseManager } from '@/database/database';

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (databaseManager.getDatabase as jest.Mock).mockReturnValue(mockDb);
});

describe('DatabaseOperations — new dashboard queries', () => {
  let ops: DatabaseOperations;

  beforeEach(() => {
    ops = new DatabaseOperations();
  });

  // ── getConcertsByYearMonth ──────────────────────────────────────────────

  describe('getConcertsByYearMonth', () => {
    it('returns rows grouped by year and month', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { year: '2024', month: 6, count: 3 },
        { year: '2024', month: 8, count: 1 },
        { year: '2025', month: 1, count: 2 },
      ]);

      const result = await ops.getConcertsByYearMonth();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ year: '2024', month: 6, count: 3 });
      expect(result[2]).toEqual({ year: '2025', month: 1, count: 2 });
    });

    it('returns an empty array when there are no concerts', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await ops.getConcertsByYearMonth();

      expect(result).toEqual([]);
    });
  });

  // ── getBusiestYear ─────────────────────────────────────────────────────

  describe('getBusiestYear', () => {
    it('returns the year with the most shows', async () => {
      mockDb.getFirstAsync.mockResolvedValue({ year: '2016', count: 58 });

      const result = await ops.getBusiestYear();

      expect(result).toEqual({ year: '2016', count: 58 });
    });

    it('returns null when there are no concerts', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await ops.getBusiestYear();

      expect(result).toBeNull();
    });
  });

  // ── getYearSummaries ───────────────────────────────────────────────────

  describe('getYearSummaries', () => {
    it('returns summaries with countries, cities and peak month per year', async () => {
      // First query: yearly totals with country/city counts
      mockDb.getAllAsync.mockResolvedValueOnce([
        { year: '2025', shows: 40, countries: 3, cities: 12 },
        { year: '2024', shows: 42, countries: 5, cities: 18 },
      ]);

      // Second query: monthly breakdowns for peak calculation
      mockDb.getAllAsync.mockResolvedValueOnce([
        { year: '2025', month: 7, cnt: 8 },
        { year: '2025', month: 4, cnt: 5 },
        { year: '2024', month: 6, cnt: 10 },
        { year: '2024', month: 8, cnt: 6 },
      ]);

      const result = await ops.getYearSummaries();

      expect(result).toHaveLength(2);

      const y2025 = result.find((r) => r.year === '2025')!;
      expect(y2025.shows).toBe(40);
      expect(y2025.countries).toBe(3);
      expect(y2025.cities).toBe(12);
      expect(y2025.peakMonth).toBe(7); // July had most (8)
      expect(y2025.peakMonthCount).toBe(8);

      const y2024 = result.find((r) => r.year === '2024')!;
      expect(y2024.peakMonth).toBe(6); // June had most (10)
      expect(y2024.peakMonthCount).toBe(10);
    });

    it('returns shows/countries/cities as zero when no concerts exist', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      const result = await ops.getYearSummaries();

      expect(result).toHaveLength(0);
    });

    it('handles a year with a single show (peak month = that month)', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        { year: '2009', shows: 1, countries: 1, cities: 1 },
      ]);
      mockDb.getAllAsync.mockResolvedValueOnce([{ year: '2009', month: 10, cnt: 1 }]);

      const result = await ops.getYearSummaries();

      expect(result[0].peakMonth).toBe(10);
      expect(result[0].peakMonthCount).toBe(1);
    });

    it('sets peak to 0 when no monthly data is available for a year', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        { year: '2020', shows: 0, countries: 0, cities: 0 },
      ]);
      mockDb.getAllAsync.mockResolvedValueOnce([]); // no monthly rows

      const result = await ops.getYearSummaries();

      expect(result[0].peakMonth).toBe(0);
      expect(result[0].peakMonthCount).toBe(0);
    });
  });
});
