// Hand-written, parameterized queries backing the chat intents (Tier 1).
// No SQL is ever generated from user input — this is a fixed, vetted query surface;
// the chat parser only ever chooses which of these functions to call and with what args.
import { databaseManager } from '@/database/database';
import { dbOperations } from '@/database/operations';
import { parseSetlistDate } from '@/utils/date';

const ISO = `substr(eventDate,7,4)||'-'||substr(eventDate,4,2)||'-'||substr(eventDate,1,2)`;

export interface ShowSummary {
  eventDate: string;
  venueName: string | null;
  cityName: string | null;
}

interface NamedCount {
  name: string;
  count: number;
}

function db() {
  return databaseManager.getDatabase();
}

// ── Single-artist history ───────────────────────────────────────────────────

async function showsForArtist(artistMbid: string): Promise<ShowSummary[]> {
  return db().getAllAsync<ShowSummary>(
    `
    SELECT sl.eventDate, v.name AS venueName, c.name AS cityName
    FROM setlists sl
    LEFT JOIN venues v ON sl.venueId = v.id
    LEFT JOIN cities c ON v.cityId = c.id
    WHERE sl.artistMbid = ?
    ORDER BY ${ISO} ASC
    `,
    [artistMbid],
  );
}

export async function firstTimeSeenArtist(artistMbid: string): Promise<ShowSummary | null> {
  const shows = await showsForArtist(artistMbid);
  return shows[0] ?? null;
}

export async function lastTimeSeenArtist(artistMbid: string): Promise<ShowSummary | null> {
  const shows = await showsForArtist(artistMbid);
  return shows[shows.length - 1] ?? null;
}

export async function countTimesSeenArtist(artistMbid: string): Promise<number> {
  const shows = await showsForArtist(artistMbid);
  return shows.length;
}

export async function listTimesSeenArtist(artistMbid: string): Promise<ShowSummary[]> {
  return showsForArtist(artistMbid);
}

export async function venuesSeenArtistAt(artistMbid: string): Promise<NamedCount[]> {
  return db().getAllAsync<NamedCount>(
    `
    SELECT v.name AS name, COUNT(*) AS count
    FROM setlists sl
    JOIN venues v ON sl.venueId = v.id
    WHERE sl.artistMbid = ?
    GROUP BY v.id
    ORDER BY count DESC, name ASC
    `,
    [artistMbid],
  );
}

export async function toursSeenArtistOn(artistMbid: string): Promise<string[]> {
  const rows = await db().getAllAsync<{ tourName: string }>(
    `
    SELECT DISTINCT tourName
    FROM setlists
    WHERE artistMbid = ? AND tourName IS NOT NULL
    ORDER BY tourName ASC
    `,
    [artistMbid],
  );
  return rows.map((r) => r.tourName);
}

export async function showsForArtistInYear(
  artistMbid: string,
  year: string,
): Promise<ShowSummary[]> {
  return db().getAllAsync<ShowSummary>(
    `
    SELECT sl.eventDate, v.name AS venueName, c.name AS cityName
    FROM setlists sl
    LEFT JOIN venues v ON sl.venueId = v.id
    LEFT JOIN cities c ON v.cityId = c.id
    WHERE sl.artistMbid = ? AND substr(sl.eventDate, 7, 4) = ?
    ORDER BY ${ISO} ASC
    `,
    [artistMbid, year],
  );
}

export async function compareArtistCounts(
  artistMbidA: string,
  artistMbidB: string,
): Promise<{ countA: number; countB: number }> {
  const [countA, countB] = await Promise.all([
    countTimesSeenArtist(artistMbidA),
    countTimesSeenArtist(artistMbidB),
  ]);
  return { countA, countB };
}

export async function longestGapBetweenArtistShows(
  artistMbid: string,
): Promise<{ days: number; fromDate: string; toDate: string } | null> {
  const shows = await showsForArtist(artistMbid);
  if (shows.length < 2) return null;

  let best: { days: number; fromDate: string; toDate: string } | null = null;
  for (let i = 1; i < shows.length; i++) {
    const prev = parseSetlistDate(shows[i - 1].eventDate);
    const curr = parseSetlistDate(shows[i].eventDate);
    const days = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (!best || days > best.days) {
      best = { days, fromDate: shows[i - 1].eventDate, toDate: shows[i].eventDate };
    }
  }
  return best;
}

// ── Aggregates ───────────────────────────────────────────────────────────────

export async function topArtistInASingleYear(): Promise<{
  name: string;
  year: string;
  count: number;
} | null> {
  return db().getFirstAsync<{ name: string; year: string; count: number }>(`
    SELECT a.name AS name, substr(sl.eventDate, 7, 4) AS year, COUNT(*) AS count
    FROM setlists sl
    JOIN artists a ON sl.artistMbid = a.mbid
    GROUP BY sl.artistMbid, year
    ORDER BY count DESC
    LIMIT 1
  `);
}

export async function top5Artists(): Promise<NamedCount[]> {
  return db().getAllAsync<NamedCount>(`
    SELECT a.name AS name, COUNT(*) AS count
    FROM setlists sl
    JOIN artists a ON sl.artistMbid = a.mbid
    GROUP BY sl.artistMbid
    ORDER BY count DESC
    LIMIT 5
  `);
}

export async function artistsSeenAtLeastNTimes(n: number): Promise<NamedCount[]> {
  return db().getAllAsync<NamedCount>(
    `
    SELECT a.name AS name, COUNT(*) AS count
    FROM setlists sl
    JOIN artists a ON sl.artistMbid = a.mbid
    GROUP BY sl.artistMbid
    HAVING COUNT(*) >= ?
    ORDER BY count DESC
    `,
    [n],
  );
}

export async function artistsSeenMoreThanOnceCount(): Promise<number> {
  const row = await db().getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) AS count FROM (
      SELECT artistMbid FROM setlists GROUP BY artistMbid HAVING COUNT(*) > 1
    )
  `);
  return row?.count ?? 0;
}

export async function artistsSeenOnlyOnceCount(): Promise<number> {
  const row = await db().getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) AS count FROM (
      SELECT artistMbid FROM setlists GROUP BY artistMbid HAVING COUNT(*) = 1
    )
  `);
  return row?.count ?? 0;
}

// ── Time-based ───────────────────────────────────────────────────────────────

export async function concertsInYear(year: string): Promise<number> {
  const row = await db().getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM setlists WHERE substr(eventDate, 7, 4) = ?`,
    [year],
  );
  return row?.count ?? 0;
}

export async function averageConcertsPerYear(): Promise<number> {
  const row = await db().getFirstAsync<{ total: number; years: number }>(`
    SELECT COUNT(*) AS total, COUNT(DISTINCT substr(eventDate, 7, 4)) AS years
    FROM setlists
  `);
  if (!row || row.years === 0) return 0;
  return Math.round((row.total / row.years) * 10) / 10;
}

export async function daysSinceLastConcert(): Promise<number | null> {
  const stats = await dbOperations.getDashboardStats();
  if (!stats.lastConcert) return null;
  const last = parseSetlistDate(stats.lastConcert.eventDate);
  const now = new Date();
  return Math.max(0, Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)));
}

// ── Geographic ───────────────────────────────────────────────────────────────

export async function citiesSeenList(): Promise<string[]> {
  const rows = await db().getAllAsync<{ name: string }>(`
    SELECT DISTINCT c.name AS name
    FROM setlists sl
    JOIN venues v ON sl.venueId = v.id
    JOIN cities c ON v.cityId = c.id
    WHERE c.name IS NOT NULL
    ORDER BY c.name ASC
  `);
  return rows.map((r) => r.name);
}

export async function showsInCountry(countryCode: string): Promise<number> {
  const row = await db().getFirstAsync<{ count: number }>(
    `
    SELECT COUNT(*) AS count
    FROM setlists sl
    JOIN venues v ON sl.venueId = v.id
    JOIN cities c ON v.cityId = c.id
    WHERE c.countryCode = ?
    `,
    [countryCode],
  );
  return row?.count ?? 0;
}

export async function mostVisitedCountry(): Promise<NamedCount | null> {
  return db().getFirstAsync<NamedCount>(`
    SELECT co.name AS name, COUNT(*) AS count
    FROM setlists sl
    JOIN venues v ON sl.venueId = v.id
    JOIN cities c ON v.cityId = c.id
    JOIN countries co ON c.countryCode = co.code
    GROUP BY co.code
    ORDER BY count DESC
    LIMIT 1
  `);
}

export async function mostVisitedCity(): Promise<NamedCount | null> {
  return db().getFirstAsync<NamedCount>(`
    SELECT c.name AS name, COUNT(*) AS count
    FROM setlists sl
    JOIN venues v ON sl.venueId = v.id
    JOIN cities c ON v.cityId = c.id
    GROUP BY c.id
    ORDER BY count DESC
    LIMIT 1
  `);
}

export async function bandsSeenInCountry(countryCode: string): Promise<string[]> {
  const rows = await db().getAllAsync<{ name: string }>(
    `
    SELECT DISTINCT a.name AS name
    FROM setlists sl
    JOIN artists a ON sl.artistMbid = a.mbid
    JOIN venues v ON sl.venueId = v.id
    JOIN cities c ON v.cityId = c.id
    WHERE c.countryCode = ?
    ORDER BY a.name ASC
    `,
    [countryCode],
  );
  return rows.map((r) => r.name);
}

export async function bandsSeenInCityYear(cityId: string, year: string): Promise<string[]> {
  const rows = await db().getAllAsync<{ name: string }>(
    `
    SELECT DISTINCT a.name AS name
    FROM setlists sl
    JOIN artists a ON sl.artistMbid = a.mbid
    JOIN venues v ON sl.venueId = v.id
    WHERE v.cityId = ? AND substr(sl.eventDate, 7, 4) = ?
    ORDER BY a.name ASC
    `,
    [cityId, year],
  );
  return rows.map((r) => r.name);
}

export async function countriesSeenInYear(year: string): Promise<string[]> {
  const rows = await db().getAllAsync<{ name: string }>(
    `
    SELECT DISTINCT co.name AS name
    FROM setlists sl
    JOIN venues v ON sl.venueId = v.id
    JOIN cities c ON v.cityId = c.id
    JOIN countries co ON c.countryCode = co.code
    WHERE substr(sl.eventDate, 7, 4) = ?
    ORDER BY co.name ASC
    `,
    [year],
  );
  return rows.map((r) => r.name);
}
