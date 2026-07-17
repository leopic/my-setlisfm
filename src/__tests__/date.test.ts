import { toIsoDate, getEventYear, monthNameToNumber, monthDisplayName } from '@/utils/date';

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

describe('monthNameToNumber', () => {
  it('maps full month names to zero-padded numbers', () => {
    expect(monthNameToNumber('June')).toBe('06');
    expect(monthNameToNumber('december')).toBe('12');
  });

  it('maps common abbreviations to the same number as the full name', () => {
    expect(monthNameToNumber('jun')).toBe('06');
    expect(monthNameToNumber('Sept')).toBe('09');
    expect(monthNameToNumber('sep')).toBe('09');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(monthNameToNumber('  JANUARY  ')).toBe('01');
  });
});

describe('monthDisplayName', () => {
  it('returns the full display name for a zero-padded month number', () => {
    expect(monthDisplayName('06')).toBe('June');
    expect(monthDisplayName('01')).toBe('January');
    expect(monthDisplayName('12')).toBe('December');
  });
});
