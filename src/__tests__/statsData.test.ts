import {
  buildArtistSeries,
  buildArtistXLabels,
  buildWeekdayBarData,
  buildYearBarData,
  findBusiestWeekday,
  findBusiestYear,
  type YearSummaries,
} from '@/components/stats/statsData';

// Echo the key so the tests read which weekday landed where.
const t = (key: string) => key;

function summary(year: string, shows: number): YearSummaries[number] {
  return { year, shows, countries: 1, cities: 1, peakMonth: 0, peakMonthCount: 0 };
}

// getYearSummaries returns the newest year first.
const NEWEST_FIRST = [summary('2025', 4), summary('2024', 4), summary('2023', 1)];

describe('buildWeekdayBarData', () => {
  it('maps Sunday (0) to Saturday (6) to the right bar', () => {
    const bars = buildWeekdayBarData(
      [
        { weekday: 0, concertDays: 1 },
        { weekday: 3, concertDays: 4 },
        { weekday: 6, concertDays: 7 },
      ],
      t,
    );
    expect(bars.map((b) => b.id)).toEqual(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    expect(bars.map((b) => b.label)).toEqual([
      'weekdays.short.sun',
      'weekdays.short.mon',
      'weekdays.short.tue',
      'weekdays.short.wed',
      'weekdays.short.thu',
      'weekdays.short.fri',
      'weekdays.short.sat',
    ]);
    expect(bars.map((b) => b.value)).toEqual([1, 0, 0, 4, 0, 0, 7]);
  });

  it('gives every day a zero bar when there are no concerts', () => {
    expect(buildWeekdayBarData([], t).map((b) => b.value)).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('findBusiestWeekday', () => {
  it('names the weekday with the most concert days', () => {
    expect(
      findBusiestWeekday(
        [
          { weekday: 1, concertDays: 2 },
          { weekday: 5, concertDays: 3 },
        ],
        t,
      ),
    ).toEqual({ name: 'weekdays.long.fri', count: 3 });
  });

  it('is null without concerts', () => {
    expect(findBusiestWeekday([], t)).toBeNull();
  });
});

describe('findBusiestYear', () => {
  it('picks the year with the most shows', () => {
    expect(findBusiestYear([summary('2025', 2), summary('2024', 5)])?.year).toBe('2024');
  });

  it('lets the later row win a tie, which is the older year in the newest-first list', () => {
    expect(findBusiestYear(NEWEST_FIRST)?.year).toBe('2024');
  });

  it('is null without years', () => {
    expect(findBusiestYear([])).toBeNull();
  });
});

describe('buildYearBarData', () => {
  it('sorts the years oldest first and leaves the input alone', () => {
    expect(buildYearBarData(NEWEST_FIRST)).toEqual([
      { id: '2023', label: '23', spokenLabel: '2023', value: 1 },
      { id: '2024', label: '24', spokenLabel: '2024', value: 4 },
      { id: '2025', label: '25', spokenLabel: '2025', value: 4 },
    ]);
    expect(NEWEST_FIRST.map((r) => r.year)).toEqual(['2025', '2024', '2023']);
  });
});

describe('buildArtistXLabels', () => {
  it('labels the years oldest first with an apostrophe', () => {
    expect(buildArtistXLabels(NEWEST_FIRST)).toEqual(["'23", "'24", "'25"]);
  });
});

describe('buildArtistSeries', () => {
  it('adds up each artist across the sorted years and cycles the colors', () => {
    const series = buildArtistSeries(
      NEWEST_FIRST,
      [
        { artistName: 'Radiohead', year: '2023', shows: 1 },
        { artistName: 'Radiohead', year: '2025', shows: 2 },
        { artistName: 'Beck', year: '2024', shows: 3 },
        { artistName: 'Air', year: '2025', shows: 1 },
      ],
      ['red', 'blue'],
    );
    expect(series).toEqual([
      { label: 'Radiohead', color: 'red', data: [1, 1, 3] },
      { label: 'Beck', color: 'blue', data: [0, 3, 3] },
      { label: 'Air', color: 'red', data: [0, 0, 1] },
    ]);
  });

  it('has no series without top artists', () => {
    expect(buildArtistSeries(NEWEST_FIRST, [], ['red'])).toEqual([]);
  });
});
