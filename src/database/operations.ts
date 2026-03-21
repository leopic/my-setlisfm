// Database CRUD operations for all entities
import { databaseManager } from './database';
import type {
  DBArtist,
  DBCity,
  DBCountry,
  DBVenue,
  DBTour,
  DBSetlist,
  DBSet,
  DBSong,
  SetlistWithDetails,
  SetWithSongs,
} from '../types/database';

// Row types for SQL query results
interface SetlistJoinRow {
  id: string;
  versionId?: string;
  artistMbid?: string;
  venueId?: string;
  tourName?: string;
  eventDate?: string;
  lastUpdated?: string;
  lastFmEventId?: number;
  info?: string;
  url?: string;
  artistTmid?: number;
  artistName?: string;
  artistSortName?: string;
  artistDisambiguation?: string;
  artistUrl?: string;
  venueName?: string;
  venueUrl?: string;
  cityId?: string;
  cityName?: string;
  cityState?: string;
  cityStateCode?: string;
  cityCountryCode?: string;
  cityCoordsLat?: number;
  cityCoordsLong?: number;
  coordsLat?: number;
  coordsLong?: number;
  countryCode?: string;
  countryName?: string;
}

interface SetSongJoinRow {
  setId: number;
  setlistId: string;
  setName?: string;
  encore?: number;
  setSongOrder: number;
  songId?: number;
  songName?: string;
  tape?: boolean;
  songInfo?: string;
  withArtistMbid?: string;
  coverArtistMbid?: string;
  songSongOrder?: number;
  songSetId?: number;
  withArtistName?: string;
  coverArtistName?: string;
}

interface SongWithSetInfoRow {
  songId: number;
  songName?: string;
  tape?: boolean;
  info?: string;
  songOrder: number;
  setId: number;
  setName?: string;
  encore?: number;
  setlistId: string;
  eventDate?: string;
  artistName?: string;
}

interface CountRow {
  count: number;
}

interface DashboardCountsRow {
  concerts: number;
  artists: number;
  venues: number;
  countries: number;
}

interface TopArtistRow {
  mbid: string;
  name: string;
  count: number;
}

interface TopVenueRow {
  id: string;
  name: string;
  cityName: string;
  count: number;
}

interface ConcertDateRow {
  setlistId: string;
  artistName: string;
  eventDate: string;
}

interface OnThisDayRow {
  setlistId: string;
  artistName: string;
  eventDate: string;
  venueName: string;
  dayDiff: number;
}

interface YearCountRow {
  year: string;
  count: number;
}

interface ArtistStatsRow {
  mbid: string;
  name?: string;
  sortName?: string;
  disambiguation?: string;
  url?: string;
  concertCount: number;
  venueNames?: string;
}

interface EventDateRow {
  eventDate?: string;
}

interface OrphanedArtistRow {
  mbid: string;
  name?: string;
}

interface VenueStatsRow {
  id: string;
  name?: string;
  url?: string;
  cityId?: string;
  cityName?: string;
  state?: string;
  stateCode?: string;
  countryCode?: string;
  countryName?: string;
  coordsLat?: number;
  coordsLong?: number;
  concertCount: number;
  lastConcertDate?: string;
  artistNames?: string;
}

interface GeoRow {
  countryName: string;
  cityName: string;
}

interface ContinentStatsRow {
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
}

interface CountryStatsRow {
  name: string;
  cityCount: number;
  venueCount: number;
  lastConcertDate?: string;
  cityNames?: string;
}

interface CityStatsRow {
  name: string;
  countryName: string;
  venueCount: number;
  lastConcertDate?: string;
  venueNames?: string;
}

interface CountryNameRow {
  countryName: string;
}

export class DatabaseOperations {
  private get db() {
    return databaseManager.getDatabase();
  }

  // Country operations
  async insertCountry(country: DBCountry): Promise<void> {
    await this.db.runAsync('INSERT OR REPLACE INTO countries (code, name) VALUES (?, ?)', [
      country.code,
      country.name || null,
    ]);
  }

  // City operations
  async insertCity(city: DBCity): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO cities 
       (id, name, state, stateCode, countryCode, coordsLat, coordsLong) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        city.id,
        city.name || null,
        city.state || null,
        city.stateCode || null,
        city.countryCode || null,
        city.coordsLat || null,
        city.coordsLong || null,
      ],
    );
  }

  // Artist operations
  async insertArtist(artist: DBArtist): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO artists 
       (mbid, tmid, name, sortName, disambiguation, url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        artist.mbid,
        artist.tmid || null,
        artist.name || null,
        artist.sortName || null,
        artist.disambiguation || null,
        artist.url || null,
      ],
    );
  }

  // Venue operations
  async insertVenue(venue: DBVenue): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO venues (id, name, cityId, url) VALUES (?, ?, ?, ?)',
      [venue.id, venue.name || null, venue.cityId || null, venue.url || null],
    );
  }

  // Tour operations
  async insertTour(tour: DBTour): Promise<void> {
    await this.db.runAsync('INSERT OR REPLACE INTO tours (name) VALUES (?)', [tour.name]);
  }

  // Setlist operations
  async insertSetlist(setlist: DBSetlist): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO setlists 
       (id, versionId, artistMbid, venueId, tourName, eventDate, lastUpdated, lastFmEventId, info, url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        setlist.id,
        setlist.versionId || null,
        setlist.artistMbid || null,
        setlist.venueId || null,
        setlist.tourName || null,
        setlist.eventDate || null,
        setlist.lastUpdated || null,
        setlist.lastFmEventId || null,
        setlist.info || null,
        setlist.url || null,
      ],
    );
  }

  // Set operations
  async insertSet(set: DBSet): Promise<void> {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO sets (setlistId, name, encore, songOrder) VALUES (?, ?, ?, ?)',
      [set.setlistId, set.name || null, set.encore || null, set.songOrder],
    );
  }

  // Song operations
  async insertSong(song: DBSong): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO songs 
       (setId, name, tape, info, withArtistMbid, coverArtistMbid, songOrder) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        song.setId,
        song.name || null,
        song.tape || null,
        song.info || null,
        song.withArtistMbid || null,
        song.coverArtistMbid || null,
        song.songOrder,
      ],
    );
  }

  // Metadata operations
  async upsertMetadata(key: string, value: string): Promise<void> {
    await this.db.runAsync('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', [
      key,
      value,
    ]);
  }

  async getMetadata(key: string): Promise<string | null> {
    const result = (await this.db.getFirstAsync('SELECT value FROM metadata WHERE key = ?', [
      key,
    ])) as { value: string } | null;
    return result?.value ?? null;
  }

  async getLastFetchedAt(): Promise<Date | null> {
    const value = await this.getMetadata('lastFetchedAt');
    return value ? new Date(value) : null;
  }

  async updateLastFetchedAt(date: Date = new Date()): Promise<void> {
    await this.upsertMetadata('lastFetchedAt', date.toISOString());
  }

  // Query operations
  async getAllSetlists(): Promise<SetlistWithDetails[]> {
    const result = (await this.db.getAllAsync(`
      SELECT
        sl.*,
        a.mbid as artistMbid,
        a.tmid as artistTmid,
        a.name as artistName,
        a.sortName as artistSortName,
        a.disambiguation as artistDisambiguation,
        a.url as artistUrl,
        v.id as venueId,
        v.name as venueName,
        v.url as venueUrl,
        c.id as cityId,
        c.name as cityName,
        c.state as cityState,
        c.stateCode as cityStateCode,
        c.countryCode as cityCountryCode,
        c.coordsLat as cityCoordsLat,
        c.coordsLong as cityCoordsLong,
        co.code as countryCode,
        co.name as countryName,
        t.name as tourName
      FROM setlists sl
      LEFT JOIN artists a ON sl.artistMbid = a.mbid
      LEFT JOIN venues v ON sl.venueId = v.id
      LEFT JOIN cities c ON v.cityId = c.id
      LEFT JOIN countries co ON c.countryCode = co.code
      LEFT JOIN tours t ON sl.tourName = t.name
      ORDER BY sl.eventDate DESC
    `)) as SetlistJoinRow[];

    return result.map(
      (row) =>
        ({
          id: row.id,
          versionId: row.versionId,
          artistMbid: row.artistMbid,
          venueId: row.venueId,
          tourName: row.tourName,
          eventDate: row.eventDate,
          lastUpdated: row.lastUpdated,
          lastFmEventId: row.lastFmEventId,
          info: row.info,
          url: row.url,
          artist: row.artistMbid
            ? {
                mbid: row.artistMbid,
                tmid: row.artistTmid,
                name: row.artistName,
                sortName: row.artistSortName,
                disambiguation: row.artistDisambiguation,
                url: row.artistUrl,
              }
            : undefined,
          venue: row.venueId
            ? {
                id: row.venueId,
                name: row.venueName,
                cityId: row.cityId,
                url: row.venueUrl,
              }
            : undefined,
          city: row.cityId
            ? {
                id: row.cityId,
                name: row.cityName,
                state: row.cityState,
                stateCode: row.cityStateCode,
                countryCode: row.cityCountryCode,
                coordsLat: row.cityCoordsLat,
                coordsLong: row.cityCoordsLong,
              }
            : undefined,
          country: row.countryCode
            ? {
                code: row.countryCode,
                name: row.countryName,
              }
            : undefined,
          tour: row.tourName
            ? {
                name: row.tourName,
              }
            : undefined,
        }) as SetlistWithDetails,
    );
  }

  async getSetlistById(id: string): Promise<SetlistWithDetails | null> {
    const result = (await this.db.getFirstAsync(
      `
      SELECT
        sl.*,
        a.mbid as artistMbid,
        a.name as artistName,
        a.sortName as artistSortName,
        a.disambiguation as artistDisambiguation,
        a.url as artistUrl,
        v.id as venueId,
        v.name as venueName,
        v.url as venueUrl,
        c.id as cityId,
        c.name as cityName,
        c.state as cityState,
        c.stateCode as cityStateCode,
        c.countryCode as cityCountryCode,
        co.code as countryCode,
        co.name as countryName,
        t.name as tourName
      FROM setlists sl
      LEFT JOIN artists a ON sl.artistMbid = a.mbid
      LEFT JOIN venues v ON sl.venueId = v.id
      LEFT JOIN cities c ON v.cityId = c.id
      LEFT JOIN countries co ON c.countryCode = co.code
      LEFT JOIN tours t ON sl.tourName = t.name
      WHERE sl.id = ?
    `,
      [id],
    )) as SetlistJoinRow | null;

    if (!result) return null;

    // Get sets and songs for this setlist
    const sets = await this.getSetsForSetlist(id);

    // Transform the flat result into the proper structure
    return {
      id: result.id,
      versionId: result.versionId,
      artistMbid: result.artistMbid,
      venueId: result.venueId,
      tourName: result.tourName,
      eventDate: result.eventDate,
      lastUpdated: result.lastUpdated,
      lastFmEventId: result.lastFmEventId,
      info: result.info,
      url: result.url,
      artist: result.artistMbid
        ? {
            mbid: result.artistMbid,
            name: result.artistName,
            sortName: result.artistSortName,
            disambiguation: result.artistDisambiguation,
            url: result.artistUrl,
          }
        : undefined,
      venue: result.venueId
        ? {
            id: result.venueId,
            name: result.venueName,
            cityId: result.cityId,
            url: result.venueUrl,
          }
        : undefined,
      city: result.cityId
        ? {
            id: result.cityId,
            name: result.cityName,
            state: result.cityState,
            stateCode: result.cityStateCode,
            countryCode: result.cityCountryCode,
            coordsLat: result.coordsLat,
            coordsLong: result.coordsLong,
          }
        : undefined,
      country: result.countryCode
        ? {
            code: result.countryCode,
            name: result.countryName,
          }
        : undefined,
      tour: result.tourName
        ? {
            name: result.tourName,
          }
        : undefined,
      sets: sets,
    } as SetlistWithDetails;
  }

  async getSetsForSetlist(setlistId: string, includeSongs = true): Promise<SetWithSongs[]> {
    if (!includeSongs) {
      return (await this.db.getAllAsync('SELECT * FROM sets WHERE setlistId = ? ORDER BY id', [
        setlistId,
      ])) as SetWithSongs[];
    }

    const rows = (await this.db.getAllAsync(
      `
      SELECT
        st.id       AS setId,
        st.setlistId,
        st.name     AS setName,
        st.encore,
        st.songOrder AS setSongOrder,
        s.id        AS songId,
        s.name      AS songName,
        s.tape,
        s.info      AS songInfo,
        s.withArtistMbid,
        s.coverArtistMbid,
        s.songOrder AS songSongOrder,
        s.setId     AS songSetId,
        wa.name     AS withArtistName,
        ca.name     AS coverArtistName
      FROM sets st
      LEFT JOIN songs s ON s.setId = st.id
      LEFT JOIN artists wa ON s.withArtistMbid = wa.mbid
      LEFT JOIN artists ca ON s.coverArtistMbid = ca.mbid
      WHERE st.setlistId = ?
      ORDER BY st.id, s.songOrder
    `,
      [setlistId],
    )) as SetSongJoinRow[];

    const setsMap = new Map<number, SetWithSongs>();

    for (const row of rows) {
      if (!setsMap.has(row.setId)) {
        setsMap.set(row.setId, {
          id: row.setId,
          setlistId: row.setlistId,
          name: row.setName,
          encore: row.encore,
          songOrder: row.setSongOrder,
          songs: [],
        });
      }

      if (row.songId != null) {
        const currentSet = setsMap.get(row.setId);
        currentSet?.songs?.push({
          id: row.songId,
          setId: row.songSetId,
          name: row.songName,
          tape: row.tape,
          info: row.songInfo,
          withArtistMbid: row.withArtistMbid,
          coverArtistMbid: row.coverArtistMbid,
          withArtist: row.withArtistMbid
            ? { mbid: row.withArtistMbid, name: row.withArtistName }
            : undefined,
          coverArtist: row.coverArtistMbid
            ? { mbid: row.coverArtistMbid, name: row.coverArtistName }
            : undefined,
          songOrder: row.songSongOrder,
        });
      }
    }

    return Array.from(setsMap.values());
  }

  async getAllSongs(): Promise<DBSong[]> {
    const result = await this.db.getAllAsync('SELECT * FROM songs ORDER BY setId, songOrder');

    return result as DBSong[];
  }

  async getSongsWithSetInfo(): Promise<SongWithSetInfoRow[]> {
    const result = await this.db.getAllAsync(`
      SELECT 
        s.id as songId,
        s.name as songName,
        s.tape,
        s.info,
        s.songOrder,
        st.id as setId,
        st.name as setName,
        st.encore,
        sl.id as setlistId,
        sl.eventDate,
        a.name as artistName
      FROM songs s
      LEFT JOIN sets st ON s.setId = st.id
      LEFT JOIN setlists sl ON st.setlistId = sl.id
      LEFT JOIN artists a ON sl.artistMbid = a.mbid
      ORDER BY sl.eventDate DESC, st.songOrder, s.songOrder
    `);

    return result as SongWithSetInfoRow[];
  }

  // Get statistics
  async getDatabaseCounts(): Promise<{
    totalSetlists: number;
    totalArtists: number;
    totalVenues: number;
    totalSongs: number;
  }> {
    const [setlists, artists, venues, songs] = await Promise.all([
      this.db.getFirstAsync('SELECT COUNT(*) as count FROM setlists'),
      this.db.getFirstAsync('SELECT COUNT(*) as count FROM artists'),
      this.db.getFirstAsync('SELECT COUNT(*) as count FROM venues'),
      this.db.getFirstAsync('SELECT COUNT(*) as count FROM songs'),
    ]);

    return {
      totalSetlists: (setlists as CountRow | null)?.count || 0,
      totalArtists: (artists as CountRow | null)?.count || 0,
      totalVenues: (venues as CountRow | null)?.count || 0,
      totalSongs: (songs as CountRow | null)?.count || 0,
    };
  }

  async getDashboardStats(): Promise<{
    totalConcerts: number;
    totalArtists: number;
    totalVenues: number;
    totalCountries: number;
    topArtist: { mbid: string; name: string; count: number } | null;
    topVenue: { id: string; name: string; cityName: string; count: number } | null;
    firstConcert: { setlistId: string; artistName: string; eventDate: string } | null;
    lastConcert: { setlistId: string; artistName: string; eventDate: string } | null;
    concertsByYear: { year: string; count: number }[];
  }> {
    const [counts, topArtist, topVenue, firstConcert, lastConcert, byYear] = await Promise.all([
      this.db.getFirstAsync(`
        SELECT
          (SELECT COUNT(*) FROM setlists) as concerts,
          (SELECT COUNT(DISTINCT artistMbid) FROM setlists) as artists,
          (SELECT COUNT(DISTINCT venueId) FROM setlists) as venues,
          (SELECT COUNT(DISTINCT co.code) FROM setlists sl
           INNER JOIN venues v ON sl.venueId = v.id
           INNER JOIN cities c ON v.cityId = c.id
           INNER JOIN countries co ON c.countryCode = co.code) as countries
      `) as Promise<DashboardCountsRow | null>,
      this.db.getFirstAsync(`
        SELECT a.mbid, a.name, COUNT(*) as count
        FROM setlists sl
        INNER JOIN artists a ON sl.artistMbid = a.mbid
        GROUP BY sl.artistMbid
        ORDER BY count DESC
        LIMIT 1
      `) as Promise<TopArtistRow | null>,
      this.db.getFirstAsync(`
        SELECT v.id, v.name, c.name as cityName, COUNT(*) as count
        FROM setlists sl
        INNER JOIN venues v ON sl.venueId = v.id
        LEFT JOIN cities c ON v.cityId = c.id
        GROUP BY sl.venueId
        ORDER BY count DESC
        LIMIT 1
      `) as Promise<TopVenueRow | null>,
      this.db.getFirstAsync(`
        SELECT sl.id as setlistId, a.name as artistName, sl.eventDate
        FROM setlists sl
        LEFT JOIN artists a ON sl.artistMbid = a.mbid
        ORDER BY substr(sl.eventDate, 7, 4) || substr(sl.eventDate, 4, 2) || substr(sl.eventDate, 1, 2) ASC
        LIMIT 1
      `) as Promise<ConcertDateRow | null>,
      this.db.getFirstAsync(`
        SELECT sl.id as setlistId, a.name as artistName, sl.eventDate
        FROM setlists sl
        LEFT JOIN artists a ON sl.artistMbid = a.mbid
        ORDER BY substr(sl.eventDate, 7, 4) || substr(sl.eventDate, 4, 2) || substr(sl.eventDate, 1, 2) DESC
        LIMIT 1
      `) as Promise<ConcertDateRow | null>,
      this.db.getAllAsync(`
        SELECT substr(eventDate, 7, 4) as year, COUNT(*) as count
        FROM setlists
        GROUP BY year
        ORDER BY year ASC
      `) as Promise<YearCountRow[]>,
    ]);

    return {
      totalConcerts: counts?.concerts || 0,
      totalArtists: counts?.artists || 0,
      totalVenues: counts?.venues || 0,
      totalCountries: counts?.countries || 0,
      topArtist: topArtist?.name
        ? { mbid: topArtist.mbid, name: topArtist.name, count: topArtist.count }
        : null,
      topVenue: topVenue?.name
        ? {
            id: topVenue.id,
            name: topVenue.name,
            cityName: topVenue.cityName,
            count: topVenue.count,
          }
        : null,
      firstConcert: firstConcert?.eventDate
        ? {
            setlistId: firstConcert.setlistId,
            artistName: firstConcert.artistName,
            eventDate: firstConcert.eventDate,
          }
        : null,
      lastConcert: lastConcert?.eventDate
        ? {
            setlistId: lastConcert.setlistId,
            artistName: lastConcert.artistName,
            eventDate: lastConcert.eventDate,
          }
        : null,
      concertsByYear: byYear.map((row) => ({ year: row.year, count: row.count })),
    };
  }

  // Find a past concert that happened around this date in a previous year
  async getOnThisDayConcert(): Promise<{
    setlistId: string;
    artistName: string;
    eventDate: string;
    venueName: string;
    yearsAgo: number;
  } | null> {
    const now = new Date();
    const currentYear = now.getFullYear();
    // DD-MM format for the current date
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');

    // Find concerts within ±7 days of today's month/day in any previous year.
    // We compute the day difference using SQLite date functions:
    // 1. Build a comparable date from the eventDate (DD-MM-YYYY) as YYYY-MM-DD
    // 2. Build a reference date in that same year with today's month/day
    // 3. Compute the absolute day difference
    // 4. Pick the smallest diff, then most recent year
    const result = (await this.db.getFirstAsync(
      `
      SELECT setlistId, artistName, eventDate, venueName, dayDiff FROM (
        SELECT
          sl.id as setlistId,
          a.name as artistName,
          sl.eventDate,
          v.name as venueName,
          ABS(
            julianday(
              substr(sl.eventDate, 7, 4) || '-' || substr(sl.eventDate, 4, 2) || '-' || substr(sl.eventDate, 1, 2)
            ) - julianday(
              substr(sl.eventDate, 7, 4) || '-' || ? || '-' || ?
            )
          ) as dayDiff
        FROM setlists sl
        LEFT JOIN artists a ON sl.artistMbid = a.mbid
        LEFT JOIN venues v ON sl.venueId = v.id
        WHERE CAST(substr(sl.eventDate, 7, 4) AS INTEGER) < ?
      )
      WHERE dayDiff <= 7
      ORDER BY dayDiff ASC, substr(eventDate, 7, 4) DESC
      LIMIT 1
      `,
      [mm, dd, currentYear],
    )) as OnThisDayRow | null;

    if (!result?.eventDate) return null;

    const eventYear = parseInt(result.eventDate.substring(6, 10), 10);
    return {
      setlistId: result.setlistId,
      artistName: result.artistName,
      eventDate: result.eventDate,
      venueName: result.venueName,
      yearsAgo: currentYear - eventYear,
    };
  }

  // Get all artists with their concert counts and stats
  async getArtistsWithStats(): Promise<
    {
      mbid: string;
      name: string;
      sortName?: string;
      disambiguation?: string;
      url?: string;
      concertCount: number;
      lastConcertDate?: string;
      venues: string[];
    }[]
  > {
    // First get basic artist stats
    const result = (await this.db.getAllAsync(`
      SELECT 
        a.mbid,
        a.name,
        a.sortName,
        a.disambiguation,
        a.url,
        COUNT(DISTINCT sl.eventDate || '|' || sl.venueId) as concertCount,
        GROUP_CONCAT(DISTINCT v.name) as venueNames
      FROM artists a
      INNER JOIN setlists sl ON a.mbid = sl.artistMbid
      LEFT JOIN venues v ON sl.venueId = v.id
      GROUP BY a.mbid, a.name, a.sortName, a.disambiguation, a.url
      HAVING COUNT(DISTINCT sl.eventDate || '|' || sl.venueId) > 0
      ORDER BY a.name COLLATE NOCASE
    `)) as ArtistStatsRow[];

    // Then get the last concert date for each artist separately
    const artistsWithLastDates = await Promise.all(
      result.map(async (artist) => {
        const lastConcertResult = (await this.db.getFirstAsync(
          'SELECT eventDate FROM setlists WHERE artistMbid = ? ORDER BY substr(eventDate, 7, 4) || "-" || substr(eventDate, 4, 2) || "-" || substr(eventDate, 1, 2) DESC LIMIT 1',
          [artist.mbid],
        )) as EventDateRow | null;

        return {
          ...artist,
          lastConcertDate: lastConcertResult?.eventDate || null,
        };
      }),
    );

    return artistsWithLastDates.map((row) => ({
      mbid: row.mbid,
      name: row.name || 'Unknown Artist',
      sortName: row.sortName,
      disambiguation: row.disambiguation,
      url: row.url,
      concertCount: row.concertCount || 0,
      lastConcertDate: row.lastConcertDate,
      venues: row.venueNames ? row.venueNames.split(',') : [],
    }));
  }

  // Debug method to check data integrity
  async debugArtistData(): Promise<{
    totalArtists: number;
    artistsWithConcerts: number;
    artistsWithoutConcerts: number;
    orphanedArtists: string[];
  }> {
    const totalArtists = (await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM artists',
    )) as CountRow | null;
    const artistsWithConcerts = (await this.db.getFirstAsync(`
      SELECT COUNT(DISTINCT a.mbid) as count
      FROM artists a
      INNER JOIN setlists sl ON a.mbid = sl.artistMbid
    `)) as CountRow | null;
    const orphanedArtists = (await this.db.getAllAsync(`
      SELECT a.mbid, a.name
      FROM artists a
      LEFT JOIN setlists sl ON a.mbid = sl.artistMbid
      WHERE sl.id IS NULL
    `)) as OrphanedArtistRow[];

    return {
      totalArtists: totalArtists?.count || 0,
      artistsWithConcerts: artistsWithConcerts?.count || 0,
      artistsWithoutConcerts: orphanedArtists.length,
      orphanedArtists: orphanedArtists.map((a) => `${a.name} (${a.mbid})`),
    };
  }

  // Get all venues with their concert counts and stats
  async getVenuesWithStats(): Promise<
    {
      id: string;
      name: string;
      url?: string;
      cityId?: string;
      cityName?: string;
      state?: string;
      stateCode?: string;
      countryCode?: string;
      countryName?: string;
      coordsLat?: number;
      coordsLong?: number;
      concertCount: number;
      lastConcertDate?: string;
      artists: string[];
    }[]
  > {
    const result = (await this.db.getAllAsync(`
      SELECT
        v.id,
        v.name,
        v.url,
        c.id as cityId,
        c.name as cityName,
        c.state,
        c.stateCode,
        c.countryCode,
        co.name as countryName,
        c.coordsLat,
        c.coordsLong,
        COUNT(DISTINCT sl.eventDate) as concertCount,
        (SELECT sl2.eventDate FROM setlists sl2 WHERE sl2.venueId = v.id ORDER BY substr(sl2.eventDate, 7, 4) || "-" || substr(sl2.eventDate, 4, 2) || "-" || substr(sl2.eventDate, 1, 2) DESC LIMIT 1) as lastConcertDate,
        GROUP_CONCAT(DISTINCT a.name) as artistNames
      FROM venues v
      INNER JOIN setlists sl ON v.id = sl.venueId
      LEFT JOIN cities c ON v.cityId = c.id
      LEFT JOIN countries co ON c.countryCode = co.code
      LEFT JOIN artists a ON sl.artistMbid = a.mbid
      GROUP BY v.id, v.name, v.url, c.id, c.name, c.state, c.stateCode, c.countryCode, co.name, c.coordsLat, c.coordsLong
      HAVING COUNT(DISTINCT sl.eventDate) > 0
      ORDER BY v.name COLLATE NOCASE
    `)) as VenueStatsRow[];

    return result.map((row) => ({
      id: row.id,
      name: row.name || 'Unknown Venue',
      url: row.url,
      cityId: row.cityId,
      cityName: row.cityName,
      state: row.state,
      stateCode: row.stateCode,
      countryCode: row.countryCode,
      countryName: row.countryName,
      coordsLat: row.coordsLat,
      coordsLong: row.coordsLong,
      concertCount: row.concertCount || 0,
      lastConcertDate: row.lastConcertDate,
      artists: row.artistNames ? row.artistNames.split(',') : [],
    }));
  }

  // Get setlists by specific artist
  async getSetlistsByArtist(artistMbid: string): Promise<SetlistWithDetails[]> {
    const result = (await this.db.getAllAsync(
      `
      SELECT 
        sl.*,
        a.mbid as artistMbid,
        a.name as artistName,
        a.sortName as artistSortName,
        a.disambiguation as artistDisambiguation,
        a.url as artistUrl,
        v.id as venueId,
        v.name as venueName,
        v.url as venueUrl,
        c.id as cityId,
        c.name as cityName,
        c.state as cityState,
        c.stateCode as cityStateCode,
        c.countryCode as cityCountryCode,
        co.code as countryCode,
        co.name as countryName,
        t.name as tourName
      FROM setlists sl
      LEFT JOIN artists a ON sl.artistMbid = a.mbid
      LEFT JOIN venues v ON sl.venueId = v.id
      LEFT JOIN cities c ON v.cityId = c.id
      LEFT JOIN countries co ON c.countryCode = co.code
      LEFT JOIN tours t ON sl.tourName = t.name
      WHERE sl.artistMbid = ?
    `,
      [artistMbid],
    )) as SetlistJoinRow[];

    return result.map(
      (row) =>
        ({
          id: row.id,
          versionId: row.versionId,
          artistMbid: row.artistMbid,
          venueId: row.venueId,
          tourName: row.tourName,
          eventDate: row.eventDate,
          lastUpdated: row.lastUpdated,
          lastFmEventId: row.lastFmEventId,
          info: row.info,
          url: row.url,
          artist: row.artistMbid
            ? {
                mbid: row.artistMbid,
                name: row.artistName,
                sortName: row.artistSortName,
                disambiguation: row.artistDisambiguation,
                url: row.artistUrl,
              }
            : undefined,
          venue: row.venueId
            ? {
                id: row.venueId,
                name: row.venueName,
                cityId: row.cityId,
                url: row.venueUrl,
              }
            : undefined,
          city: row.cityId
            ? {
                id: row.cityId,
                name: row.cityName,
                state: row.cityState,
                stateCode: row.cityStateCode,
                countryCode: row.cityCountryCode,
                coordsLat: row.coordsLat,
                coordsLong: row.coordsLong,
              }
            : undefined,
          country: row.countryCode
            ? {
                code: row.countryCode,
                name: row.countryName,
              }
            : undefined,
          tour: row.tourName
            ? {
                name: row.tourName,
              }
            : undefined,
        }) as SetlistWithDetails,
    );
  }

  // Get setlists by specific venue
  async getSetlistsByVenue(venueId: string): Promise<SetlistWithDetails[]> {
    const result = (await this.db.getAllAsync(
      `
      SELECT 
        sl.*,
        a.mbid as artistMbid,
        a.name as artistName,
        a.sortName as artistSortName,
        a.disambiguation as artistDisambiguation,
        a.url as artistUrl,
        v.id as venueId,
        v.name as venueName,
        v.url as venueUrl,
        c.id as cityId,
        c.name as cityName,
        c.state as cityState,
        c.stateCode as cityStateCode,
        c.countryCode as cityCountryCode,
        co.code as countryCode,
        co.name as countryName,
        t.name as tourName
      FROM setlists sl
      LEFT JOIN artists a ON sl.artistMbid = a.mbid
      LEFT JOIN venues v ON sl.venueId = v.id
      LEFT JOIN cities c ON v.cityId = c.id
      LEFT JOIN countries co ON c.countryCode = co.code
      LEFT JOIN tours t ON sl.tourName = t.name
      WHERE sl.venueId = ?
    `,
      [venueId],
    )) as SetlistJoinRow[];

    return result.map(
      (row) =>
        ({
          id: row.id,
          versionId: row.versionId,
          artistMbid: row.artistMbid,
          venueId: row.venueId,
          tourName: row.tourName,
          eventDate: row.eventDate,
          lastUpdated: row.lastUpdated,
          lastFmEventId: row.lastFmEventId,
          info: row.info,
          url: row.url,
          artist: row.artistMbid
            ? {
                mbid: row.artistMbid,
                name: row.artistName,
                sortName: row.artistSortName,
                disambiguation: row.artistDisambiguation,
                url: row.artistUrl,
              }
            : undefined,
          venue: row.venueId
            ? {
                id: row.venueId,
                name: row.venueName,
                cityId: row.cityId,
                url: row.venueUrl,
              }
            : undefined,
          city: row.cityId
            ? {
                id: row.cityId,
                name: row.cityName,
                state: row.cityState,
                stateCode: row.cityStateCode,
                countryCode: row.cityCountryCode,
                coordsLat: row.coordsLat,
                coordsLong: row.coordsLong,
              }
            : undefined,
          country: row.countryCode
            ? {
                code: row.countryCode,
                name: row.countryName,
              }
            : undefined,
          tour: row.tourName
            ? {
                name: row.tourName,
              }
            : undefined,
        }) as SetlistWithDetails,
    );
  }

  async getArtistByMbid(mbid: string): Promise<DBArtist | null> {
    const result = await this.db.getFirstAsync('SELECT * FROM artists WHERE mbid = ?', [mbid]);
    return result as DBArtist | null;
  }

  async getVenueById(id: string): Promise<DBVenue | null> {
    const result = await this.db.getFirstAsync('SELECT * FROM venues WHERE id = ?', [id]);
    return result as DBVenue | null;
  }

  // Get geographical statistics for venues
  async getGeographicBreakdown(): Promise<{
    totalContinents: number;
    totalCountries: number;
    totalCities: number;
    continents: string[];
    countries: string[];
    cities: string[];
  }> {
    const result = (await this.db.getAllAsync(`
      SELECT DISTINCT
        co.name as countryName,
        c.name as cityName
      FROM setlists sl
      INNER JOIN venues v ON sl.venueId = v.id
      INNER JOIN cities c ON v.cityId = c.id
      INNER JOIN countries co ON c.countryCode = co.code
      WHERE co.name IS NOT NULL AND c.name IS NOT NULL
      ORDER BY co.name, c.name
    `)) as GeoRow[];

    const countries = [...new Set(result.map((row) => row.countryName))];
    const cities = [...new Set(result.map((row) => row.cityName))];

    // Map countries to continents
    const continents = [...new Set(countries.map((country) => this.getContinent(country)))];

    return {
      totalContinents: continents.length,
      totalCountries: countries.length,
      totalCities: cities.length,
      continents,
      countries,
      cities,
    };
  }

  // Get continents with detailed statistics
  async getContinentsWithStats(): Promise<
    {
      name: string;
      countryCount: number;
      cityCount: number;
      venueCount: number;
      lastConcertDate?: string;
      countries: string[];
    }[]
  > {
    // First get all countries and map them to continents
    const countryResult = (await this.db.getAllAsync(`
      SELECT DISTINCT co.name as countryName
      FROM setlists sl
      INNER JOIN venues v ON sl.venueId = v.id
      INNER JOIN cities c ON v.cityId = c.id
      INNER JOIN countries co ON c.countryCode = co.code
      WHERE co.name IS NOT NULL
    `)) as CountryNameRow[];

    const countries = countryResult.map((row) => row.countryName);
    const continentMap = new Map<string, string[]>();

    // Group countries by continent
    countries.forEach((country) => {
      const continent = this.getContinent(country);
      if (!continentMap.has(continent)) {
        continentMap.set(continent, []);
      }
      const countries = continentMap.get(continent);
      if (countries) {
        countries.push(country);
      }
    });

    // Get detailed stats for each continent
    const continentsWithStats = await Promise.all(
      Array.from(continentMap.entries()).map(async ([continentName, continentCountries]) => {
        const placeholders = continentCountries.map(() => '?').join(', ');

        const statsResult = (await this.db.getAllAsync(
          `
          SELECT
            COUNT(DISTINCT c.name) as cityCount,
            COUNT(DISTINCT v.id) as venueCount,
            MAX(sl.eventDate) as lastConcertDate
          FROM setlists sl
          INNER JOIN venues v ON sl.venueId = v.id
          INNER JOIN cities c ON v.cityId = c.id
          INNER JOIN countries co ON c.countryCode = co.code
          WHERE co.name IN (${placeholders})
        `,
          continentCountries,
        )) as ContinentStatsRow[];

        const stats = statsResult[0] || {};

        return {
          name: continentName,
          countryCount: continentCountries.length,
          cityCount: stats.cityCount || 0,
          venueCount: stats.venueCount || 0,
          lastConcertDate: stats.lastConcertDate,
          countries: continentCountries,
        };
      }),
    );

    return continentsWithStats.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get countries with detailed statistics
  async getCountriesWithStats(): Promise<
    {
      name: string;
      cityCount: number;
      venueCount: number;
      lastConcertDate?: string;
      cities: string[];
    }[]
  > {
    const result = (await this.db.getAllAsync(`
      SELECT
        co.name,
        COUNT(DISTINCT c.name) as cityCount,
        COUNT(DISTINCT v.id) as venueCount,
        MAX(sl.eventDate) as lastConcertDate,
        GROUP_CONCAT(DISTINCT c.name) as cityNames
      FROM setlists sl
      INNER JOIN venues v ON sl.venueId = v.id
      INNER JOIN cities c ON v.cityId = c.id
      INNER JOIN countries co ON c.countryCode = co.code
      WHERE co.name IS NOT NULL AND c.name IS NOT NULL
      GROUP BY co.name
      ORDER BY co.name
    `)) as CountryStatsRow[];

    return result.map((row) => ({
      name: row.name,
      cityCount: row.cityCount || 0,
      venueCount: row.venueCount || 0,
      lastConcertDate: row.lastConcertDate,
      cities: row.cityNames ? row.cityNames.split(',') : [],
    }));
  }

  // Get cities with detailed statistics
  async getCitiesWithStats(): Promise<
    {
      name: string;
      countryName: string;
      venueCount: number;
      lastConcertDate?: string;
      venues: string[];
    }[]
  > {
    const result = (await this.db.getAllAsync(`
      SELECT
        c.name,
        co.name as countryName,
        COUNT(DISTINCT v.id) as venueCount,
        MAX(sl.eventDate) as lastConcertDate,
        GROUP_CONCAT(DISTINCT v.name) as venueNames
      FROM setlists sl
      INNER JOIN venues v ON sl.venueId = v.id
      INNER JOIN cities c ON v.cityId = c.id
      INNER JOIN countries co ON c.countryCode = co.code
      WHERE c.name IS NOT NULL AND co.name IS NOT NULL
      GROUP BY c.name, co.name
      ORDER BY c.name
    `)) as CityStatsRow[];

    return result.map((row) => ({
      name: row.name,
      countryName: row.countryName,
      venueCount: row.venueCount || 0,
      lastConcertDate: row.lastConcertDate,
      venues: row.venueNames ? row.venueNames.split(',') : [],
    }));
  }

  // Helper function to map countries to continents
  getContinent(country: string): string {
    const continentMap: { [key: string]: string } = {
      // North America
      'United States': 'North America',
      Canada: 'North America',
      Mexico: 'North America',

      // Europe
      Germany: 'Europe',
      'United Kingdom': 'Europe',
      France: 'Europe',
      Italy: 'Europe',
      Spain: 'Europe',
      Netherlands: 'Europe',
      Belgium: 'Europe',
      Switzerland: 'Europe',
      Austria: 'Europe',
      Sweden: 'Europe',
      Norway: 'Europe',
      Denmark: 'Europe',
      Finland: 'Europe',
      Poland: 'Europe',
      'Czech Republic': 'Europe',
      Czechia: 'Europe',
      Hungary: 'Europe',
      Portugal: 'Europe',
      Ireland: 'Europe',
      Greece: 'Europe',
      Croatia: 'Europe',
      Slovenia: 'Europe',
      Slovakia: 'Europe',
      Romania: 'Europe',
      Bulgaria: 'Europe',

      // South America
      Brazil: 'South America',
      Argentina: 'South America',
      Chile: 'South America',
      Colombia: 'South America',
      Peru: 'South America',
      Uruguay: 'South America',
      Venezuela: 'South America',
      Ecuador: 'South America',

      // Central America
      'Costa Rica': 'Central America',
      Panama: 'Central America',
      Nicaragua: 'Central America',
      Honduras: 'Central America',
      'El Salvador': 'Central America',
      Guatemala: 'Central America',

      // Asia
      Japan: 'Asia',
      'South Korea': 'Asia',
      China: 'Asia',
      India: 'Asia',
      Thailand: 'Asia',
      Singapore: 'Asia',
      Malaysia: 'Asia',
      Indonesia: 'Asia',
      Philippines: 'Asia',

      // Oceania
      Australia: 'Oceania',
      'New Zealand': 'Oceania',

      // Africa
      'South Africa': 'Africa',
      Egypt: 'Africa',
      Morocco: 'Africa',
      Nigeria: 'Africa',
    };

    return continentMap[country] || 'Other';
  }

  // Clear all data for testing (use with caution!)
  async clearAllData(): Promise<void> {
    try {
      await this.db.execAsync(`
        DELETE FROM songs;
        DELETE FROM sets;
        DELETE FROM setlists;
        DELETE FROM venues;
        DELETE FROM artists;
      `);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const dbOperations = new DatabaseOperations();
