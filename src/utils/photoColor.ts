import { decode } from 'jpeg-js';

// The color a person would name for a photo: the strongest common hue. Greys, near-black and
// near-white don't count; concert photos are mostly dark stage and grey sky.
const HUE_BUCKETS = 12;
const MIN_SATURATION = 0.25;
const MIN_LIGHTNESS = 0.12;
const MAX_LIGHTNESS = 0.88;
// Below this share of colored pixels a photo has no clear color (black and white, say).
const MIN_COLORED_SHARE = 0.05;

type Bucket = { weight: number; r: number; g: number; b: number };

function saturationAndLightness(r: number, g: number, b: number) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { saturation, lightness };
}

// Hue from 0 (inclusive) to 1 (exclusive).
function hue(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  if (delta === 0) return 0;
  const sixths =
    max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return sixths / 6;
}

const toHex = (channel: number) => Math.round(channel).toString(16).padStart(2, '0');

/** Returns the photo's main color as `#rrggbb`, or null when it has none. */
export function pickPhotoColor(jpeg: Uint8Array): string | null {
  const { data, width, height } = decode(jpeg, {
    useTArray: true,
    formatAsRGBA: true,
    maxResolutionInMP: 1,
    maxMemoryUsageInMB: 16,
  });
  const buckets: Bucket[] = Array.from({ length: HUE_BUCKETS }, () => ({
    weight: 0,
    r: 0,
    g: 0,
    b: 0,
  }));
  let colored = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const { saturation, lightness } = saturationAndLightness(r, g, b);
    if (saturation < MIN_SATURATION || lightness < MIN_LIGHTNESS || lightness > MAX_LIGHTNESS) {
      continue;
    }
    colored++;
    // Stronger pixels count more, so a small vivid shirt beats a large dull wall. Buckets are
    // centered on their hue, so reds on both sides of 0° share one.
    const bucket = buckets[Math.floor(hue(r, g, b) * HUE_BUCKETS + 0.5) % HUE_BUCKETS];
    bucket.weight += saturation;
    bucket.r += r * saturation;
    bucket.g += g * saturation;
    bucket.b += b * saturation;
  }
  if (colored < width * height * MIN_COLORED_SHARE) return null;

  const best = buckets.reduce((a, b) => (b.weight > a.weight ? b : a));
  return `#${toHex(best.r / best.weight)}${toHex(best.g / best.weight)}${toHex(best.b / best.weight)}`;
}
