import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/utils/date';
import type { ConcertWithDetails } from './types';
import type { ConcertsStyles } from './useConcertsStyles';
import type { Href } from 'expo-router';
import { Chevron, RowLink } from '@/components/ui';
import { useConcertMenu } from './useConcertMenu';

type Props = {
  concert: ConcertWithDetails;
  isTablet: boolean;
  selectedConcertId: string | null;
  onConcertPress: (concert: ConcertWithDetails) => void;
  /** Phone only: the row opens this screen itself, through a Link with a preview. */
  concertHref?: (concert: ConcertWithDetails) => Href;
  styles: ConcertsStyles;
};

export default function ConcertFlatRow({
  concert,
  isTablet,
  selectedConcertId,
  onConcertPress,
  concertHref,
  styles,
}: Props) {
  const { t } = useTranslation();
  const concertMenu = useConcertMenu();
  const isSelected = isTablet && selectedConcertId === concert.id;
  const href = concertHref?.(concert);
  return (
    <RowLink href={href} menu={concertMenu(concert)}>
      <Pressable
        style={({ pressed }) => [
          styles.alphabeticalEntry,
          isSelected && styles.riverEntrySelected,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        testID={`concert-${concert.id}`}
        onPress={href ? undefined : () => onConcertPress(concert)}
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
    </RowLink>
  );
}
