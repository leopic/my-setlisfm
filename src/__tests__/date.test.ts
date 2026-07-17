import { toIsoDate, getEventYear } from '@/utils/date';

describe('toIsoDate', () => {
  it('converts a DD-MM-YYYY string to ISO YYYY-MM-DD', () => {
    expect(toIsoDate('17-07-2026')).toBe('2026-07-17');
  });

  it('handles single-digit day/month with leading zeros preserved', () => {
    expect(toIsoDate('05-01-2020')).toBe('2020-01-05');
  });
});

describe('getEventYear', () => {
  it('extracts the year from a DD-MM-YYYY string', () => {
    expect(getEventYear('17-07-2026')).toBe('2026');
  });

  it('returns an empty string for malformed input', () => {
    expect(getEventYear('')).toBe('');
  });
});
