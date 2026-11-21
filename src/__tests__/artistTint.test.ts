import { artistTint, contrast } from '@/utils/artistTint';

// The theme values from src/utils/colors.ts (not imported: unit tests run without React Native).
const dark = { background: '#08090f', accent: '#00e8ff' };
const light = { background: '#f2f6fc', accent: '#0077cc' };

// Colors found in real photos (dark teal, wine, sand, slate blue) and the extremes.
const PHOTO_COLORS = ['#0f4458', '#942130', '#dcc09a', '#667fb6', '#000080', '#ffff00', '#00ff00'];

// The card fill as the screen draws it: `soft` over the background.
function cardFill(soft: string, background: string) {
  const [r, g, b, a] = (soft.match(/[\d.]+/g) ?? []).map(Number);
  const bg = [1, 3, 5].map((i) => parseInt(background.slice(i, i + 2), 16));
  return `#${[r, g, b]
    .map((c, i) =>
      Math.round(bg[i] * (1 - a) + c * a)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

describe.each([
  ['dark', dark],
  ['light', light],
])('on the %s theme', (_theme, colors) => {
  it.each(PHOTO_COLORS)('keeps %s readable on a card filled with it', (photoColor) => {
    const { accent, soft } = artistTint(photoColor, colors);
    expect(contrast(accent, cardFill(soft, colors.background))).toBeGreaterThanOrEqual(4.5);
  });

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

it.each([
  ['black on the dark theme', '#000000', dark],
  ['white on the light theme', '#ffffff', light],
])('falls back to the theme accent for %s', (_case, photoColor, colors) => {
  expect(artistTint(photoColor, colors).accent).toBe(colors.accent);
});

it('gives cards a faint fill of the accent', () => {
  expect(artistTint('#942130', light).soft).toBe('rgba(148, 33, 48, 0.1)');
});
