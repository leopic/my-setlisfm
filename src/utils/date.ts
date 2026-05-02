/**
 * Parses a DD-MM-YYYY date string (setlist.fm format) into a Date object.
 */
export function parseSetlistDate(dateString: string): Date {
  try {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  } catch {
    return new Date(0);
  }
}

type DateFormat = 'short' | 'long';

/**
 * Formats a YYYY-MM-DD ISO date string for display.
 */
export function formatIsoDate(isoDate: string, format: DateFormat = 'short'): string {
  try {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (format === 'long') {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function isoYear(isoDate: string): string {
  return isoDate.split('-')[0] ?? isoDate;
}

/**
 * Converts a raw day count into a human-readable duration string.
 * Intended for gaps and spans between dates, not event counts.
 *
 * Examples:
 *   0   → "same day"
 *   1   → "1 day"
 *   17  → "17 days"
 *   45  → "1 month"
 *   182 → "6 months"
 *   380 → "1 year"
 *   400 → "1 year, 1 month"
 *   880 → "2 years, 5 months"
 */
export function formatDaySpan(days: number): string {
  if (days <= 0) return 'same day';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;

  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);

  if (years > 0 && months > 0) {
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
  }
  if (years > 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  return `${months} month${months !== 1 ? 's' : ''}`;
}

/**
 * Formats a DD-MM-YYYY date string for display.
 * - "short": "Mar 19, 2026"
 * - "long":  "Thursday, March 19, 2026"
 */
export function formatDate(dateString: string, format: DateFormat = 'short'): string {
  try {
    const date = parseSetlistDate(dateString);
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
