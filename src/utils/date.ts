/**
 * Parses a DD-MM-YYYY date string (setlist.fm format) into a Date object.
 */
export function parseDateCorrectly(dateString: string): Date {
  try {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  } catch {
    return new Date(0);
  }
}

type DateFormat = 'short' | 'long';

/**
 * Formats a DD-MM-YYYY date string for display.
 * - "short": "Mar 19, 2026"
 * - "long":  "Thursday, March 19, 2026"
 */
export function formatDate(dateString: string, format: DateFormat = 'short'): string {
  try {
    const date = parseDateCorrectly(dateString);
    if (format === 'long') {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
