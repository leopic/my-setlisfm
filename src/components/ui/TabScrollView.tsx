import { ScrollView, type ScrollViewProps } from 'react-native';
import { tabBarContentStyle } from './tabBarContent';

export default function TabScrollView({ contentContainerStyle, ...props }: ScrollViewProps) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[tabBarContentStyle, contentContainerStyle]}
      {...props}
    />
  );
}
