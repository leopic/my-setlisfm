import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 49;

/**
 * Returns the bottom padding needed to clear the native tab bar.
 * Use as contentContainerStyle={{ paddingBottom }} on ScrollViews.
 */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return { paddingBottom: TAB_BAR_HEIGHT + insets.bottom };
}
