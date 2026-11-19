import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

// ship-main.yml skips pushes that only touch non-app files, to save EAS minutes. A skipped
// app change would leave the preview build without it, so pin both sides.
const shipMain = parse(
  readFileSync(join(__dirname, '../../.eas/workflows/ship-main.yml'), 'utf8'),
) as { on: { push: { paths: string[] } } };
const patterns = shipMain.on.push.paths;

// Glob semantics as in GitHub's path filters (EAS documents the same `**` and `!` syntax):
// the last pattern that matches a file decides. This models EAS's matcher; it can't test it.
const toRegExp = (glob: string) =>
  new RegExp(
    `^${glob
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*\//g, '%ANYDIRS%')
      .replace(/\*\*/g, '%ANY%')
      .replace(/\*/g, '[^/]*')
      .replace(/%ANYDIRS%/g, '(?:.*/)?')
      .replace(/%ANY%/g, '.*')}$`,
  );
const ships = (file: string) =>
  patterns.reduce(
    (included, pattern) =>
      pattern.startsWith('!')
        ? included && !toRegExp(pattern.slice(1)).test(file)
        : included || toRegExp(pattern).test(file),
    false,
  );

it('ships every change that can reach the app', () => {
  for (const file of [
    'app/(tabs)/(stats)/index.tsx',
    'app/_layout.tsx',
    'src/components/charts/LineChart.tsx',
    'src/utils/date.ts',
    'src/i18n/en.ts',
    'assets/icon.png',
    'index.ts',
    'app.config.js',
    'fingerprint.config.js',
    'eas.json',
    'package.json',
    'yarn.lock',
    'tsconfig.json',
    '.eas/workflows/ship-main.yml',
    '.nvmrc',
    '.yarnrc.yml',
    // The fingerprint reads it to choose the files it hashes.
    '.gitignore',
  ])
    expect([file, ships(file)]).toEqual([file, true]);
});

it('skips changes to CI, tests, docs and dev tooling', () => {
  for (const file of [
    '.github/workflows/ci.yml',
    '.husky/pre-push',
    '.maestro/flows/dashboard.yaml',
    '.react-doctor/false-positives.md',
    'docs/screenshots/stats.jpg',
    'scripts/verify.sh',
    'src/__tests__/integration/lineChart.test.tsx',
    'test/screen.ts',
    'README.md',
    'CLAUDE.md',
    'eslint.config.js',
    'jest.config.js',
  ])
    expect([file, ships(file)]).toEqual([file, false]);
});
