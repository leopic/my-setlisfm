import { parseSetlistDate } from './date';

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
    case 'recent':
      return [...items].sort((a, b) => {
        const dateA = getDate(a);
        const dateB = getDate(b);
        if (!dateA || !dateB) return 0;
        return parseSetlistDate(dateB).getTime() - parseSetlistDate(dateA).getTime();
      });
    case 'top':
      if (!getCount) return items;
      return [...items].sort((a, b) => getCount(b) - getCount(a));
    default:
      return items;
  }
}
