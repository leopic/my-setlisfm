import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

// Runs the two shell steps of observe-intake.yml as written, with fake `npx` (eas-cli) and `gh`,
// to check the guards: fingerprint form, one open issue per error group, the daily agent cap,
// and no agent without an app frame.
const REPO = join(__dirname, '../..');
type Step = { name?: string; run?: string };
const workflow = parse(
  readFileSync(join(REPO, '.github/workflows/observe-intake.yml'), 'utf8'),
) as { jobs: { intake: { steps: Step[]; env: Record<string, unknown> } } };
const script = (name: string) =>
  workflow.jobs.intake.steps.find((step) => step.name === name)?.run ?? '';

const FP = 'a1b2c3d4e5f6a7b8';
// The fake `date` below prints this day, so the cap tests don't depend on the clock.
const today = '2026-11-15';
const group = {
  fingerprint: FP,
  type: 'TypeError',
  message: 'boom',
  isFatal: false,
  platforms: ['ios'],
  eventCount: 1,
  uniqueUserCount: 1,
  firstSeenAt: '2026-11-15T19:04:12.000Z',
};
const appFrame = { stacktrace: '    at f (src/utils/date.ts:5:1)', environment: 'preview' };
const intakeIssue = (fp: string, number = 12) => ({
  number,
  body: `Error group from EAS Observe\n\n**Observe group:** \`${fp}\`\n**Build:** ios`,
});
const createdToday = (count: number) =>
  Array.from({ length: count }, () => ({ createdAt: `${today}T01:00:00Z` })).concat({
    createdAt: '2020-01-01T00:00:00Z',
  });

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'observe-intake-'));
  const bin = join(dir, 'bin');
  mkdirSync(bin);
  writeFileSync(
    join(bin, 'npx'),
    `#!/bin/bash
echo "npx $*" >> "$FAKE/calls.log"
if [[ " $* " == *" --fingerprint="* ]]; then cat "$FAKE/fake-occurrences.json"; else cat "$FAKE/fake-groups.json"; fi
`,
  );
  writeFileSync(
    join(bin, 'gh'),
    `#!/bin/bash
echo "gh $*" >> "$FAKE/calls.log"
if [ "$1 $2" = "issue create" ]; then echo "https://github.com/o/r/issues/77"; exit 0; fi
if [[ " $* " == *" --json number,body "* ]]; then cat "$FAKE/fake-open.json"; exit 0; fi
expr=""; prev=""; for a in "$@"; do [ "$prev" = "--jq" ] && expr="$a"; prev="$a"; done
jq "$expr" "$FAKE/fake-agent-issues.json"
`,
  );
  writeFileSync(join(bin, 'date'), `#!/bin/bash\necho ${today}\n`);
  chmodSync(join(bin, 'date'), 0o755);
  chmodSync(join(bin, 'npx'), 0o755);
  chmodSync(join(bin, 'gh'), 0o755);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function intake({
  fingerprint = FP,
  groups = [group] as unknown[],
  occurrences = [appFrame] as unknown[],
  open = [] as unknown[],
  agentIssues = [] as unknown[],
} = {}) {
  const files = {
    'fake-groups.json': { errors: groups, isTruncated: false },
    'fake-occurrences.json': { occurrences },
    'fake-open.json': open,
    'fake-agent-issues.json': agentIssues,
  };
  for (const [name, value] of Object.entries(files)) {
    writeFileSync(join(dir, name), JSON.stringify(value));
  }
  for (const name of ['calls.log', 'output', 'summary']) writeFileSync(join(dir, name), '');
  const env = {
    NODE_ENV: 'test' as const,
    PATH: `${join(dir, 'bin')}:${dirname(process.execPath)}:${process.env.PATH}`,
    FAKE: dir,
    FINGERPRINT: fingerprint,
    PROJECT_ID: 'project',
    DAILY_CAP: String(workflow.jobs.intake.env.DAILY_CAP),
    GITHUB_REPOSITORY: 'o/r',
    GITHUB_WORKSPACE: REPO,
    GITHUB_OUTPUT: join(dir, 'output'),
    GITHUB_STEP_SUMMARY: join(dir, 'summary'),
  };
  let status = 0;
  for (const name of ['Fetch the error group', 'Open the issue']) {
    status = spawnSync('bash', ['-e', '-c', script(name)], { cwd: dir, env }).status ?? 1;
    if (status !== 0) break;
  }
  const outputs = Object.fromEntries(
    readFileSync(join(dir, 'output'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split('=')),
  );
  const calls = readFileSync(join(dir, 'calls.log'), 'utf8');
  const create = calls.split('\n').find((line) => line.startsWith('gh issue create'));
  return { status, outputs, calls, labels: create?.match(/--label (\S+)/)?.[1] };
}

it('opens the issue and starts the agent for a new error with an app frame', () => {
  const result = intake({ agentIssues: createdToday(2) });
  // Duplicates: open intake issues. Cap: intake issues the agent took, open or closed.
  expect(result.calls).toMatch(
    /gh issue list .*--label source:observe --state open .*--json number,body/,
  );
  expect(result.calls).toMatch(
    /gh issue list .*--label source:observe --label fixer:gh --state all .*--json createdAt/,
  );
  expect(result).toMatchObject({
    status: 0,
    outputs: { issue: '77', start: 'true' },
    labels: 'bug,source:observe,fixer:gh',
  });
});

it('opens no second issue for an error group with an open issue', () => {
  const result = intake({ open: [intakeIssue(`${FP}0`, 13), intakeIssue(FP)] });
  expect(result).toMatchObject({ status: 0, outputs: { start: 'false' }, labels: undefined });
});

it('finds the open issue after an edit in the browser (CRLF line ends)', () => {
  const edited = { number: 12, body: intakeIssue(FP).body.replace(/\n/g, '\r\n') };
  expect(intake({ open: [edited] }).labels).toBeUndefined();
});

it('treats an issue for a longer fingerprint, or with no body, as another group', () => {
  const result = intake({ open: [intakeIssue(`${FP}0`), { number: 3, body: null }] });
  expect(result.outputs.start).toBe('true');
});

it('opens the issue but starts no agent over the daily cap', () => {
  const result = intake({ agentIssues: createdToday(3) });
  expect(result).toMatchObject({
    outputs: { issue: '77', start: 'false' },
    labels: 'bug,source:observe,budget:paused',
  });
});

it('opens the issue but starts no agent without an app frame', () => {
  const result = intake({ occurrences: [{ stacktrace: '    at f (node_modules/x.js:1:1)' }] });
  expect(result).toMatchObject({
    outputs: { issue: '77', start: 'false' },
    labels: 'bug,source:observe,skipped:no-app-frames',
  });
});

it('opens nothing for a group Observe does not list, and says so', () => {
  const result = intake({ fingerprint: 'bbbbbbbbbbbbbbbb' });
  expect(result).toMatchObject({ status: 0, outputs: { start: 'false' }, labels: undefined });
  expect(result.calls).not.toContain('--fingerprint=');
  expect(readFileSync(join(dir, 'summary'), 'utf8')).toContain('No issue');
});

it('fails when Observe sends no list of error groups', () => {
  const result = intake({ groups: 'not a list' as unknown as unknown[] });
  expect(result.status).not.toBe(0);
  expect(result.calls).not.toContain('gh issue');
});

it.each([['abc;rm -rf ~'], ['short'], ['--project-id=x']])(
  'refuses the fingerprint %p before it calls anything',
  (fingerprint) => {
    const result = intake({ fingerprint });
    expect(result.status).not.toBe(0);
    expect(result.calls).toBe('');
  },
);
