import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Region } from 'react-native-maps';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { dbOperations } from '@/database/operations';
import { formatDate } from '@/utils/date';
import { useColors } from '@/utils/colors';

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
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        loadingText: {
          marginTop: 10,
          fontSize: 16,
          color: colors.textSecondary,
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
          backgroundColor: colors.background,
        },
        emptyText: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: 10,
        },
        emptySubtext: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        map: {
          flex: 1,
        },
        venueCount: {
          backgroundColor: colors.backgroundCard,
          padding: 15,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          alignItems: 'center',
        },
        venueCountText: {
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        legend: {
          backgroundColor: colors.backgroundCard,
          padding: 15,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        legendTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textPrimary,
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
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  const [venues, setVenues] = useState<VenueWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>({
    latitude: 40.7128, // Default to NYC
    longitude: -74.006,
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
        (venue) => venue.coordsLat != null && venue.coordsLong != null,
      );

      setVenues(venuesWithCoords);

      // Calculate center point of all venues for better initial view
      if (venuesWithCoords.length > 0) {
        const avgLat =
          venuesWithCoords.reduce((sum, venue) => sum + (venue.coordsLat || 0), 0) /
          venuesWithCoords.length;
        const avgLng =
          venuesWithCoords.reduce((sum, venue) => sum + (venue.coordsLong || 0), 0) /
          venuesWithCoords.length;

        // Calculate bounds for appropriate zoom level
        const latitudes = venuesWithCoords.map((v) => v.coordsLat || 0);
        const longitudes = venuesWithCoords.map((v) => v.coordsLong || 0);
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
      Alert.alert(t('common.error'), 'Failed to load venue locations');
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (concertCount: number): string => {
    // Color code markers based on visit count
    if (concertCount >= 5) return colors.mapFrequent; // Red for frequent venues
    if (concertCount >= 3) return colors.mapModerate; // Teal for moderate
    if (concertCount >= 2) return colors.mapOccasional; // Blue for occasional
    return colors.mapSingleVisit; // Green for single visits
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('map.loading')}</Text>
      </View>
    );
  }

  if (venues.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('map.noData')}</Text>
        <Text style={styles.emptySubtext}>{t('map.noDataSubtitle')}</Text>
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
        mapType="none"
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{
              latitude: venue.coordsLat ?? 0,
              longitude: venue.coordsLong ?? 0,
            }}
            pinColor={getMarkerColor(venue.concertCount)}
            title={venue.name}
            description={`${venue.cityName}${venue.countryName ? `, ${venue.countryName}` : ''}\n${t('common.visit', { count: venue.concertCount })}${venue.lastConcertDate ? `\nLast: ${formatDate(venue.lastConcertDate)}` : ''}`}
          />
        ))}
      </MapView>

      <View style={styles.venueCount}>
        <Text style={styles.venueCountText}>
          {t('map.venuesWithLocation', { count: venues.length })}
        </Text>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>{t('map.legendTitle')}</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.mapSingleVisit }]} />
            <Text style={styles.legendText}>{t('map.legend1')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.mapOccasional }]} />
            <Text style={styles.legendText}>{t('map.legend2')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.mapModerate }]} />
            <Text style={styles.legendText}>{t('map.legend3')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.mapFrequent }]} />
            <Text style={styles.legendText}>{t('map.legend5')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
