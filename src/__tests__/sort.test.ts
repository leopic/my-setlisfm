import { parseSetlistDate } from '@/utils/date';
import { sortByOption } from '@/utils/sort';

// Counts the date parses; the list screens sort on every render, so this is the hot path.
jest.mock('@/utils/date', () => {
  const actual = jest.requireActual('@/utils/date');
  return { ...actual, parseSetlistDate: jest.fn(actual.parseSetlistDate) };
});

type Item = { name: string; lastConcertDate?: string; count: number };

const items: Item[] = [
  { name: 'Beta', lastConcertDate: '01-02-2024', count: 3 },
  { name: 'alpha', lastConcertDate: '15-06-2025', count: 1 },
  { name: 'Gamma', lastConcertDate: '31-12-2023', count: 7 },
];
const names = (list: Item[]) => list.map((i) => i.name);

beforeEach(() => jest.mocked(parseSetlistDate).mockClear());

describe('sortByOption', () => {
  it('puts the most recent first', () => {
    expect(names(sortByOption(items, 'recent'))).toEqual(['alpha', 'Beta', 'Gamma']);
  });

  it('sorts by name and by count', () => {
    expect(names(sortByOption(items, 'alphabetical'))).toEqual(['alpha', 'Beta', 'Gamma']);
    expect(names(sortByOption(items, 'top', undefined, (i) => i.count))).toEqual([
      'Gamma',
      'Beta',
      'alpha',
    ]);
  });

  it('reads the date through getDate', () => {
    // lastConcertDate says the opposite order, so only getDate gives this one.
    const byEvent = [
      { name: 'old', eventDate: '01-01-2020', lastConcertDate: '01-01-2026' },
      { name: 'new', eventDate: '01-01-2026', lastConcertDate: '01-01-2020' },
    ];
    expect(sortByOption(byEvent, 'recent', (i) => i.eventDate).map((i) => i.name)).toEqual([
      'new',
      'old',
    ]);
  });

  it('keeps an item without a date where it is', () => {
    const undated: Item[] = [
      { name: 'A', lastConcertDate: '01-01-2020', count: 0 },
      { name: 'B', count: 0 },
      { name: 'C', lastConcertDate: '01-01-2026', count: 0 },
      { name: 'D', lastConcertDate: '', count: 0 },
    ];
    expect(names(sortByOption(undated, 'recent'))).toEqual(['A', 'B', 'C', 'D']);
  });

  it('does not change the list it gets', () => {
    const copy = [...items];
    sortByOption(items, 'recent');
    expect(items).toEqual(copy);
  });

  it('parses each date once, not once per comparison', () => {
    const many: Item[] = Array.from({ length: 450 }, (_, i) => ({
      name: `Artist ${i}`,
      lastConcertDate: `${String((i % 28) + 1).padStart(2, '0')}-${String((i % 12) + 1).padStart(2, '0')}-${2000 + (i % 26)}`,
      count: i,
    }));
    sortByOption(many, 'recent');
    expect(parseSetlistDate).toHaveBeenCalledTimes(450);
  });
});
