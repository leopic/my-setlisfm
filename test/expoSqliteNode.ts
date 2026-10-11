// Backs expo-sqlite with Node's built-in SQLite, in memory, so integration
// tests run the app's real schema and queries without a simulator. Covers the
// slice of the async API the app uses.
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

type Params = SQLInputValue[];

function normalizeParams(params: unknown[]): Params {
  // expo-sqlite accepts both spread params and a single array.
  const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  return flat.map((p) =>
    p === undefined ? null : typeof p === 'boolean' ? Number(p) : p,
  ) as Params;
}

export class NodeSQLiteDatabase {
  readonly db = new DatabaseSync(':memory:');

  async execAsync(source: string) {
    this.db.exec(source);
  }

  async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
    return this.db.prepare(source).all(...normalizeParams(params)) as T[];
  }

  async getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null> {
    return (this.db.prepare(source).get(...normalizeParams(params)) as T | undefined) ?? null;
  }

  async runAsync(source: string, ...params: unknown[]) {
    const result = this.db.prepare(source).run(...normalizeParams(params));
    return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
  }

  async closeAsync() {
    this.db.close();
  }
}

let current: NodeSQLiteDatabase | null = null;

// One database per test file, created lazily by the app's own initialize().
export async function openDatabaseAsync() {
  current ??= new NodeSQLiteDatabase();
  return current;
}

export function getTestDatabase() {
  if (!current) throw new Error('Database not opened yet');
  return current.db;
}
