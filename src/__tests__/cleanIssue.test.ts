import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

// The bug report the agent reads (agent-fix.yml): hidden text goes, visible text stays.
const FILTER = join(__dirname, '../../.github/scripts/clean-issue.jq');

type Cleaned = {
  number: number;
  labels: string[];
  title: string;
  body: string;
  body_truncated: boolean;
};

function clean(issue: { title: string; body: string | null }): Cleaned {
  const input = JSON.stringify({ number: 7, labels: [{ name: 'bug' }], user: {}, ...issue });
  return JSON.parse(execFileSync('jq', ['-f', FILTER], { input, encoding: 'utf8' }));
}

it('keeps visible text, including code with angle brackets', () => {
  const body = [
    '```tsx',
    'const list: Array<string> = [];',
    '<Text>hi</Text>',
    'if (a < b && c > d) {}',
    '    at <anonymous>',
    '```',
  ].join('\n');
  expect(clean({ title: 'Crash', body }).body).toBe(body);
});

it('removes HTML comments, also an unclosed one', () => {
  expect(clean({ title: 'T', body: 'A<!-- hidden -->B' }).body).toBe('AB');
  expect(clean({ title: 'T', body: 'A\n<!-- hidden to the end\nmore' }).body).toBe('A\n');
});

it('removes markdown comment lines', () => {
  expect(clean({ title: 'T', body: 'A\n[//]: # (hidden)\nB' }).body).toBe('A\n\nB');
});

it('removes invisible characters from the body and the title', () => {
  const invisible = '​‮ ️ㅤ\u{E0041}\u{E0100}­';
  const result = clean({ title: `Cr${invisible}ash`, body: `B${invisible}ody` });
  expect(result.title).toBe('Crash');
  expect(result.body).toBe('Body');
});

it('cuts long text and says so', () => {
  const result = clean({ title: 'x'.repeat(300), body: 'y'.repeat(4001) });
  expect(result.title).toHaveLength(200);
  expect(result.body).toHaveLength(4000);
  expect(result.body_truncated).toBe(true);
  expect(clean({ title: 'T', body: 'short' }).body_truncated).toBe(false);
});

it('keeps the number and label names, and handles an empty body', () => {
  expect(clean({ title: 'T', body: null })).toEqual({
    number: 7,
    labels: ['bug'],
    title: 'T',
    body: '',
    body_truncated: false,
  });
});
