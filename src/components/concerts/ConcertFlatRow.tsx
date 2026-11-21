import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/date';
import type { ConcertWithDetails } from './types';
import type { ConcertsStyles } from './useConcertsStyles';
import { Chevron } from '@/components/ui';

type Props = {
  concert: ConcertWithDetails;
  isTablet: boolean;
  selectedConcertId: string | null;
  onConcertPress: (concert: ConcertWithDetails) => void;
  styles: ConcertsStyles;
};

export default function ConcertFlatRow({
  concert,
  isTablet,
  selectedConcertId,
  onConcertPress,
  styles,
}: Props) {
  const { t } = useTranslation();
  const isSelected = isTablet && selectedConcertId === concert.id;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.alphabeticalEntry,
        isSelected && styles.riverEntrySelected,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      testID={`concert-${concert.id}`}
      onPress={() => onConcertPress(concert)}
      accessibilityRole="button"
      accessibilityLabel={`${concert.artistName}, ${concert.venueName}, ${formatDate(concert.eventDate ?? '')}`}
      accessibilityHint={t('concerts.viewConcertDetails')}
    >
      <View style={styles.alphabeticalEntryRow}>
        <View style={styles.alphabeticalEntryContent}>
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
}
