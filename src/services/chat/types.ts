import type { DBArtist, DBCity, DBCountry, DBVenue } from '@/types/database';

export type EntityKind = 'artist' | 'city' | 'country' | 'venue';

/** Raw slots captured by a regex match, before entity resolution. */
export type RawSlots = Record<string, string>;

/** Entities remembered across turns so follow-up questions can resolve "them"/"that year"/"there". */
export interface ChatContext {
  artist?: { mbid: string; name: string };
  year?: string;
  city?: { id: string; name: string };
  country?: { code: string; name: string };
  venue?: { id: string; name: string };
  /** The last ranking-style answer given, so "which was the next one?" can continue it. */
  lastRanking?: { rankingId: string; excludedKeys: string[] };
}

export interface ChatAnswer {
  type: 'answer';
  text: string;
  /** Updated context for the caller to pass into the next turn's answerQuestion call. */
  context?: ChatContext;
}

export interface ClarificationOption {
  label: string;
  value: string; // the id/mbid/code to resume with once picked
}

export interface ClarificationNeeded {
  type: 'clarification';
  prompt: string;
  options: ClarificationOption[];
  /** Opaque state the caller passes back once the user picks an option. */
  resume: {
    intentId: string;
    slotKey: string;
    rawSlots: RawSlots;
  };
}

export interface NoMatch {
  type: 'no_match';
  text: string;
}

export type ChatResult = ChatAnswer | ClarificationNeeded | NoMatch;

export interface ResolvedEntities {
  artist?: DBArtist;
  artist2?: DBArtist;
  city?: DBCity;
  country?: DBCountry;
  venue?: DBVenue;
}

/**
 * Every intent defines EITHER `handle` (the normal case) OR `rankingId`+`getRanked` (a
 * "top N" style aggregate that supports "which was the next one?" follow-ups) — never
 * neither. Ranking intents skip entitySlots/handle entirely; answerQuestion dispatches
 * to getRanked directly.
 */
export interface ChatIntent {
  id: string;
  /** Each pattern must use named capture groups matching the slot keys it declares. */
  patterns: RegExp[];
  /** Which named capture groups need fuzzy entity resolution, and against which table. */
  entitySlots?: Partial<Record<'artist' | 'artist2' | 'city' | 'country' | 'venue', EntityKind>>;
  handle?: (raw: RawSlots, resolved: ResolvedEntities) => Promise<string>;
  /** Identifies this intent as ranking-style; must be paired with getRanked. */
  rankingId?: string;
  /** Re-runs this ranking excluding already-shown keys; returns null once exhausted. */
  getRanked?: (excludeKeys: string[]) => Promise<{ text: string; key: string } | null>;
  /** Resolves an optional "excluding X" clause captured in raw into ranking-specific keys. */
  resolveNamedExclusion?: (raw: RawSlots) => Promise<string[]>;
}
