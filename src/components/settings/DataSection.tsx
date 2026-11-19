import { Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChronicleColors } from '@/utils/colors';
import { Icon } from '@/components/ui';
import type { SettingsStyles } from './useSettingsStyles';

type DataSectionProps = {
  styles: SettingsStyles;
  onClearData: () => void;
};

export default function DataSection({ styles, onClearData }: DataSectionProps) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  return (
    <>
      <Text style={styles.sectionLabel}>{t('settings.data')}</Text>

      <Pressable
        style={({ pressed }) => [styles.row, styles.rowFirst, { opacity: pressed ? 0.7 : 1 }]}
        onPress={onClearData}
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
    </>
  );
}
