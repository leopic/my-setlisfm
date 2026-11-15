// Turns two @expo/fingerprint results (PR base and head) into the body of the
// PR comment that reminds us to run Maestro. Prints nothing when the native
// fingerprint is unchanged.
//
// The files come from a job that ran the PR's code, so they are untrusted: only a hex hash,
// a known op and a name with no backtick or line break get into the comment.
//
// Usage: node native-fingerprint-comment.mjs <base.json> <head.json> <diff.json> <branch> <same-repo>
import { readFileSync } from 'node:fs';
import process from 'node:process';

const [baseFile, headFile, diffFile, branch, sameRepo] = process.argv.slice(2);
const base = JSON.parse(readFileSync(baseFile, 'utf8'));
const head = JSON.parse(readFileSync(headFile, 'utf8'));
const diff = JSON.parse(readFileSync(diffFile, 'utf8'));

const isHash = (value) => typeof value === 'string' && /^[0-9a-f]{7,64}$/.test(value);
if (!isHash(base.hash) || !isHash(head.hash) || !Array.isArray(diff)) {
  process.stderr.write('The fingerprint files are not in the expected shape.\n');
  process.exit(1);
}
const OPS = ['added', 'removed', 'changed'];
const safeName = (value) =>
  typeof value === 'string' && value.length <= 200 && !/[`\p{Cc}]/u.test(value) ? value : 'unknown';

if (base.hash === head.hash) process.exit(0);

// An SDK bump can touch hundreds of sources; keep the comment readable and
// well under GitHub's size limit.
const MAX_LISTED = 50;

const changes = diff.map((entry) => {
  // 'changed' carries before/after sources; 'added' and 'removed' carry one.
  const source =
    entry.addedSource ?? entry.removedSource ?? entry.afterSource ?? entry.beforeSource;
  const name = safeName(source?.filePath ?? source?.id ?? source?.type);
  const op = OPS.includes(entry?.op) ? entry.op : 'changed';
  return `- ${op}: \`${name}\``;
});
const listed = changes.slice(0, MAX_LISTED);

// The command is meant to be pasted into a shell, and branch names are PR-controlled: show
// it only for a name with no shell characters, on a branch of this repo (a fork's `main`
// would run Maestro on ours).
const ciRun =
  sameRepo === 'true' && /^[A-Za-z0-9._/-]+$/.test(branch ?? '')
    ? `\`gh workflow run e2e.yml --ref '${branch}'\``
    : "run `e2e.yml` on this PR's branch (it is in a fork, or its name isn't safe in a shell)";
if (changes.length > MAX_LISTED) listed.push(`- …and ${changes.length - MAX_LISTED} more`);

process.stdout.write(`### Native fingerprint changed

This PR changes the iOS native fingerprint (\`${base.hash.slice(0, 7)}\` → \`${head.hash.slice(0, 7)}\`), which the headless tests can't see. Per CLAUDE.md, run Maestro before merging:

- Locally: \`yarn test:e2e\`
- On CI: ${ciRun}

<details><summary>Changed native sources (${changes.length})</summary>

${listed.join('\n')}

</details>
`);
