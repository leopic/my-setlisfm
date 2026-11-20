import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { BackButton } from '@/components/ui';
import { Space } from '@/utils/spacing';

interface ListScreenHeaderProps {
  title: string;
  subtitle: string;
}

export default function ListScreenHeader({ title, subtitle }: ListScreenHeaderProps) {
  const colors = useChronicleColors();
  const router = useRouter();
  const styles = StyleSheet.create({
    inlineHeader: {
      paddingHorizontal: Space.edge,
      // The back button's 44 pt target already adds space above its text.
      paddingTop: Space.s4,
      paddingBottom: Space.s12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      ...Type.title1,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      ...Type.subheadline,
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.inlineHeader}>
      <View style={styles.backRow}>
        <BackButton onPress={() => router.back()} />
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );
}
