import type { TFunction } from 'i18next';
import { formatDate } from '@/utils/date';

export interface VenueWithCoords {
  id: string;
  name: string;
  cityName?: string;
  countryName?: string;
  coordsLat?: number;
  coordsLong?: number;
  concertCount: number;
  lastConcertDate?: string;
}

// Pin and legend colours by how often a venue was visited, fewest visits first.
export const VISIT_TIERS = [
  { minVisits: 1, color: '#96CEB4', labelKey: 'map.legend1' },
  { minVisits: 2, color: '#45B7D1', labelKey: 'map.legend2' },
  { minVisits: 3, color: '#4ECDC4', labelKey: 'map.legend3' },
  { minVisits: 5, color: '#FF6B6B', labelKey: 'map.legend5' },
] as const;

export function visitColor(visits: number) {
  return (
    [...VISIT_TIERS].reverse().find((tier) => visits >= tier.minVisits)?.color ??
    VISIT_TIERS[0].color
  );
}

// Venue and city names come from setlist.fm. They go into HTML and into a <script>, so escape
// them for HTML, and pass the popup to JavaScript as JSON with `<` escaped: a name holding
// `</script>` or `<img onerror=...>` must stay text.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toScriptString(text: string): string {
  return JSON.stringify(text)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildHtml(
  venues: VenueWithCoords[],
  centerLat: number,
  centerLng: number,
  t: TFunction,
): string {
  const markers = venues
    .map((v) => {
      const color = visitColor(v.concertCount);
      const popup = [
        `<b>${escapeHtml(v.name)}</b>`,
        escapeHtml(
          v.cityName && v.countryName ? `${v.cityName}, ${v.countryName}` : (v.cityName ?? ''),
        ),
        escapeHtml(t('common.visit', { count: v.concertCount })),
        v.lastConcertDate
          ? escapeHtml(t('map.lastVisit', { date: formatDate(v.lastConcertDate) }))
          : '',
      ]
        .filter(Boolean)
        .join('<br/>');
      return `L.circleMarker([${Number(v.coordsLat)},${Number(v.coordsLong)}],{radius:${Math.min(6 + Number(v.concertCount) * 2, 18)},color:'${color}',fillColor:'${color}',fillOpacity:0.8,weight:2}).bindPopup(${toScriptString(popup)}).addTo(map);`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
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
