import { readFileSync } from 'node:fs';

// expo-router gives Link.Preview's native view `display: 'contents'`. On iOS that view then
// has no size, and the accessibility tree drops the row inside it: VoiceOver and Maestro
// can't find a concert row. .yarn/patches/expo-router-* removes the style. An expo-router
// upgrade drops the patch unless it is moved to the new version; this test says so.
it('keeps the expo-router patch that leaves Link.Preview rows accessible', () => {
  const linkWithPreview = readFileSync(
    require.resolve('expo-router/build/link/LinkWithPreview.js'),
    'utf8',
  );
  expect(linkWithPreview).not.toContain("display: 'contents'");
});
