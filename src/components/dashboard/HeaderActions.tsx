import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui';
import { useChronicleColors } from '@/utils/colors';

type Props = { onSync: () => void; style?: StyleProp<ViewStyle> };

export default function HeaderActions({ onSync, style }: Props) {
  const router = useRouter();
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    topBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
  });
  return (
    <View style={[styles.topBarActions, style]}>
      <Pressable
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        onPress={onSync}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.syncData')}
      >
        <Icon sf="arrow.clockwise" md="refresh-outline" size={20} color={colors.textMuted} />
      </Pressable>
      <Pressable
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        onPress={() => router.push('/(home)/settings')}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.openSettings')}
      >
        <Icon sf="gearshape" md="settings-outline" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
