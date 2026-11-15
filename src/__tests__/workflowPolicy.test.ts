import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

// The agent's code runs in the `fix` job of agent-fix.yml. These rules keep a hijacked agent
// from pushing, reading the Claude token or reaching a write token. See the comments there.
type Step = {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, string | boolean>;
  'continue-on-error'?: boolean;
};
type Job = {
  if?: string;
  env?: Record<string, unknown>;
  permissions?: Record<string, string>;
  environment?: string;
  steps: Step[];
};
type Workflow = { permissions?: unknown; on: Record<string, unknown>; jobs: Record<string, Job> };

const read = (name: string) =>
  parse(readFileSync(join(__dirname, '../../.github/workflows', name), 'utf8')) as Workflow;

const workflow = read('agent-fix.yml');
const fix = workflow.jobs.fix;
const agentStep = fix.steps.find((step) => step.uses?.startsWith('anthropics/claude-code-action@'));

it('gives the workflow no default permissions', () => {
  expect(workflow.permissions).toEqual({});
});

it('runs the agent with a read-only token, no id-token, and the main-only environment', () => {
  expect(fix.permissions).toEqual({ contents: 'read', issues: 'read' });
  expect(fix.environment).toBe('agent');
});

it('starts only on issues Leo opened and labeled', () => {
  for (const name of ['fix', 'pick-up']) {
    const condition = workflow.jobs[name].if ?? '';
    expect(condition).toContain('github.event.issue.user.login == github.repository_owner');
    expect(condition).toContain('github.event.sender.login == github.repository_owner');
  }
});

// The Observe intake calls the workflow with the issue it opened; label events need Leo.
it('starts from a call with an issue number, or from Leo labeling his own issue', () => {
  expect(workflow.on.workflow_call).toEqual({
    inputs: { issue_number: { type: 'number', required: true } },
  });
  for (const name of ['fix', 'pick-up']) {
    const condition = (workflow.jobs[name].if ?? '').replace(/\s+/g, ' ').trim();
    expect(condition).toBe(
      "inputs.issue_number || (github.event_name == 'issues' && github.event.label.name == 'fixer:gh' && !github.event.issue.pull_request && github.event.issue.user.login == github.repository_owner && github.event.sender.login == github.repository_owner)",
    );
  }
});

it('reads only an open issue by Leo or the intake when called, and fails if it can not', () => {
  const save = fix.steps.find((step) => step.name === 'Save the bug report')?.run ?? '';
  expect(save).toContain('set -o pipefail');
  expect(save).toContain('(.pull_request | not) and .state == "open"');
  expect(save).toContain('.user.login == $owner');
  expect(save).toContain('.user.login == "github-actions[bot]"');
  expect(save).toContain('any(.labels[]; .name == "source:observe")');
  expect(save).toMatch(
    /\| jq -f \.github\/scripts\/clean-issue\.jq > "\$RUNNER_TEMP\/agent-io\/issue\.json"$/m,
  );
});

it('takes the issue number from the call first, everywhere', () => {
  const text = readFileSync(join(__dirname, '../../.github/workflows/agent-fix.yml'), 'utf8');
  const uses = text.match(/[^\n]*github\.event\.issue\.number[^\n]*/g) ?? [];
  expect(uses.length).toBeGreaterThan(0);
  for (const line of uses)
    expect(line).toContain('inputs.issue_number || github.event.issue.number');
});

it('isolates the commands the agent runs', () => {
  expect(String(fix.env?.CLAUDE_CODE_SUBPROCESS_ENV_SCRUB)).toBe('1');
  const isolation = fix.steps.findIndex((step) =>
    step.run?.includes('install -y --no-install-recommends bubblewrap'),
  );
  const root = fix.steps.findIndex((step) => step.run?.includes('sudo -n true'));
  expect(isolation).toBeGreaterThan(-1);
  expect(isolation).toBeLessThan(root);
});

it('keeps git credentials out of the agent checkout', () => {
  const checkout = fix.steps.find((step) => step.uses?.startsWith('actions/checkout@'));
  expect(checkout?.with?.['persist-credentials']).toBe(false);
});

it('uses the job token and turns on the action hardening', () => {
  expect(agentStep?.with?.github_token).toBe('${{ github.token }}');
  expect(agentStep?.with?.allowed_non_write_users).toBeTruthy();
  expect(agentStep?.with?.classify_inline_comments).toBe('false');
});

it('keeps file tools inside the project', () => {
  expect(JSON.parse(String(agentStep?.with?.settings ?? '{}'))).toEqual({
    permissions: {
      blockReadsOutsideWorkingDirectories: true,
      blockWritesOutsideWorkingDirectories: true,
    },
  });
});

it('locks the file-tool block in managed settings before the agent starts', () => {
  const lock = fix.steps.findIndex((step) =>
    step.run?.includes('/etc/claude-code/managed-settings.json'),
  );
  const agentIndex = fix.steps.findIndex((step) => step === agentStep);
  const run = fix.steps[lock]?.run ?? '';
  const json = run.match(/echo '(\{.*\})'/)?.[1] ?? '{}';
  expect(JSON.parse(json)).toEqual({
    permissions: {
      blockReadsOutsideWorkingDirectories: true,
      blockWritesOutsideWorkingDirectories: true,
      deny: ['Read(//proc/**)', 'Edit(//proc/**)'],
    },
    allowManagedHooksOnly: true,
    env: { CLAUDE_CODE_SUBPROCESS_ENV_SCRUB: '1' },
  });
  // Written while sudo still works, and checked to be out of the agent's reach.
  expect(run.indexOf('managed-settings.json')).toBeLessThan(run.indexOf('/etc/sudoers.d'));
  expect(run).toContain('[ -w /etc/claude-code/managed-settings.json ]');
  expect(run).toContain('| sudo tee /etc/claude-code/managed-settings.json');
  expect(lock).toBeGreaterThan(-1);
  expect(lock).toBeLessThan(agentIndex);
});

it('allows no tool that writes outside the project or to GitHub', () => {
  const args = String(agentStep?.with?.claude_args ?? '');
  const allowed = args.match(/--allowedTools "([^"]*)"/)?.[1].split(',') ?? [];
  expect(allowed.length).toBeGreaterThan(0);
  for (const tool of allowed) {
    // A bare file tool has no path limit; push, commit and MCP tools write to GitHub.
    expect(tool).toMatch(/^Bash\(/);
    expect(tool).not.toMatch(/git (push|commit|add|switch|checkout|remote|config)|gh |curl|mcp__/);
  }
  expect(args).not.toMatch(/--dangerously|bypassPermissions/);
  // Settings files in the checkout (git ignores .claude/) are not loaded.
  expect(args).toMatch(/^--setting-sources user$/m);
});

it('restores no cache into the agent job', () => {
  expect(fix.steps.filter((step) => step.uses?.startsWith('actions/cache'))).toEqual([]);
});

it('removes root access before the agent starts', () => {
  const rootStep = fix.steps.findIndex((step) => step.run?.includes('sudo -n true'));
  expect(fix.steps[rootStep]?.run).toContain('[ -w /var/run/docker.sock ]');
  const agentIndex = fix.steps.findIndex((step) => step === agentStep);
  expect(rootStep).toBeGreaterThan(-1);
  expect(rootStep).toBeLessThan(agentIndex);
});

it('runs no project code in a job that can write', () => {
  for (const [name, job] of Object.entries(workflow.jobs)) {
    const writes = Object.values(job.permissions ?? {}).includes('write');
    if (!writes) continue;
    for (const step of job.steps) {
      // Scripts in .github/scripts come from main, like this workflow; the rest is project code.
      expect({ job: name, run: step.run ?? '' }).not.toEqual(
        expect.objectContaining({ run: expect.stringMatching(/\b(yarn|npx|npm|node|jest)\b/) }),
      );
    }
  }
});

it('publishes only through the patch check', () => {
  const runs = workflow.jobs.publish.steps.map((step) => step.run ?? '').join('\n');
  expect(runs).toContain('.github/scripts/apply-agent-patch.sh');
  expect(runs).toContain('.github/scripts/find-tokens.sh');
  expect(runs.indexOf('apply-agent-patch.sh')).toBeLessThan(runs.indexOf('git push'));
});

it('pins the agent action to a commit', () => {
  expect(agentStep?.uses).toMatch(/@[0-9a-f]{40}( |$)/);
});

it('hands the patch to publish under one name for all attempts', () => {
  const name = 'agent-output-${{ inputs.issue_number || github.event.issue.number }}';
  const upload = fix.steps.find((step) => step.with?.name === name);
  const download = workflow.jobs.publish.steps.find((step) =>
    step.uses?.startsWith('actions/download-artifact@'),
  );
  expect(upload?.with?.overwrite).toBe(true);
  expect(download?.with?.name).toBe(name);
});

it('fails the transcript scan when the scanner is missing', () => {
  const scan = fix.steps.find((step) => step.run?.includes('find-tokens.sh'));
  expect(scan?.run).toContain('[ -n "$scanner" ]');
  expect(scan?.run).not.toMatch(/git show[^\n]*\|\s*bash/);
});

// A tag can move to other code; a commit can't. Dependabot keeps the pins fresh.
it('pins every action to a commit', () => {
  const dir = join(__dirname, '../../.github/workflows');
  const uses = readdirSync(dir)
    .filter((name) => name.endsWith('.yml'))
    .flatMap((name) => readFileSync(join(dir, name), 'utf8').match(/^\s*-?\s*uses:\s*\S+/gm) ?? []);
  expect(uses.length).toBeGreaterThan(0);
  for (const line of uses) expect(line).toMatch(/@[0-9a-f]{40}$/);
});

it('runs an exact eas-cli version with the Expo token', () => {
  const ship = readFileSync(join(__dirname, '../../.eas/workflows/ship-main.yml'), 'utf8');
  const versions = ship.match(/eas-cli@\S+/g) ?? [];
  expect(versions.length).toBeGreaterThan(0);
  for (const version of versions) expect(version).toMatch(/^eas-cli@\d+\.\d+\.\d+$/);
});

it('lets the agent workflow start CI', () => {
  expect(read('ci.yml').on).toHaveProperty('workflow_dispatch');
});

// PR code (installs, fingerprint) runs in a read-only job; the job that comments runs main's
// script only.
describe('native-fingerprint.yml', () => {
  const fingerprint = read('native-fingerprint.yml');
  const runs = (job: Job) => job.steps.map((step) => step.run ?? '').join('\n');

  it('gives write access only to the comment job', () => {
    expect(fingerprint.permissions).toEqual({});
    expect(fingerprint.jobs.fingerprint.permissions).toEqual({ contents: 'read' });
    expect(fingerprint.jobs.comment.permissions).toEqual({
      contents: 'read',
      'pull-requests': 'write',
    });
  });

  it('runs no PR code in the comment job', () => {
    const { steps } = fingerprint.jobs.comment;
    const checkouts = steps.filter((step) => step.uses?.startsWith('actions/checkout@'));
    expect(checkouts.length).toBeGreaterThan(0);
    for (const checkout of checkouts) expect(checkout.with?.ref).toBe('${{ github.base_ref }}');
    const download = steps.find((step) => step.uses?.startsWith('actions/download-artifact@'));
    expect(String(download?.with?.path)).toMatch(/^\$\{\{ runner\.temp \}\}/);
    const run = runs(fingerprint.jobs.comment);
    expect(run).toContain('node .github/scripts/native-fingerprint-comment.mjs');
    expect(run).not.toMatch(/\b(yarn|npx|npm)\b/);
  });

  it('keeps git credentials out of the job that runs PR code', () => {
    const checkout = fingerprint.jobs.fingerprint.steps.find((step) =>
      step.uses?.startsWith('actions/checkout@'),
    );
    expect(checkout?.with?.['persist-credentials']).toBe(false);
  });

  it('never turns the PR red from the comment job', () => {
    const build = fingerprint.jobs.comment.steps.find((step) =>
      step.run?.includes('native-fingerprint-comment.mjs'),
    );
    expect(build?.['continue-on-error']).toBe(true);
  });
});

// Jobs that run untrusted code (the agent, a PR's install) restore no cache: another run could
// have saved code into it.
it.each([
  ['agent-fix.yml', 'fix'],
  ['native-fingerprint.yml', 'fingerprint'],
])('%s %s restores no cache', (file, job) => {
  const { steps } = read(file).jobs[job];
  expect(steps.filter((step) => step.uses?.startsWith('actions/cache'))).toEqual([]);
  const setupNode = steps.filter((step) => step.uses?.startsWith('actions/setup-node@'));
  expect(setupNode.length).toBeGreaterThan(0);
  for (const step of setupNode) {
    expect(step.with?.cache).toBeUndefined();
    expect(step.with?.['package-manager-cache']).toBe(false);
  }
});
