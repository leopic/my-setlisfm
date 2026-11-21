import type { Ref } from 'react';
import { ScrollView, type ScrollViewInstance, type ScrollViewProps } from 'react-native';
import { tabBarContentStyle } from './tabBarContent';

export default function TabScrollView({
  contentContainerStyle,
  ...props
}: ScrollViewProps & { ref?: Ref<ScrollViewInstance> }) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[tabBarContentStyle, contentContainerStyle]}
      {...props}
    />
  );
}
