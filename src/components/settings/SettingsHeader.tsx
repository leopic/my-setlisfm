import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Icon } from '@/components/ui';
import type { SettingsStyles } from './useSettingsStyles';

export default function SettingsHeader({ styles }: { styles: SettingsStyles }) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const router = useRouter();
  return (
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
  );
}
