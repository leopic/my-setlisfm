import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ArtistsStyles } from './useArtistsStyles';

type ArtistsHeaderProps = {
  styles: ArtistsStyles;
  // Left out on the full-page empty state, which shows the title alone.
  subtitle?: string;
};

export default function ArtistsHeader({ styles, subtitle }: ArtistsHeaderProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('artists.title')}</Text>
      {subtitle !== undefined && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  );
}
