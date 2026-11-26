import type { dbOperations } from '@/database/operations';

export type DashboardStats = Awaited<ReturnType<typeof dbOperations.getDashboardStats>>;
export type OnThisDayConcert = Awaited<ReturnType<typeof dbOperations.getOnThisDayConcert>>;
export type InsightStats = Awaited<ReturnType<typeof dbOperations.getInsightStats>>;
export type YearConcerts = Awaited<ReturnType<typeof dbOperations.getSetlistsByYear>>;
export type Milestone = InsightStats['milestones'][number];

export type MonthlyRow = { year: string; month: number; count: number };

export type YearSummary = {
  year: string;
  shows: number;
  countries: number;
  cities: number;
  peakMonth: number;
  peakMonthCount: number;
};

// Concert fields every dashboard entry needs: image, name, date and the route id.
export type ConcertEntry = {
  setlistId: string;
  artistName: string;
  eventDate: string;
  artistMbid: string | null;
  artistImageUrl: string | null;
  // For the long-press menu's Open venue (phone timeline); the iPad's year list has none.
  venueId?: string | null;
};

export type MonthCounts = Record<number, number>;
