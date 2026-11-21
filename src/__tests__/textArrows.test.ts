import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(__dirname, '../..');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });

// Row arrows are the Chevron component (an SF Symbol on iOS), not a "›" character. The venue
// concert list keeps its text arrow for now: that file is frozen for the Observe demo.
const FROZEN = ['app/(tabs)/(venues)/concerts.tsx'];

it('draws no row arrow as text', () => {
  const offenders = ['app', 'src']
    .flatMap((dir) => sourceFiles(join(root, dir)))
    .filter((file) => !FROZEN.includes(relative(root, file)))
    .flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => ({ line, at: `${relative(root, file)}:${i + 1}` }))
        // Any › outside a comment: JSX text, {'›'}, a template or a .ts helper.
        .filter(({ line }) => line.includes('›') && !/^\s*(\/\/|\/?\*)/.test(line)),
    )
    .map(({ at, line }) => `${at} ${line.trim()}`);
  expect(offenders).toEqual([]);
});
