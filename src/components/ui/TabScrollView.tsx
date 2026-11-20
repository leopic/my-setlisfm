import { ScrollView, type ScrollViewProps, StyleSheet } from 'react-native';
import { TAB_BAR_PADDING } from '@/utils/spacing';

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: TAB_BAR_PADDING,
  },
});

export default function TabScrollView({ contentContainerStyle, ...props }: ScrollViewProps) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      {...props}
    />
  );
}
