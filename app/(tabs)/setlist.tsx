import React, { useState, useEffect, useMemo } from 'react';
import { Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../../src/database/operations';
import type { SetlistWithDetails, SetWithSongs } from '../../src/types/database';
import Setlist from '../../src/components/Setlist';
import { useColors } from '../../src/utils/colors';

export default function SetlistDetailScreen() {
  const colors = useColors();
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 100,
    },
    errorText: {
      fontSize: 18,
      color: colors.danger,
      textAlign: 'center',
      marginTop: 100,
    },
  }), [colors]);

  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [setlist, setSetlist] = useState<SetlistWithDetails | null>(null);
  const [sets, setSets] = useState<SetWithSongs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSetlistDetails();
    }
  }, [id]);

  const loadSetlistDetails = async () => {
    try {
      setLoading(true);
      const setlistData = await dbOperations.getSetlistById(id);
      if (setlistData) {
        setSetlist(setlistData);
        setSets(setlistData.sets || []);
      }
    } catch (error) {
      console.error('Failed to load setlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading setlist...</Text>
      </SafeAreaView>
    );
  }

  if (!setlist) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Setlist not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Setlist setlist={setlist} sets={sets} onBackPress={handleBackPress} />
    </SafeAreaView>
  );
}
