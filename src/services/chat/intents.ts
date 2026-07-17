// Tier 1 intent registry: pattern → slots → handler.
// Every handler calls a fixed, hand-written query (chatQueries.ts / dbOperations) —
// no SQL is ever built from user input.
import i18n from '@/i18n';
import { dbOperations } from '@/database/operations';
import * as chatQueries from '@/database/chatQueries';
import { formatDate, formatIsoDate, monthDisplayName, monthNameToNumber } from '@/utils/date';
import { findArtists, findCountries, findCities, findVenues } from '@/services/chat/entityResolver';
import type { ChatIntent } from '@/services/chat/types';
import type { ArtistShowSummary } from '@/database/chatQueries';

function requireArtist(resolved: { artist?: { mbid: string; name?: string } }): {
  mbid: string;
  name: string;
} {
  if (!resolved.artist) throw new Error('artist slot not resolved');
  return { mbid: resolved.artist.mbid, name: resolved.artist.name ?? 'that artist' };
}

// Named-exclusion resolution for ranking intents ("...other than Foo Fighters?"). Best
// effort only — an unresolved or ambiguous name just means no exclusion is applied,
// rather than blocking the whole answer on a clarification for what's a modifier clause,
// not the primary subject of the question.
async function resolveExcludeMbids(rawName?: string): Promise<string[]> {
  if (!rawName) return [];
  const candidates = await findArtists(rawName);
  return candidates[0] ? [candidates[0].record.mbid] : [];
}

async function resolveExcludeCountryCodes(rawName?: string): Promise<string[]> {
  if (!rawName) return [];
  const candidates = await findCountries(rawName);
  return candidates[0] ? [candidates[0].record.code] : [];
}

async function resolveExcludeCityIds(rawName?: string): Promise<string[]> {
  if (!rawName) return [];
  const candidates = await findCities(rawName);
  return candidates[0] ? [candidates[0].record.id] : [];
}

async function resolveExcludeVenueIds(rawName?: string): Promise<string[]> {
  if (!rawName) return [];
  const candidates = await findVenues(rawName);
  return candidates[0] ? [candidates[0].record.id] : [];
}

function formatBusiestPeriodShows(shows: ArtistShowSummary[]): string {
  return shows
    .map((s) =>
      i18n.t('chat.answers.busiestPeriodEntry', {
        artist: s.artistName ?? 'Unknown artist',
        date: formatDate(s.eventDate),
        venue: s.venueName ?? '—',
      }),
    )
    .join('\n');
}

// Shared month-name vocabulary for the month-level time-based intents below.
const MONTH_NAMES =
  'january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec';

export const CHAT_INTENTS: ChatIntent[] = [
  // ── A. Single-artist history ────────────────────────────────────────────
  {
    id: 'first_time_seen',
    patterns: [
      /^when was the first time i saw (?<artist>.+?)\??$/i,
      /^when (?:was|did) i first see (?<artist>.+?)\??$/i,
      /^when did i see (?<artist>.+?) for the first time\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const show = await chatQueries.firstTimeSeenArtist(artist.mbid);
      if (!show) return i18n.t('chat.answers.neverSeen', { artist: artist.name });
      return show.venueName
        ? i18n.t('chat.answers.firstTimeSeen', {
            artist: artist.name,
            date: formatDate(show.eventDate),
            venue: show.venueName,
          })
        : i18n.t('chat.answers.firstTimeSeenNoVenue', {
            artist: artist.name,
            date: formatDate(show.eventDate),
          });
    },
  },
  {
    id: 'last_time_seen',
    patterns: [
      /^when was the last time i saw (?<artist>.+?)\??$/i,
      /^when (?:was|did) i last see (?<artist>.+?)\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const show = await chatQueries.lastTimeSeenArtist(artist.mbid);
      if (!show) return i18n.t('chat.answers.neverSeen', { artist: artist.name });
      return show.venueName
        ? i18n.t('chat.answers.lastTimeSeen', {
            artist: artist.name,
            date: formatDate(show.eventDate),
            venue: show.venueName,
          })
        : i18n.t('chat.answers.lastTimeSeenNoVenue', {
            artist: artist.name,
            date: formatDate(show.eventDate),
          });
    },
  },
  {
    id: 'count_times_seen',
    patterns: [/^how many times have i seen (?<artist>.+?)\??$/i],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const count = await chatQueries.countTimesSeenArtist(artist.mbid);
      return i18n.t('chat.answers.countTimesSeen', { artist: artist.name, count });
    },
  },
  {
    id: 'list_times_seen',
    patterns: [
      /^list (?:every|all) times? i(?:'ve| have) seen (?<artist>[^,.?]+?)(?:[,.].*)?\??$/i,
      /^(?:show me |give me )?(?:every|all) times? i(?:'ve| have) seen (?<artist>[^,.?]+?)(?:[,.].*)?\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const shows = await chatQueries.listTimesSeenArtist(artist.mbid);
      if (shows.length === 0) return i18n.t('chat.answers.neverSeen', { artist: artist.name });
      const list = shows
        .map((s) =>
          i18n.t('chat.answers.listTimesSeenEntry', {
            date: formatDate(s.eventDate),
            venue: s.venueName ?? '—',
          }),
        )
        .join('\n');
      return `${i18n.t('chat.answers.listTimesSeenIntro', { artist: artist.name, count: shows.length })}\n${list}`;
    },
  },
  {
    id: 'venues_seen_at',
    patterns: [
      /^what venues have i seen (?<artist>.+?) at\??$/i,
      /^where have i seen (?<artist>.+?)\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const venues = await chatQueries.venuesSeenArtistAt(artist.mbid);
      if (venues.length === 0) return i18n.t('chat.answers.neverSeen', { artist: artist.name });
      return i18n.t('chat.answers.venuesSeenAt', {
        artist: artist.name,
        count: venues.length,
        venues: venues.map((v) => v.name).join(', '),
      });
    },
  },
  {
    id: 'tours_seen_on',
    patterns: [/^what tours have i seen (?<artist>.+?) on\??$/i],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const tours = await chatQueries.toursSeenArtistOn(artist.mbid);
      if (tours.length === 0)
        return i18n.t('chat.answers.toursSeenOnNone', { artist: artist.name });
      return i18n.t('chat.answers.toursSeenOn', { artist: artist.name, tours: tours.join(', ') });
    },
  },
  {
    id: 'compare_artists',
    patterns: [/^have i seen (?<artist>.+?) more (?:times|often) than (?<artist2>.+?)\??$/i],
    entitySlots: { artist: 'artist', artist2: 'artist' },
    handle: async (_raw, resolved) => {
      const a = requireArtist({ artist: resolved.artist });
      const b = requireArtist({ artist: resolved.artist2 });
      const { countA, countB } = await chatQueries.compareArtistCounts(a.mbid, b.mbid);
      return i18n.t('chat.answers.compareArtists', {
        artistA: a.name,
        countA,
        artistB: b.name,
        countB,
      });
    },
  },
  {
    id: 'artist_seen_in_year',
    patterns: [
      /^did i see (?<artist>.+?) in (?<year>\d{4})\??$/i,
      /^when (?:was|did) i see (?<artist>.+?) in (?<year>\d{4})\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (raw, resolved) => {
      const artist = requireArtist(resolved);
      const shows = await chatQueries.showsForArtistInYear(artist.mbid, raw.year);
      if (shows.length === 0) {
        return i18n.t('chat.answers.artistSeenInYearNone', { artist: artist.name, year: raw.year });
      }
      const list = shows
        .map((s) =>
          i18n.t('chat.answers.listTimesSeenEntry', {
            date: formatDate(s.eventDate),
            venue: s.venueName ?? '—',
          }),
        )
        .join('\n');
      return `${i18n.t('chat.answers.artistSeenInYear', { artist: artist.name, year: raw.year, count: shows.length })}\n${list}`;
    },
  },
  {
    id: 'longest_gap',
    patterns: [
      /^what(?:'s| is) the longest gap between (?:two )?(?<artist>.+?) shows(?: i(?:'ve| have) been to)?\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const gap = await chatQueries.longestGapBetweenArtistShows(artist.mbid);
      if (!gap) return i18n.t('chat.answers.longestGapNone', { artist: artist.name });
      return i18n.t('chat.answers.longestGap', {
        artist: artist.name,
        days: gap.days,
        from: formatDate(gap.fromDate),
        to: formatDate(gap.toDate),
      });
    },
  },

  // ── G. Aggregates ────────────────────────────────────────────────────────
  {
    id: 'total_concerts_logged',
    patterns: [/^how many (?:total )?concerts have i logged\??$/i],
    handle: async () => {
      const stats = await dbOperations.getDashboardStats();
      return i18n.t('chat.answers.totalConcertsLogged', { count: stats.totalConcerts });
    },
  },
  {
    id: 'top_artist',
    patterns: [
      /^who(?:'s| is) the (?:artist|band) i(?:'ve| have) seen the most\??$/i,
      /^who(?:'s| is) the (?:artist|band) i(?:'ve| have) seen the most,? (?:other than|besides|excluding|not counting) (?<excludeArtist>.+?)\??$/i,
      /^which (?:artists?|bands?) have i seen the most\??$/i,
      /^which (?:artists?|bands?) have i seen the most,? (?:other than|besides|excluding|not counting) (?<excludeArtist>.+?)\??$/i,
    ],
    rankingId: 'top_artist',
    resolveNamedExclusion: async (raw) => resolveExcludeMbids(raw.excludeArtist),
    getRanked: async (excludeKeys) => {
      const top = await chatQueries.topArtist(excludeKeys);
      if (!top) return null;
      return {
        text: i18n.t('chat.answers.topArtist', { artist: top.name, count: top.count }),
        key: top.mbid,
      };
    },
  },
  {
    id: 'top_artist_in_a_single_year',
    patterns: [
      /^(?:which|who)(?:'s| is)? (?:is )?the (?:artist|band) (?:that )?i(?:'ve| have) seen the most in a single year\??$/i,
      /^which (?:artist|band) have i seen the most in a single year\??$/i,
    ],
    rankingId: 'top_artist_in_a_single_year',
    getRanked: async (excludeKeys) => {
      const top = await chatQueries.topArtistInASingleYear(
        excludeKeys.map((k) => {
          const [mbid, year] = k.split('|');
          return { mbid, year };
        }),
      );
      if (!top) return null;
      return {
        text: i18n.t('chat.answers.topArtistInASingleYear', {
          artist: top.name,
          count: top.count,
          year: top.year,
        }),
        key: `${top.mbid}|${top.year}`,
      };
    },
  },
  {
    id: 'top5_artists',
    patterns: [
      /^what are my top 5(?: most-seen)? (?:artists|bands)\??$/i,
      /^who are my top 5 (?:artists|bands)\??$/i,
    ],
    handle: async () => {
      const artists = await chatQueries.top5Artists();
      if (artists.length === 0) return i18n.t('chat.answers.noData');
      const list = artists.map((a) => `${a.name} (${a.count})`).join(', ');
      return i18n.t('chat.answers.top5Artists', { list });
    },
  },
  {
    id: 'unique_artists_count',
    patterns: [/^how many (?:unique )?(?:artists|bands) have i seen(?: overall)?\??$/i],
    handle: async () => {
      const stats = await dbOperations.getDashboardStats();
      return i18n.t('chat.answers.uniqueArtistsCount', { count: stats.totalArtists });
    },
  },
  {
    id: 'artists_seen_more_than_once',
    patterns: [/^how many (?:artists|bands) have i seen more than once\??$/i],
    handle: async () => {
      const count = await chatQueries.artistsSeenMoreThanOnceCount();
      return i18n.t('chat.answers.artistsSeenMoreThanOnce', { count });
    },
  },
  {
    id: 'artists_seen_only_once',
    patterns: [
      /^how many (?:artists|bands) have i (?:only )?seen (?:only )?(?:a single time|once)\??$/i,
    ],
    handle: async () => {
      const count = await chatQueries.artistsSeenOnlyOnceCount();
      return i18n.t('chat.answers.artistsSeenOnlyOnce', { count });
    },
  },
  {
    id: 'artists_seen_at_least_n',
    patterns: [/^which (?:artists|bands) have i seen (?<n>\d+)\+? ?(?:or more )?times\??$/i],
    handle: async (raw) => {
      const n = Number(raw.n ?? 5);
      const artists = await chatQueries.artistsSeenAtLeastNTimes(n);
      if (artists.length === 0) return i18n.t('chat.answers.artistsSeenAtLeastNNone', { n });
      return i18n.t('chat.answers.artistsSeenAtLeastN', {
        n,
        count: artists.length,
        list: artists.map((a) => a.name).join(', '),
      });
    },
  },

  // ── F. Time-based / calendar ─────────────────────────────────────────────
  {
    id: 'concerts_in_year',
    patterns: [/^how many concerts did i go to in (?<year>\d{4})\??$/i],
    handle: async (raw) => {
      const count = await chatQueries.concertsInYear(raw.year);
      return i18n.t('chat.answers.concertsInYear', { year: raw.year, count });
    },
  },
  {
    id: 'concerts_in_month_year',
    patterns: [
      new RegExp(
        `^how many concerts did i go to in (?<month>${MONTH_NAMES}) (?<year>\\d{4})\\??$`,
        'i',
      ),
    ],
    handle: async (raw) => {
      const month = monthNameToNumber(raw.month);
      const count = await chatQueries.concertsInMonthYear(month, raw.year);
      return i18n.t('chat.answers.concertsInMonthYear', {
        month: monthDisplayName(month),
        year: raw.year,
        count,
      });
    },
  },
  {
    id: 'artists_seen_in_month_year',
    patterns: [
      new RegExp(
        `^(?:which|what) (?:artists|bands) (?:did i see|have i seen|i saw) in (?<month>${MONTH_NAMES}) (?<year>\\d{4})\\??$`,
        'i',
      ),
    ],
    handle: async (raw) => {
      const month = monthNameToNumber(raw.month);
      const monthLabel = monthDisplayName(month);
      const artists = await chatQueries.artistsSeenInMonthYear(month, raw.year);
      if (artists.length === 0) {
        return i18n.t('chat.answers.artistsSeenInMonthYearNone', {
          month: monthLabel,
          year: raw.year,
        });
      }
      return i18n.t('chat.answers.artistsSeenInMonthYear', {
        month: monthLabel,
        year: raw.year,
        count: artists.length,
        list: artists.join(', '),
      });
    },
  },
  {
    id: 'average_concerts_per_year',
    patterns: [
      /^what(?:'s| is) (?:the )?average (?:number of )?concerts(?: i go to)? per year\??$/i,
    ],
    handle: async () => {
      const avg = await chatQueries.averageConcertsPerYear();
      return i18n.t('chat.answers.averageConcertsPerYear', { count: avg });
    },
  },
  {
    id: 'days_since_last_concert',
    patterns: [/^how many days (?:has it been |is it )?since my last concert\??$/i],
    handle: async () => {
      const days = await chatQueries.daysSinceLastConcert();
      if (days === null) return i18n.t('chat.answers.noData');
      return i18n.t('chat.answers.daysSinceLastConcert', { count: days });
    },
  },
  {
    id: 'year_with_most_concerts',
    patterns: [/^which year did i see the most concerts\??$/i],
    handle: async () => {
      const busiest = await dbOperations.getBusiestYear();
      if (!busiest) return i18n.t('chat.answers.noData');
      return i18n.t('chat.answers.yearWithMostConcerts', {
        year: busiest.year,
        count: busiest.count,
      });
    },
  },
  {
    id: 'busiest_year_with_shows',
    patterns: [
      /^(?:which|what) was my busiest year(?:,? (?:outside|excluding|other than|besides|not counting) (?<exYear>\d{4}))?(?:,? and (?:which|what) concerts did i (?:see|go to))?\??$/i,
    ],
    rankingId: 'busiest_year',
    resolveNamedExclusion: async (raw) => (raw.exYear ? [raw.exYear] : []),
    getRanked: async (excludeKeys) => {
      const busiest = await chatQueries.busiestYear(excludeKeys);
      if (!busiest) return null;
      const shows = await chatQueries.showsInYear(busiest.year);
      const list = formatBusiestPeriodShows(shows);
      return {
        text: `${i18n.t('chat.answers.busiestYearWithShows', { year: busiest.year, count: busiest.count })}\n${list}`,
        key: busiest.year,
      };
    },
  },
  {
    id: 'busiest_month_with_shows',
    patterns: [
      new RegExp(
        `^(?:which|what) was my busiest month(?:,? (?:outside|excluding|other than|besides|not counting) (?<exMonth>${MONTH_NAMES}) (?<exYear>\\d{4}))?(?:,? and (?:which|what) concerts did i (?:see|go to))?\\??$`,
        'i',
      ),
    ],
    rankingId: 'busiest_month',
    resolveNamedExclusion: async (raw) =>
      raw.exMonth && raw.exYear ? [`${monthNameToNumber(raw.exMonth)}|${raw.exYear}`] : [],
    getRanked: async (excludeKeys) => {
      const busiest = await chatQueries.busiestMonth(
        excludeKeys.map((k) => {
          const [month, year] = k.split('|');
          return { month, year };
        }),
      );
      if (!busiest) return null;
      const shows = await chatQueries.showsInMonthYear(busiest.month, busiest.year);
      const list = formatBusiestPeriodShows(shows);
      return {
        text: `${i18n.t('chat.answers.busiestMonthWithShows', {
          month: monthDisplayName(busiest.month),
          year: busiest.year,
          count: busiest.count,
        })}\n${list}`,
        key: `${busiest.month}|${busiest.year}`,
      };
    },
  },
  {
    id: 'busiest_week_with_shows',
    patterns: [
      /^(?:which|what) was my busiest week(?:,? and (?:which|what) concerts did i (?:see|go to))?\??$/i,
    ],
    rankingId: 'busiest_week',
    getRanked: async (excludeKeys) => {
      const busiest = await chatQueries.busiestWeek(excludeKeys);
      if (!busiest) return null;
      const shows = await chatQueries.showsInWeek(busiest.weekStart);
      const list = formatBusiestPeriodShows(shows);
      return {
        text: `${i18n.t('chat.answers.busiestWeekWithShows', {
          start: formatIsoDate(busiest.weekStart),
          end: formatIsoDate(busiest.weekEnd),
          count: busiest.count,
        })}\n${list}`,
        key: busiest.weekStart,
      };
    },
  },
  {
    id: 'first_concert_ever',
    patterns: [/^what was my (?:very )?first concert(?: ever)?\??$/i],
    handle: async () => {
      const stats = await dbOperations.getDashboardStats();
      if (!stats.firstConcert) return i18n.t('chat.answers.noData');
      return i18n.t('chat.answers.firstConcertEver', {
        artist: stats.firstConcert.artistName,
        date: formatDate(stats.firstConcert.eventDate),
      });
    },
  },
  {
    id: 'most_recent_concert',
    patterns: [/^what was my most recent concert\??$/i],
    handle: async () => {
      const stats = await dbOperations.getDashboardStats();
      if (!stats.lastConcert) return i18n.t('chat.answers.noData');
      return i18n.t('chat.answers.mostRecentConcert', {
        artist: stats.lastConcert.artistName,
        date: formatDate(stats.lastConcert.eventDate),
      });
    },
  },

  // ── E. Geographic ────────────────────────────────────────────────────────
  {
    id: 'countries_seen_count',
    patterns: [/^how many countries have i seen live music in\??$/i],
    handle: async () => {
      const stats = await dbOperations.getDashboardStats();
      return i18n.t('chat.answers.countriesSeenCount', { count: stats.totalCountries });
    },
  },
  {
    id: 'cities_seen_list',
    patterns: [/^what cities have i seen concerts in\??$/i],
    handle: async () => {
      const cities = await chatQueries.citiesSeenList();
      if (cities.length === 0) return i18n.t('chat.answers.noData');
      return i18n.t('chat.answers.citiesSeenList', {
        count: cities.length,
        list: cities.join(', '),
      });
    },
  },
  {
    id: 'shows_in_country',
    patterns: [/^how many shows have i seen in (?<country>.+?)\??$/i],
    entitySlots: { country: 'country' },
    handle: async (_raw, resolved) => {
      if (!resolved.country) throw new Error('country slot not resolved');
      const count = await chatQueries.showsInCountry(resolved.country.code);
      return count === 0
        ? i18n.t('chat.answers.showsInCountryNone', { country: resolved.country.name })
        : i18n.t('chat.answers.showsInCountry', { country: resolved.country.name, count });
    },
  },
  {
    id: 'most_visited_country',
    patterns: [
      /^which country have i seen the most concerts in\??$/i,
      /^which country have i seen the most concerts in,? (?:other than|besides|excluding|not counting) (?<excludeCountry>.+?)\??$/i,
    ],
    rankingId: 'most_visited_country',
    resolveNamedExclusion: async (raw) => resolveExcludeCountryCodes(raw.excludeCountry),
    getRanked: async (excludeKeys) => {
      const top = await chatQueries.mostVisitedCountry(excludeKeys);
      if (!top) return null;
      return {
        text: i18n.t('chat.answers.mostVisitedCountry', { country: top.name, count: top.count }),
        key: top.code,
      };
    },
  },
  {
    id: 'bands_seen_in_country',
    patterns: [
      /^which bands have i seen in (?<country>.+?)\??$/i,
      /^what artists have i seen in (?<country>.+?)\??$/i,
    ],
    entitySlots: { country: 'country' },
    handle: async (_raw, resolved) => {
      if (!resolved.country) throw new Error('country slot not resolved');
      const bands = await chatQueries.bandsSeenInCountry(resolved.country.code);
      if (bands.length === 0) {
        return i18n.t('chat.answers.bandsSeenInCountryNone', { country: resolved.country.name });
      }
      return i18n.t('chat.answers.bandsSeenInCountry', {
        country: resolved.country.name,
        list: bands.join(', '),
      });
    },
  },
  {
    id: 'bands_seen_in_city_year',
    patterns: [/^how many (?:different )?bands have i seen in (?<city>.+?) in (?<year>\d{4})\??$/i],
    entitySlots: { city: 'city' },
    handle: async (raw, resolved) => {
      if (!resolved.city) throw new Error('city slot not resolved');
      const bands = await chatQueries.bandsSeenInCityYear(resolved.city.id, raw.year);
      if (bands.length === 0) {
        return i18n.t('chat.answers.bandsSeenInCityYearNone', {
          city: resolved.city.name,
          year: raw.year,
        });
      }
      return i18n.t('chat.answers.bandsSeenInCityYear', {
        city: resolved.city.name,
        year: raw.year,
        count: bands.length,
        list: bands.join(', '),
      });
    },
  },
  {
    id: 'countries_seen_in_year',
    patterns: [/^what countries did i see concerts in during (?<year>\d{4})\??$/i],
    handle: async (raw) => {
      const countries = await chatQueries.countriesSeenInYear(raw.year);
      if (countries.length === 0) {
        return i18n.t('chat.answers.countriesSeenInYearNone', { year: raw.year });
      }
      return i18n.t('chat.answers.countriesSeenInYear', {
        year: raw.year,
        list: countries.join(', '),
      });
    },
  },
  {
    id: 'most_visited_city',
    patterns: [
      /^which city have i seen the most concerts in\??$/i,
      /^which city have i seen the most concerts in,? (?:other than|besides|excluding|not counting) (?<excludeCity>.+?)\??$/i,
    ],
    rankingId: 'most_visited_city',
    resolveNamedExclusion: async (raw) => resolveExcludeCityIds(raw.excludeCity),
    getRanked: async (excludeKeys) => {
      const top = await chatQueries.mostVisitedCity(excludeKeys);
      if (!top) return null;
      return {
        text: i18n.t('chat.answers.mostVisitedCity', { city: top.name, count: top.count }),
        key: top.id,
      };
    },
  },

  // ── H. Venues ────────────────────────────────────────────────────────────
  {
    id: 'venue_visit_count',
    patterns: [/^how many times have i (?:been to|visited|gone to) (?<venue>.+?)\??$/i],
    entitySlots: { venue: 'venue' },
    handle: async (_raw, resolved) => {
      if (!resolved.venue) throw new Error('venue slot not resolved');
      const count = await chatQueries.venueVisitCount(resolved.venue.id);
      return i18n.t('chat.answers.venueVisitCount', {
        venue: resolved.venue.name,
        count,
      });
    },
  },
  {
    id: 'bands_seen_at_venue',
    patterns: [/^(?:which|what) (?:artists|bands) have i seen at (?<venue>.+?)\??$/i],
    entitySlots: { venue: 'venue' },
    handle: async (_raw, resolved) => {
      if (!resolved.venue) throw new Error('venue slot not resolved');
      const bands = await chatQueries.bandsSeenAtVenue(resolved.venue.id);
      if (bands.length === 0) {
        return i18n.t('chat.answers.bandsSeenAtVenueNone', { venue: resolved.venue.name });
      }
      return i18n.t('chat.answers.bandsSeenAtVenue', {
        venue: resolved.venue.name,
        list: bands.join(', '),
      });
    },
  },
  {
    id: 'first_time_at_venue',
    patterns: [/^when was the first time i (?:was at|went to|visited) (?<venue>.+?)\??$/i],
    entitySlots: { venue: 'venue' },
    handle: async (_raw, resolved) => {
      if (!resolved.venue) throw new Error('venue slot not resolved');
      const show = await chatQueries.firstTimeAtVenue(resolved.venue.id);
      if (!show) return i18n.t('chat.answers.noData');
      return i18n.t('chat.answers.firstTimeAtVenue', {
        venue: resolved.venue.name,
        date: formatDate(show.eventDate),
      });
    },
  },
  {
    id: 'last_time_at_venue',
    patterns: [/^when was the last time i (?:was at|went to|visited) (?<venue>.+?)\??$/i],
    entitySlots: { venue: 'venue' },
    handle: async (_raw, resolved) => {
      if (!resolved.venue) throw new Error('venue slot not resolved');
      const show = await chatQueries.lastTimeAtVenue(resolved.venue.id);
      if (!show) return i18n.t('chat.answers.noData');
      return i18n.t('chat.answers.lastTimeAtVenue', {
        venue: resolved.venue.name,
        date: formatDate(show.eventDate),
      });
    },
  },
  {
    id: 'venues_seen_count',
    patterns: [/^how many (?:different )?venues have i (?:been to|visited)\??$/i],
    handle: async () => {
      const count = await chatQueries.venuesSeenCount();
      return i18n.t('chat.answers.venuesSeenCount', { count });
    },
  },
  {
    id: 'most_visited_venue',
    patterns: [
      /^which venues? have i (?:been to|visited) the most\??$/i,
      /^which venues? have i (?:been to|visited) the most,? (?:other than|besides|excluding|not counting) (?<excludeVenue>.+?)\??$/i,
    ],
    rankingId: 'most_visited_venue',
    resolveNamedExclusion: async (raw) => resolveExcludeVenueIds(raw.excludeVenue),
    getRanked: async (excludeKeys) => {
      const top = await chatQueries.mostVisitedVenue(excludeKeys);
      if (!top) return null;
      return {
        text: i18n.t('chat.answers.mostVisitedVenue', { venue: top.name, count: top.count }),
        key: top.id,
      };
    },
  },

  // ── I. Songs / setlist detail ────────────────────────────────────────────
  // covers_played_by_artist is listed before the more general song_play_count so its
  // "has X played any covers?" phrasing is matched first — song_play_count's own
  // "has X played Y?" pattern would otherwise greedily capture "any covers" as a song title.
  {
    id: 'covers_played_by_artist',
    patterns: [
      /^what covers has (?<artist>.+?) played\??$/i,
      /^has (?<artist>.+?) played any covers\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const covers = await chatQueries.coversPlayedByArtist(artist.mbid);
      if (covers.length === 0) {
        return i18n.t('chat.answers.coversPlayedByArtistNone', { artist: artist.name });
      }
      const list = covers
        .map((c) =>
          c.originalArtist ? `${c.songName} (originally by ${c.originalArtist})` : c.songName,
        )
        .join(', ');
      return i18n.t('chat.answers.coversPlayedByArtist', { artist: artist.name, list });
    },
  },
  {
    id: 'song_play_count',
    patterns: [
      /^how many times has (?<artist>.+?) played (?<song>.+?)\??$/i,
      /^has (?<artist>.+?) (?:ever )?played (?<song>.+?)\??$/i,
      /^did (?<artist>.+?) play (?<song>.+?)\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (raw, resolved) => {
      const artist = requireArtist(resolved);
      const count = await chatQueries.songPlayCount(artist.mbid, raw.song);
      if (count === 0) {
        return i18n.t('chat.answers.songPlayCountNone', { artist: artist.name, song: raw.song });
      }
      return i18n.t('chat.answers.songPlayCount', { artist: artist.name, song: raw.song, count });
    },
  },
  {
    id: 'most_played_song_by_artist',
    patterns: [
      /^what(?:'s| is) (?<artist>.+?)(?:'s)? most[- ]played song\??$/i,
      /^what song does (?<artist>.+?) play the most\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const top = await chatQueries.mostPlayedSongByArtist(artist.mbid);
      if (!top) return i18n.t('chat.answers.mostPlayedSongByArtistNone', { artist: artist.name });
      return i18n.t('chat.answers.mostPlayedSongByArtist', {
        artist: artist.name,
        song: top.name,
        count: top.count,
      });
    },
  },
  {
    id: 'guest_artists_with',
    patterns: [
      /^which artists has (?<artist>.+?) brought (?:on ?stage|out)\??$/i,
      /^who has (?<artist>.+?) performed with\??$/i,
    ],
    entitySlots: { artist: 'artist' },
    handle: async (_raw, resolved) => {
      const artist = requireArtist(resolved);
      const guests = await chatQueries.guestArtistsWithArtist(artist.mbid);
      if (guests.length === 0) {
        return i18n.t('chat.answers.guestArtistsWithArtistNone', { artist: artist.name });
      }
      return i18n.t('chat.answers.guestArtistsWithArtist', {
        artist: artist.name,
        list: guests.join(', '),
      });
    },
  },
];
