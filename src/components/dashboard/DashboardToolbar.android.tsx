import { Stack } from 'expo-router';
import HeaderActions from './HeaderActions';

type Props = { onSync: () => void };

// Android: Stack.Toolbar needs '@expo/ui' there, which the app does not ship, and it throws
// while rendering. So the bar holds the JS HeaderActions instead.
export default function DashboardToolbar({ onSync }: Props) {
  return <Stack.Screen options={{ headerRight: () => <HeaderActions onSync={onSync} /> }} />;
}
