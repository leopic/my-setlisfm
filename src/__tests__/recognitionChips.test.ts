import type { TFunction } from 'i18next';
import { buildRecognitionChips } from '@/components/recognitionChips';
import type { ConcertRecognitionFacts } from '@/database/factQueries';

jest.mock('@/utils/date', () => ({
  formatTimeAgo: (days: number) => `${days}d ago`,
}));

// Renders "key|options" so each assertion shows the template and the values it got.
const t = ((key: string, options?: Record<string, unknown>) =>
  options ? `${key}|${JSON.stringify(options)}` : key) as unknown as TFunction;

const baseFacts: ConcertRecognitionFacts = {
  ordinalForArtist: 1,
  previousShowForArtist: null,
  daysSincePreviousShowForArtist: null,
  distinctCountriesForArtistSoFar: 1,
  distinctCitiesForArtistSoFar: 1,
  isNewCountryForArtist: false,
  isNewCityForArtist: false,
  isFirstVisitToVenue: true,
  venueVisitOrdinal: 1,
};

const previousShow = {
  eventDate: '01-01-2020',
  venueName: 'Old Venue',
  cityName: 'Berlin',
  countryName: 'Germany',
};

function chipsFor(
  facts: Partial<ConcertRecognitionFacts>,
  names: { city?: string | null; country?: string | null } = {},
) {
  return buildRecognitionChips({
    facts: { ...baseFacts, ...facts },
    artistName: 'Muse',
    currentCityName: names.city,
    currentCountryName: names.country,
    t,
  });
}

describe('buildRecognitionChips', () => {
  it('shows only the first-visit venue chip when nothing else applies', () => {
    expect(chipsFor({})).toEqual([
      { icon: { sf: 'mappin', md: 'location-outline' }, text: 'recognition.firstVisitToVenue' },
    ]);
  });

  it('shows the venue visit ordinal on a repeat visit', () => {
    expect(chipsFor({ isFirstVisitToVenue: false, venueVisitOrdinal: 22 })).toEqual([
      {
        icon: { sf: 'arrow.triangle.2.circlepath', md: 'repeat-outline' },
        text: 'recognition.venueVisitOrdinal|{"ordinal":"22nd"}',
      },
    ]);
  });

  it('shows the last-seen chip with the previous location', () => {
    const [lastSeen] = chipsFor({
      previousShowForArtist: previousShow,
      daysSincePreviousShowForArtist: 400,
    });

    expect(lastSeen).toEqual({
      icon: { sf: 'clock', md: 'time-outline' },
      text: 'recognition.lastSeen|{"timeAgo":"400d ago","location":"Berlin, Germany"}',
    });
  });

  it('shows the last-seen chip for a previous show that has only a country', () => {
    const [lastSeen] = chipsFor({
      previousShowForArtist: { ...previousShow, cityName: null },
      daysSincePreviousShowForArtist: 10,
    });

    expect(lastSeen.text).toBe('recognition.lastSeen|{"timeAgo":"10d ago","location":"Germany"}');
  });

  it('uses the no-location variant when the previous show has no city or country', () => {
    const [lastSeen] = chipsFor({
      previousShowForArtist: { ...previousShow, cityName: null, countryName: null },
      daysSincePreviousShowForArtist: 0,
    });

    expect(lastSeen).toEqual({
      icon: { sf: 'clock', md: 'time-outline' },
      text: 'recognition.lastSeenNoLocation|{"timeAgo":"0d ago"}',
    });
  });

  it('skips the last-seen chip when the day gap is missing', () => {
    expect(
      chipsFor({ previousShowForArtist: previousShow, daysSincePreviousShowForArtist: null }),
    ).toHaveLength(1);
  });

  it('skips the last-seen chip when there is no previous show', () => {
    expect(
      chipsFor({ previousShowForArtist: null, daysSincePreviousShowForArtist: 5 }),
    ).toHaveLength(1);
  });

  it('shows the new-country chip and no city chip for a new country', () => {
    const chips = chipsFor(
      {
        isNewCountryForArtist: true,
        isNewCityForArtist: true,
        distinctCountriesForArtistSoFar: 3,
        distinctCitiesForArtistSoFar: 5,
      },
      { city: 'Paris', country: 'France' },
    );

    expect(chips.slice(1)).toEqual([
      {
        icon: { sf: 'globe', md: 'globe-outline' },
        text: 'recognition.newCountryForArtist|{"artist":"Muse","country":"France"}',
      },
    ]);
  });

  it('falls back to the country count when a new country has no country name', () => {
    const chips = chipsFor({
      isNewCountryForArtist: true,
      distinctCountriesForArtistSoFar: 2,
    });

    expect(chips.slice(1)).toEqual([
      {
        icon: { sf: 'globe', md: 'globe-outline' },
        text: 'recognition.countriesForArtist|{"count":2,"artist":"Muse"}',
      },
    ]);
  });

  it('shows the country count when the artist was seen in several countries', () => {
    expect(chipsFor({ distinctCountriesForArtistSoFar: 4 }).slice(1)).toEqual([
      {
        icon: { sf: 'globe', md: 'globe-outline' },
        text: 'recognition.countriesForArtist|{"count":4,"artist":"Muse"}',
      },
    ]);
  });

  it('shows the new-city chip only when the country is not new', () => {
    expect(chipsFor({ isNewCityForArtist: true }, { city: 'Hamburg' }).slice(1)).toEqual([
      {
        icon: { sf: 'building.2', md: 'business-outline' },
        text: 'recognition.newCityForArtist|{"artist":"Muse","city":"Hamburg"}',
      },
    ]);
  });

  it('falls back to the city count when a new city has no city name', () => {
    expect(
      chipsFor({ isNewCityForArtist: true, distinctCitiesForArtistSoFar: 2 }).slice(1),
    ).toEqual([
      {
        icon: { sf: 'building.2', md: 'business-outline' },
        text: 'recognition.citiesForArtist|{"count":2,"artist":"Muse"}',
      },
    ]);
  });

  it('shows the city count when the artist was seen in several cities', () => {
    expect(chipsFor({ distinctCitiesForArtistSoFar: 6 }).slice(1)).toEqual([
      {
        icon: { sf: 'building.2', md: 'business-outline' },
        text: 'recognition.citiesForArtist|{"count":6,"artist":"Muse"}',
      },
    ]);
  });

  it('orders the chips last seen, venue, country, city', () => {
    const chips = chipsFor(
      {
        previousShowForArtist: previousShow,
        daysSincePreviousShowForArtist: 30,
        isFirstVisitToVenue: false,
        venueVisitOrdinal: 3,
        distinctCountriesForArtistSoFar: 2,
        isNewCityForArtist: true,
      },
      { city: 'Hamburg', country: 'Germany' },
    );

    expect(chips.map((chip) => chip.text.split('|')[0])).toEqual([
      'recognition.lastSeen',
      'recognition.venueVisitOrdinal',
      'recognition.countriesForArtist',
      'recognition.newCityForArtist',
    ]);
  });
});
