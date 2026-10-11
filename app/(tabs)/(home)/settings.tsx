import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { dbOperations } from '@/database/operations';
import { getStoredUsername, setStoredUsername, syncConcertData } from '@/services/syncService';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { useSyncContext } from '@/contexts/SyncContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { TabScrollView, Icon } from '@/components/ui';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const router = useRouter();
  const { notifySyncComplete } = useSyncContext();
  const { restartOnboarding } = useOnboardingContext();

  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    backButton: { padding: 4 },
    headerTitle: { ...Type.heading, color: colors.textPrimary, flex: 1 },
    // ── Section ──────────────────────────────────────────────────────────
    sectionLabel: {
      ...Type.label,
      color: colors.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 8,
    },
    // ── Rows ─────────────────────────────────────────────────────────────
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowFirst: { borderTopWidth: 1, borderTopColor: colors.border },
    rowLabel: { ...Type.body, color: colors.textSecondary, width: 110 },
    rowValue: { ...Type.body, color: colors.textPrimary, flex: 1 },
    rowAction: { ...Type.body, color: colors.accent },
    rowDestructive: { ...Type.title, color: colors.danger ?? '#ff453a', flex: 1 },
    // ── Username edit ─────────────────────────────────────────────────────
    usernameInput: {
      flex: 1,
      ...Type.body,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    saveButton: {
      marginLeft: 10,
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: colors.accent,
      borderRadius: 8,
    },
    saveButtonText: {
      ...Type.label,
      color: colors.textOnAccent,
    },
    cancelButton: { marginLeft: 8, padding: 6 },
    // ── Sync button ───────────────────────────────────────────────────────
    syncRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    syncText: { ...Type.title, color: colors.accent, flex: 1 },
    syncTextDisabled: { ...Type.title, color: colors.textMuted, flex: 1 },
  });

  useEffect(() => {
    (async () => {
      const stored = await getStoredUsername();
      setUsername(stored ?? '');
      const fetchedAt = await dbOperations.getLastFetchedAt();
      setLastSynced(fetchedAt ? fetchedAt.toLocaleString() : null);
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
        notifySyncComplete();
        const fetchedAt = await dbOperations.getLastFetchedAt();
        setLastSynced(fetchedAt ? fetchedAt.toLocaleString() : null);
        if (result.newConcerts > 0) {
          Alert.alert(
            t('dashboard.syncComplete'),
            t('dashboard.syncCompleteMessage', { count: result.newConcerts }),
          );
        } else {
          Alert.alert(t('dashboard.upToDate'), t('dashboard.upToDateMessage'));
        }
      } else {
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

  const appVersion = Constants.expoConfig?.version ?? '—';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
            testID="back-button"
            accessibilityRole="button"
            accessibilityLabel={t('common.goBack')}
          >
            <Icon sf="chevron.left" md="chevron-back-outline" size={20} color={colors.accent} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        </View>

        <TabScrollView showsVerticalScrollIndicator={false}>
          {/* ── Account ─────────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{t('settings.account')}</Text>

          <View style={[styles.row, styles.rowFirst]}>
            <Text style={styles.rowLabel}>{t('settings.username')}</Text>
            {isEditing ? (
              <>
                <TextInput
                  style={styles.usernameInput}
                  value={editingUsername}
                  onChangeText={setEditingUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveUsername}
                  placeholderTextColor={colors.textMuted}
                />
                <Pressable
                  style={({ pressed }) => [styles.saveButton, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={handleSaveUsername}
                >
                  <Text style={styles.saveButtonText}>{t('settings.save')}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => setIsEditing(false)}
                  accessibilityRole="button"
                >
                  <Icon sf="xmark" md="close-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.rowValue}>{username || '—'}</Text>
                <Pressable
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  onPress={handleStartEdit}
                  accessibilityRole="button"
                >
                  <Text style={styles.rowAction}>{t('settings.change')}</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* ── Sync ────────────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{t('settings.sync')}</Text>

          <View style={[styles.row, styles.rowFirst]}>
            <Text style={styles.rowLabel}>{t('settings.lastSynced')}</Text>
            <Text style={styles.rowValue}>{lastSynced ?? t('settings.never')}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.syncRow, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => handleSync()}
            disabled={isSyncing || !username}
            accessibilityRole="button"
            accessibilityLabel={t('settings.syncNowLabel')}
          >
            <Icon
              sf={isSyncing ? 'arrow.clockwise' : 'arrow.clockwise'}
              md="refresh-outline"
              size={18}
              color={isSyncing || !username ? colors.textMuted : colors.accent}
            />
            <Text style={isSyncing || !username ? styles.syncTextDisabled : styles.syncText}>
              {isSyncing ? t('settings.syncing') : t('settings.syncNow')}
            </Text>
          </Pressable>

          {/* ── About ───────────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{t('settings.about')}</Text>

          <View style={[styles.row, styles.rowFirst]}>
            <Text style={styles.rowLabel}>{t('settings.version')}</Text>
            <Text style={styles.rowValue}>{appVersion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.dataSource')}</Text>
            <Text style={styles.rowValue}>setlist.fm</Text>
          </View>

          {/* ── Danger zone ─────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{t('settings.data')}</Text>

          <Pressable
            style={({ pressed }) => [styles.row, styles.rowFirst, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleClearData}
            accessibilityRole="button"
            accessibilityLabel={t('settings.clearAllDataLabel')}
          >
            <Text style={styles.rowDestructive}>{t('settings.clearAllData')}</Text>
            <Icon
              sf="chevron.right"
              md="chevron-forward-outline"
              size={16}
              color={colors.textDisabled}
            />
          </Pressable>
        </TabScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
