jest.mock('@/database/database', () => ({
  databaseManager: {
    getDatabase: jest.fn(),
  },
}));

import { databaseManager } from '@/database/database';
import { dbOperations } from '@/database/operations';
import * as factQueries from '@/database/factQueries';

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (databaseManager.getDatabase as jest.Mock).mockReturnValue(mockDb);
});

describe('concert-detail recognition facts', () => {
  it('returns null when the setlist has no artist', async () => {
    jest.spyOn(dbOperations, 'getSetlistById').mockResolvedValue({ id: 'sl-1' } as any);
    expect(await factQueries.getConcertRecognitionFacts('sl-1')).toBeNull();
  });

  it('returns null when the setlist is not found', async () => {
    jest.spyOn(dbOperations, 'getSetlistById').mockResolvedValue(null);
    expect(await factQueries.getConcertRecognitionFacts('sl-1')).toBeNull();
  });

  it('computes facts for a first-ever show', async () => {
    jest.spyOn(dbOperations, 'getSetlistById').mockResolvedValue({
      id: 'sl-1',
      artistMbid: 'mbid-1',
      venueId: 'venue-1',
    } as any);
    mockDb.getAllAsync
      .mockResolvedValueOnce([
        {
          setlistId: 'sl-1',
          eventDate: '10-03-2019',
          venueName: 'The Fillmore',
          cityName: 'San Francisco',
          cityId: 'city-1',
          countryCode: 'US',
          countryName: 'United States',
        },
      ])
      .mockResolvedValueOnce([{ setlistId: 'sl-1' }]);

    const result = await factQueries.getConcertRecognitionFacts('sl-1');
    expect(result).toEqual({
      ordinalForArtist: 1,
      previousShowForArtist: null,
      daysSincePreviousShowForArtist: null,
      distinctCountriesForArtistSoFar: 1,
      distinctCitiesForArtistSoFar: 1,
      isNewCountryForArtist: false,
      isNewCityForArtist: false,
      isFirstVisitToVenue: true,
      venueVisitOrdinal: 1,
    });
  });

  it('computes facts for a later show in a new country', async () => {
    jest.spyOn(dbOperations, 'getSetlistById').mockResolvedValue({
      id: 'sl-2',
      artistMbid: 'mbid-1',
      venueId: 'venue-2',
    } as any);
    mockDb.getAllAsync
      .mockResolvedValueOnce([
        {
          setlistId: 'sl-1',
          eventDate: '10-03-2019',
          venueName: 'The Fillmore',
          cityName: 'San Francisco',
          cityId: 'city-1',
          countryCode: 'US',
          countryName: 'United States',
        },
        {
          setlistId: 'sl-2',
          eventDate: '22-08-2021',
          venueName: 'Paradiso',
          cityName: 'Amsterdam',
          cityId: 'city-2',
          countryCode: 'NL',
          countryName: 'Netherlands',
        },
      ])
      .mockResolvedValueOnce([{ setlistId: 'sl-2' }]);

    const result = await factQueries.getConcertRecognitionFacts('sl-2');
    expect(result).toEqual({
      ordinalForArtist: 2,
      previousShowForArtist: {
        eventDate: '10-03-2019',
        venueName: 'The Fillmore',
        cityName: 'San Francisco',
        countryName: 'United States',
      },
      daysSincePreviousShowForArtist: 896,
      distinctCountriesForArtistSoFar: 2,
      distinctCitiesForArtistSoFar: 2,
      isNewCountryForArtist: true,
      isNewCityForArtist: true,
      isFirstVisitToVenue: true,
      venueVisitOrdinal: 1,
    });
  });

  it('detects a venue revisit and does not flag a new country/city', async () => {
    jest.spyOn(dbOperations, 'getSetlistById').mockResolvedValue({
      id: 'sl-2',
      artistMbid: 'mbid-1',
      venueId: 'venue-1',
    } as any);
    mockDb.getAllAsync
      .mockResolvedValueOnce([
        {
          setlistId: 'sl-1',
          eventDate: '10-03-2019',
          venueName: 'The Fillmore',
          cityName: 'San Francisco',
          cityId: 'city-1',
          countryCode: 'US',
          countryName: 'United States',
        },
        {
          setlistId: 'sl-2',
          eventDate: '22-08-2021',
          venueName: 'The Fillmore',
          cityName: 'San Francisco',
          cityId: 'city-1',
          countryCode: 'US',
          countryName: 'United States',
        },
      ])
      .mockResolvedValueOnce([{ setlistId: 'sl-1' }, { setlistId: 'sl-2' }]);

    const result = await factQueries.getConcertRecognitionFacts('sl-2');
    expect(result?.isFirstVisitToVenue).toBe(false);
    expect(result?.venueVisitOrdinal).toBe(2);
    expect(result?.isNewCountryForArtist).toBe(false);
    expect(result?.isNewCityForArtist).toBe(false);
    expect(result?.distinctCountriesForArtistSoFar).toBe(1);
  });

  it('returns null when the target setlist is missing from its own artist history', async () => {
    jest.spyOn(dbOperations, 'getSetlistById').mockResolvedValue({
      id: 'sl-missing',
      artistMbid: 'mbid-1',
      venueId: 'venue-1',
    } as any);
    mockDb.getAllAsync.mockResolvedValueOnce([]);
    expect(await factQueries.getConcertRecognitionFacts('sl-missing')).toBeNull();
  });
});
