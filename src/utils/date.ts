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

function isoYear(isoDate: string): string {
  return isoDate.split('-')[0] ?? isoDate;
}

/**
 * Converts a DD-MM-YYYY date string (setlist.fm format) to ISO YYYY-MM-DD.
 * Mirrors the `substr(eventDate,7,4)||'-'||substr(eventDate,4,2)||'-'||substr(eventDate,1,2)`
 * SQL expression used across operations.ts, for JS-side callers (e.g. chat query formatting).
 */
export function toIsoDate(dateString: string): string {
  const [day, month, year] = dateString.split('-');
  return `${year}-${month}-${day}`;
}

/**
 * Extracts the year (as a string) from a DD-MM-YYYY event date.
 */
export function getEventYear(dateString: string): string {
  return dateString.split('-')[2] ?? '';
}

const MONTH_DISPLAY_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_NAME_TO_NUMBER: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

/** Maps a month name or abbreviation (case-insensitive) to its zero-padded number, e.g. "June" → "06". */
export function monthNameToNumber(name: string): string {
  return MONTH_NAME_TO_NUMBER[name.trim().toLowerCase()];
}

/** Full display name for a zero-padded month number, e.g. "06" → "June". */
export function monthDisplayName(monthNumber: string): string {
  return MONTH_DISPLAY_NAMES[Number(monthNumber) - 1] ?? monthNumber;
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
function formatDaySpan(days: number): string {
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
