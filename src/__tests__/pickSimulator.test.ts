import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The Maestro scripts seed and test the simulator pick-simulator.sh picks. With two booted
// (an iPhone and an iPad) the seed used to take the first one, so it could land on the
// wrong simulator. These run the real scripts with a fake xcrun, sqlite3 and maestro.
const SCRIPTS = join(__dirname, '../../.maestro/scripts');

type Simulator = { udid: string; name: string; state?: string; hasApp: boolean };

let home: string;
beforeEach(() => (home = mkdtempSync(join(tmpdir(), 'pick-simulator-'))));
afterEach(() => rmSync(home, { recursive: true, force: true }));

const dbPath = (udid: string) =>
  join(home, 'Library/Developer/CoreSimulator/Devices', udid, 'data/SQLite/setlistfm.db');

function fakeTool(bin: string, name: string, body: string) {
  writeFileSync(join(bin, name), `#!/bin/bash\n${body}\n`);
  chmodSync(join(bin, name), 0o755);
}

// xcrun lists the simulators (the real one filters by state itself, the script must too);
// sqlite3 and maestro write down where they were sent.
function run(script: string, simulators: Simulator[], env: Record<string, string> = {}) {
  const bin = join(home, 'bin');
  mkdirSync(bin, { recursive: true });
  const devices = simulators.map(({ state = 'Booted', ...s }) => ({ ...s, state }));
  const json = JSON.stringify({ devices: { 'iOS 26': devices } });
  fakeTool(bin, 'xcrun', `[ "$2" = list ] && echo '${json}'; exit 0`);
  fakeTool(bin, 'sqlite3', 'cat >/dev/null; echo "$1" >> "$HOME/sqlite.log"');
  fakeTool(bin, 'maestro', 'echo "$*" >> "$HOME/maestro.log"');
  for (const sim of simulators.filter((s) => s.hasApp)) {
    mkdirSync(join(dbPath(sim.udid), '..'), { recursive: true });
    writeFileSync(dbPath(sim.udid), '');
  }
  // The test's own environment, minus any SIMULATOR_UDID from the shell running it.
  const base: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    HOME: home,
  };
  delete base.SIMULATOR_UDID;
  const result = spawnSync('bash', [join(SCRIPTS, script)], {
    encoding: 'utf8',
    env: { ...base, ...env },
  });
  const log = (name: string) =>
    existsSync(join(home, name)) ? readFileSync(join(home, name), 'utf8').trim().split('\n') : [];
  return {
    status: result.status,
    out: result.stdout.trim(),
    err: result.stderr,
    sqlite: log('sqlite.log'),
    maestro: log('maestro.log'),
  };
}

const iphone = { udid: 'IPHONE-1', name: 'iPhone 17', hasApp: true };
const ipad = { udid: 'IPAD-1', name: 'iPad Air', hasApp: true };

describe('pick-simulator.sh', () => {
  it('picks the one booted simulator with the app', () => {
    const picked = run('pick-simulator.sh', [{ ...ipad, hasApp: false }, iphone]);
    expect(picked).toMatchObject({ status: 0, out: 'IPHONE-1' });
  });

  it('leaves out a simulator that is not booted', () => {
    const picked = run('pick-simulator.sh', [{ ...ipad, state: 'Shutdown' }, iphone]);
    expect(picked).toMatchObject({ status: 0, out: 'IPHONE-1' });
  });

  it('stops and lists the simulators when several have the app', () => {
    const { status, out, err } = run('pick-simulator.sh', [ipad, iphone]);
    expect(status).toBe(1);
    expect(out).toBe('');
    expect(err).toContain('IPAD-1 iPad Air');
    expect(err).toContain('IPHONE-1 iPhone 17');
    expect(err).toContain('SIMULATOR_UDID=');
  });

  it('takes SIMULATOR_UDID when set', () => {
    const picked = run('pick-simulator.sh', [ipad, iphone], { SIMULATOR_UDID: 'IPHONE-1' });
    expect(picked).toMatchObject({ status: 0, out: 'IPHONE-1' });
  });

  it('says so when SIMULATOR_UDID has no app', () => {
    const { status, err } = run('pick-simulator.sh', [iphone], { SIMULATOR_UDID: 'TYPO' });
    expect(status).toBe(1);
    expect(err).toContain('SIMULATOR_UDID=TYPO has no app database');
  });

  it('stops when no booted simulator has the app', () => {
    const { status, err } = run('pick-simulator.sh', [{ ...iphone, hasApp: false }]);
    expect(status).toBe(1);
    expect(err).toContain('no booted simulator');
  });
});

describe('the scripts that use it', () => {
  it('seeds the picked simulator, not the first booted one', () => {
    const seeded = run('seed-db.sh', [ipad, iphone], { SIMULATOR_UDID: 'IPHONE-1' });
    expect(seeded.status).toBe(0);
    expect(seeded.sqlite.length).toBeGreaterThan(0);
    expect(new Set(seeded.sqlite)).toEqual(new Set([dbPath('IPHONE-1')]));
  });

  it('seeds nothing when it cannot tell which simulator', () => {
    const seeded = run('seed-db.sh', [ipad, iphone]);
    expect(seeded.status).toBe(1);
    expect(seeded.sqlite).toEqual([]);
  });

  it.each([
    ['run-seeded.sh', '--exclude-tags=empty-state'],
    ['run-empty.sh', '--include-tags=empty-state'],
  ])('%s seeds and tests the same simulator', (script, tags) => {
    const { status, sqlite, maestro } = run(script, [ipad, iphone], { SIMULATOR_UDID: 'IPHONE-1' });
    expect(status).toBe(0);
    expect(new Set(sqlite)).toEqual(new Set([dbPath('IPHONE-1')]));
    expect(maestro).toHaveLength(1);
    expect(maestro[0]).toMatch(new RegExp(`^--device IPHONE-1 test .*${tags}$`));
  });
});
