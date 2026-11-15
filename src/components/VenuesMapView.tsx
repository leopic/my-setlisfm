import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { dbOperations } from '@/database/operations';
import { useChronicleColors } from '@/utils/colors';
import { buildHtml, visitColor, VISIT_TIERS, type VenueWithCoords } from './venuesMapHtml';

export default function VenuesMapView() {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: { marginTop: 10, fontSize: 16, color: colors.textSecondary },
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
    venueCount: {
      backgroundColor: colors.background,
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'center',
    },
    venueCountText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    legend: {
      backgroundColor: colors.background,
      padding: 15,
      // The native tab bar floats over the bottom of the screen; keep the legend above it.
      paddingBottom: 15 + insets.bottom,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 10,
    },
    legendItems: { flexDirection: 'row', justifyContent: 'space-around' },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
    legendText: { fontSize: 12, color: colors.textSecondary },
  });

  const [venues, setVenues] = useState<VenueWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState({ lat: 51.0, lng: 10.0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const allVenues = await dbOperations.getVenuesWithStats();
        const venuesWithCoords = allVenues.filter(
          (v) => v.coordsLat != null && v.coordsLong != null,
        );
        if (!cancelled) {
          setVenues(venuesWithCoords);
          if (venuesWithCoords.length > 0) {
            const mostVisited = venuesWithCoords.reduce((best, v) =>
              v.concertCount > best.concertCount ? v : best,
            );
            setCenter({ lat: mostVisited.coordsLat ?? 51.0, lng: mostVisited.coordsLong ?? 10.0 });
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load venues for map:', error);
        if (!cancelled) {
          Alert.alert(t('common.error'), 'Failed to load venue locations');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
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

  const mapContent =
    Platform.OS === 'ios' ? (
      <MapView
        style={{ flex: 1 }}
        region={{
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: 50,
          longitudeDelta: 50,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass
        showsScale
      >
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{ latitude: venue.coordsLat ?? 0, longitude: venue.coordsLong ?? 0 }}
            pinColor={visitColor(venue.concertCount)}
            title={venue.name}
            description={`${venue.cityName ?? ''}${venue.countryName ? ', ' + venue.countryName : ''} · ${t('common.visit', { count: venue.concertCount })}`}
          />
        ))}
      </MapView>
    ) : (
      <WebView
        style={{ flex: 1 }}
        source={{ html: buildHtml(venues, center.lat, center.lng, t) }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}
      />
    );

  return (
    <View style={styles.container}>
      {mapContent}

      <View style={styles.venueCount}>
        <Text style={styles.venueCountText}>
          {t('map.venuesWithLocation', { count: venues.length })}
        </Text>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>{t('map.legendTitle')}</Text>
        <View style={styles.legendItems}>
          {VISIT_TIERS.map(({ color, labelKey }) => (
            <View key={color} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{t(labelKey)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
