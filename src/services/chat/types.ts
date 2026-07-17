import type { DBArtist, DBCity, DBCountry } from '@/types/database';

export type EntityKind = 'artist' | 'city' | 'country';

/** Raw slots captured by a regex match, before entity resolution. */
export type RawSlots = Record<string, string>;

/** Entities remembered across turns so follow-up questions can resolve "them"/"that year"/"there". */
export interface ChatContext {
  artist?: { mbid: string; name: string };
  year?: string;
  city?: { id: string; name: string };
  country?: { code: string; name: string };
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
}

export interface ChatIntent {
  id: string;
  /** Each pattern must use named capture groups matching the slot keys it declares. */
  patterns: RegExp[];
  /** Which named capture groups need fuzzy entity resolution, and against which table. */
  entitySlots?: Partial<Record<'artist' | 'artist2' | 'city' | 'country', EntityKind>>;
  handle: (raw: RawSlots, resolved: ResolvedEntities) => Promise<string>;
}
