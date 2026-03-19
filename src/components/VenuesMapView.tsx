import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { dbOperations } from '../database/operations';
import { formatDate } from '../utils/date';

interface VenueWithCoords {
  id: string;
  name: string;
  cityName?: string;
  countryName?: string;
  coordsLat?: number;
  coordsLong?: number;
  concertCount: number;
  lastConcertDate?: string;
}

export default function VenuesMapView() {
  const [venues, setVenues] = useState<VenueWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>({
    latitude: 40.7128, // Default to NYC
    longitude: -74.0060,
    latitudeDelta: 50, // Wide view to show multiple countries
    longitudeDelta: 50,
  });

  useEffect(() => {
    loadVenuesWithCoordinates();
  }, []);

  const loadVenuesWithCoordinates = async () => {
    try {
      setLoading(true);
      const allVenues = await dbOperations.getVenuesWithStats();
      
      // Filter venues that have coordinates
      const venuesWithCoords = allVenues.filter(
        venue => venue.coordsLat != null && venue.coordsLong != null
      );
      
      setVenues(venuesWithCoords);
      
      // Calculate center point of all venues for better initial view
      if (venuesWithCoords.length > 0) {
        const avgLat = venuesWithCoords.reduce((sum, venue) => sum + (venue.coordsLat || 0), 0) / venuesWithCoords.length;
        const avgLng = venuesWithCoords.reduce((sum, venue) => sum + (venue.coordsLong || 0), 0) / venuesWithCoords.length;
        
        // Calculate bounds for appropriate zoom level
        const latitudes = venuesWithCoords.map(v => v.coordsLat || 0);
        const longitudes = venuesWithCoords.map(v => v.coordsLong || 0);
        const latDelta = Math.max(...latitudes) - Math.min(...latitudes);
        const lngDelta = Math.max(...longitudes) - Math.min(...longitudes);
        
        setRegion({
          latitude: avgLat,
          longitude: avgLng,
          latitudeDelta: Math.max(latDelta * 1.5, 1), // Add padding and minimum zoom
          longitudeDelta: Math.max(lngDelta * 1.5, 1),
        });
      }
    } catch (error) {
      console.error('Failed to load venues for map:', error);
      Alert.alert('Error', 'Failed to load venue locations');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (concertCount: number): string => {
    // Color code markers based on visit count
    if (concertCount >= 5) return '#FF6B6B'; // Red for frequent venues
    if (concertCount >= 3) return '#4ECDC4'; // Teal for moderate
    if (concertCount >= 2) return '#45B7D1'; // Blue for occasional
    return '#96CEB4'; // Green for single visits
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading venue locations...</Text>
      </View>
    );
  }

  if (venues.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No venues with location data found</Text>
        <Text style={styles.emptySubtext}>
          Venues need coordinate information to appear on the map
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.coordsLat!,
              longitude: venue.coordsLong!,
            }}
            pinColor={getMarkerColor(venue.concertCount)}
            title={venue.name}
            description={`${venue.cityName}${venue.countryName ? `, ${venue.countryName}` : ''}\n${venue.concertCount} visit${venue.concertCount !== 1 ? 's' : ''}${venue.lastConcertDate ? `\nLast: ${formatDate(venue.lastConcertDate)}` : ''}`}
          />
        ))}
      </MapView>
      
      <View style={styles.venueCount}>
        <Text style={styles.venueCountText}>
          {venues.length} venue{venues.length !== 1 ? 's' : ''} with location data
        </Text>
      </View>
      
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Visit Count Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#96CEB4' }]} />
            <Text style={styles.legendText}>1 visit</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#45B7D1' }]} />
            <Text style={styles.legendText}>2 visits</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.legendText}>3-4 visits</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>5+ visits</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  map: {
    flex: 1,
  },
  venueCount: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'center',
  },
  venueCountText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  legend: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
