/** Weekday keys in JS `getDay()` / SQLite `%w` order (0 = Sunday), for `weekdays.short.*` and `weekdays.long.*`. */
export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** Month keys in calendar order (index 0 = January), for `months.short.*`. */
export const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;
