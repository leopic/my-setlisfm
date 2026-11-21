import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Replaces the theme accent, e.g. with the artist's color. */
  color?: string;
};

// The "← Back" link at the top of pushed screens. The text is one line, the target 44 pt.
export default function BackButton({ onPress, style, color }: Props) {
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
  });
  return (
    <Pressable
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }, style]}
      onPress={onPress}
      testID="back-button"
      accessibilityRole="button"
      accessibilityLabel={t('common.goBack')}
    >
      <Text style={styles.text}>{t('common.back')}</Text>
    </Pressable>
  );
}
