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
    jest.spyOn(dbOperations, 'getDashboardStats').mockResolvedValue({
      totalConcerts: 0,
      totalArtists: 0,
      totalVenues: 0,
      totalCountries: 0,
      topArtist: { mbid: 'mbid-1', name: 'Bad Religion', count: 5 },
      topVenue: null,
      firstConcert: null,
      lastConcert: null,
      concertsByYear: [],
    });

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
