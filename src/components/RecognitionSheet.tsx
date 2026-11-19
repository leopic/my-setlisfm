import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { toOrdinal } from '@/utils/ordinal';
import type { ConcertRecognitionFacts } from '@/database/factQueries';
import { buildRecognitionChips } from './recognitionChips';

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
