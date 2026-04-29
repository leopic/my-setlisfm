import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import type { SFSymbol } from 'sf-symbols-typescript';

// Cross-platform icon using SF Symbols on iOS and Ionicons on Android.
// Matches the sf/md pattern already used in the tab bar triggers.
type Props = {
  sf: SFSymbol;
  md: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export default function Icon({ sf, md, size = 20, color, style }: Props) {
  if (Platform.OS === 'ios') {
    return <SymbolView name={sf} size={size} tintColor={color} style={style} />;
  }
  return <Ionicons name={md} size={size} color={color} style={style} />;
}
