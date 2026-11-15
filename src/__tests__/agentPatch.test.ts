import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The agent hands over a patch; agent-fix.yml publishes it only through this script, which
// must refuse anything outside src/ and app/ (it could run code in CI or on EAS).
const SCRIPT = join(__dirname, '../../.github/scripts/apply-agent-patch.sh');

let repo: string;
const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });

function write(path: string, text: string) {
  mkdirSync(join(repo, path, '..'), { recursive: true });
  writeFileSync(join(repo, path), text);
}

// Makes the change in a scratch copy, turns it into a patch like the agent job does, and
// resets the repo, so the script applies it to a clean checkout.
function patchOf(change: () => void): string {
  change();
  git('add', '-A');
  const patch = join(repo, '..', 'agent.patch');
  writeFileSync(patch, git('diff', '--cached', '--binary', 'HEAD'));
  git('reset', '-q', '--hard', 'HEAD');
  git('clean', '-qfd');
  return patch;
}

function apply(patch: string) {
  const run = spawnSync('bash', [SCRIPT, patch], { cwd: repo, encoding: 'utf8' });
  return { status: run.status, staged: git('diff', '--cached', '--name-only').trim() };
}

beforeEach(() => {
  repo = join(mkdtempSync(join(tmpdir(), 'agent-patch-')), 'repo');
  mkdirSync(repo);
  git('init', '-q');
  write('src/a.ts', 'export const a = 1;\n');
  write('.eas/workflows/ship.yml', 'name: ship\n');
  write('package.json', '{}\n');
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base');
});

afterEach(() => rmSync(join(repo, '..'), { recursive: true, force: true }));

it('stages a change in src/ and app/', () => {
  const patch = patchOf(() => {
    write('src/a.ts', 'export const a = 2;\n');
    write('app/(tabs)/new.tsx', 'export default null;\n');
  });
  expect(apply(patch)).toEqual({ status: 0, staged: 'app/(tabs)/new.tsx\nsrc/a.ts' });
});

it.each([
  ['an EAS workflow', () => write('.eas/workflows/ship.yml', 'name: evil\n')],
  ['a GitHub workflow', () => write('.github/workflows/x.yml', 'on: push\n')],
  ['package.json', () => write('package.json', '{"scripts":{"postinstall":"x"}}\n')],
  [
    'a file next to a good one',
    () => {
      write('src/a.ts', 'export const a = 2;\n');
      write('eas.json', '{}\n');
    },
  ],
  ['a rename out of src/', () => git('mv', 'src/a.ts', 'a.ts')],
])('refuses %s and stages nothing', (_name, change) => {
  expect(apply(patchOf(change))).toEqual({ status: 1, staged: '' });
});

// Many long names: a check that pipes into `grep -q` dies of SIGPIPE here and passes.
function manyFiles() {
  for (let i = 0; i < 2000; i++) write(`src/${'x'.repeat(150)}${i}.ts`, '');
}

it('refuses a bad file in a very large patch', () => {
  const patch = patchOf(() => {
    write('.eas/workflows/evil.yml', 'name: evil\n');
    manyFiles();
  });
  expect(apply(patch)).toEqual({ status: 1, staged: '' });
});

// 10,000 short names: the list of file modes is longer than a pipe buffer (64 KB), and the
// patch stays below the 1 MB limit. The symlink sorts first, so a reader that stops at the
// first bad mode leaves most of the list unread.
it('refuses a symlink in a patch with many files', () => {
  const patch = patchOf(() => {
    for (let i = 0; i < 10000; i++) write(`src/x${i}.ts`, '');
    symlinkSync('../.eas/workflows/ship.yml', join(repo, 'src/a-link'));
  });
  expect(apply(patch).status).toBe(1);
}, 60000);

it('refuses a rename into src/', () => {
  expect(apply(patchOf(() => git('mv', '.eas/workflows/ship.yml', 'src/ship.yml'))).status).toBe(1);
});

it('refuses a package.json in src/', () => {
  expect(apply(patchOf(() => write('src/package.json', '{"babel":{}}\n'))).status).toBe(1);
});

it('refuses a dotfile in src/', () => {
  expect(apply(patchOf(() => write('src/.babelrc.js', 'module.exports = {};\n'))).status).toBe(1);
});

it('refuses a symlink in src/', () => {
  const patch = patchOf(() => symlinkSync('../.eas/workflows/ship.yml', join(repo, 'src/link')));
  expect(apply(patch).status).toBe(1);
});

it('refuses an executable in src/', () => {
  const patch = patchOf(() => {
    write('src/run.sh', 'echo hi\n');
    chmodSync(join(repo, 'src/run.sh'), 0o755);
  });
  expect(apply(patch).status).toBe(1);
});

it('says when the patch is empty', () => {
  const patch = join(repo, '..', 'empty.patch');
  writeFileSync(patch, '');
  expect(apply(patch)).toEqual({ status: 3, staged: '' });
});
