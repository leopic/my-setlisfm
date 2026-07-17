jest.mock('@/database/database', () => ({
  databaseManager: {
    getDatabase: jest.fn(),
  },
}));

import { databaseManager } from '@/database/database';
import { dbOperations } from '@/database/operations';
import * as chatQueries from '@/database/chatQueries';

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (databaseManager.getDatabase as jest.Mock).mockReturnValue(mockDb);
});

const SHOWS = [
  { eventDate: '10-03-2019', venueName: 'The Fillmore', cityName: 'San Francisco' },
  { eventDate: '22-08-2021', venueName: 'The Fillmore', cityName: 'San Francisco' },
  { eventDate: '01-01-2024', venueName: 'Red Rocks', cityName: 'Morrison' },
];

describe('single-artist history', () => {
  it('firstTimeSeenArtist returns the earliest show', async () => {
    mockDb.getAllAsync.mockResolvedValue(SHOWS);
    const result = await chatQueries.firstTimeSeenArtist('mbid-1');
    expect(result?.eventDate).toBe('10-03-2019');
  });

  it('lastTimeSeenArtist returns the latest show', async () => {
    mockDb.getAllAsync.mockResolvedValue(SHOWS);
    const result = await chatQueries.lastTimeSeenArtist('mbid-1');
    expect(result?.eventDate).toBe('01-01-2024');
  });

  it('firstTimeSeenArtist returns null when the artist has no shows', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    expect(await chatQueries.firstTimeSeenArtist('mbid-1')).toBeNull();
  });

  it('countTimesSeenArtist counts all shows', async () => {
    mockDb.getAllAsync.mockResolvedValue(SHOWS);
    expect(await chatQueries.countTimesSeenArtist('mbid-1')).toBe(3);
  });

  it('listTimesSeenArtist returns every show', async () => {
    mockDb.getAllAsync.mockResolvedValue(SHOWS);
    const result = await chatQueries.listTimesSeenArtist('mbid-1');
    expect(result).toHaveLength(3);
  });

  it('showsForArtistInYear returns the shows for that artist', async () => {
    const yearShows = [SHOWS[1]];
    mockDb.getAllAsync.mockResolvedValue(yearShows);
    const result = await chatQueries.showsForArtistInYear('mbid-1', '2021');
    expect(result).toEqual(yearShows);
  });

  it('venuesSeenArtistAt returns venue counts', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { name: 'The Fillmore', count: 2 },
      { name: 'Red Rocks', count: 1 },
    ]);
    const result = await chatQueries.venuesSeenArtistAt('mbid-1');
    expect(result[0]).toEqual({ name: 'The Fillmore', count: 2 });
  });

  it('toursSeenArtistOn returns distinct tour names', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ tourName: 'Age of Unreason Tour' }]);
    expect(await chatQueries.toursSeenArtistOn('mbid-1')).toEqual(['Age of Unreason Tour']);
  });

  it('compareArtistCounts returns counts for both artists', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce(SHOWS) // artist A
      .mockResolvedValueOnce(SHOWS.slice(0, 1)); // artist B

    const result = await chatQueries.compareArtistCounts('mbid-a', 'mbid-b');
    expect(result).toEqual({ countA: 3, countB: 1 });
  });

  it('longestGapBetweenArtistShows finds the biggest gap between consecutive shows', async () => {
    mockDb.getAllAsync.mockResolvedValue(SHOWS);
    const result = await chatQueries.longestGapBetweenArtistShows('mbid-1');
    // 10-03-2019 -> 22-08-2021 is the larger of the two consecutive gaps (~895 vs ~862 days)
    expect(result?.fromDate).toBe('10-03-2019');
    expect(result?.toDate).toBe('22-08-2021');
    expect(result?.days).toBeGreaterThan(800);
  });

  it('longestGapBetweenArtistShows returns null with fewer than two shows', async () => {
    mockDb.getAllAsync.mockResolvedValue(SHOWS.slice(0, 1));
    expect(await chatQueries.longestGapBetweenArtistShows('mbid-1')).toBeNull();
  });
});

describe('aggregates', () => {
  it('top5Artists returns up to five ranked artists', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ name: 'Bad Religion', count: 12 }]);
    expect(await chatQueries.top5Artists()).toEqual([{ name: 'Bad Religion', count: 12 }]);
  });

  it('artistsSeenAtLeastNTimes passes the threshold through', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ name: 'NOFX', count: 5 }]);
    const result = await chatQueries.artistsSeenAtLeastNTimes(5);
    expect(result).toEqual([{ name: 'NOFX', count: 5 }]);
  });

  it('artistsSeenMoreThanOnceCount reads the wrapped count', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 7 });
    expect(await chatQueries.artistsSeenMoreThanOnceCount()).toBe(7);
  });

  it('artistsSeenOnlyOnceCount defaults to 0 when null', async () => {
    mockDb.getFirstAsync.mockResolvedValue(null);
    expect(await chatQueries.artistsSeenOnlyOnceCount()).toBe(0);
  });

  it('topArtistInASingleYear returns the top artist/year/count row', async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      mbid: 'mbid-1',
      name: 'Bad Religion',
      year: '2019',
      count: 4,
    });
    expect(await chatQueries.topArtistInASingleYear()).toEqual({
      mbid: 'mbid-1',
      name: 'Bad Religion',
      year: '2019',
      count: 4,
    });
  });

  it('topArtistInASingleYear returns null with no data', async () => {
    mockDb.getFirstAsync.mockResolvedValue(null);
    expect(await chatQueries.topArtistInASingleYear()).toBeNull();
  });

  it('topArtistInASingleYear passes exclusion keys through as params', async () => {
    mockDb.getFirstAsync.mockResolvedValue(null);
    await chatQueries.topArtistInASingleYear([{ mbid: 'mbid-1', year: '2019' }]);
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['mbid-1', '2019']);
  });

  it('topArtist returns the top artist/mbid/count row', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ mbid: 'mbid-1', name: 'Bad Religion', count: 10 });
    expect(await chatQueries.topArtist()).toEqual({
      mbid: 'mbid-1',
      name: 'Bad Religion',
      count: 10,
    });
  });

  it('topArtist excludes the given mbids', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ mbid: 'mbid-2', name: 'NOFX', count: 8 });
    const result = await chatQueries.topArtist(['mbid-1']);
    expect(result?.mbid).toBe('mbid-2');
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['mbid-1']);
  });

  it('mostVisitedCountry returns the top country/code/count row', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ name: 'Mexico', code: 'MX', count: 6 });
    expect(await chatQueries.mostVisitedCountry()).toEqual({
      name: 'Mexico',
      code: 'MX',
      count: 6,
    });
  });

  it('mostVisitedCountry excludes the given codes', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ name: 'Argentina', code: 'AR', count: 3 });
    const result = await chatQueries.mostVisitedCountry(['MX']);
    expect(result?.code).toBe('AR');
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['MX']);
  });

  it('mostVisitedCity returns the top city/id/count row', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ name: 'Berlin', id: 'city-1', count: 6 });
    expect(await chatQueries.mostVisitedCity()).toEqual({ name: 'Berlin', id: 'city-1', count: 6 });
  });

  it('mostVisitedCity excludes the given city ids', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ name: 'Paris', id: 'city-2', count: 4 });
    const result = await chatQueries.mostVisitedCity(['city-1']);
    expect(result?.id).toBe('city-2');
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['city-1']);
  });

  it('busiestYear returns the year/count row', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ year: '2022', count: 58 });
    expect(await chatQueries.busiestYear()).toEqual({ year: '2022', count: 58 });
  });

  it('busiestYear excludes the given years', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ year: '2019', count: 33 });
    const result = await chatQueries.busiestYear(['2022']);
    expect(result?.year).toBe('2019');
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['2022']);
  });

  it('busiestYear returns null with no data', async () => {
    mockDb.getFirstAsync.mockResolvedValue(null);
    expect(await chatQueries.busiestYear()).toBeNull();
  });
});

describe('time-based', () => {
  it('concertsInYear counts shows for the given year', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 4 });
    expect(await chatQueries.concertsInYear('2019')).toBe(4);
  });

  it('concertsInMonthYear counts shows for the given month and year', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 2 });
    const result = await chatQueries.concertsInMonthYear('06', '2025');
    expect(result).toBe(2);
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['06', '2025']);
  });

  it('artistsSeenInMonthYear returns distinct artist names for that month and year', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ name: 'Foo Fighters' }, { name: 'IDLES' }]);
    const result = await chatQueries.artistsSeenInMonthYear('06', '2025');
    expect(result).toEqual(['Foo Fighters', 'IDLES']);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.any(String), ['06', '2025']);
  });

  it('showsInYear returns every show across all artists for that year', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        eventDate: '10-03-2019',
        artistName: 'Bad Religion',
        venueName: 'The Fillmore',
        cityName: 'San Francisco',
      },
    ]);
    const result = await chatQueries.showsInYear('2019');
    expect(result).toHaveLength(1);
    expect(result[0].artistName).toBe('Bad Religion');
  });

  it('showsInMonthYear returns every show across all artists for that month and year', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        eventDate: '03-06-2025',
        artistName: 'Foo Fighters',
        venueName: 'Ernst Happel Stadion',
        cityName: 'Vienna',
      },
    ]);
    const result = await chatQueries.showsInMonthYear('06', '2025');
    expect(result).toHaveLength(1);
    expect(result[0].artistName).toBe('Foo Fighters');
  });

  it('busiestMonth returns the month/year/count with the most shows', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ month: '06', year: '2025', count: 5 });
    expect(await chatQueries.busiestMonth()).toEqual({ month: '06', year: '2025', count: 5 });
  });

  it('busiestMonth returns null with no logged concerts', async () => {
    mockDb.getFirstAsync.mockResolvedValue(undefined);
    expect(await chatQueries.busiestMonth()).toBeNull();
  });

  it('busiestMonth excludes the given month/year pairs', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ month: '09', year: '2018', count: 14 });
    const result = await chatQueries.busiestMonth([{ month: '06', year: '2025' }]);
    expect(result).toEqual({ month: '09', year: '2018', count: 14 });
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['06', '2025']);
  });

  it('busiestWeek returns the week start/end/count with the most shows', async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      weekStart: '2025-03-03',
      weekEnd: '2025-03-09',
      count: 3,
    });
    expect(await chatQueries.busiestWeek()).toEqual({
      weekStart: '2025-03-03',
      weekEnd: '2025-03-09',
      count: 3,
    });
  });

  it('busiestWeek excludes the given week-start dates', async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      weekStart: '2018-09-10',
      weekEnd: '2018-09-16',
      count: 13,
    });
    const result = await chatQueries.busiestWeek(['2025-03-03']);
    expect(result?.weekStart).toBe('2018-09-10');
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['2025-03-03']);
  });

  it('busiestWeek returns null with no logged concerts', async () => {
    mockDb.getFirstAsync.mockResolvedValue(undefined);
    expect(await chatQueries.busiestWeek()).toBeNull();
  });

  it('showsInWeek returns every show within that week', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        eventDate: '04-03-2025',
        artistName: 'IDLES',
        venueName: 'Some Venue',
        cityName: 'Some City',
      },
    ]);
    const result = await chatQueries.showsInWeek('2025-03-03');
    expect(result).toHaveLength(1);
    expect(result[0].artistName).toBe('IDLES');
  });

  it('artistsSeenInMonthYear returns an empty list when nothing matches', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    expect(await chatQueries.artistsSeenInMonthYear('06', '2025')).toEqual([]);
  });

  it('averageConcertsPerYear divides total by distinct years', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ total: 20, years: 4 });
    expect(await chatQueries.averageConcertsPerYear()).toBe(5);
  });

  it('averageConcertsPerYear returns 0 with no data', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ total: 0, years: 0 });
    expect(await chatQueries.averageConcertsPerYear()).toBe(0);
  });

  it('daysSinceLastConcert derives from the dashboard stats last concert', async () => {
    jest.spyOn(dbOperations, 'getDashboardStats').mockResolvedValue({
      totalConcerts: 1,
      totalArtists: 1,
      totalVenues: 1,
      totalCountries: 1,
      topArtist: null,
      topVenue: null,
      firstConcert: null,
      lastConcert: {
        setlistId: 's1',
        artistName: 'Bad Religion',
        eventDate: '01-01-2020',
        artistMbid: 'mbid-1',
        artistImageUrl: null,
      },
      concertsByYear: [],
    });

    const result = await chatQueries.daysSinceLastConcert();
    expect(result).not.toBeNull();
    expect(result).toBeGreaterThan(0);
  });

  it('daysSinceLastConcert returns null with no logged concerts', async () => {
    jest.spyOn(dbOperations, 'getDashboardStats').mockResolvedValue({
      totalConcerts: 0,
      totalArtists: 0,
      totalVenues: 0,
      totalCountries: 0,
      topArtist: null,
      topVenue: null,
      firstConcert: null,
      lastConcert: null,
      concertsByYear: [],
    });

    expect(await chatQueries.daysSinceLastConcert()).toBeNull();
  });
});

describe('geographic', () => {
  it('citiesSeenList returns distinct city names', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ name: 'Berlin' }, { name: 'Mexico City' }]);
    expect(await chatQueries.citiesSeenList()).toEqual(['Berlin', 'Mexico City']);
  });

  it('showsInCountry counts shows for a country code', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 6 });
    expect(await chatQueries.showsInCountry('MX')).toBe(6);
  });

  it('mostVisitedCountry returns the top country', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ name: 'Germany', count: 9 });
    expect(await chatQueries.mostVisitedCountry()).toEqual({ name: 'Germany', count: 9 });
  });

  it('mostVisitedCity returns the top city', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ name: 'Berlin', count: 4 });
    expect(await chatQueries.mostVisitedCity()).toEqual({ name: 'Berlin', count: 4 });
  });

  it('bandsSeenInCountry returns distinct artist names', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ name: 'Die Toten Hosen' }]);
    expect(await chatQueries.bandsSeenInCountry('MX')).toEqual(['Die Toten Hosen']);
  });

  it('bandsSeenInCityYear filters by city and year', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ name: 'Rammstein' }]);
    const result = await chatQueries.bandsSeenInCityYear('city-berlin', '2025');
    expect(result).toEqual(['Rammstein']);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(expect.any(String), ['city-berlin', '2025']);
  });

  it('countriesSeenInYear returns distinct country names', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ name: 'Germany' }]);
    expect(await chatQueries.countriesSeenInYear('2025')).toEqual(['Germany']);
  });
});
