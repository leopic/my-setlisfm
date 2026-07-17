jest.mock('@/database/database', () => ({
  databaseManager: {
    getDatabase: jest.fn(),
  },
}));

import { databaseManager } from '@/database/database';
import { findArtists, findVenues, isAmbiguous } from '@/services/chat/entityResolver';

const mockDb = {
  getAllAsync: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (databaseManager.getDatabase as jest.Mock).mockReturnValue(mockDb);
});

describe('findArtists', () => {
  it('matches on exact name', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { mbid: '1', name: 'Bad Religion' },
      { mbid: '2', name: 'NOFX' },
    ]);

    const matches = await findArtists('Bad Religion');

    expect(matches[0].record.mbid).toBe('1');
    expect(matches[0].score).toBe(1);
  });

  it('tolerates typos via fuzzy matching', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { mbid: '1', name: 'Bad Religion' },
      { mbid: '2', name: 'NOFX' },
    ]);

    const matches = await findArtists('bad religon');

    expect(matches[0].record.mbid).toBe('1');
    expect(matches[0].score).toBeGreaterThan(0.5);
  });

  it('surfaces disambiguation text in the label when present', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ mbid: '1', name: 'Suede', disambiguation: 'UK band' }]);

    const matches = await findArtists('Suede');

    expect(matches[0].label).toBe('Suede (UK band)');
  });

  it('returns no matches below the similarity threshold', async () => {
    mockDb.getAllAsync.mockResolvedValue([{ mbid: '1', name: 'Bad Religion' }]);

    const matches = await findArtists('xyz completely unrelated');

    expect(matches).toHaveLength(0);
  });
});

describe('findVenues', () => {
  it('matches venue names', async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { id: 'v1', name: 'The Fillmore' },
      { id: 'v2', name: 'Red Rocks Amphitheatre' },
    ]);

    const matches = await findVenues('fillmore');

    expect(matches[0].record.id).toBe('v1');
  });
});

describe('isAmbiguous', () => {
  it('is false for a single match', () => {
    expect(isAmbiguous([{ record: {}, score: 1, label: 'a' }])).toBe(false);
  });

  it('is false when the top match clearly beats the runner-up', () => {
    expect(
      isAmbiguous([
        { record: {}, score: 1, label: 'a' },
        { record: {}, score: 0.6, label: 'b' },
      ]),
    ).toBe(false);
  });

  it('is true when two candidates are close in score', () => {
    expect(
      isAmbiguous([
        { record: {}, score: 0.9, label: 'a' },
        { record: {}, score: 0.87, label: 'b' },
      ]),
    ).toBe(true);
  });
});
