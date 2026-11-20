import type { TFunction } from 'i18next';
import type { Icon } from '@/components/ui';
import { formatTimeAgo } from '@/utils/date';
import { toOrdinal } from '@/utils/ordinal';
import type { ConcertRecognitionFacts } from '@/database/factQueries';
import { formatPlace } from '@/utils/place';

export interface Chip {
  icon: {
    sf: React.ComponentProps<typeof Icon>['sf'];
    md: React.ComponentProps<typeof Icon>['md'];
  };
  text: string;
}

interface RecognitionChipInput {
  facts: ConcertRecognitionFacts;
  artistName: string;
  currentCityName?: string | null;
  currentCountryName?: string | null;
  t: TFunction;
}

function lastSeenChip({ facts, t }: RecognitionChipInput): Chip | null {
  if (!facts.previousShowForArtist || facts.daysSincePreviousShowForArtist == null) return null;

  const prevLocation = formatPlace(
    facts.previousShowForArtist.cityName,
    facts.previousShowForArtist.countryName,
  );
  return {
    icon: { sf: 'clock', md: 'time-outline' },
    text: prevLocation
      ? t('recognition.lastSeen', {
          timeAgo: formatTimeAgo(facts.daysSincePreviousShowForArtist),
          location: prevLocation,
        })
      : t('recognition.lastSeenNoLocation', {
          timeAgo: formatTimeAgo(facts.daysSincePreviousShowForArtist),
        }),
  };
}

function venueChip({ facts, t }: RecognitionChipInput): Chip {
  return facts.isFirstVisitToVenue
    ? { icon: { sf: 'mappin', md: 'location-outline' }, text: t('recognition.firstVisitToVenue') }
    : {
        icon: { sf: 'arrow.triangle.2.circlepath', md: 'repeat-outline' },
        text: t('recognition.venueVisitOrdinal', { ordinal: toOrdinal(facts.venueVisitOrdinal) }),
      };
}

function countryChip({
  facts,
  artistName,
  currentCountryName,
  t,
}: RecognitionChipInput): Chip | null {
  if (facts.isNewCountryForArtist && currentCountryName) {
    return {
      icon: { sf: 'globe', md: 'globe-outline' },
      text: t('recognition.newCountryForArtist', {
        artist: artistName,
        country: currentCountryName,
      }),
    };
  }
  if (facts.distinctCountriesForArtistSoFar > 1) {
    return {
      icon: { sf: 'globe', md: 'globe-outline' },
      text: t('recognition.countriesForArtist', {
        count: facts.distinctCountriesForArtistSoFar,
        artist: artistName,
      }),
    };
  }
  return null;
}

function cityChip({ facts, artistName, currentCityName, t }: RecognitionChipInput): Chip | null {
  // A new country always means a new city too — the country chip above already says so,
  // so only show a city-level chip when it adds information the country chip didn't.
  if (facts.isNewCountryForArtist) return null;

  if (facts.isNewCityForArtist && currentCityName) {
    return {
      icon: { sf: 'building.2', md: 'business-outline' },
      text: t('recognition.newCityForArtist', { artist: artistName, city: currentCityName }),
    };
  }
  if (facts.distinctCitiesForArtistSoFar > 1) {
    return {
      icon: { sf: 'building.2', md: 'business-outline' },
      text: t('recognition.citiesForArtist', {
        count: facts.distinctCitiesForArtistSoFar,
        artist: artistName,
      }),
    };
  }
  return null;
}

/** Builds the recognition sheet chips in display order: last seen, venue, country, city. */
export function buildRecognitionChips(input: RecognitionChipInput): Chip[] {
  return [lastSeenChip(input), venueChip(input), countryChip(input), cityChip(input)].filter(
    (chip): chip is Chip => chip !== null,
  );
}
