// Turns two @expo/fingerprint results (PR base and head) into the body of the
// PR comment that reminds us to run Maestro. Prints nothing when the native
// fingerprint is unchanged.
//
// Usage: node native-fingerprint-comment.mjs <base.json> <head.json> <diff.json> <branch>
import { readFileSync } from 'node:fs';
import process from 'node:process';

const [baseFile, headFile, diffFile, branch] = process.argv.slice(2);
const base = JSON.parse(readFileSync(baseFile, 'utf8'));
const head = JSON.parse(readFileSync(headFile, 'utf8'));

if (base.hash === head.hash) process.exit(0);

// An SDK bump can touch hundreds of sources; keep the comment readable and
// well under GitHub's size limit.
const MAX_LISTED = 50;

const diff = JSON.parse(readFileSync(diffFile, 'utf8'));
const changes = diff.map((entry) => {
  // 'changed' carries before/after sources; 'added' and 'removed' carry one.
  const source =
    entry.addedSource ?? entry.removedSource ?? entry.afterSource ?? entry.beforeSource;
  const name = source?.filePath ?? source?.id ?? source?.type ?? 'unknown';
  return `- ${entry.op}: \`${name}\``;
});
const listed = changes.slice(0, MAX_LISTED);
if (changes.length > MAX_LISTED) listed.push(`- …and ${changes.length - MAX_LISTED} more`);

process.stdout.write(`### Native fingerprint changed

This PR changes the iOS native fingerprint (\`${base.hash.slice(0, 7)}\` → \`${head.hash.slice(0, 7)}\`), which the headless tests can't see. Per CLAUDE.md, run Maestro before merging:

- Locally: \`yarn test:e2e\`
- On CI: \`gh workflow run e2e.yml --ref ${branch}\`

<details><summary>Changed native sources (${changes.length})</summary>

${listed.join('\n')}

</details>
`);
