import i18n from '@/i18n';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function partOfToday(hour: number) {
  if (hour < 5) return i18n.t('since.lastNight');
  if (hour < 12) return i18n.t('since.thisMorning');
  if (hour < 17) return i18n.t('since.thisAfternoon');
  return i18n.t('since.thisEvening');
}

/**
 * When something happened, as a person says it: "just now", "5 minutes ago", "this morning",
 * "yesterday", "on Tuesday", "on Nov 3" or, from another year, "on Nov 3, 2025".
 */
export function formatSince(date: Date, now = new Date()): string {
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE) return i18n.t('since.justNow');
  if (elapsed < HOUR) return i18n.t('since.minutesAgo', { count: Math.floor(elapsed / MINUTE) });
  // A few hours ago is still counted; later the same day becomes a part of the day.
  if (elapsed < 3 * HOUR) return i18n.t('since.hoursAgo', { count: Math.floor(elapsed / HOUR) });

  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / (24 * HOUR));
  if (days === 0) return partOfToday(date.getHours());
  if (days === 1) return i18n.t('since.yesterday');
  const day =
    days < 7
      ? date.toLocaleDateString('en-US', { weekday: 'long' })
      : date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
        });
  return i18n.t('since.onDay', { day });
}

/** The same, starting with a capital, for a value that stands alone: "Yesterday". */
export const formatSinceAlone = (date: Date, now?: Date) => {
  const text = formatSince(date, now);
  return text.charAt(0).toUpperCase() + text.slice(1);
};
