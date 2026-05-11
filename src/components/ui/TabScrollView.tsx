import { ScrollView, type ScrollViewProps, StyleSheet } from 'react-native';

const TAB_BAR_PADDING = 100;

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
