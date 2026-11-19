import type { LineSeries } from '@/components/charts/LineChart';
import type { dbOperations } from '@/database/operations';
import { WEEKDAY_KEYS } from '@/i18n/calendar';

export type YearSummaries = Awaited<ReturnType<typeof dbOperations.getYearSummaries>>;
export type StatsChartData = Awaited<ReturnType<typeof dbOperations.getStatsChartData>>;
type Translate = (key: string) => string;

export const ARTIST_COLORS_DARK = ['#00e8ff', '#ff9f0a', '#30d158', '#bf5af2', '#ff6b6b'];
export const ARTIST_COLORS_LIGHT = ['#0066bb', '#b45309', '#16a34a', '#7c3aed', '#dc2626'];

// ── Helpers ───────────────────────────────────────────────────────────────

// ── Derived chart data ─────────────────────────────────────────────────────

function sortByYear(yearSummaries: YearSummaries) {
  return [...yearSummaries].sort((a, b) => a.year.localeCompare(b.year));
}

export function buildYearBarData(yearSummaries: YearSummaries) {
  return sortByYear(yearSummaries).map((r) => ({
    id: r.year,
    label: r.year.slice(2),
    value: r.shows,
  }));
}

// Cumulative shows per year for each of the top artists.
export function buildArtistSeries(
  yearSummaries: YearSummaries,
  topArtistsPerYear: StatsChartData['topArtistsPerYear'],
  artistColors: string[],
): LineSeries[] {
  const allYears = sortByYear(yearSummaries).map((r) => r.year);

  // Group by artist
  const byArtist = new Map<string, Map<string, number>>();
  for (const row of topArtistsPerYear) {
    if (!byArtist.has(row.artistName)) byArtist.set(row.artistName, new Map());
    byArtist.get(row.artistName)?.set(row.year, row.shows);
  }

  return Array.from(byArtist.entries()).map(([name, yearMap], i) => {
    let cumul = 0;
    const data = allYears.map((yr) => {
      cumul += yearMap.get(yr) ?? 0;
      return cumul;
    });
    return { label: name, color: artistColors[i % artistColors.length], data };
  });
}

export function buildArtistXLabels(yearSummaries: YearSummaries) {
  return sortByYear(yearSummaries).map((r) => `'${r.year.slice(2)}`);
}

export function findBusiestYear(yearSummaries: YearSummaries) {
  if (!yearSummaries.length) return null;
  return yearSummaries.reduce((a, b) => (a.shows > b.shows ? a : b));
}

export function findBusiestWeekday(weekdays: StatsChartData['weekdays'], t: Translate) {
  if (!weekdays.length) return null;
  const top = weekdays.reduce((a, b) => (a.concertDays > b.concertDays ? a : b));
  const key = WEEKDAY_KEYS[top.weekday];
  return key ? { name: t(`weekdays.long.${key}`), count: top.concertDays } : null;
}

export function buildWeekdayBarData(weekdays: StatsChartData['weekdays'], t: Translate) {
  return WEEKDAY_KEYS.map((key, i) => ({
    id: key,
    label: t(`weekdays.short.${key}`),
    value: weekdays.find((w) => w.weekday === i)?.concertDays ?? 0,
  }));
}
