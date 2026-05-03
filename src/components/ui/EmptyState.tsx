import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { Ionicons } from '@expo/vector-icons';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import Icon from './Icon';

interface EmptyStateProps {
  /** SF Symbol (ios) + Material icon (android) */
  icon?: { sf: SFSymbol; md: React.ComponentProps<typeof Ionicons>['name'] };
  title: string;
  /** Supporting sentence — what will appear here once data exists. */
  body?: string;
  /**
   * 'page'   — full-screen centred, used when there is no underlying data at all.
   * 'inline' — compact, used inside a list when a search returns no results.
   * Default: 'page'
   */
  variant?: 'page' | 'inline';
  /** Legacy prop — maps to `body`. */
  subtitle?: string;
}

export default function EmptyState({
  icon,
  title,
  body,
  subtitle,
  variant = 'page',
}: EmptyStateProps) {
  const colors = useChronicleColors();
  const description = body ?? subtitle;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        page: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 52,
          paddingVertical: 64,
        },
        inline: {
          alignItems: 'center',
          paddingHorizontal: 40,
          paddingVertical: 48,
        },
        iconWrap: {
          marginBottom: 20,
          opacity: 0.22,
        },
        title: {
          ...Type.title,
          color: colors.textMuted,
          textAlign: 'center',
          marginBottom: 8,
        },
        body: {
          ...Type.body,
          color: colors.textDisabled,
          textAlign: 'center',
          lineHeight: 20,
        },
      }),
    [colors],
  );

  return (
    <View style={variant === 'page' ? styles.page : styles.inline} accessibilityRole="text">
      {icon ? (
        <View style={styles.iconWrap}>
          <Icon sf={icon.sf} md={icon.md} size={52} color={colors.textMuted} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.body}>{description}</Text> : null}
    </View>
  );
}
