import { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dbOperations } from '@/database/operations';
import { getStoredUsername, setStoredUsername, syncConcertData } from '@/services/syncService';
import { useSyncContext } from '@/contexts/SyncContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { TabScrollView } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { useSettingsStyles } from '@/components/settings/useSettingsStyles';
import SettingsHeader from '@/components/settings/SettingsHeader';
import AccountSection from '@/components/settings/AccountSection';
import SyncSection from '@/components/settings/SyncSection';
import AboutSection from '@/components/settings/AboutSection';
import DataSection from '@/components/settings/DataSection';
import { Haptic } from '@/utils/haptics';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { notifySyncComplete } = useSyncContext();
  const { restartOnboarding } = useOnboardingContext();

  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const styles = useSettingsStyles();

  useEffect(() => {
    (async () => {
      const stored = await getStoredUsername();
      setUsername(stored ?? '');
      const fetchedAt = await dbOperations.getLastFetchedAt();
      setLastSyncedAt(fetchedAt);
    })();
  }, []);

  const handleStartEdit = () => {
    setEditingUsername(username);
    setIsEditing(true);
  };

  const handleSaveUsername = async () => {
    const trimmed = editingUsername.trim();
    if (!trimmed) return;
    await setStoredUsername(trimmed);
    setUsername(trimmed);
    setIsEditing(false);
    // Trigger a fresh sync with the new username
    handleSync(trimmed);
  };

  const handleSync = async (overrideUsername?: string) => {
    const user = overrideUsername ?? username;
    if (!user) return;
    setIsSyncing(true);
    try {
      const result = await syncConcertData(user);
      if (result.success) {
        Haptic.success();
        notifySyncComplete();
        const fetchedAt = await dbOperations.getLastFetchedAt();
        setLastSyncedAt(fetchedAt);
        if (result.newConcerts > 0) {
          Alert.alert(
            t('dashboard.syncComplete'),
            t('dashboard.syncCompleteMessage', { count: result.newConcerts }),
          );
        } else {
          Alert.alert(t('dashboard.upToDate'), t('dashboard.upToDateMessage'));
        }
      } else {
        Haptic.failure();
        Alert.alert(t('dashboard.syncFailed'), result.error ?? t('common.unknownError'));
      }
      setIsSyncing(false);
    } catch {
      setIsSyncing(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(t('settings.clearAllData'), t('settings.clearConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.clearEverything'),
        style: 'destructive',
        onPress: async () => {
          await dbOperations.clearAllData();
          await setStoredUsername('');
          restartOnboarding();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <SettingsHeader styles={styles} />

        <TabScrollView showsVerticalScrollIndicator={false}>
          {/* ── Account ─────────────────────────────────────────────────── */}
          <AccountSection
            styles={styles}
            username={username}
            editingUsername={editingUsername}
            isEditing={isEditing}
            onChangeEditingUsername={setEditingUsername}
            onStartEdit={handleStartEdit}
            onSave={handleSaveUsername}
            onCancelEdit={() => setIsEditing(false)}
          />
          {/* ── Sync ────────────────────────────────────────────────────── */}
          <SyncSection
            styles={styles}
            lastSyncedAt={lastSyncedAt}
            isSyncing={isSyncing}
            hasUsername={!!username}
            // Not returned: the test library waits for a returned promise, so a pending sync would hang a press.
            onSync={() => {
              void handleSync();
            }}
          />
          {/* ── About ───────────────────────────────────────────────────── */}
          <AboutSection styles={styles} />
          {/* ── Danger zone ─────────────────────────────────────────────── */}
          <DataSection styles={styles} onClearData={handleClearData} />
        </TabScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
