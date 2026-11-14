import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEMO_DATA_SQL } from '@/demo/demoData';

// The app's demo data is a copy of the Maestro fixture, so demos and E2E runs show
// the same concerts. Update both together.
it('matches the Maestro fixture', () => {
  const fixture = readFileSync(join(__dirname, '../../.maestro/fixtures/seed.sql'), 'utf8');
  expect(DEMO_DATA_SQL).toBe(fixture);
});
