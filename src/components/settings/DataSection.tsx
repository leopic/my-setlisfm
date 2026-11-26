import { Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chevron } from '@/components/ui';
import type { SettingsStyles } from './useSettingsStyles';

type DataSectionProps = {
  styles: SettingsStyles;
  onClearData: () => void;
};

export default function DataSection({ styles, onClearData }: DataSectionProps) {
  const { t } = useTranslation();
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
        <Chevron style={styles.rowChevron} />
      </Pressable>
    </>
  );
}
