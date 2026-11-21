import { artistTint, contrast } from '@/utils/artistTint';
import type { ChronicleColors } from '@/utils/colors';

// Only the background decides the tint.
const dark = { background: '#08090f' } as ChronicleColors;
const light = { background: '#f2f6fc' } as ChronicleColors;

// Colors found in real photos (dark teal, wine, sand, slate blue) and the extremes.
const PHOTO_COLORS = ['#0f4458', '#942130', '#dcc09a', '#667fb6', '#000080', '#ffff00', '#00ff00'];

describe.each([
  ['dark', dark],
  ['light', light],
])('on the %s theme', (_theme, colors) => {
  it.each(PHOTO_COLORS)('makes %s readable as text', (photoColor) => {
    expect(
      contrast(artistTint(photoColor, colors).accent, colors.background),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

it('keeps a photo color that is readable already', () => {
  expect(artistTint('#942130', light).accent).toBe('#942130');
});

it('keeps the hue: a dark red becomes a lighter red on the dark theme', () => {
  const accent = artistTint('#942130', dark).accent;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(accent.slice(i, i + 2), 16));
  expect(r).toBeGreaterThan(0x94);
  expect(r).toBeGreaterThan(g);
  expect(r).toBeGreaterThan(b);
});

it('shows the glow a little stronger on the dark theme', () => {
  expect(artistTint('#942130', dark).glowOpacity).toBeGreaterThan(
    artistTint('#942130', light).glowOpacity,
  );
});
