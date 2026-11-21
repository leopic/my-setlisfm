import { Platform, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';

// The size of iOS's own disclosure arrow next to body text.
const SIZE = 14;

/**
 * The › at the end of a row that opens something: SF Symbols' chevron.right on iOS, Ionicons'
 * chevron-forward elsewhere. It takes its color and its place (margins, alignment) from the
 * row's arrow style, so a row keeps the style it had for the text arrow. VoiceOver skips it: the
 * row's label and role already say that it opens something.
 */
export default function Chevron({ style }: { style?: StyleProp<TextStyle> }) {
  const { color, alignSelf, marginLeft, marginRight } = StyleSheet.flatten(style) ?? {};
  const place = { alignSelf, marginLeft, marginRight };
  const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no' } as const;
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name="chevron.right"
        size={SIZE}
        weight="semibold"
        tintColor={typeof color === 'string' ? color : undefined}
        style={[{ width: SIZE, height: SIZE }, place]}
        testID="row-chevron"
        {...hidden}
      />
    );
  }
  return (
    <Ionicons
      name="chevron-forward"
      size={SIZE}
      color={typeof color === 'string' ? color : undefined}
      style={place}
      testID="row-chevron"
      {...hidden}
    />
  );
}
