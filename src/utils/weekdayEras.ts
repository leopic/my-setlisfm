export interface WeekdayEra {
  startYear: number;
  /** Last year of the era, capped at the latest year with concerts. */
  endYear: number;
  /** Concert days per weekday, 0 = Sunday … 6 = Saturday. */
  counts: number[];
  total: number;
  /** Weekdays sharing the highest count; more than one on a tie. */
  topWeekdays: number[];
  topCount: number;
}

/**
 * Groups per-year weekday counts into eras of `eraLength` years, anchored on the first year
 * with concerts so nobody starts with a near-empty calendar bucket. An era without any
 * concerts is left out, and fewer than `minEras` eras returns nothing:
 * one era says no more than the plain weekday chart does.
 */
export function groupWeekdaysIntoEras(
  rows: Array<{ year: number; weekday: number; concertDays: number }>,
  { eraLength = 5, minEras = 2 }: { eraLength?: number; minEras?: number } = {},
): WeekdayEra[] {
  if (rows.length === 0) return [];

  const firstYear = Math.min(...rows.map((r) => r.year));
  const lastYear = Math.max(...rows.map((r) => r.year));

  const byStart = new Map<number, number[]>();
  for (const { year, weekday, concertDays } of rows) {
    const startYear = firstYear + Math.floor((year - firstYear) / eraLength) * eraLength;
    const counts = byStart.get(startYear) ?? Array<number>(7).fill(0);
    counts[weekday] += concertDays;
    byStart.set(startYear, counts);
  }

  const eras = [...byStart.entries()]
    .sort(([a], [b]) => a - b)
    .map(([startYear, counts]) => {
      const topCount = Math.max(...counts);
      return {
        startYear,
        endYear: Math.min(startYear + eraLength - 1, lastYear),
        counts,
        total: counts.reduce((sum, n) => sum + n, 0),
        topWeekdays: counts.flatMap((n, weekday) => (n === topCount ? [weekday] : [])),
        topCount,
      };
    });

  return eras.length >= minEras ? eras : [];
}

/** "2014–18", or "1998–2002" across a century, or "2026" for a one-year era. */
export function formatEraLabel({ startYear, endYear }: Pick<WeekdayEra, 'startYear' | 'endYear'>) {
  if (startYear === endYear) return String(startYear);
  const sameCentury = Math.floor(startYear / 100) === Math.floor(endYear / 100);
  return `${startYear}–${sameCentury ? String(endYear).slice(2) : endYear}`;
}
