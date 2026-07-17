// Fuzzy name resolution for the chat query parser.
// No LLM involved — plain string-similarity matching against tables already in the DB.
import { databaseManager } from '@/database/database';
import type { DBArtist, DBVenue, DBCity, DBCountry } from '@/types/database';

export interface EntityMatch<T> {
  record: T;
  score: number; // 0..1, 1 = exact match
  label: string; // display label, includes disambiguation when present
}

const MIN_SCORE = 0.5;
const MAX_CANDIDATES = 5;
const AMBIGUITY_MARGIN = 0.08;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics (e.g. "México" → "mexico")
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/** Levenshtein edit distance between two strings. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Normalized similarity in [0, 1], boosted when one string contains the other. */
function similarity(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;

  const distance = levenshtein(q, c);
  const maxLen = Math.max(q.length, c.length);
  let score = 1 - distance / maxLen;

  if (c.includes(q) || q.includes(c)) {
    score = Math.max(score, 0.85);
  }
  if (c.startsWith(q) || q.startsWith(c)) {
    score = Math.max(score, 0.9);
  }
  return score;
}

function scoreCandidates<T>(
  rows: T[],
  query: string,
  getNames: (row: T) => string[],
  getLabel: (row: T) => string,
): EntityMatch<T>[] {
  return rows
    .map((row) => {
      const best = Math.max(0, ...getNames(row).map((n) => similarity(query, n)));
      return { record: row, score: best, label: getLabel(row) };
    })
    .filter((m) => m.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);
}

/** True when the top candidates are close enough that picking one silently would be a guess. */
export function isAmbiguous<T>(matches: EntityMatch<T>[]): boolean {
  if (matches.length < 2) return false;
  return matches[0].score - matches[1].score < AMBIGUITY_MARGIN;
}

function labelWithDisambiguation(name: string, disambiguation?: string): string {
  return disambiguation ? `${name} (${disambiguation})` : name;
}

export async function findArtists(query: string): Promise<EntityMatch<DBArtist>[]> {
  const db = databaseManager.getDatabase();
  const rows = await db.getAllAsync<DBArtist>('SELECT * FROM artists');
  return scoreCandidates(
    rows,
    query,
    (a) => [a.name, a.sortName].filter((v): v is string => !!v),
    (a) => labelWithDisambiguation(a.name ?? '', a.disambiguation),
  );
}

export async function findVenues(query: string): Promise<EntityMatch<DBVenue>[]> {
  const db = databaseManager.getDatabase();
  const rows = await db.getAllAsync<DBVenue>('SELECT * FROM venues');
  return scoreCandidates(
    rows,
    query,
    (v) => [v.name].filter((n): n is string => !!n),
    (v) => v.name ?? '',
  );
}

export async function findCities(query: string): Promise<EntityMatch<DBCity>[]> {
  const db = databaseManager.getDatabase();
  const rows = await db.getAllAsync<DBCity>('SELECT * FROM cities');
  return scoreCandidates(
    rows,
    query,
    (c) => [c.name].filter((n): n is string => !!n),
    (c) => (c.state ? `${c.name}, ${c.state}` : (c.name ?? '')),
  );
}

export async function findCountries(query: string): Promise<EntityMatch<DBCountry>[]> {
  const db = databaseManager.getDatabase();
  const rows = await db.getAllAsync<DBCountry>('SELECT * FROM countries');
  return scoreCandidates(
    rows,
    query,
    (c) => [c.name].filter((n): n is string => !!n),
    (c) => c.name ?? '',
  );
}

// ── By-id lookups (used to resolve a clarification choice back to a record) ──

export async function getCityById(id: string): Promise<DBCity | null> {
  const db = databaseManager.getDatabase();
  return db.getFirstAsync<DBCity>('SELECT * FROM cities WHERE id = ?', [id]);
}

export async function getCountryByCode(code: string): Promise<DBCountry | null> {
  const db = databaseManager.getDatabase();
  return db.getFirstAsync<DBCountry>('SELECT * FROM countries WHERE code = ?', [code]);
}
