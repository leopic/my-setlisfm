// Verifies every Tier 1 example phrasing (from the vetted 58-question list) actually
// matches its intended intent's regex — pure pattern-matching, no DB involved.
import { CHAT_INTENTS } from '@/services/chat/intents';

function matchedIntentId(text: string): string | null {
  const normalized = text.trim().replace(/\s+/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  for (const intent of CHAT_INTENTS) {
    if (intent.patterns.some((p) => p.test(normalized))) {
      return intent.id;
    }
  }
  return null;
}

const CASES: [string, string][] = [
  ['When was the first time I saw Bad Religion?', 'first_time_seen'],
  ['When was the last time I saw NOFX?', 'last_time_seen'],
  ['How many times have I seen Bad Religion?', 'count_times_seen'],
  ["List every time I've seen NOFX, with dates and venues.", 'list_times_seen'],
  ['What venues have I seen Bad Religion at?', 'venues_seen_at'],
  ['What tours have I seen Bad Religion on?', 'tours_seen_on'],
  ["What's the longest gap between two Bad Religion shows I've been to?", 'longest_gap'],
  ['Have I seen Bad Religion more times than NOFX?', 'compare_artists'],
  ['Did I see Bad Religion in 2025?', 'artist_seen_in_year'],
  ['When did I see Bad Religion in 2025?', 'artist_seen_in_year'],
  ['What are my top 5 most-seen artists?', 'top5_artists'],
  ["Who's the artist I've seen the most?", 'top_artist'],
  ["Who's the artist I've seen the most, other than Foo Fighters?", 'top_artist'],
  ['Which is the artist that I’ve seen the most in a single year?', 'top_artist_in_a_single_year'],
  ['How many unique artists have I seen overall?', 'unique_artists_count'],
  ['How many artists have I seen more than once?', 'artists_seen_more_than_once'],
  ['How many artists have I only seen a single time?', 'artists_seen_only_once'],
  ['Which artists have I seen 5 or more times?', 'artists_seen_at_least_n'],
  ['How many concerts did I go to in 2019?', 'concerts_in_year'],
  ['How many concerts did I go to in June 2025?', 'concerts_in_month_year'],
  ['Which artists did I see in June 2025?', 'artists_seen_in_month_year'],
  ['What bands have I seen in Jan 2025?', 'artists_seen_in_month_year'],
  ["What's the average number of concerts I go to per year?", 'average_concerts_per_year'],
  ['How many days has it been since my last concert?', 'days_since_last_concert'],
  ['Which year did I see the most concerts?', 'year_with_most_concerts'],
  ['Which was my busiest year and which concerts did I see?', 'busiest_year_with_shows'],
  ['Which was my busiest year, outside 2022?', 'busiest_year_with_shows'],
  ['What was my busiest month and what concerts did I go to?', 'busiest_month_with_shows'],
  ['Which was my busiest month, outside June 2025?', 'busiest_month_with_shows'],
  ['Which was my busiest week and which concerts did I see?', 'busiest_week_with_shows'],
  ['How many total concerts have I logged?', 'total_concerts_logged'],
  ['How many countries have I seen live music in?', 'countries_seen_count'],
  ['What cities have I seen concerts in?', 'cities_seen_list'],
  ['How many shows have I seen in Mexico?', 'shows_in_country'],
  ['Which country have I seen the most concerts in?', 'most_visited_country'],
  ['Which country have I seen the most concerts in, excluding Mexico?', 'most_visited_country'],
  ['Which bands have I seen in Mexico?', 'bands_seen_in_country'],
  ['How many different bands have I seen in Berlin in 2025?', 'bands_seen_in_city_year'],
  ['What countries did I see concerts in during 2025?', 'countries_seen_in_year'],
  ['Which city have I seen the most concerts in?', 'most_visited_city'],
  ['Which city have I seen the most concerts in, other than Berlin?', 'most_visited_city'],
  ['What was my very first concert ever?', 'first_concert_ever'],
  ['What was my most recent concert?', 'most_recent_concert'],
];

describe('Tier 1 intent pattern coverage', () => {
  it.each(CASES)('matches "%s" to %s', (text, expectedId) => {
    expect(matchedIntentId(text)).toBe(expectedId);
  });
});
