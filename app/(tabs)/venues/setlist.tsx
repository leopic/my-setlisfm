import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { dbOperations } from '../../../src/database/operations';
import type { SetlistWithDetails, SetWithSongs } from '../../../src/types/database';
import Setlist from '../../../src/components/Setlist';

export default function VenueSetlistDetailScreen() {
  const router = useRouter();
  const { id, returnTo, returnParams } = useLocalSearchParams<{ 
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
    console.log('🔄 Navigation: Back button pressed from /venues/setlist');
    
    // If we have return information, navigate back to the specific page with params
    if (returnTo && returnParams) {
      try {
        const parsedParams = JSON.parse(returnParams);
        console.log('🔄 Navigation: Returning to', returnTo, 'with params:', parsedParams);
        router.push({
          pathname: returnTo as any,
          params: parsedParams
        });
      } catch (error) {
        console.error('Failed to parse return params, using router.back()');
        router.back();
      }
    } else {
      // Fallback to normal back navigation
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
      <Setlist 
        setlist={setlist}
        sets={sets}
        onBackPress={handleBackPress}
      />
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
