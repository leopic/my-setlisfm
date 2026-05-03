import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { TabScrollView, Icon } from '@/components/ui';

export default function SettingsScreen() {
  const colors = useChronicleColors();
  const router = useRouter();
  const { notifySyncComplete } = useSyncContext();

  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
      }),
    [colors],
  );

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const stored = await getStoredUsername();
    setUsername(stored ?? '');
    const fetchedAt = await dbOperations.getLastFetchedAt();
    setLastSynced(fetchedAt ? fetchedAt.toLocaleString() : null);
  };

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
            'Sync Complete',
            `Added ${result.newConcerts} new concert${result.newConcerts !== 1 ? 's' : ''}.`,
          );
        } else {
          Alert.alert('Up to Date', 'No new concerts found.');
        }
      } else {
        Alert.alert('Sync Failed', result.error ?? 'Unknown error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your concert history and restart the app. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await dbOperations.clearAllData();
            await setStoredUsername('');
            router.replace('/onboarding');
          },
        },
      ],
    );
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon sf="chevron.left" md="chevron-back-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <TabScrollView showsVerticalScrollIndicator={false}>
          {/* ── Account ─────────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Account</Text>

          <View style={[styles.row, styles.rowFirst]}>
            <Text style={styles.rowLabel}>Username</Text>
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
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveUsername}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditing(false)}
                  accessibilityRole="button"
                >
                  <Icon sf="xmark" md="close-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.rowValue}>{username || '—'}</Text>
                <TouchableOpacity onPress={handleStartEdit} accessibilityRole="button">
                  <Text style={styles.rowAction}>Change</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ── Sync ────────────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Sync</Text>

          <View style={[styles.row, styles.rowFirst]}>
            <Text style={styles.rowLabel}>Last synced</Text>
            <Text style={styles.rowValue}>{lastSynced ?? 'Never'}</Text>
          </View>

          <TouchableOpacity
            style={styles.syncRow}
            onPress={() => handleSync()}
            disabled={isSyncing || !username}
            accessibilityRole="button"
            accessibilityLabel="Sync now"
          >
            <Icon
              sf={isSyncing ? 'arrow.clockwise' : 'arrow.clockwise'}
              md="refresh-outline"
              size={18}
              color={isSyncing || !username ? colors.textMuted : colors.accent}
            />
            <Text style={isSyncing || !username ? styles.syncTextDisabled : styles.syncText}>
              {isSyncing ? 'Syncing…' : 'Sync Now'}
            </Text>
          </TouchableOpacity>

          {/* ── About ───────────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>About</Text>

          <View style={[styles.row, styles.rowFirst]}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{appVersion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Data source</Text>
            <Text style={styles.rowValue}>setlist.fm</Text>
          </View>

          {/* ── Danger zone ─────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>Data</Text>

          <TouchableOpacity
            style={[styles.row, styles.rowFirst]}
            onPress={handleClearData}
            accessibilityRole="button"
            accessibilityLabel="Clear all data"
          >
            <Text style={styles.rowDestructive}>Clear All Data</Text>
            <Icon
              sf="chevron.right"
              md="chevron-forward-outline"
              size={16}
              color={colors.textDisabled}
            />
          </TouchableOpacity>
        </TabScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
