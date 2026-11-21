import { encode } from 'jpeg-js';
import { pickPhotoColor } from '@/utils/photoColor';

type RGB = [number, number, number];

// A 20×20 JPEG: `share` of the pixels (from the top) in `subject`, the rest in `background`.
function jpeg(background: RGB, subject?: RGB, share = 0) {
  const width = 20;
  const height = 20;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const [r, g, b] = subject && i < width * height * share ? subject : background;
    data.set([r, g, b, 255], i * 4);
  }
  return new Uint8Array(encode({ data, width, height }, 100).data);
}

const channels = (hex: string | null) => {
  expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  return [1, 3, 5].map((i) => parseInt(String(hex).slice(i, i + 2), 16));
};

it('finds the colored subject on a dark stage', () => {
  const color = pickPhotoColor(jpeg([30, 30, 30], [200, 40, 40], 0.4));

  const [r, g, b] = channels(color);
  expect(r).toBeGreaterThan(150);
  expect(g).toBeLessThan(90);
  expect(b).toBeLessThan(90);
});

it('ignores a white background', () => {
  const color = pickPhotoColor(jpeg([250, 250, 250], [40, 80, 200], 0.3));

  const [r, g, b] = channels(color);
  expect(b).toBeGreaterThan(150);
  expect(r).toBeLessThan(100);
  expect(g).toBeLessThan(130);
});

it('has no color for a black and white photo', () => {
  expect(pickPhotoColor(jpeg([30, 30, 30], [200, 200, 200], 0.5))).toBeNull();
});

it('has no color when only a speck is colored', () => {
  expect(pickPhotoColor(jpeg([30, 30, 30], [200, 40, 40], 0.02))).toBeNull();
});

it('throws on bytes that are not a JPEG', () => {
  expect(() => pickPhotoColor(new Uint8Array([1, 2, 3]))).toThrow();
});
