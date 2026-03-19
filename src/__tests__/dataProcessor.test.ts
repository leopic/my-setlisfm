import { DataProcessor } from '../services/dataProcessor';
import type { SetlistsResponse, Setlist } from '../types/api';

// Mock the dbOperations module
jest.mock('../database/operations', () => ({
  dbOperations: {
    insertCountry: jest.fn(),
    insertCity: jest.fn(),
    insertArtist: jest.fn(),
    insertVenue: jest.fn(),
    insertTour: jest.fn(),
    insertSetlist: jest.fn(),
    insertSet: jest.fn(),
    insertSong: jest.fn(),
    getSetlistById: jest.fn(),
    getSetsForSetlist: jest.fn(),
  },
}));

import { dbOperations } from '../database/operations';

const mockDbOps = dbOperations as jest.Mocked<typeof dbOperations>;

function makeSetlist(overrides: Partial<Setlist> = {}): Setlist {
  return {
    id: 'set-1',
    eventDate: '01-01-2024',
    artist: { mbid: 'artist-1', name: 'Test Artist' },
    venue: {
      id: 'venue-1',
      name: 'Test Venue',
      city: {
        id: 'city-1',
        name: 'Test City',
        country: { code: 'US', name: 'United States' },
      },
    },
    tour: { name: 'Test Tour' },
    sets: {
      set: [
        {
          name: 'Main Set',
          song: [
            { name: 'Song 1' },
            { name: 'Song 2', cover: { mbid: 'cover-artist-1', name: 'Cover Artist' } },
          ],
        },
      ],
    },
    ...overrides,
  };
}

function makeResponse(setlists: Setlist[]): SetlistsResponse {
  return {
    type: 'setlists',
    itemsPerPage: 20,
    page: 1,
    total: setlists.length,
    setlist: setlists,
  };
}

describe('DataProcessor', () => {
  let processor: DataProcessor;

  beforeEach(() => {
    processor = new DataProcessor();
    jest.clearAllMocks();
    mockDbOps.getSetlistById.mockResolvedValue(null as any);
    mockDbOps.getSetsForSetlist.mockResolvedValue([
      { id: 100, setlistId: 'set-1', songOrder: 0 },
    ] as any);
  });

  describe('processSetlistsResponse', () => {
    it('should process a full setlist with all entities', async () => {
      const response = makeResponse([makeSetlist()]);

      await processor.processSetlistsResponse(response);

      expect(mockDbOps.insertCountry).toHaveBeenCalledWith({ code: 'US', name: 'United States' });
      expect(mockDbOps.insertCity).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'city-1', name: 'Test City', countryCode: 'US' }),
      );
      expect(mockDbOps.insertVenue).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'venue-1', name: 'Test Venue' }),
      );
      expect(mockDbOps.insertArtist).toHaveBeenCalledWith(
        expect.objectContaining({ mbid: 'artist-1', name: 'Test Artist' }),
      );
      expect(mockDbOps.insertTour).toHaveBeenCalledWith({ name: 'Test Tour' });
      expect(mockDbOps.insertSetlist).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'set-1' }),
      );
      expect(mockDbOps.insertSet).toHaveBeenCalled();
      expect(mockDbOps.insertSong).toHaveBeenCalledTimes(2);
    });

    it('should skip setlists that already exist in the database', async () => {
      mockDbOps.getSetlistById.mockResolvedValue({ id: 'set-1' } as any);
      const response = makeResponse([makeSetlist()]);

      await processor.processSetlistsResponse(response);

      expect(mockDbOps.insertSetlist).not.toHaveBeenCalled();
      expect(mockDbOps.insertSong).not.toHaveBeenCalled();
    });

    it('should skip setlists without an id', async () => {
      const response = makeResponse([makeSetlist({ id: undefined })]);

      await processor.processSetlistsResponse(response);

      expect(mockDbOps.insertSetlist).not.toHaveBeenCalled();
    });

    it('should skip setlists with no sets (no actual concert data)', async () => {
      const response = makeResponse([makeSetlist({ sets: { set: [] } })]);

      await processor.processSetlistsResponse(response);

      // Country/city/venue should still be processed, but no artist/setlist/songs
      expect(mockDbOps.insertCountry).toHaveBeenCalled();
      expect(mockDbOps.insertArtist).not.toHaveBeenCalled();
      expect(mockDbOps.insertSetlist).not.toHaveBeenCalled();
    });

    it('should process cover artists as separate artist entries', async () => {
      const response = makeResponse([makeSetlist()]);

      await processor.processSetlistsResponse(response);

      // Main artist + cover artist
      expect(mockDbOps.insertArtist).toHaveBeenCalledWith(
        expect.objectContaining({ mbid: 'cover-artist-1', name: 'Cover Artist' }),
      );
    });

    it('should handle setlists without a venue gracefully', async () => {
      const response = makeResponse([makeSetlist({ venue: undefined })]);

      await processor.processSetlistsResponse(response);

      expect(mockDbOps.insertVenue).not.toHaveBeenCalled();
      expect(mockDbOps.insertCity).not.toHaveBeenCalled();
      expect(mockDbOps.insertCountry).not.toHaveBeenCalled();
    });

    it('should handle setlists without a tour', async () => {
      const response = makeResponse([makeSetlist({ tour: undefined })]);

      await processor.processSetlistsResponse(response);

      expect(mockDbOps.insertTour).not.toHaveBeenCalled();
    });
  });

  describe('processMultipleSetlistsResponses', () => {
    it('should process all responses in order', async () => {
      const responses = [
        makeResponse([makeSetlist({ id: 'set-1' })]),
        makeResponse([makeSetlist({ id: 'set-2' })]),
      ];

      await processor.processMultipleSetlistsResponses(responses);

      expect(mockDbOps.insertSetlist).toHaveBeenCalledTimes(2);
    });
  });
});
