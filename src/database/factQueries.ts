// "As of this show" facts for the concert-detail recognition sheet. Hand-written,
// parameterized queries: no SQL is ever generated from user input.
import { databaseManager } from '@/database/database';
import { dbOperations } from '@/database/operations';
import { parseSetlistDate } from '@/utils/date';

const ISO = `substr(eventDate,7,4)||'-'||substr(eventDate,4,2)||'-'||substr(eventDate,1,2)`;

function db() {
  return databaseManager.getDatabase();
}

// ── Concert-detail recognition facts ────────────────────────────────────────
// "As of this show" metrics for a single setlist — ordinal position in the artist's
// history, geographic diversity, recency vs. the previous show, and venue novelty.
// All ordering ties (two shows on the same date) are broken by setlist id so the
// ordinal position is always deterministic, never dependent on unspecified row order.

interface ArtistShowGeoRow {
  setlistId: string;
  eventDate: string;
  venueName: string | null;
  cityName: string | null;
  cityId: string | null;
  countryCode: string | null;
  countryName: string | null;
}

async function showsForArtistWithGeo(artistMbid: string): Promise<ArtistShowGeoRow[]> {
  return db().getAllAsync<ArtistShowGeoRow>(
    `
    SELECT sl.id AS setlistId, sl.eventDate, v.name AS venueName,
           c.name AS cityName, c.id AS cityId, co.code AS countryCode, co.name AS countryName
    FROM setlists sl
    LEFT JOIN venues v ON sl.venueId = v.id
    LEFT JOIN cities c ON v.cityId = c.id
    LEFT JOIN countries co ON c.countryCode = co.code
    WHERE sl.artistMbid = ?
    ORDER BY ${ISO} ASC, sl.id ASC
    `,
    [artistMbid],
  );
}

async function setlistIdsAtVenue(venueId: string): Promise<string[]> {
  const rows = await db().getAllAsync<{ setlistId: string }>(
    `
    SELECT sl.id AS setlistId
    FROM setlists sl
    WHERE sl.venueId = ?
    ORDER BY ${ISO} ASC, sl.id ASC
    `,
    [venueId],
  );
  return rows.map((r) => r.setlistId);
}

export interface ConcertRecognitionFacts {
  /** 1-based position of this show among all shows for this artist, as of its date. */
  ordinalForArtist: number;
  previousShowForArtist: {
    eventDate: string;
    venueName: string | null;
    cityName: string | null;
    countryName: string | null;
  } | null;
  daysSincePreviousShowForArtist: number | null;
  /** Distinct countries seen for this artist, counting this show. */
  distinctCountriesForArtistSoFar: number;
  /** Distinct cities seen for this artist, counting this show. */
  distinctCitiesForArtistSoFar: number;
  /** True if this is the first time this artist's country has appeared (never true for the 1st-ever show). */
  isNewCountryForArtist: boolean;
  /** True if this is the first time this artist's city has appeared (never true for the 1st-ever show). */
  isNewCityForArtist: boolean;
  /** True if no one has played this venue (any artist) before this show. */
  isFirstVisitToVenue: boolean;
  /** 1-based position of this show among all shows at this venue, any artist. */
  venueVisitOrdinal: number;
}

export async function getConcertRecognitionFacts(
  setlistId: string,
): Promise<ConcertRecognitionFacts | null> {
  const setlist = await dbOperations.getSetlistById(setlistId);
  if (!setlist?.artistMbid) return null;

  const shows = await showsForArtistWithGeo(setlist.artistMbid);
  const index = shows.findIndex((s) => s.setlistId === setlistId);
  if (index === -1) return null;

  const current = shows[index];
  const priorCountries = new Set(
    shows
      .slice(0, index)
      .map((s) => s.countryCode)
      .filter(Boolean),
  );
  const priorCities = new Set(
    shows
      .slice(0, index)
      .map((s) => s.cityId)
      .filter(Boolean),
  );

  const seenCountries = new Set(
    shows
      .slice(0, index + 1)
      .map((s) => s.countryCode)
      .filter(Boolean),
  );
  const seenCities = new Set(
    shows
      .slice(0, index + 1)
      .map((s) => s.cityId)
      .filter(Boolean),
  );

  const previous = index > 0 ? shows[index - 1] : null;
  let daysSincePreviousShowForArtist: number | null = null;
  if (previous) {
    const prevDate = parseSetlistDate(previous.eventDate);
    const currDate = parseSetlistDate(current.eventDate);
    daysSincePreviousShowForArtist = Math.max(
      0,
      Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }

  let venueVisitOrdinal = 1;
  let isFirstVisitToVenue = true;
  if (setlist.venueId) {
    const venueIds = await setlistIdsAtVenue(setlist.venueId);
    const venueIndex = venueIds.indexOf(setlistId);
    venueVisitOrdinal = venueIndex === -1 ? 1 : venueIndex + 1;
    isFirstVisitToVenue = venueVisitOrdinal === 1;
  }

  return {
    ordinalForArtist: index + 1,
    previousShowForArtist: previous
      ? {
          eventDate: previous.eventDate,
          venueName: previous.venueName,
          cityName: previous.cityName,
          countryName: previous.countryName,
        }
      : null,
    daysSincePreviousShowForArtist,
    distinctCountriesForArtistSoFar: seenCountries.size,
    distinctCitiesForArtistSoFar: seenCities.size,
    isNewCountryForArtist:
      index > 0 && !!current.countryCode && !priorCountries.has(current.countryCode),
    isNewCityForArtist: index > 0 && !!current.cityId && !priorCities.has(current.cityId),
    isFirstVisitToVenue,
    venueVisitOrdinal,
  };
}
