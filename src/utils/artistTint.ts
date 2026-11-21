// Text in the artist's color must stay as readable as the theme accent: WCAG AA for small text.
const MIN_CONTRAST = 4.5;
const LIGHTNESS_STEP = 0.02;

export interface ArtistTint {
  /** For dates, tour names and dots: readable on the screen background. */
  accent: string;
  /** For the glow behind the screen header, as `accent` at a low opacity. */
  glowOpacity: number;
  /** A faint fill of `accent` for cards, like the theme's `accentSoft`. */
  soft: string;
}

type Rgb = [number, number, number];

const parseHex = (hex: string): Rgb =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;

const toHex = (rgb: Rgb) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

function luminance([r, g, b]: Rgb): number {
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(parseHex(a)), luminance(parseHex(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// `top` at `opacity` over `bottom`, as the screen draws it.
const blend = (bottom: Rgb, top: Rgb, opacity: number): Rgb =>
  bottom.map((c, i) => c * (1 - opacity) + top[i] * opacity) as Rgb;

function toHsl([r, g, b]: Rgb): Rgb {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === rn ? ((gn - bn) / d + 6) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function fromHsl([h, s, l]: Rgb): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/**
 * The artist's photo color, made readable on the current theme: lighter on a dark background,
 * darker on a light one, with the same hue.
 */
export function artistTint(
  photoColor: string,
  colors: { background: string; accent: string },
): ArtistTint {
  const darkTheme = luminance(parseHex(colors.background)) < 0.5;
  const softOpacity = darkTheme ? 0.12 : 0.1;
  // Text in the accent also sits on cards filled with `soft`, which is closer to the accent than
  // the background is: it has to read there too.
  const readable = (color: string) =>
    contrast(color, colors.background) >= MIN_CONTRAST &&
    contrast(color, toHex(blend(parseHex(colors.background), parseHex(color), softOpacity))) >=
      MIN_CONTRAST;
  const [h, s, startLightness] = toHsl(parseHex(photoColor));
  let l = startLightness;
  let accent = photoColor;
  while (!readable(accent) && l > 0 && l < 1) {
    l = Math.min(1, Math.max(0, l + (darkTheme ? LIGHTNESS_STEP : -LIGHTNESS_STEP)));
    accent = toHex(fromHsl([h, s, l]));
  }
  // Pure black on the dark theme or pure white on the light one: no lightness reads.
  if (!readable(accent)) accent = colors.accent;
  const [r, g, b] = parseHex(accent);
  const soft = `rgba(${r}, ${g}, ${b}, ${softOpacity})`;
  return { accent, glowOpacity: darkTheme ? 0.22 : 0.16, soft };
}
