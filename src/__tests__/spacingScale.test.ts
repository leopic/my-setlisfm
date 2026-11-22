import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { edgeForWidth } from '@/utils/screenEdge';

const root = join(__dirname, '../..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });

describe('spacing scale', () => {
  it('is a 4 pt grid', () => {
    const scale = readFileSync(join(root, 'src/utils/spacing.ts'), 'utf8');
    const steps = [...scale.matchAll(/^\s+s(\d+): (\d+),$/gm)].map(([, name, value]) => {
      expect(value).toBe(name);
      return Number(value);
    });
    expect(steps).toEqual([4, 8, 12, 16, 20, 24, 32, 48, 64]);
  });

  // The screen edge follows iOS's layout margins, so content lines up with native bars.
  it.each([
    [375, 16], // iPhone SE, mini
    [402, 16], // iPhone 17, 17 Pro
    [414, 20], // iPhone 11, XR
    [440, 20], // iPhone 17 Pro Max
    [820, 20], // iPad Air
  ])('keeps a %i pt wide screen %i pt from its edges', (width, edge) => {
    expect(edgeForWidth(width)).toBe(edge);
  });

  // Every padding, margin and gap comes from Space (or is worked out from it), so the app
  // keeps one rhythm. 0 is fine, and so is halving or doubling (`/ 2`, `* 2`).
  it('no component sets a padding, margin or gap number directly', () => {
    const direct =
      /\b(padding\w*|margin\w*|gap|rowGap|columnGap): [^,}\n]*?(?<![\w.])(?<!\/ )(?<!\* )[1-9]/;
    const offenders = ['app', 'src']
      .flatMap((dir) => sourceFiles(join(root, dir)))
      .filter((file) => !file.endsWith(join('utils', 'spacing.ts')))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line, i) => ({ line, at: `${relative(root, file)}:${i + 1}` }))
          .filter(({ line }) => direct.test(line) && !line.trim().startsWith('//')),
      )
      .map(({ at, line }) => `${at} ${line.trim()}`);
    expect(offenders).toEqual([]);
  });
});
