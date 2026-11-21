import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useChronicleColors } from '@/utils/colors';

type Props = { style?: StyleProp<ViewStyle>; children: ReactNode; testID?: string };

/**
 * The surface of a small control that sits on a photo: Liquid Glass on iOS 26, which blurs and
 * lightens what is behind it like the system's own buttons, and a solid chip in the screen
 * background elsewhere. Give it the shape (padding, radius); it adds the fill.
 */
export default function PhotoChip({ style, children, testID }: Props) {
  const colors = useChronicleColors();
  if (isLiquidGlassAvailable()) {
    return (
      // Not interactive: the button around it already answers a press.
      <GlassView glassEffectStyle="regular" style={style} testID={testID}>
        {children}
      </GlassView>
    );
  }
  return (
    <View
      // The screen background is the color every accent is checked against.
      style={[
        style,
        { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
