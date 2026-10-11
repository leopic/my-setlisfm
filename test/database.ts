import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { databaseManager } from '@/database/database';
import { getTestDatabase } from './expoSqliteNode';

// The same fixture the Maestro flows seed: 8 shows, 5 artists, 3 countries,
// and a stored username so the onboarding gate opens the tabs.
const SEED_SQL = readFileSync(join(__dirname, '../.maestro/fixtures/seed.sql'), 'utf8');

export async function seedDatabase() {
  // Creates the schema; the root layout's own initialize() is then a no-op.
  await databaseManager.initialize();
  getTestDatabase().exec(SEED_SQL);
}
