import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useChronicleColors } from '@/utils/colors';
import { Type } from '@/utils/typography';
import { BackButton } from '@/components/ui';

interface ListScreenHeaderProps {
  title: string;
  subtitle: string;
}

export default function ListScreenHeader({ title, subtitle }: ListScreenHeaderProps) {
  const colors = useChronicleColors();
  const router = useRouter();
  const styles = StyleSheet.create({
    inlineHeader: {
      paddingHorizontal: 16,
      // The back button's 44 pt target already adds space above its text.
      paddingTop: 4,
      paddingBottom: 12,
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
      marginTop: 2,
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
