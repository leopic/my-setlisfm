import { formatSince, formatSinceAlone } from '@/utils/since';

// Saturday, Nov 21, 2026, 15:00 local time.
const NOW = new Date(2026, 10, 21, 15, 0);
const minutesBefore = (minutes: number) => new Date(NOW.getTime() - minutes * 60 * 1000);
const at = (month: number, day: number, hour: number, year = 2026) =>
  new Date(year, month - 1, day, hour);

it.each([
  ['30 seconds ago', minutesBefore(0.5), 'just now'],
  ['1 minute ago', minutesBefore(1), 'a minute ago'],
  ['45 minutes ago', minutesBefore(45), '45 minutes ago'],
  ['1 hour ago', minutesBefore(60), 'an hour ago'],
  ['2 hours 59 minutes ago', minutesBefore(179), '2 hours ago'],
  ['3 hours ago, at noon', minutesBefore(180), 'this afternoon'],
  ['earlier this morning', at(11, 21, 9), 'this morning'],
  ['before dawn', at(11, 21, 3), 'last night'],
  ['the evening before', at(11, 20, 22), 'yesterday'],
  ['three days ago', at(11, 18, 15), 'on Wednesday'],
  ['six days ago', at(11, 15, 15), 'on Sunday'],
  ['a week ago', at(11, 14, 15), 'on Nov 14'],
  ['last year', at(11, 3, 15, 2025), 'on Nov 3, 2025'],
])('says a time %s the way a person would', (_when, date, expected) => {
  expect(formatSince(date, NOW)).toBe(expected);
});

it('names the part of today for a time more than a few hours ago', () => {
  const evening = new Date(2026, 10, 21, 23, 0);
  expect(formatSince(at(11, 21, 13), evening)).toBe('this afternoon');
  expect(formatSince(at(11, 21, 18), evening)).toBe('this evening');
});

it('says "just now" for a time a little ahead of the clock', () => {
  expect(formatSince(minutesBefore(-2), NOW)).toBe('just now');
});

it('starts with a capital when it stands alone', () => {
  expect(formatSinceAlone(at(11, 20, 22), NOW)).toBe('Yesterday');
});

// Days with a clock change are 23 or 25 hours long. In Berlin the clocks go forward early on
// Mar 29, 2026 and back early on Oct 25, 2026, so the gap from those days to the next is 23 or
// 25 hours. These cases only test that in a zone with clock changes (a Mac in Berlin runs the
// pre-push hook there); CI runs in UTC, where every day is 24 hours.
describe('around a clock change in Berlin', () => {
  it.each([
    ['after the clocks went forward', 2, 30],
    ['after the clocks went back', 9, 26],
  ])('still says "yesterday" for the evening before, %s', (_when, month, day) => {
    const now = new Date(2026, month, day, 21);
    const date = new Date(2026, month, day - 1, 22);
    expect(formatSince(date, now)).toBe('yesterday');
  });
});
