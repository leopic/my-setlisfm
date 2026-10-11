import { groupWeekdaysIntoEras, formatEraLabel } from '@/utils/weekdayEras';

const FRI = 5;
const SAT = 6;
const SUN = 0;

describe('groupWeekdaysIntoEras', () => {
  it('anchors eras on the first year and caps the last one at the latest year', () => {
    const eras = groupWeekdaysIntoEras([
      { year: 2009, weekday: FRI, concertDays: 3 },
      { year: 2013, weekday: SAT, concertDays: 1 },
      { year: 2014, weekday: SAT, concertDays: 4 },
      { year: 2016, weekday: SUN, concertDays: 2 },
    ]);

    expect(eras.map(({ startYear, endYear }) => [startYear, endYear])).toEqual([
      [2009, 2013],
      [2014, 2016],
    ]);
  });

  it('adds up concert days per weekday across the years of an era', () => {
    const [first] = groupWeekdaysIntoEras([
      { year: 2010, weekday: FRI, concertDays: 2 },
      { year: 2011, weekday: FRI, concertDays: 3 },
      { year: 2012, weekday: SAT, concertDays: 1 },
      { year: 2020, weekday: SAT, concertDays: 1 },
    ]);

    expect(first.counts).toEqual([0, 0, 0, 0, 0, 5, 1]);
    expect(first.total).toBe(6);
    expect(first.topWeekdays).toEqual([FRI]);
    expect(first.topCount).toBe(5);
  });

  it('keeps every weekday that ties for the top', () => {
    const [first] = groupWeekdaysIntoEras([
      { year: 2019, weekday: SUN, concertDays: 15 },
      { year: 2019, weekday: FRI, concertDays: 15 },
      { year: 2020, weekday: SAT, concertDays: 3 },
      { year: 2025, weekday: SAT, concertDays: 1 },
    ]);

    expect(first.topWeekdays).toEqual([SUN, FRI]);
    expect(first.topCount).toBe(15);
  });

  it('leaves out an era without any concerts', () => {
    const eras = groupWeekdaysIntoEras([
      { year: 2000, weekday: FRI, concertDays: 1 },
      { year: 2012, weekday: SAT, concertDays: 1 },
    ]);

    expect(eras.map((e) => e.startYear)).toEqual([2000, 2010]);
  });

  it('returns nothing when the history fits in a single era', () => {
    expect(
      groupWeekdaysIntoEras([
        { year: 2024, weekday: FRI, concertDays: 3 },
        { year: 2025, weekday: SAT, concertDays: 2 },
      ]),
    ).toEqual([]);
  });

  it('returns nothing without concerts', () => {
    expect(groupWeekdaysIntoEras([])).toEqual([]);
  });
});

describe('formatEraLabel', () => {
  it('shortens the end year within a century', () => {
    expect(formatEraLabel({ startYear: 2014, endYear: 2018 })).toBe('2014–18');
  });

  it('keeps the full end year across a century', () => {
    expect(formatEraLabel({ startYear: 1998, endYear: 2002 })).toBe('1998–2002');
  });

  it('shows a single year for a one-year era', () => {
    expect(formatEraLabel({ startYear: 2026, endYear: 2026 })).toBe('2026');
  });
});
