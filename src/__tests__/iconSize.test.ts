import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { IconSize } from '@/utils/iconSize';

const root = join(__dirname, '../..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });

// Files that may size an icon some other way.
const EXEMPT = [
  join('app', '(tabs)', '(home)', 'demo.tsx'), // frozen; keeps its own back arrow
  join('ui', 'Icon.tsx'), // passes its caller's size on
  join('ui', 'Chevron.tsx'), // the row arrow: iOS's disclosure size, one place
  'ArtistImage.tsx', // the placeholder is half the photo
];

describe('icon sizes', () => {
  it('is the type scale, plus one size for empty states', () => {
    expect(IconSize).toEqual({
      footnote: 13,
      subheadline: 15,
      body: 17,
      headline: 17,
      title3: 20,
      title2: 22,
      title1: 28,
      largeTitle: 34,
      feature: 52,
    });
  });

  // An icon takes its size from IconSize, so it matches the text next to it.
  it('no component sizes an icon outside IconSize', () => {
    const offenders = ['app', 'src']
      .flatMap((dir) => sourceFiles(join(root, dir)))
      .filter((file) => !EXEMPT.some((exempt) => file.endsWith(exempt)))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line, i) => ({ line, at: `${relative(root, file)}:${i + 1}` }))
          .filter(({ line }) => /\bsize=\{(?!IconSize\.)/.test(line)),
      )
      .map(({ at, line }) => `${at} ${line.trim()}`);
    expect(offenders).toEqual([]);
  });
});
