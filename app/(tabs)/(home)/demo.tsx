import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import { DEMO_CONCERTS } from '@/demo/demoConcerts';
import { useSyncContext } from '@/contexts/SyncContext';
import { useChronicleColors } from '@/utils/colors';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import { Type } from '@/utils/typography';
import { TabScrollView, Icon } from '@/components/ui';

// Hidden screen for the self-healing talk (long-press the version in Settings).
export default function DemoScreen() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const router = useRouter();
  const { notifySyncComplete } = useSyncContext();
  const [added, setAdded] = useState<number[]>([]);
  // Two quick taps would start a second transaction inside the first one.
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void dbOperations.getAddedDemoConcerts().then((rows) => {
      if (!cancelled) setAdded(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (change: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await change();
    } catch (error) {
      console.error('Demo concert change failed:', error);
      Alert.alert(t('demo.error'));
    }
    // No try/finally: the React Compiler cannot compile it, so reset after the catch.
    try {
      notifySyncComplete();
      setAdded(await dbOperations.getAddedDemoConcerts());
    } catch (error) {
      console.error('Demo concert refresh failed:', error);
    }
    busyRef.current = false;
    setBusy(false);
  };

  const confirmRemove = () => {
    Alert.alert(t('demo.removeTitle'), t('demo.removeMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('demo.remove'),
        style: 'destructive',
        onPress: () => run(() => dbOperations.removeDemoConcerts()),
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      // The chevron stays on the screen margin; the target reaches toward the title.
      justifyContent: 'center',
    },
    headerTitle: { ...Type.title1, color: colors.textPrimary, flex: 1 },
    intro: { ...Type.subheadline, color: colors.textSecondary, padding: 20 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    rowFirst: { borderTopWidth: 1, borderTopColor: colors.border },
    rowText: { flex: 1 },
    rowTitle: { ...Type.body, color: colors.textPrimary },
    rowHint: { ...Type.footnote, color: colors.textSecondary, marginTop: 2 },
    addText: { ...Type.body, color: colors.accent },
    addedText: { ...Type.body, color: colors.textMuted },
    removeRow: { marginTop: 28 },
    removeText: { ...Type.headline, color: colors.danger, flex: 1 },
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container} testID="demo-screen">
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
        <Text style={styles.headerTitle}>{t('demo.title')}</Text>
      </View>

      <TabScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{t('demo.intro')}</Text>

        {DEMO_CONCERTS.map((concert, index) => {
          const isAdded = added.includes(concert.number);
          return (
            <View
              key={concert.number}
              style={[styles.row, index === 0 && styles.rowFirst]}
              testID={`demo-concert-${concert.number}`}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>
                  {t('demo.concert', { number: concert.number, artist: concert.artist })}
                </Text>
                <Text style={styles.rowHint}>
                  {t(`demo.screens.${concert.screen}`, { target: concert.target })}
                </Text>
              </View>
              <Pressable
                onPress={() => void run(() => dbOperations.addDemoConcert(concert.number))}
                disabled={isAdded || busy}
                accessibilityRole="button"
                accessibilityLabel={t('demo.addLabel', {
                  number: concert.number,
                  artist: concert.artist,
                })}
                testID={`demo-add-${concert.number}`}
              >
                <Text style={isAdded ? styles.addedText : styles.addText}>
                  {isAdded ? t('demo.added') : t('demo.add')}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <Pressable
          style={[styles.row, styles.rowFirst, styles.removeRow]}
          onPress={confirmRemove}
          disabled={added.length === 0 || busy}
          accessibilityRole="button"
          testID="demo-remove"
        >
          <Text style={added.length === 0 ? styles.addedText : styles.removeText}>
            {t('demo.removeAll')}
          </Text>
        </Pressable>
      </TabScrollView>
    </SafeAreaView>
  );
}
