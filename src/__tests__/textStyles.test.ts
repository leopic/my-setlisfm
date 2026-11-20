import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Type } from '@/utils/typography';

const root = join(__dirname, '../..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });

describe('text styles', () => {
  // Apple's text styles at the default text size (Human Interface Guidelines).
  it.each([
    ['largeTitle', 34, 41],
    ['title1', 28, 34],
    ['title2', 22, 28],
    ['title3', 20, 25],
    ['headline', 17, 22],
    ['body', 17, 22],
    ['subheadline', 15, 20],
    ['footnote', 13, 18],
    ['caption', 12, 16],
  ] as const)('%s is %i/%i', (style, fontSize, lineHeight) => {
    expect(Type[style]).toMatchObject({ fontSize, lineHeight });
  });

  // Every text takes its size, weight and line height from Type, so the scale stays in one
  // place. A number here, or a fontWeight next to a Space Grotesk family, is a second scale.
  it('no component sets a font size, line height or weight directly', () => {
    const direct = /\b(fontSize|lineHeight|fontWeight)(: ?|=)\{?['"]?\d/;
    // SVG chart labels use the system font at Type.caption's size; react-native-svg takes
    // their weight as a prop.
    const chartWeight = /fontWeight(: |=)['"]\d+['"]/g;
    const offenders = ['app', 'src']
      .flatMap((dir) => sourceFiles(join(root, dir)))
      .filter((file) => !file.endsWith(join('utils', 'typography.ts')))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line, i) => ({ line, at: `${relative(root, file)}:${i + 1}` }))
          .map(({ line, at }) => ({
            at,
            line: at.includes(join('components', 'charts')) ? line.replace(chartWeight, '') : line,
          }))
          .filter(({ line }) => direct.test(line) && !line.trim().startsWith('//')),
      )
      .map(({ at, line }) => `${at} ${line.trim()}`);
    expect(offenders).toEqual([]);
  });
});
