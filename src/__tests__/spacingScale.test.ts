import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Space } from '@/utils/spacing';

const root = join(__dirname, '../..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });

describe('spacing scale', () => {
  it('is a 4 pt grid with a 20 pt screen edge', () => {
    const { edge, ...steps } = Space;
    expect(Object.values(steps)).toEqual([4, 8, 12, 16, 20, 24, 32, 48, 64]);
    expect(edge).toBe(20);
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
