import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Icon } from '@/components/ui';
import { formatSinceAlone } from '@/utils/since';
import { useNow } from '@/utils/useNow';
import type { SettingsStyles } from './useSettingsStyles';
import { IconSize } from '@/utils/iconSize';

type SyncSectionProps = {
  styles: SettingsStyles;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  hasUsername: boolean;
  onSync: () => void;
};

export default function SyncSection({
  styles,
  lastSyncedAt,
  isSyncing,
  hasUsername,
  onSync,
}: SyncSectionProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const syncDisabled = isSyncing || !hasUsername;
  const now = useNow();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('settings.sync')}</Text>

      <View style={[styles.row, styles.rowFirst]}>
        <Text style={styles.rowLabel}>{t('settings.lastSynced')}</Text>
        <Text style={styles.rowValue}>
          {lastSyncedAt ? formatSinceAlone(lastSyncedAt, now) : t('settings.never')}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.syncRow, { opacity: pressed ? 0.7 : 1 }]}
        onPress={onSync}
        disabled={syncDisabled}
        accessibilityRole="button"
        accessibilityLabel={t('settings.syncNowLabel')}
      >
        <Icon
          sf="arrow.clockwise"
          md="refresh-outline"
          size={IconSize.headline}
          color={syncDisabled ? colors.textMuted : colors.accent}
        />
        <Text style={syncDisabled ? styles.syncTextDisabled : styles.syncText}>
          {isSyncing ? t('settings.syncing') : t('settings.syncNow')}
        </Text>
      </Pressable>
    </>
  );
}
