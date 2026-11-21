import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import { Space } from '@/utils/spacing';
import PhotoChip from './PhotoChip';

const PILL_HEIGHT = Type.body.lineHeight + Space.s4 * 2;

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Replaces the theme accent, e.g. with the artist's color. */
  color?: string;
  /** Over a photo: the text sits on a pill, so it reads whatever the photo shows. */
  onPhoto?: boolean;
};

// The "← Back" link at the top of pushed screens. The text is one line, the target 44 pt.
export default function BackButton({ onPress, style, color, onPhoto = false }: Props) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const styles = StyleSheet.create({
    button: {
      minHeight: TOUCH_TARGET,
      minWidth: TOUCH_TARGET,
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    text: { ...Type.body, color: color ?? colors.accent },
    // The shape of the chip; PhotoChip fills it (Liquid Glass, or a solid chip). The radius is
    // exact: the glass view takes it as is, without React Native's cap at half the height.
    pill: {
      height: PILL_HEIGHT,
      justifyContent: 'center',
      paddingHorizontal: Space.s12,
      borderRadius: PILL_HEIGHT / 2,
    },
  });
  return (
    <Pressable
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }, style]}
      onPress={onPress}
      testID="back-button"
      accessibilityRole="button"
      accessibilityLabel={t('common.goBack')}
    >
      {onPhoto ? (
        <PhotoChip style={styles.pill} testID="back-pill">
          <Text style={styles.text}>{t('common.back')}</Text>
        </PhotoChip>
      ) : (
        <Text style={styles.text}>{t('common.back')}</Text>
      )}
    </Pressable>
  );
}
