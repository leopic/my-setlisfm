import type { SetlistWithDetails } from '@/types/database';

export interface ConcertWithDetails extends SetlistWithDetails {
  artistName: string;
  venueName: string;
  cityName?: string;
  stateName?: string;
  countryName?: string;
}

export interface YearGroup {
  year: string;
  concerts: ConcertWithDetails[];
  monthStats: { [month: string]: number };
  totalConcerts: number;
}

export type ConcertListItem =
  | { type: 'year'; yearGroup: YearGroup; yearIndex: number }
  | { type: 'concert'; concert: ConcertWithDetails };
