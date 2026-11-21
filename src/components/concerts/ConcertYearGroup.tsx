import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/date';
import type { ConcertWithDetails, YearGroup } from './types';
import type { ConcertsStyles } from './useConcertsStyles';
import { Chevron } from '@/components/ui';

type Props = {
  yearGroup: YearGroup;
  yearIndex: number;
  isTablet: boolean;
  selectedConcertId: string | null;
  onConcertPress: (concert: ConcertWithDetails) => void;
  styles: ConcertsStyles;
};

export default function ConcertYearGroup({
  yearGroup,
  yearIndex,
  isTablet,
  selectedConcertId,
  onConcertPress,
  styles,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.yearSection}>
      <Text style={styles.yearGhost}>{yearGroup.year}</Text>
      <Text style={styles.yearSubLabel}>
        {t('common.concert', { count: yearGroup.totalConcerts })}
      </Text>
      <View style={styles.spineContainer}>
        {yearGroup.concerts.map((concert, concertIndex) => {
          const isFirstOfMostRecentYear = yearIndex === 0 && concertIndex === 0;
          const isSelected = isTablet && selectedConcertId === concert.id;
          return (
            <Pressable
              key={concert.id}
              style={({ pressed }) => [
                styles.riverEntry,
                isSelected && styles.riverEntrySelected,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              testID={`concert-${concert.id}`}
              onPress={() => onConcertPress(concert)}
              accessibilityRole="button"
              accessibilityLabel={`${concert.artistName}, ${concert.venueName}, ${formatDate(concert.eventDate ?? '')}`}
              accessibilityHint={t('concerts.viewConcertDetails')}
            >
              <View style={[styles.dot, isFirstOfMostRecentYear && styles.dotActive]} />
              <View style={styles.entryRow}>
                <View style={styles.entryContent}>
                  <Text style={styles.entryDate}>{formatDate(concert.eventDate ?? '')}</Text>
                  <Text style={styles.entryArtist}>{concert.artistName}</Text>
                  <Text style={styles.entryVenue}>
                    {concert.venueName}
                    {concert.cityName ? ` · ${concert.cityName}` : ''}
                  </Text>
                  {concert.tour?.name && <Text style={styles.entryTour}>{concert.tour.name}</Text>}
                </View>
                <Chevron style={styles.entryChevron} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
