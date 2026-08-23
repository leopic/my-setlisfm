import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { formatTimeAgo } from '@/utils/date';
import { toOrdinal } from '@/utils/ordinal';
import type { ConcertRecognitionFacts } from '@/database/chatQueries';

interface Props {
  visible: boolean;
  onClose: () => void;
  artistName: string;
  currentCityName?: string | null;
  currentCountryName?: string | null;
  facts: ConcertRecognitionFacts;
  isLandmark: boolean;
}

interface Chip {
  icon: { sf: React.ComponentProps<typeof Icon>['sf']; md: React.ComponentProps<typeof Icon>['md'] };
  text: string;
}

export default function RecognitionSheet({
  visible,
  onClose,
  artistName,
  currentCityName,
  currentCountryName,
  facts,
  isLandmark,
}: Props) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const accent = isLandmark ? colors.gold : colors.accent;

  const styles = StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.55)',
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTopWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 34,
        },
        grip: {
          alignSelf: 'center',
          width: 36,
          height: 4,
          borderRadius: 3,
          backgroundColor: colors.borderLight,
          marginBottom: 14,
        },
        hero: {
          alignItems: 'center',
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          marginBottom: 14,
        },
        heroIcon: { marginBottom: 8 },
        heroCount: {
          ...Type.display,
          color: accent,
        },
        heroLabel: {
          ...Type.body,
          color: colors.textSecondary,
          marginTop: 2,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 18,
        },
        chip: {
          flexBasis: '48%',
          flexGrow: 1,
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          padding: 10,
        },
        chipIcon: { marginBottom: 6 },
        chipText: {
          ...Type.body,
          color: colors.textSecondary,
        },
        doneButton: {
          alignItems: 'center',
          paddingVertical: 12,
          borderRadius: 10,
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: colors.border,
        },
        doneText: {
          ...Type.title,
          color: colors.textPrimary,
        },
      });

  const location = [currentCityName, currentCountryName].filter(Boolean).join(', ');
  const heroLabel = location || t('recognition.heroSubtitle');

  const chips: Chip[] = [];

  if (facts.previousShowForArtist && facts.daysSincePreviousShowForArtist != null) {
    const prevLocation = [
      facts.previousShowForArtist.cityName,
      facts.previousShowForArtist.countryName,
    ]
      .filter(Boolean)
      .join(', ');
    chips.push({
      icon: { sf: 'clock', md: 'time-outline' },
      text: prevLocation
        ? t('recognition.lastSeen', {
            timeAgo: formatTimeAgo(facts.daysSincePreviousShowForArtist),
            location: prevLocation,
          })
        : t('recognition.lastSeenNoLocation', {
            timeAgo: formatTimeAgo(facts.daysSincePreviousShowForArtist),
          }),
    });
  }

  chips.push(
    facts.isFirstVisitToVenue
      ? { icon: { sf: 'mappin', md: 'location-outline' }, text: t('recognition.firstVisitToVenue') }
      : {
          icon: { sf: 'arrow.triangle.2.circlepath', md: 'repeat-outline' },
          text: t('recognition.venueVisitOrdinal', { ordinal: toOrdinal(facts.venueVisitOrdinal) }),
        },
  );

  if (facts.isNewCountryForArtist && currentCountryName) {
    chips.push({
      icon: { sf: 'globe', md: 'globe-outline' },
      text: t('recognition.newCountryForArtist', { artist: artistName, country: currentCountryName }),
    });
  } else if (facts.distinctCountriesForArtistSoFar > 1) {
    chips.push({
      icon: { sf: 'globe', md: 'globe-outline' },
      text: t('recognition.countriesForArtist', {
        count: facts.distinctCountriesForArtistSoFar,
        artist: artistName,
      }),
    });
  }

  // A new country always means a new city too — the country chip above already says so,
  // so only show a city-level chip when it adds information the country chip didn't.
  if (!facts.isNewCountryForArtist) {
    if (facts.isNewCityForArtist && currentCityName) {
      chips.push({
        icon: { sf: 'building.2', md: 'business-outline' },
        text: t('recognition.newCityForArtist', { artist: artistName, city: currentCityName }),
      });
    } else if (facts.distinctCitiesForArtistSoFar > 1) {
      chips.push({
        icon: { sf: 'building.2', md: 'business-outline' },
        text: t('recognition.citiesForArtist', {
          count: facts.distinctCitiesForArtistSoFar,
          artist: artistName,
        }),
      });
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel={t('common.close')}>
        <Pressable testID="recognition-sheet" style={styles.sheet} onPress={() => {}}>
          <View style={styles.grip} />

          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Icon
                sf={isLandmark ? 'trophy.fill' : 'music.note'}
                md={isLandmark ? 'trophy' : 'musical-notes'}
                size={28}
                color={accent}
              />
            </View>
            <Text style={styles.heroCount}>
              {t('recognition.ordinalShow', {
                ordinal: toOrdinal(facts.ordinalForArtist),
                artist: artistName,
              })}
            </Text>
            <Text style={styles.heroLabel}>{heroLabel}</Text>
          </View>

          <View style={styles.grid}>
            {chips.map((chip, index) => (
              <View key={index} style={styles.chip}>
                <View style={styles.chipIcon}>
                  <Icon sf={chip.icon.sf} md={chip.icon.md} size={15} color={colors.textMuted} />
                </View>
                <Text style={styles.chipText}>{chip.text}</Text>
              </View>
            ))}
          </View>

          <Pressable
            testID="recognition-done-button"
            style={styles.doneButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Text style={styles.doneText}>{t('recognition.done')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
