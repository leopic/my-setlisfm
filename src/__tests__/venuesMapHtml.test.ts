import type { TFunction } from 'i18next';
import { buildHtml, type VenueWithCoords } from '@/components/venuesMapHtml';

// The Android map's WebView page. Venue text comes from setlist.fm and must stay text.
const t = ((key: string) => key) as unknown as TFunction;

const hostile: VenueWithCoords = {
  id: 'v1',
  name: `</script><img src=x onerror="alert(1)">Bob's "Bar"`,
  cityName: '<b>Town</b>',
  countryName: 'Land',
  coordsLat: 52.5,
  coordsLong: 13.4,
  concertCount: 2,
};

function popupOf(html: string): string {
  const match = html.match(/\.bindPopup\(("(?:[^"\\]|\\.)*")\)/);
  if (!match) throw new Error('no popup in the page');
  return JSON.parse(match[1]);
}

it('keeps venue text as text in the page and the popup', () => {
  const html = buildHtml([hostile], 0, 0, t);
  // Only the two real script tags close; the venue name cannot end the inline script.
  expect(html.match(/<\/script>/g)).toHaveLength(2);
  expect(html).not.toContain('<img');
  expect(popupOf(html)).toBe(
    '<b>&lt;/script&gt;&lt;img src=x onerror=&quot;alert(1)&quot;&gt;Bob&#39;s &quot;Bar&quot;</b>' +
      '<br/>&lt;b&gt;Town&lt;/b&gt;, Land<br/>common.visit',
  );
});

it('loads Leaflet only with the pinned integrity hashes', () => {
  const html = buildHtml([], 0, 0, t);
  expect(html).toContain(
    'leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="',
  );
  expect(html).toContain(
    'leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="',
  );
});

it('writes only numbers for the coordinates', () => {
  const odd = { ...hostile, coordsLat: '1]);alert(1);//' as unknown as number };
  expect(buildHtml([odd], 0, 0, t)).toContain('L.circleMarker([NaN,13.4]');
});
