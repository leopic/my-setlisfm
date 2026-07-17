// Main entry point for the chat feature: matches free text to a Tier 1 intent,
// resolves any entity slots via fuzzy matching, and either answers, asks for
// clarification, or reports that nothing matched. No network calls, no LLM.
//
// Follow-up fallback: when nothing matches AND we have remembered context from a
// previous turn, references like "them"/"that year"/"there" and single-field overrides
// ("what about in 2021?", "how about Metallica instead?") are resolved deterministically
// first — direct substitution from remembered context, or a fuzzy DB lookup against
// whichever entity kinds the context is already anchored to, reusing the same
// resolver/ambiguity logic as normal intent dispatch. An on-device model
// (coreferenceResolver) is only tried afterwards, for phrasing the deterministic patterns
// don't recognize. Either way, the result is substituted back into the original sentence
// and re-matched through the SAME deterministic classifier below — nothing but this
// module's own regex patterns ever decides intent.
import i18n from '@/i18n';
import { dbOperations } from '@/database/operations';
import {
  findArtists,
  findCities,
  findCountries,
  isAmbiguous,
  getCityById,
  getCountryByCode,
  type EntityMatch,
} from '@/services/chat/entityResolver';
import { CHAT_INTENTS } from '@/services/chat/intents';
import { resolveReferences, type ResolvedReferences } from '@/services/chat/coreferenceResolver';
import type {
  ChatContext,
  ChatIntent,
  ChatResult,
  EntityKind,
  RawSlots,
  ResolvedEntities,
} from '@/services/chat/types';

type EntitySlotKey = 'artist' | 'artist2' | 'city' | 'country';

function normalizeInput(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function matchIntent(text: string): { intent: ChatIntent; raw: RawSlots } | null {
  for (const intent of CHAT_INTENTS) {
    for (const pattern of intent.patterns) {
      const match = text.match(pattern);
      if (match) {
        return { intent, raw: (match.groups ?? {}) as RawSlots };
      }
    }
  }
  return null;
}

/** Replaces reference words with resolved literal text, preserving the message's original shape. */
function substituteReferences(text: string, resolved: ResolvedReferences): string {
  let result = text;
  if (resolved.artist) {
    result = result.replace(/\b(?:them|it)\b/gi, resolved.artist);
  }
  const place = resolved.city ?? resolved.country;
  if (place) {
    result = result.replace(/\bthere\b/gi, `in ${place}`);
  }
  if (resolved.year) {
    result = result.replace(/\b(?:that|this|the same) year\b/gi, `in ${resolved.year}`);
  }
  return result;
}

/** Canonical phrasings to try when substitution alone doesn't land on a known pattern. */
function canonicalFallbacks(resolved: ResolvedReferences): string[] {
  const fallbacks: string[] = [];
  if (resolved.artist && resolved.year) {
    fallbacks.push(`did i see ${resolved.artist} in ${resolved.year}`);
  }
  if (resolved.city && resolved.year) {
    fallbacks.push(`how many bands have i seen in ${resolved.city} in ${resolved.year}`);
  }
  if (resolved.country) {
    fallbacks.push(`how many shows have i seen in ${resolved.country}`);
  }
  return fallbacks;
}

const PRONOUN_PATTERN = /\b(?:them|it|there|(?:that|this|the same) year)\b/i;
const YEAR_OVERRIDE_PATTERN = /^(?:what|how) about (?:in )?(?<year>\d{4})(?: instead)?\??$/i;
const VALUE_OVERRIDE_PATTERN = /^(?:what|how) about (?<value>.+?)(?: instead)?\??$/i;

/** Remembered context values as-is — the trivial, always-correct pronoun carry-over case. */
function contextAsResolved(context: ChatContext): ResolvedReferences {
  return {
    artist: context.artist?.name,
    year: context.year,
    city: context.city?.name,
    country: context.country?.name,
  };
}

/**
 * Fuzzy-matches a bare override value ("Metallica", "Argentina") against whichever
 * entity kinds the context is already anchored to, reusing the same resolver and
 * ambiguity threshold as normal intent dispatch. Only an unambiguous single match
 * counts as a resolution — a genuinely ambiguous value just falls through to the next
 * anchored kind, or ultimately to the on-device model as a last resort, rather than
 * surfacing its own clarification prompt.
 */
async function resolveOverrideValue(
  value: string,
  context: ChatContext,
): Promise<ResolvedReferences | null> {
  const anchoredKinds: EntityKind[] = [];
  if (context.artist) anchoredKinds.push('artist');
  if (context.city) anchoredKinds.push('city');
  if (context.country) anchoredKinds.push('country');

  for (const kind of anchoredKinds) {
    const candidates = await findByKind(kind, value);
    if (candidates.length === 0 || isAmbiguous(candidates)) continue;

    const resolved = contextAsResolved(context);
    const name = (candidates[0].record as { name?: string }).name ?? value;
    if (kind === 'artist') resolved.artist = name;
    if (kind === 'city') resolved.city = name;
    if (kind === 'country') resolved.country = name;
    return resolved;
  }
  return null;
}

/** Deterministic follow-up resolution: pronoun carry-over and single-field overrides, no model involved. */
async function resolveFollowUpDeterministically(
  text: string,
  context: ChatContext,
): Promise<ResolvedReferences | null> {
  if (PRONOUN_PATTERN.test(text)) {
    return contextAsResolved(context);
  }

  const yearMatch = text.match(YEAR_OVERRIDE_PATTERN);
  if (yearMatch?.groups?.year) {
    return { ...contextAsResolved(context), year: yearMatch.groups.year };
  }

  const valueMatch = text.match(VALUE_OVERRIDE_PATTERN);
  if (valueMatch?.groups?.value) {
    return resolveOverrideValue(valueMatch.groups.value.trim(), context);
  }

  return null;
}

/** Attempts the follow-up fallback when the deterministic parser found no match. */
async function resolveFollowUp(
  text: string,
  context: ChatContext,
): Promise<{ intent: ChatIntent; raw: RawSlots } | null> {
  const hasContext = Boolean(context.artist || context.year || context.city || context.country);
  if (!hasContext) return null;

  const resolved =
    (await resolveFollowUpDeterministically(text, context)) ??
    (await resolveReferences(text, context));
  if (!resolved) return null;

  const substituted = substituteReferences(text, resolved);
  const bySubstitution = matchIntent(substituted);
  if (bySubstitution) return bySubstitution;

  for (const fallback of canonicalFallbacks(resolved)) {
    const match = matchIntent(fallback);
    if (match) return match;
  }
  return null;
}

function mergeContext(
  previous: ChatContext,
  raw: RawSlots,
  resolved: ResolvedEntities,
): ChatContext {
  const next: ChatContext = { ...previous };
  if (resolved.artist) {
    next.artist = { mbid: resolved.artist.mbid, name: resolved.artist.name ?? '' };
  }
  if (resolved.city) {
    next.city = { id: resolved.city.id, name: resolved.city.name ?? '' };
  }
  if (resolved.country) {
    next.country = { code: resolved.country.code, name: resolved.country.name ?? '' };
  }
  if (raw.year) next.year = raw.year;
  return next;
}

async function findByKind(kind: EntityKind, query: string): Promise<EntityMatch<unknown>[]> {
  switch (kind) {
    case 'artist':
      return findArtists(query);
    case 'city':
      return findCities(query);
    case 'country':
      return findCountries(query);
  }
}

async function lookupById(kind: EntityKind, id: string): Promise<unknown | null> {
  switch (kind) {
    case 'artist':
      return dbOperations.getArtistByMbid(id);
    case 'city':
      return getCityById(id);
    case 'country':
      return getCountryByCode(id);
  }
}

function entityId(kind: EntityKind, record: unknown): string {
  if (kind === 'artist') return (record as { mbid: string }).mbid;
  if (kind === 'city') return (record as { id: string }).id;
  return (record as { code: string }).code;
}

function setResolvedEntity(
  resolved: ResolvedEntities,
  slotKey: EntitySlotKey,
  record: unknown,
): void {
  if (slotKey === 'artist' || slotKey === 'artist2') {
    resolved[slotKey] = record as ResolvedEntities['artist'];
  } else if (slotKey === 'city') {
    resolved.city = record as ResolvedEntities['city'];
  } else {
    resolved.country = record as ResolvedEntities['country'];
  }
}

/** Resolves every entity slot an intent declares, in order; short-circuits on the first ambiguity or miss. */
async function resolveEntitySlots(
  intent: ChatIntent,
  raw: RawSlots,
  skipKey?: EntitySlotKey,
): Promise<ChatResult | { resolved: ResolvedEntities }> {
  const resolved: ResolvedEntities = {};
  const entitySlots = intent.entitySlots ?? {};

  for (const slotKey of Object.keys(entitySlots) as EntitySlotKey[]) {
    if (slotKey === skipKey) continue;
    const kind = entitySlots[slotKey];
    if (!kind) continue;
    const rawValue = raw[slotKey];
    if (!rawValue) continue;

    const candidates = await findByKind(kind, rawValue);
    if (candidates.length === 0) {
      return { type: 'no_match', text: i18n.t(`chat.noMatch.${kind}`, { query: rawValue }) };
    }
    if (isAmbiguous(candidates)) {
      return {
        type: 'clarification',
        prompt: i18n.t(`chat.clarify.${kind}`),
        options: candidates.map((c) => ({ label: c.label, value: entityId(kind, c.record) })),
        resume: { intentId: intent.id, slotKey, rawSlots: raw },
      };
    }
    setResolvedEntity(resolved, slotKey, candidates[0].record);
  }

  return { resolved };
}

export async function answerQuestion(
  input: string,
  context: ChatContext = {},
): Promise<ChatResult> {
  const text = normalizeInput(input);
  const matched = matchIntent(text) ?? (await resolveFollowUp(text, context));

  if (!matched) {
    return { type: 'no_match', text: i18n.t('chat.notUnderstood') };
  }

  const { intent, raw } = matched;
  const outcome = await resolveEntitySlots(intent, raw);
  if ('type' in outcome) return outcome;

  const answerText = await intent.handle(raw, outcome.resolved);
  return {
    type: 'answer',
    text: answerText,
    context: mergeContext(context, raw, outcome.resolved),
  };
}

/** Continues a question after the user picked a clarification option. */
export async function resumeWithChoice(
  resume: { intentId: string; slotKey: string; rawSlots: RawSlots },
  chosenValue: string,
  context: ChatContext = {},
): Promise<ChatResult> {
  const intent = CHAT_INTENTS.find((i) => i.id === resume.intentId);
  const entitySlots = intent?.entitySlots ?? {};
  const slotKey = resume.slotKey as EntitySlotKey;
  const kind = entitySlots[slotKey];

  if (!intent || !kind) {
    return { type: 'no_match', text: i18n.t('chat.notUnderstood') };
  }

  const record = await lookupById(kind, chosenValue);
  if (!record) {
    return { type: 'no_match', text: i18n.t('chat.notUnderstood') };
  }

  const outcome = await resolveEntitySlots(intent, resume.rawSlots, slotKey);
  if ('type' in outcome) return outcome;

  setResolvedEntity(outcome.resolved, slotKey, record);
  const answerText = await intent.handle(resume.rawSlots, outcome.resolved);
  return {
    type: 'answer',
    text: answerText,
    context: mergeContext(context, resume.rawSlots, outcome.resolved),
  };
}
