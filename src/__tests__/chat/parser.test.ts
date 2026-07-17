jest.mock('@/database/database', () => ({
  databaseManager: {
    getDatabase: jest.fn(),
  },
}));
jest.mock('@/services/chat/coreferenceResolver', () => ({
  resolveReferences: jest.fn(),
}));

import { databaseManager } from '@/database/database';
import { dbOperations } from '@/database/operations';
import { resolveReferences } from '@/services/chat/coreferenceResolver';
import { answerQuestion, resumeWithChoice } from '@/services/chat/parser';

const mockDb = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // clearAllMocks only wipes call history — it leaves queued mockResolvedValueOnce
  // values and any default mockResolvedValue implementation in place. Without an
  // explicit reset, an under-consumed queue from one test silently bleeds into the
  // next test's calls. mockReset() removes both.
  mockDb.getAllAsync.mockReset();
  mockDb.getFirstAsync.mockReset();
  (resolveReferences as jest.Mock).mockReset();
  (databaseManager.getDatabase as jest.Mock).mockReturnValue(mockDb);
});

describe('answerQuestion — no match', () => {
  it('returns a no_match result for gibberish input', async () => {
    const result = await answerQuestion('flibbertigibbet nonsense');
    expect(result.type).toBe('no_match');
  });
});

describe('answerQuestion — smart-quote normalization', () => {
  it('matches a question typed with iOS smart-quote apostrophes', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ mbid: 'mbid-1', name: 'Bad Religion', count: 5 });

    const result = await answerQuestion('Who’s the artist I’ve seen the most?');
    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Bad Religion');
  });
});

describe('answerQuestion — no-entity intents', () => {
  it('answers a total-concerts question straight from dashboard stats', async () => {
    jest.spyOn(dbOperations, 'getDashboardStats').mockResolvedValue({
      totalConcerts: 42,
      totalArtists: 10,
      totalVenues: 5,
      totalCountries: 3,
      topArtist: null,
      topVenue: null,
      firstConcert: null,
      lastConcert: null,
      concertsByYear: [],
    });

    const result = await answerQuestion('How many total concerts have I logged?');
    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('42');
  });

  it('answers a year-with-most-concerts question via getBusiestYear', async () => {
    jest.spyOn(dbOperations, 'getBusiestYear').mockResolvedValue({ year: '2019', count: 12 });

    const result = await answerQuestion('Which year did I see the most concerts?');
    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('2019');
  });
});

describe('answerQuestion — busiest period with shows', () => {
  it('answers busiest year with the list of concerts that year', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ year: '2025', count: 2 });
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        eventDate: '03-06-2025',
        artistName: 'Foo Fighters',
        venueName: 'Ernst Happel Stadion',
        cityName: 'Vienna',
      },
      {
        eventDate: '03-06-2025',
        artistName: 'IDLES',
        venueName: 'Ernst Happel Stadion',
        cityName: 'Vienna',
      },
    ]);

    const result = await answerQuestion('Which was my busiest year and which concerts did I see?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('2025');
    expect(result.type === 'answer' && result.text).toContain('Foo Fighters');
    expect(result.type === 'answer' && result.text).toContain('IDLES');
  });

  it('answers busiest month with the list of concerts that month', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ month: '06', year: '2025', count: 1 });
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        eventDate: '03-06-2025',
        artistName: 'Foo Fighters',
        venueName: 'Ernst Happel Stadion',
        cityName: 'Vienna',
      },
    ]);

    const result = await answerQuestion('What was my busiest month and what concerts did I go to?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('June 2025');
    expect(result.type === 'answer' && result.text).toContain('Foo Fighters');
  });

  it('answers busiest week with the list of concerts that week', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      weekStart: '2025-03-03',
      weekEnd: '2025-03-09',
      count: 1,
    });
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        eventDate: '04-03-2025',
        artistName: 'IDLES',
        venueName: 'Some Venue',
        cityName: 'Some City',
      },
    ]);

    const result = await answerQuestion('Which was my busiest week and which concerts did I see?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('IDLES');
  });

  it('reports no data when there are no logged concerts at all', async () => {
    const result = await answerQuestion('Which was my busiest year and which concerts did I see?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain("don't have enough data");
  });
});

describe('answerQuestion — ranking named exclusion', () => {
  it('excludes a named artist from top_artist', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Foo Fighters' }]); // findArtists
    mockDb.getFirstAsync.mockResolvedValueOnce({ mbid: 'mbid-2', name: 'NOFX', count: 8 }); // topArtist

    const result = await answerQuestion(
      "Who's the artist I've seen the most, other than Foo Fighters?",
    );

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('NOFX');
    expect(result.type === 'answer' && result.context?.lastRanking).toEqual({
      rankingId: 'top_artist',
      excludedKeys: ['mbid-1', 'mbid-2'],
    });
  });

  it('excludes a named country from most_visited_country', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ code: 'MX', name: 'Mexico' }]); // findCountries
    mockDb.getFirstAsync.mockResolvedValueOnce({ code: 'AR', name: 'Argentina', count: 3 }); // mostVisitedCountry

    const result = await answerQuestion(
      'Which country have I seen the most concerts in, excluding Mexico?',
    );

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Argentina');
  });

  it('excludes a named city from most_visited_city', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ id: 'city-1', name: 'Berlin' }]); // findCities
    mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'city-2', name: 'Paris', count: 4 }); // mostVisitedCity

    const result = await answerQuestion(
      'Which city have I seen the most concerts in, other than Berlin?',
    );

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Paris');
  });

  it('excludes a named year from busiest_year_with_shows', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ year: '2019', count: 33 }); // busiestYear
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        eventDate: '10-03-2019',
        artistName: 'Bad Religion',
        venueName: 'The Fillmore',
        cityName: 'San Francisco',
      },
    ]); // showsInYear

    const result = await answerQuestion('Which was my busiest year, outside 2022?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('2019');
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['2022']);
  });

  it('excludes a named month from busiest_month_with_shows', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ month: '09', year: '2018', count: 14 }); // busiestMonth
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        eventDate: '08-09-2018',
        artistName: 'Childish Gambino',
        venueName: 'United Center',
        cityName: 'Chicago',
      },
    ]); // showsInMonthYear

    const result = await answerQuestion('Which was my busiest month, outside June 2025?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('September 2018');
    expect(result.type === 'answer' && result.text).toContain('Childish Gambino');
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(expect.any(String), ['06', '2025']);
  });
});

describe('answerQuestion — "which was the next one?" ranking follow-up', () => {
  it('continues a top_artist ranking to the next entry', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ mbid: 'mbid-1', name: 'Foo Fighters', count: 20 });
    const first = await answerQuestion("Who's the artist I've seen the most?");
    expect(first.type === 'answer' && first.text).toContain('Foo Fighters');
    const contextAfterFirst = first.type === 'answer' ? first.context : undefined;
    expect(contextAfterFirst?.lastRanking).toEqual({
      rankingId: 'top_artist',
      excludedKeys: ['mbid-1'],
    });

    mockDb.getFirstAsync.mockResolvedValueOnce({ mbid: 'mbid-2', name: 'NOFX', count: 15 });
    const second = await answerQuestion('Which was the next one after that?', contextAfterFirst);

    expect(second.type).toBe('answer');
    expect(second.type === 'answer' && second.text).toContain('NOFX');
    expect(second.type === 'answer' && second.context?.lastRanking).toEqual({
      rankingId: 'top_artist',
      excludedKeys: ['mbid-1', 'mbid-2'],
    });
  });

  it('keeps chaining across multiple "next one" turns, accumulating exclusions', async () => {
    const context = {
      lastRanking: { rankingId: 'top_artist', excludedKeys: ['mbid-1', 'mbid-2'] },
    };
    mockDb.getFirstAsync.mockResolvedValueOnce({ mbid: 'mbid-3', name: 'Bad Religion', count: 10 });

    const result = await answerQuestion('What about the next one?', context);

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Bad Religion');
    expect(result.type === 'answer' && result.context?.lastRanking?.excludedKeys).toEqual([
      'mbid-1',
      'mbid-2',
      'mbid-3',
    ]);
  });

  it('recognizes "who\'s next?" as a shorter equivalent phrasing', async () => {
    const context = { lastRanking: { rankingId: 'top_artist', excludedKeys: ['mbid-1'] } };
    mockDb.getFirstAsync.mockResolvedValueOnce({ mbid: 'mbid-2', name: 'NOFX', count: 15 });

    const result = await answerQuestion("Who's next?", context);

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('NOFX');
  });

  it('reports a graceful message once the ranking is exhausted', async () => {
    const context = {
      lastRanking: { rankingId: 'top_artist', excludedKeys: ['mbid-1', 'mbid-2'] },
    };
    mockDb.getFirstAsync.mockResolvedValueOnce(undefined);

    const result = await answerQuestion('Which was the next one after that?', context);

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('no more results');
  });

  it('falls through to no_match when there is no remembered ranking to continue', async () => {
    const result = await answerQuestion('Which was the next one after that?');
    expect(result.type).toBe('no_match');
  });
});

describe('answerQuestion — venue intents', () => {
  it('resolves a venue entity and answers a visit-count question', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ id: 'venue-1', name: 'The Fillmore' }]); // findVenues
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 3 }); // venueVisitCount

    const result = await answerQuestion('How many times have I been to The Fillmore?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('The Fillmore');
    expect(result.type === 'answer' && result.text).toContain('3');
  });

  it('excludes a named venue from most_visited_venue', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ id: 'venue-1', name: 'Red Rocks' }]); // findVenues
    mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'venue-2', name: 'The Fillmore', count: 5 }); // mostVisitedVenue

    const result = await answerQuestion(
      'Which venue have I been to the most, other than Red Rocks?',
    );

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('The Fillmore');
    expect(result.type === 'answer' && result.context?.lastRanking).toEqual({
      rankingId: 'most_visited_venue',
      excludedKeys: ['venue-1', 'venue-2'],
    });
  });

  it('continues a most_visited_venue ranking to the next entry', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'venue-1', name: 'Red Rocks', count: 5 });
    const first = await answerQuestion('Which venue have I been to the most?');
    const contextAfterFirst = first.type === 'answer' ? first.context : undefined;

    mockDb.getFirstAsync.mockResolvedValueOnce({ id: 'venue-2', name: 'The Fillmore', count: 4 });
    const second = await answerQuestion('Which was the next one after that?', contextAfterFirst);

    expect(second.type).toBe('answer');
    expect(second.type === 'answer' && second.text).toContain('The Fillmore');
  });
});

describe('answerQuestion — song intents', () => {
  it('answers how many times an artist played a given song', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Bad Religion' }]); // findArtists
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 4 }); // songPlayCount

    const result = await answerQuestion('How many times has Bad Religion played American Jesus?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Bad Religion');
    expect(result.type === 'answer' && result.text).toContain('4');
  });

  it('reports the song was never played when the count is zero', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Bad Religion' }]);
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });

    const result = await answerQuestion('Has Bad Religion ever played Some Rare B-Side?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain("haven't heard");
  });

  it('answers the most played song for an artist', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Bad Religion' }]); // findArtists
    mockDb.getFirstAsync.mockResolvedValueOnce({ name: 'American Jesus', count: 20 }); // mostPlayedSongByArtist

    const result = await answerQuestion("What's Bad Religion's most played song?");

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('American Jesus');
  });

  it('answers covers played by an artist', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Bad Religion' }]) // findArtists
      .mockResolvedValueOnce([
        { songName: 'Fortunate Son', originalArtist: 'Creedence Clearwater Revival' },
      ]); // coversPlayedByArtist

    const result = await answerQuestion('What covers has Bad Religion played?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Fortunate Son');
    expect(result.type === 'answer' && result.text).toContain('Creedence Clearwater Revival');
  });

  it('answers guest artists brought on stage', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Bad Religion' }]) // findArtists
      .mockResolvedValueOnce([{ name: 'Brett Gurewitz' }]); // guestArtistsWithArtist

    const result = await answerQuestion('Which artists has Bad Religion brought on stage?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Brett Gurewitz');
  });
});

describe('answerQuestion — month-level intents', () => {
  it('answers which artists were seen in a given month and year', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ name: 'Foo Fighters' }, { name: 'IDLES' }]);

    const result = await answerQuestion('Which artists did I see in June 2025?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Foo Fighters');
    expect(result.type === 'answer' && result.text).toContain('June 2025');
  });

  it('answers a concerts-in-month-year count question', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 3 });

    const result = await answerQuestion('How many concerts did I go to in June 2025?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('3');
    expect(result.type === 'answer' && result.text).toContain('June 2025');
  });

  it('reports no artists when nothing matches that month/year', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([]);

    const result = await answerQuestion('What bands have I seen in Jan 2025?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain("didn't see any concerts");
  });

  it('strips a "tell me" lead-in so the underlying question still matches', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ name: 'Foo Fighters' }]);

    const result = await answerQuestion('Tell me which artists I saw in June 2025?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Foo Fighters');
  });

  it('strips "please"/"can you" combined with "tell me"', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 1 });

    const result = await answerQuestion(
      'Can you please tell me how many concerts did I go to in June 2025?',
    );

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('June 2025');
  });
});

describe('answerQuestion — single-artist intent with entity resolution', () => {
  it('resolves a clean artist match and answers directly', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Bad Religion' }]) // findArtists
      .mockResolvedValueOnce([
        { eventDate: '10-03-2019', venueName: 'The Fillmore', cityName: 'San Francisco' },
      ]); // showsForArtist

    const result = await answerQuestion('When was the first time I saw Bad Religion?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Bad Religion');
    expect(result.type === 'answer' && result.text).toContain('Fillmore');
  });

  it('asks for clarification when two artists are a near-tie match', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { mbid: 'mbid-1', name: 'Suede', disambiguation: 'UK band' },
      { mbid: 'mbid-2', name: 'Suede', disambiguation: 'US band' },
    ]);

    const result = await answerQuestion('When was the first time I saw Suede?');

    expect(result.type).toBe('clarification');
    if (result.type === 'clarification') {
      expect(result.options).toHaveLength(2);
      expect(result.resume.intentId).toBe('first_time_seen');
    }
  });

  it('reports no match when the artist name has no candidates at all', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Bad Religion' }]);

    const result = await answerQuestion('When was the first time I saw Zzzznonexistentband?');

    expect(result.type).toBe('no_match');
  });
});

describe('answerQuestion — deterministic follow-up resolution', () => {
  it('resolves a full pronoun follow-up ("them"/"that year") purely from context, without calling the model', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Foo Fighters' }]) // findArtists (resolveEntitySlots)
      .mockResolvedValueOnce([
        { eventDate: '15-06-2019', venueName: 'Some Venue', cityName: 'Some City' },
      ]); // showsForArtistInYear

    const result = await answerQuestion('When did I see them that year?', {
      artist: { mbid: 'mbid-1', name: 'Foo Fighters' },
      year: '2019',
    });

    expect(resolveReferences).not.toHaveBeenCalled();
    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Foo Fighters');
  });

  it('resolves "there" to the remembered city/country without calling the model', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ id: 'city-1', name: 'Berlin' }]) // findCities (resolveEntitySlots)
      .mockResolvedValueOnce([{ name: 'Foo Fighters' }]); // bandsSeenInCityYear

    const result = await answerQuestion('How many bands have I seen there in 2019?', {
      city: { id: 'city-1', name: 'Berlin' },
    });

    expect(resolveReferences).not.toHaveBeenCalled();
    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Berlin');
  });

  it('resolves a year-only override ("what about in 2021?"), carrying the artist over, without calling the model', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Foo Fighters' }]) // findArtists
      .mockResolvedValueOnce([]); // showsForArtistInYear — none that year

    const result = await answerQuestion('What about in 2021?', {
      artist: { mbid: 'mbid-1', name: 'Foo Fighters' },
      year: '2019',
    });

    expect(resolveReferences).not.toHaveBeenCalled();
    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Foo Fighters');
    expect(result.type === 'answer' && result.text).toContain('2021');
  });

  it('resolves a bare-name override against the artist anchored in context ("how about Metallica instead?")', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ mbid: 'mbid-2', name: 'Metallica' }]) // findArtists (override resolution)
      .mockResolvedValueOnce([{ mbid: 'mbid-2', name: 'Metallica' }]) // findArtists (resolveEntitySlots)
      .mockResolvedValueOnce([
        { eventDate: '20-08-2019', venueName: 'Some Arena', cityName: 'Some City' },
      ]); // showsForArtistInYear

    const result = await answerQuestion('How about Metallica instead?', {
      artist: { mbid: 'mbid-1', name: 'Foo Fighters' },
      year: '2019',
    });

    expect(resolveReferences).not.toHaveBeenCalled();
    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Metallica');
  });

  it('resolves a bare-name override against the city anchored in context ("how about Paris instead?")', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ id: 'city-2', name: 'Paris' }]) // findCities (override resolution)
      .mockResolvedValueOnce([{ id: 'city-2', name: 'Paris' }]) // findCities (resolveEntitySlots)
      .mockResolvedValueOnce([]); // bandsSeenInCityYear — none

    const result = await answerQuestion('How about Paris instead?', {
      city: { id: 'city-1', name: 'Berlin' },
      year: '2019',
    });

    expect(resolveReferences).not.toHaveBeenCalled();
    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Paris');
  });

  it('resolves a bare-name override against the country anchored in context ("what about Argentina?")', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ code: 'AR', name: 'Argentina' }]) // findCountries (override resolution)
      .mockResolvedValueOnce([{ code: 'AR', name: 'Argentina' }]); // findCountries (resolveEntitySlots)
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 }); // showsInCountry

    const result = await answerQuestion('What about Argentina?', {
      country: { code: 'MX', name: 'Mexico' },
    });

    expect(resolveReferences).not.toHaveBeenCalled();
    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Argentina');
  });

  it('does not call the model when there is no remembered context', async () => {
    const result = await answerQuestion('gibberish nonsense with no context');

    expect(resolveReferences).not.toHaveBeenCalled();
    expect(result.type).toBe('no_match');
  });
});

describe('answerQuestion — on-device model as last resort', () => {
  it('falls through to the model when the phrasing matches no deterministic pattern at all', async () => {
    (resolveReferences as jest.Mock).mockResolvedValue({ artist: 'Foo Fighters', year: '2021' });
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Foo Fighters' }]) // findArtists
      .mockResolvedValueOnce([]); // showsForArtistInYear

    const result = await answerQuestion('yeah give me more detail please', {
      artist: { mbid: 'mbid-1', name: 'Foo Fighters' },
      year: '2019',
    });

    expect(resolveReferences).toHaveBeenCalled();
    expect(result.type).toBe('answer');
  });

  it('lets an ambiguous override value fall through to the model instead of guessing', async () => {
    (resolveReferences as jest.Mock).mockResolvedValue(null);
    mockDb.getAllAsync.mockResolvedValueOnce([
      { mbid: 'mbid-1', name: 'Suede', disambiguation: 'UK band' },
      { mbid: 'mbid-2', name: 'Suede', disambiguation: 'US band' },
    ]); // findArtists — ambiguous, so the deterministic override can't use it

    const result = await answerQuestion('How about Suede instead?', {
      artist: { mbid: 'mbid-3', name: 'Foo Fighters' },
      year: '2019',
    });

    expect(resolveReferences).toHaveBeenCalled();
    expect(result.type).toBe('no_match');
  });

  it('lets an override value with no DB match fall through to the model', async () => {
    (resolveReferences as jest.Mock).mockResolvedValue(null);
    mockDb.getAllAsync.mockResolvedValueOnce([]); // findArtists — no candidates at all

    const result = await answerQuestion('How about Zzzznonexistentband instead?', {
      artist: { mbid: 'mbid-1', name: 'Foo Fighters' },
      year: '2019',
    });

    expect(resolveReferences).toHaveBeenCalled();
    expect(result.type).toBe('no_match');
  });

  it('reports no_match when neither deterministic resolution nor the model can resolve anything', async () => {
    (resolveReferences as jest.Mock).mockResolvedValue(null);

    const result = await answerQuestion('asdkjaslkdj', {
      artist: { mbid: 'mbid-1', name: 'Foo Fighters' },
    });

    expect(result.type).toBe('no_match');
  });
});

describe('answerQuestion — context threading', () => {
  it('threads updated context forward after a normal (non-fallback) answer', async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([{ mbid: 'mbid-1', name: 'Bad Religion' }]) // findArtists
      .mockResolvedValueOnce([
        { eventDate: '10-03-2019', venueName: 'The Fillmore', cityName: 'San Francisco' },
      ]); // showsForArtist

    const result = await answerQuestion('When was the first time I saw Bad Religion?');

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.context?.artist?.name).toBe('Bad Religion');
  });
});

describe('resumeWithChoice', () => {
  it('completes the original question once the user picks a clarification option', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({
      mbid: 'mbid-2',
      name: 'Suede',
      disambiguation: 'US band',
    }); // getArtistByMbid
    mockDb.getAllAsync.mockResolvedValueOnce([
      { eventDate: '01-01-2015', venueName: 'Some Venue', cityName: 'Some City' },
    ]); // showsForArtist

    const result = await resumeWithChoice(
      { intentId: 'first_time_seen', slotKey: 'artist', rawSlots: { artist: 'Suede' } },
      'mbid-2',
    );

    expect(result.type).toBe('answer');
    expect(result.type === 'answer' && result.text).toContain('Suede');
  });
});
