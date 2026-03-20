import { useState, useEffect, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import type { SetlistWithDetails, SetWithSongs } from '../../../src/types/database';
import Setlist from '../../../src/components/Setlist';
import { useColors } from '../../../src/utils/colors';
import SetlistSkeleton from '../../../src/components/skeletons/SetlistSkeleton';

export default function SetlistDetailScreen() {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
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
      }),
    [colors],
  );

  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [setlist, setSetlist] = useState<SetlistWithDetails | null>(null);
  const [sets, setSets] = useState<SetWithSongs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadSetlistDetails();
  }, [id]);

  const loadSetlistDetails = async () => {
    try {
      setLoading(true);
      const data = await dbOperations.getSetlistById(id);
      if (data) {
        setSetlist(data);
        setSets(data.sets || []);
      }
    } catch (error) {
      console.error('Failed to load setlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SetlistSkeleton />;
  }

  if (!setlist) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
        <Text style={styles.errorText}>Setlist not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container} testID="setlist-screen">
      <Setlist setlist={setlist} sets={sets} onBackPress={() => router.back()} />
    </SafeAreaView>
  );
}
