import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// expo-router gives Link.Preview's native view `display: 'contents'`. Up to 58.0.32 that view had
// no size on iOS and the accessibility tree dropped the row inside it, so a yarn patch removed
// the style. Since 58.0.33 the native view (DisplayContentsView) takes its rows' box itself, and
// it needs the style: with the old patch, every concert row moved half a screen to the right.
it('runs expo-router unpatched, with the style its native Link.Preview view needs', () => {
  const { dependencies } = JSON.parse(
    readFileSync(join(__dirname, '../../package.json'), 'utf8'),
  ) as { dependencies: Record<string, string> };
  expect(dependencies['expo-router']).not.toMatch(/^patch:/);

  const linkWithPreview = readFileSync(
    require.resolve('expo-router/build/link/LinkWithPreview.js'),
    'utf8',
  );
  expect(linkWithPreview).toMatch(/display:\s*['"]contents['"]/);
});
