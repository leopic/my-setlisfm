import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import type { SetlistWithDetails, SetWithSongs } from '../../../src/types/database';
import Setlist from '../../../src/components/Setlist';

export default function VenueSetlistDetailScreen() {
  const router = useRouter();
  const { id, returnTo } = useLocalSearchParams<{
    id: string;
    returnTo?: string;
    returnParams?: string;
  }>();
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
    if (returnTo) {
      try {
        const parsedParams = JSON.parse(returnTo);
        router.push({
          pathname: parsedParams.pathname as any,
          params: parsedParams.params,
        });
      } catch (error) {
        console.error('Error parsing return params:', error);
        router.back();
      }
    } else {
      router.back();
    }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 100,
  },
});
