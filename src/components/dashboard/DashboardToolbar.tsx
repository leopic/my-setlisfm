import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

type Props = { onSync: () => void };

// Sync and settings as native header buttons, next to the large title (phone). The empty
// state and the iPad keep HeaderActions in their own top bar.
export default function DashboardToolbar({ onSync }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon="arrow.clockwise"
        accessibilityLabel={t('dashboard.syncData')}
        onPress={onSync}
      />
      <Stack.Toolbar.Button
        icon="gearshape"
        accessibilityLabel={t('dashboard.openSettings')}
        onPress={() => router.push('/(home)/settings')}
      />
    </Stack.Toolbar>
  );
}
