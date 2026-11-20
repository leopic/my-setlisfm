import { transformFileSync } from '@babel/core';
import { join } from 'node:path';

// The app ships through React Compiler (app.config.js experiments.reactCompiler), which turns
// on per bundle through Babel's caller. Jest has no such caller unless jest.config.js adds it,
// so the integration tests would render code the app never runs.
const root = join(__dirname, '../..');

function compile(file: string, project: string) {
  type Project = { displayName: string; transform: Record<string, [string, object]> };
  const config = jest.requireActual<{ projects: Project[] }>(join(root, 'jest.config.js'));
  const found = config.projects.find((p) => p.displayName === project);
  if (!found) throw new Error(`No Jest project "${project}"`);
  const [, options] = found.transform['\\.[jt]sx?$'];
  return transformFileSync(join(root, file), { ...options, filename: join(root, file) })?.code;
}

it.each(['app/(tabs)/(artists)/index.tsx', 'src/components/ArtistImage.tsx'])(
  'runs the integration tests on compiled components: %s',
  (file) => {
    expect(compile(file, 'integration')).toContain('react/compiler-runtime');
  },
);
