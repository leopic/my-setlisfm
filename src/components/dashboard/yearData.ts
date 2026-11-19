import type {
  DashboardStats,
  Milestone,
  MonthCounts,
  MonthlyRow,
  OnThisDayConcert,
  YearSummary,
} from './types';

// Dates are DD-MM-YYYY.
export const yearOf = (eventDate: string) => eventDate.split('-')[2];

export const groupMonthlyByYear = (rows: MonthlyRow[]) =>
  rows.reduce<Record<string, MonthCounts>>((acc, row) => {
    if (!acc[row.year]) acc[row.year] = {};
    acc[row.year][row.month] = row.count;
    return acc;
  }, {});

export const indexSummariesByYear = (summaries: YearSummary[]) =>
  summaries.reduce<Record<string, YearSummary>>((acc, s) => {
    acc[s.year] = s;
    return acc;
  }, {});

export const groupMilestonesByYear = (milestones: Milestone[]) =>
  milestones.reduce<Record<string, Milestone[]>>((acc, m) => {
    const yr = yearOf(m.eventDate);
    if (yr) {
      if (!acc[yr]) acc[yr] = [];
      acc[yr].push(m);
    }
    return acc;
  }, {});

// Which special concerts fall in a year, and the milestones that no special entry already shows.
export function getYearHighlights(
  yearStr: string,
  stats: DashboardStats,
  onThisDay: OnThisDayConcert,
  yearMilestones: Milestone[],
) {
  const isLast = stats.lastConcert ? yearOf(stats.lastConcert.eventDate) === yearStr : false;
  const isFirst = stats.firstConcert ? yearOf(stats.firstConcert.eventDate) === yearStr : false;
  const isOnThisDay = onThisDay ? yearOf(onThisDay.eventDate) === yearStr : false;
  const alreadyShownIds = new Set([
    isLast ? stats.lastConcert?.setlistId : undefined,
    isFirst ? stats.firstConcert?.setlistId : undefined,
    isOnThisDay ? onThisDay?.setlistId : undefined,
  ]);
  const milestones = yearMilestones.filter((m) => !alreadyShownIds.has(m.setlistId));
  return { isLast, isFirst, isOnThisDay, milestones };
}
