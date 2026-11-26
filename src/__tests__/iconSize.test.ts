import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { IconSize } from '@/utils/iconSize';
import { Type } from '@/utils/typography';

const root = join(__dirname, '../..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });

// The demo screen is frozen; it keeps its own back arrow.
const FROZEN = [join('app', '(tabs)', '(home)', 'demo.tsx')];

describe('icon sizes', () => {
  it('follow the text styles', () => {
    expect(IconSize).toEqual({
      footnote: Type.footnote.fontSize,
      subheadline: Type.subheadline.fontSize,
      body: Type.body.fontSize,
      title3: Type.title3.fontSize,
      title1: Type.title1.fontSize,
      largeTitle: Type.largeTitle.fontSize,
      feature: 52,
    });
  });

  // An icon takes its size from IconSize, so it matches the text next to it.
  it('no component gives an icon a number size', () => {
    const offenders = ['app', 'src']
      .flatMap((dir) => sourceFiles(join(root, dir)))
      .filter((file) => !FROZEN.some((frozen) => file.endsWith(frozen)))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line, i) => ({ line, at: `${relative(root, file)}:${i + 1}` }))
          .filter(({ line }) => /\bsize=\{\d/.test(line)),
      )
      .map(({ at, line }) => `${at} ${line.trim()}`);
    expect(offenders).toEqual([]);
  });
});
