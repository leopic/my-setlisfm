import { formatPlace } from '@/utils/place';

describe('formatPlace', () => {
  it('joins city, state and country', () => {
    expect(formatPlace('Austin', 'Texas', 'United States')).toBe('Austin, Texas, United States');
  });

  it('leaves out a state with the same name as its city', () => {
    expect(formatPlace('Berlin', 'Berlin', 'Germany')).toBe('Berlin, Germany');
    expect(formatPlace('New York', 'new york', 'United States')).toBe('New York, United States');
  });

  it('leaves out a country with the same name as its city', () => {
    expect(formatPlace('Singapore', undefined, 'Singapore')).toBe('Singapore');
  });

  it('ignores accents when comparing', () => {
    expect(formatPlace('Zürich', 'Zurich', 'Switzerland')).toBe('Zürich, Switzerland');
  });

  it('leaves out empty parts', () => {
    expect(formatPlace(undefined, null, ' ', 'Germany')).toBe('Germany');
    expect(formatPlace()).toBe('');
  });
});
