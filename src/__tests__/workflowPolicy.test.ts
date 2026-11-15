import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

// The agent's code runs in the `fix` job of agent-fix.yml. These rules keep a hijacked agent
// from pushing, reading the Claude token or reaching a write token. See the comments there.
type Step = { uses?: string; run?: string; with?: Record<string, string | boolean> };
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
  expect(fix.permissions).toEqual({ contents: 'read' });
  expect(fix.environment).toBe('agent');
});

it('starts only on issues Leo opened and labeled', () => {
  for (const name of ['fix', 'pick-up']) {
    const condition = workflow.jobs[name].if ?? '';
    expect(condition).toContain('github.event.issue.user.login == github.repository_owner');
    expect(condition).toContain('github.event.sender.login == github.repository_owner');
  }
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
  const upload = fix.steps.find((step) => step.with?.name === 'agent-output');
  const download = workflow.jobs.publish.steps.find((step) =>
    step.uses?.startsWith('actions/download-artifact@'),
  );
  expect(upload?.with?.overwrite).toBe(true);
  expect(download?.with?.name).toBe('agent-output');
});

it('fails the transcript scan when the scanner is missing', () => {
  const scan = fix.steps.find((step) => step.run?.includes('find-tokens.sh'));
  expect(scan?.run).toContain('[ -n "$scanner" ]');
  expect(scan?.run).not.toMatch(/git show[^\n]*\|\s*bash/);
});

it('lets the agent workflow start CI', () => {
  expect(read('ci.yml').on).toHaveProperty('workflow_dispatch');
});
