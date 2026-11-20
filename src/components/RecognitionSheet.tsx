import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { toOrdinal } from '@/utils/ordinal';
import type { ConcertRecognitionFacts } from '@/database/factQueries';
import { buildRecognitionChips } from './recognitionChips';
import { Space } from '@/utils/spacing';
import { Corner, Radius } from '@/utils/radius';
import { formatPlace } from '@/utils/place';

interface Props {
  visible: boolean;
  onClose: () => void;
  artistName: string;
  currentCityName?: string | null;
  currentCountryName?: string | null;
  facts: ConcertRecognitionFacts;
  isLandmark: boolean;
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
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      borderCurve: 'continuous',
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Space.s20,
      paddingTop: Space.s12,
      paddingBottom: Space.s32,
    },
    grip: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: Radius.full,
      backgroundColor: colors.borderLight,
      marginBottom: Space.s16,
    },
    hero: {
      alignItems: 'center',
      paddingBottom: Space.s16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: Space.s16,
    },
    heroIcon: { marginBottom: Space.s8 },
    heroCount: {
      ...Type.largeTitle,
      color: accent,
    },
    heroLabel: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Space.s8,
      marginBottom: Space.s20,
    },
    chip: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
      ...Corner.md,
      padding: Space.s12,
    },
    chipIcon: { marginBottom: Space.s4 },
    chipText: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
    doneButton: {
      alignItems: 'center',
      paddingVertical: Space.s12,
      ...Corner.md,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.border,
    },
    doneText: {
      ...Type.headline,
      color: colors.textPrimary,
    },
  });

  const location = formatPlace(currentCityName, currentCountryName);
  const heroLabel = location || t('recognition.heroSubtitle');

  const chips = buildRecognitionChips({
    facts,
    artistName,
    currentCityName,
    currentCountryName,
    t,
  });

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
            {chips.map((chip) => (
              // Chip text is unique: each chip kind has its own template and values.
              <View key={chip.text} style={styles.chip}>
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
