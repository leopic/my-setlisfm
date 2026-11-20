import { parseSetlistDate } from '@/utils/date';

export type SortOption = 'alphabetical' | 'recent' | 'top';

interface Sortable {
  name: string;
  lastConcertDate?: string;
  eventDate?: string;
}

/**
 * Generic sort for list screens.
 *
 * @param items       - The array to sort (not mutated).
 * @param sortBy      - Which sort to apply.
 * @param getDate     - Accessor for the date field (defaults to lastConcertDate).
 * @param getCount    - Accessor for the numeric "top" field (required only when sortBy is 'top').
 */
export function sortByOption<T extends Sortable>(
  items: T[],
  sortBy: SortOption,
  getDate: (item: T) => string | undefined = (item) => item.lastConcertDate ?? item.eventDate,
  getCount?: (item: T) => number,
): T[] {
  switch (sortBy) {
    case 'alphabetical':
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
    case 'recent': {
      // Parse each date once, not in the comparator: that ran ~n log n times, 20 ms a render
      // for 450 artists, and the list screens sort on every render (each search keystroke).
      const times = new Map<T, number>();
      for (const item of items) {
        const date = getDate(item);
        if (date) times.set(item, parseSetlistDate(date).getTime());
      }
      return [...items].sort((a, b) => {
        const timeA = times.get(a);
        const timeB = times.get(b);
        if (timeA === undefined || timeB === undefined) return 0;
        return timeB - timeA;
      });
    }
    case 'top':
      if (!getCount) return items;
      return [...items].sort((a, b) => getCount(b) - getCount(a));
    default:
      return items;
  }
}
