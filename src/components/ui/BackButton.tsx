import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import { Space } from '@/utils/spacing';
import { Radius } from '@/utils/radius';

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
    // A solid fill and a hairline border, like the round badges next to it. The fill is the
    // screen background, which every accent (the theme's and each artist's) is checked against.
    pill: {
      paddingHorizontal: Space.s12,
      paddingVertical: Space.s4,
      borderRadius: Radius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
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
        <View style={styles.pill} testID="back-pill">
          <Text style={styles.text}>{t('common.back')}</Text>
        </View>
      ) : (
        <Text style={styles.text}>{t('common.back')}</Text>
      )}
    </Pressable>
  );
}
