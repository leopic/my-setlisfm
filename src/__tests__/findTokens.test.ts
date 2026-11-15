import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// agent-fix.yml publishes the transcript and the agent's patch and PR text only if this
// finds no token in them. Fake tokens, built at run time so no scanner flags this file.
const SCRIPT = join(__dirname, '../../.github/scripts/find-tokens.sh');
const fakeGitHubToken = 'ghp' + '_' + 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8';
const fakeClaudeToken = 'sk-' + 'ant-' + 'oat01-AbCdEfGhIjKlMnOpQrStUv';

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), 'find-tokens-'))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function scan(...texts: string[]) {
  const files = texts.map((text, i) => {
    const file = join(dir, `f${i}.txt`);
    writeFileSync(file, text);
    return file;
  });
  const run = spawnSync('bash', [SCRIPT, ...files], { encoding: 'utf8' });
  return { status: run.status, out: run.stdout };
}

it('passes text with no token, including the credential helper URL', () => {
  expect(scan('fix: city name\nhttps://x-access-token@github.com/o/r.git\n').status).toBe(0);
});

it.each([
  ['GitHub token', `token is ${fakeGitHubToken} here`],
  ['Claude token', `CLAUDE_CODE_OAUTH_TOKEN=${fakeClaudeToken}`],
  ['git URL with a token', 'https://x-access-token:abc123@github.com/o/r.git'],
])('finds a %s and does not print it', (name, text) => {
  const { status, out } = scan('clean\n', text);
  expect(status).toBe(1);
  expect(out).toContain(`contains a ${name}`);
  expect(out).not.toContain(fakeGitHubToken);
  expect(out).not.toContain(fakeClaudeToken);
  expect(out).not.toContain('abc123');
});

it('keeps workflow commands in the scanned text inert', () => {
  const { out } = scan(`::error::x ${fakeGitHubToken}`);
  const lines = out.split('\n');
  const stop = lines.findIndex((line) => line.startsWith('::stop-commands::'));
  const marker = lines[stop].slice('::stop-commands::'.length);
  const resume = lines.indexOf(`::${marker}::`);
  expect(marker).toMatch(/^[0-9a-f]{32}$/);
  expect(lines.slice(stop + 1, resume).join('\n')).toContain('::error::x');
});

it('fails closed when a file cannot be read', () => {
  expect(spawnSync('bash', [SCRIPT, join(dir, 'missing')]).status).toBe(2);
});
