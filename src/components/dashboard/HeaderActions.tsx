import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui';
import { useChronicleColors } from '@/utils/colors';
import { TOUCH_TARGET } from '@/utils/touchTarget';
import { IconSize } from '@/utils/iconSize';

type Props = { onSync: () => void; style?: StyleProp<ViewStyle> };

export default function HeaderActions({ onSync, style }: Props) {
  const router = useRouter();
  const colors = useChronicleColors();
  const { t } = useTranslation();
  const styles = StyleSheet.create({
    topBarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      // The icon sits in the middle of its 44 pt target; pull the row out so the gear still
      // lines up with the screen margin.
      marginRight: -(TOUCH_TARGET - IconSize.title2) / 2,
    },
    action: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
  return (
    <View style={[styles.topBarActions, style]}>
      <Pressable
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}
        onPress={onSync}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.syncData')}
      >
        <Icon
          sf="arrow.clockwise"
          md="refresh-outline"
          size={IconSize.title2}
          color={colors.textMuted}
        />
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}
        onPress={() => router.push('/(home)/settings')}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.openSettings')}
      >
        <Icon
          sf="gearshape"
          md="settings-outline"
          size={IconSize.title2}
          color={colors.textMuted}
        />
      </Pressable>
    </View>
  );
}
