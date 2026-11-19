import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/utils/date';
import type { SettingsStyles } from './useSettingsStyles';

export default function AboutSection({ styles }: { styles: SettingsStyles }) {
  const { t } = useTranslation();
  const router = useRouter();

  const appVersion = Constants.expoConfig?.version ?? '—';

  // The JS the app runs: the bundle built into the app (also when updates are off), an update
  // downloaded from EAS, or else a dev client's Metro bundle, which has no update to show.
  const { currentlyRunning } = Updates.useUpdates();
  const builtIn = !Updates.isEnabled || currentlyRunning.isEmbeddedLaunch;
  const runningUpdate =
    builtIn || !currentlyRunning.createdAt
      ? null
      : {
          date: formatDateTime(currentlyRunning.createdAt),
          detail: t('settings.updateDetail', {
            // The commit the ship workflow bundles in; an update published another way has
            // only its id, whose first characters are a timestamp.
            id: process.env.EXPO_PUBLIC_COMMIT || currentlyRunning.updateId?.slice(-7) || '—',
            // Native sends "" for a build without a channel.
            channel: currentlyRunning.channel || '—',
          }),
        };

  return (
    <>
      <Text style={styles.sectionLabel}>{t('settings.about')}</Text>

      {/* Long-press opens the hidden Demo screen for the self-healing talk. */}
      <Pressable
        style={[styles.row, styles.rowFirst]}
        onLongPress={() => router.push('/(home)/demo')}
        testID="settings-version"
      >
        <Text style={styles.rowLabel}>{t('settings.version')}</Text>
        <Text style={styles.rowValue}>{appVersion}</Text>
      </Pressable>
      <View style={[styles.row, styles.rowTop]} testID="settings-update">
        <Text style={styles.rowLabel}>{t('settings.update')}</Text>
        {runningUpdate ? (
          <View style={styles.rowValueColumn}>
            <Text style={styles.rowValueText}>{runningUpdate.date}</Text>
            <Text style={styles.rowDetail}>{runningUpdate.detail}</Text>
          </View>
        ) : (
          <Text style={styles.rowValue}>
            {builtIn ? t('settings.updateBuiltIn') : t('settings.updateDevelopment')}
          </Text>
        )}
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{t('settings.dataSource')}</Text>
        {/* eslint-disable-next-line i18next/no-literal-string -- the service's name */}
        <Text style={styles.rowValue}>setlist.fm</Text>
      </View>
    </>
  );
}
