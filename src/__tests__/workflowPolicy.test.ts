import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

// The agent's code runs in the `fix` job of agent-fix.yml. These rules keep a hijacked agent
// from pushing, reading the Claude token or reaching a write token. See the comments there.
type Step = {
  name?: string;
  uses?: string;
  run?: string;
  'working-directory'?: string;
  with?: Record<string, string | boolean>;
  env?: Record<string, unknown>;
  'continue-on-error'?: boolean;
};
type Job = {
  if?: string;
  env?: Record<string, unknown>;
  permissions?: Record<string, string>;
  environment?: string;
  uses?: string;
  with?: Record<string, unknown>;
  needs?: string | string[];
  concurrency?: { group?: string; 'cancel-in-progress'?: boolean };
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

it('starts on a label only when Leo adds it', () => {
  for (const name of ['fix', 'pick-up']) {
    const condition = workflow.jobs[name].if ?? '';
    expect(condition).toContain('&& github.event.sender.login == github.repository_owner)');
  }
});

// The Observe intake calls the workflow with the issue it opened; label events need Leo, on his
// own issue or on one the intake opened (one it paused over the daily cap).
it('starts from a call with an issue number, or from Leo labeling his or an intake issue', () => {
  expect(workflow.on.workflow_call).toEqual({
    inputs: { issue_number: { type: 'number', required: true } },
  });
  for (const name of ['fix', 'pick-up']) {
    const condition = (workflow.jobs[name].if ?? '').replace(/\s+/g, ' ').trim();
    expect(condition).toBe(
      "inputs.issue_number || (github.event_name == 'issues' && github.event.label.name == 'fixer:gh' && !github.event.issue.pull_request && (github.event.issue.user.login == github.repository_owner || (github.event.issue.user.login == 'github-actions[bot]' && contains(github.event.issue.labels.*.name, 'source:observe'))) && github.event.sender.login == github.repository_owner)",
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

const workflowsDir = join(__dirname, '../../.github/workflows');
const workflowFiles = readdirSync(workflowsDir).filter((name) => name.endsWith('.yml'));

// A tag can move to other code; a commit can't. Dependabot keeps the pins fresh. A workflow in
// this repo (`./.github/workflows/…`) runs from the same commit, so it needs no pin.
it('pins every action to a commit', () => {
  const uses = workflowFiles.flatMap(
    (name) => readFileSync(join(workflowsDir, name), 'utf8').match(/^\s*-?\s*uses:\s*\S+/gm) ?? [],
  );
  expect(uses.length).toBeGreaterThan(0);
  for (const line of uses) {
    expect(line).toMatch(/(@[0-9a-f]{40}|uses:\s*\.\/\.github\/workflows\/[\w-]+\.yml)$/);
  }
});

it('runs an exact eas-cli version with the Expo token', () => {
  for (const file of [
    '../../.eas/workflows/ship-main.yml',
    '../../.github/workflows/observe-intake.yml',
  ]) {
    const versions = readFileSync(join(__dirname, file), 'utf8').match(/eas-cli@\S+/g) ?? [];
    expect(versions.length).toBeGreaterThan(0);
    for (const version of versions) expect(version).toMatch(/^eas-cli@\d+\.\d+\.\d+$/);
  }
});

// Only the intake may start the agent without Leo's label: it opens the issue from a fixed
// template and applies the guards.
it('lets only the Observe intake call the agent workflow', () => {
  const callers = workflowFiles.filter((name) =>
    /uses:\s*\.\/\.github\/workflows\/agent-fix\.yml/.test(
      readFileSync(join(workflowsDir, name), 'utf8'),
    ),
  );
  expect(callers).toEqual(['observe-intake.yml']);
});

it('lets the agent workflow start CI', () => {
  expect(read('ci.yml').on).toHaveProperty('workflow_dispatch');
});

// Only the change is scanned, so the step needs main's history and must block on warnings.
it('blocks on new React Doctor issues in the required CI job', () => {
  const steps = read('ci.yml').jobs.check.steps;
  const checkout = steps.find((step) => step.uses?.startsWith('actions/checkout@'));
  expect(checkout?.with?.['fetch-depth']).toBe(0);
  const doctor = steps.find((step) => step.run?.startsWith('yarn react-doctor '));
  for (const flag of ['--scope changed', '--base origin/main', '--blocking warning', '--no-score'])
    expect(doctor?.run).toContain(flag);
  expect(doctor?.['continue-on-error']).toBeUndefined();
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

describe('observe-intake.yml', () => {
  const intakeWorkflow = read('observe-intake.yml');
  const intake = intakeWorkflow.jobs.intake;
  const fixCall = intakeWorkflow.jobs.fix;
  const steps = intake.steps;

  it('starts only by hand or by dispatch, with no default permissions', () => {
    expect(Object.keys(intakeWorkflow.on)).toEqual(['workflow_dispatch']);
    expect(intakeWorkflow.permissions).toEqual({});
  });

  it('gives the Expo token job only issue writes, in the main-only environment', () => {
    expect(intake.permissions).toEqual({ contents: 'read', issues: 'write' });
    expect(intake.environment).toBe('observe');
  });

  it('runs one intake at a time, so the guards cannot race', () => {
    expect(intake.concurrency).toEqual({ group: 'observe-intake', 'cancel-in-progress': false });
  });

  it('gives the Expo token to the fetch step only', () => {
    expect(JSON.stringify(intake.env)).not.toContain('secrets.');
    expect(JSON.stringify(intake.env)).not.toContain('github.token');
    const withSecrets = steps.filter((step) => JSON.stringify(step).includes('secrets.'));
    expect(withSecrets.map((step) => step.name)).toEqual(['Fetch the error group']);
    expect(withSecrets[0].env).toEqual({ EXPO_TOKEN: '${{ secrets.EXPO_TOKEN }}' });
  });

  // eas-cli comes from npm with unlocked dependencies: it must not see a token that writes.
  it('gives the GitHub token only to the step that opens the issue', () => {
    const withToken = steps.filter((step) => JSON.stringify(step).includes('github.token'));
    expect(withToken.map((step) => step.name)).toEqual(['Open the issue']);
  });

  it('runs no project code next to the Expo token', () => {
    for (const step of steps.filter((step) => step.run)) {
      expect(step['working-directory']).toBe('${{ runner.temp }}');
    }
    for (const step of steps) {
      expect(step.run ?? '').not.toMatch(/\b(yarn|npm (ci|install)|corepack)\b/);
      if (step.uses?.startsWith('actions/checkout@')) {
        expect(step.with?.['persist-credentials']).toBe(false);
      }
      if (step.uses?.startsWith('actions/setup-node@')) {
        expect(step.with?.['package-manager-cache']).toBe(false);
      }
      expect(step.uses ?? '').not.toMatch(/^actions\/cache/);
    }
  });

  it('checks the fingerprint before it uses it', () => {
    const fetch = steps.find((step) => step.name === 'Fetch the error group')?.run ?? '';
    const check = fetch.indexOf('[[ "$FINGERPRINT" =~ ^[A-Za-z0-9_-]{8,128}$ ]]');
    expect(check).toBeGreaterThan(-1);
    expect(check).toBeLessThan(fetch.indexOf('eas observe:errors'));
    // Only through env: an expression inside a script would put the text in the shell code.
    expect(intake.env?.FINGERPRINT).toBe('${{ inputs.fingerprint }}');
    for (const step of steps) expect(step.run ?? '').not.toContain('${{');
  });

  it('starts the agent only when the intake says so, on the issue it opened', () => {
    expect(fixCall.needs).toBe('intake');
    expect(fixCall.if).toBe("needs.intake.outputs.start == 'true'");
    expect(fixCall.uses).toBe('./.github/workflows/agent-fix.yml');
    expect(fixCall.with).toEqual({ issue_number: '${{ fromJSON(needs.intake.outputs.issue) }}' });
  });
});

// An unpinned install script can change under us. The zip is pinned to a version and checked
// against a SHA-256 before it is unpacked.
it('installs Maestro only from a pinned version with a checksum check', () => {
  const text = readFileSync(join(workflowsDir, 'e2e.yml'), 'utf8');
  const step = read('e2e.yml').jobs.maestro?.steps.find((s) => s.name === 'Install Maestro');
  expect(step).toBeDefined();
  expect(String(step?.env?.MAESTRO_VERSION)).toMatch(/^\d+\.\d+\.\d+$/);
  expect(String(step?.env?.MAESTRO_EXPECTED_SHA256)).toMatch(/^[0-9a-f]{64}$/);
  expect(step?.run).toMatch(/shasum -a 256 -c/);
  expect(step?.run?.indexOf('shasum')).toBeLessThan(step?.run?.indexOf('unzip') ?? -1);
  expect(text).not.toMatch(/curl[^\n]*\|\s*(ba)?sh/);
});
