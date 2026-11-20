import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Corner, Radius } from '@/utils/radius';

const root = join(__dirname, '../..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });

describe('corner radius', () => {
  it('has three steps and full, with the smooth curve on each step', () => {
    expect(Radius).toEqual({ sm: 8, md: 12, lg: 16, full: 9999 });
    for (const corner of Object.values(Corner)) {
      expect(corner.borderCurve).toBe('continuous');
    }
  });

  // Every corner comes from Radius or Corner, so the app keeps one shape language. 0 is fine.
  it('no component sets a corner radius number directly', () => {
    const direct = /\bborder\w*Radius(: ?|=\{)[^,}\n]*?(?<![\w.])(?<!\/ )(?<!\* )[1-9]/;
    const offenders = ['app', 'src']
      .flatMap((dir) => sourceFiles(join(root, dir)))
      .filter((file) => !file.endsWith(join('utils', 'radius.ts')))
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
