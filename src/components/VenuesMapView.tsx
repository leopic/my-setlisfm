import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
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

function buildHtml(venues: VenueWithCoords[], centerLat: number, centerLng: number): string {
  const markers = venues
    .map((v) => {
      const color =
        v.concertCount >= 5
          ? '#FF6B6B'
          : v.concertCount >= 3
            ? '#4ECDC4'
            : v.concertCount >= 2
              ? '#45B7D1'
              : '#96CEB4';
      const popup = [
        `<b>${v.name}</b>`,
        v.cityName && v.countryName ? `${v.cityName}, ${v.countryName}` : (v.cityName ?? ''),
        `${v.concertCount} visit${v.concertCount !== 1 ? 's' : ''}`,
        v.lastConcertDate ? `Last: ${formatDate(v.lastConcertDate)}` : '',
      ]
        .filter(Boolean)
        .join('<br/>');
      return `L.circleMarker([${v.coordsLat},${v.coordsLong}],{radius:${Math.min(6 + v.concertCount * 2, 18)},color:'${color}',fillColor:'${color}',fillOpacity:0.8,weight:2}).bindPopup('${popup.replace(/'/g, "\\'")}').addTo(map);`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;padding:0;width:100%;height:100%;background:#1a1a2e}
  .leaflet-popup-content-wrapper{border-radius:8px;font-size:13px}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true}).setView([${centerLat},${centerLng}],3);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,
  attribution:'© OpenStreetMap'
}).addTo(map);
${markers}
</script>
</body>
</html>`;
}

export default function VenuesMapView() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          backgroundColor: colors.backgroundCard,
          padding: 15,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          alignItems: 'center',
        },
        venueCountText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
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
        legendItems: { flexDirection: 'row', justifyContent: 'space-around' },
        legendItem: { flexDirection: 'row', alignItems: 'center' },
        legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
        legendText: { fontSize: 12, color: colors.textSecondary },
      }),
    [colors],
  );

  const [venues, setVenues] = useState<VenueWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState({ lat: 51.0, lng: 10.0 });

  useEffect(() => {
    loadVenuesWithCoordinates();
  }, []);

  const loadVenuesWithCoordinates = async () => {
    try {
      setLoading(true);
      const allVenues = await dbOperations.getVenuesWithStats();
      const venuesWithCoords = allVenues.filter(
        (v) => v.coordsLat != null && v.coordsLong != null,
      );
      setVenues(venuesWithCoords);

      if (venuesWithCoords.length > 0) {
        const avgLat =
          venuesWithCoords.reduce((s, v) => s + (v.coordsLat ?? 0), 0) / venuesWithCoords.length;
        const avgLng =
          venuesWithCoords.reduce((s, v) => s + (v.coordsLong ?? 0), 0) / venuesWithCoords.length;
        setCenter({ lat: avgLat, lng: avgLng });
      }
    } catch (error) {
      console.error('Failed to load venues for map:', error);
      Alert.alert(t('common.error'), 'Failed to load venue locations');
    } finally {
      setLoading(false);
    }
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
      <WebView
        style={{ flex: 1 }}
        source={{ html: buildHtml(venues, center.lat, center.lng) }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      />

      <View style={styles.venueCount}>
        <Text style={styles.venueCountText}>
          {t('map.venuesWithLocation', { count: venues.length })}
        </Text>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>{t('map.legendTitle')}</Text>
        <View style={styles.legendItems}>
          {[
            { color: '#96CEB4', label: t('map.legend1') },
            { color: '#45B7D1', label: t('map.legend2') },
            { color: '#4ECDC4', label: t('map.legend3') },
            { color: '#FF6B6B', label: t('map.legend5') },
          ].map(({ color, label }) => (
            <View key={color} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
