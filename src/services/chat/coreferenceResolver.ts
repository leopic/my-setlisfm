// Resolves pronoun/elliptical follow-up references ("them", "that year", "there") against
// remembered ChatContext, using Apple's on-device Foundation Models. This module NEVER
// decides intent — parser.ts's deterministic regex classifier stays the only thing that
// dispatches a question to a query. It only fills in literal artist/year/city/country text
// so the parser can re-match the (substituted) sentence.
//
// Three separate, minimal, single-purpose calls instead of one combined schema — the
// investigation found that combining fields into one schema measurably degrades every
// field's reliability (hallucination and guardrail-rejection rates both regressed when
// city/country were added to the artist/year schema), while keeping each call scoped to
// exactly the fields one real intent group needs held up at the same reliability as the
// original artist/year baseline. Each schema/instructions pair below is copied verbatim
// from the harness configuration that held up under repeated (n=50) testing — see
// fm_test7/8 (artist/year), fm_test11_cityyear (city/year), and fm_test11_country +
// fm_test12 (country) in the investigation. The `intent` field is kept in every schema to
// match that exact tested shape, but its value is intentionally discarded; only the
// entity fields are ever used.
import { apple } from '@react-native-ai/apple';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { ChatContext } from '@/services/chat/types';

const ArtistYearSlots = z.object({
  intent: z.string().describe('short snake_case intent id'),
  artist: z.string().optional(),
  year: z.number().optional(),
});

const CityYearSlots = z.object({
  intent: z.string().describe('short snake_case intent id'),
  city: z.string().optional(),
  year: z.number().optional(),
});

const CountrySlots = z.object({
  intent: z.string().describe('short snake_case intent id'),
  country: z.string().optional(),
});

const ARTIST_YEAR_INSTRUCTIONS =
  'You are a strict information-extraction system for a concert-tracking app. ' +
  'You never answer questions and you never know any facts about the user’s concert history. ' +
  'Your only job is to read the user’s message and extract an intent id plus any entity ' +
  '(artist name, year) that is LITERALLY present in that message’s text. ' +
  'If an entity is not literally mentioned in the message, leave that field null — never guess, ' +
  'invent, or fill in a plausible-sounding value. When resolving "it"/"them"/"that year" style ' +
  'references, only use entities that were explicitly stated earlier in this conversation, never ' +
  'outside knowledge.';

const CITY_YEAR_INSTRUCTIONS =
  'You are a strict information-extraction system for a concert-tracking app. ' +
  'You never answer questions and you never know any facts about the user’s concert history. ' +
  'Your only job is to read the user’s message and extract an intent id plus any entity ' +
  '(city name, year) that is LITERALLY present in that message’s text. ' +
  'If an entity is not literally mentioned in the message, leave that field null — never guess, ' +
  'invent, or fill in a plausible-sounding value. When resolving "it"/"there"/"that year" style ' +
  'references, only use entities that were explicitly stated earlier in this conversation, never ' +
  'outside knowledge.';

const COUNTRY_INSTRUCTIONS =
  'You are a strict information-extraction system for a concert-tracking app. ' +
  'You never answer questions and you never know any facts about the user’s concert history. ' +
  'Your only job is to read the user’s message and extract an intent id plus any entity ' +
  '(country name) that is LITERALLY present in that message’s text. ' +
  'If an entity is not literally mentioned in the message, leave that field null — never guess, ' +
  'invent, or fill in a plausible-sounding value. When resolving "it"/"there" style references, ' +
  'only use entities that were explicitly stated earlier in this conversation, never outside ' +
  'knowledge.';

const ABSENT_STRINGS = new Set(['null', 'none', 'n/a', '']);

function isAbsentString(value?: string): boolean {
  if (!value) return true;
  return ABSENT_STRINGS.has(value.trim().toLowerCase());
}

function isAbsentNumber(value?: number): boolean {
  return value === undefined || value === null || value === 0;
}

export interface ResolvedReferences {
  artist?: string;
  year?: string;
  city?: string;
  country?: string;
  /** Never populated by the on-device model — only deterministic venue resolution sets this. */
  venue?: string;
}

function buildPrompt(text: string, contextParts: string[]): string {
  return `Known context: ${contextParts.join(', ')}.\nUser message: ${text}`;
}

async function resolveArtistYear(
  text: string,
  context: ChatContext,
): Promise<ResolvedReferences | null> {
  const contextParts: string[] = [];
  if (context.artist) contextParts.push(`artist=${context.artist.name}`);
  if (context.year) contextParts.push(`year=${context.year}`);

  try {
    const { object } = await generateObject({
      model: apple(),
      schema: ArtistYearSlots,
      system: ARTIST_YEAR_INSTRUCTIONS,
      prompt: buildPrompt(text, contextParts),
    });
    const artist = isAbsentString(object.artist) ? context.artist?.name : object.artist;
    const year = isAbsentNumber(object.year) ? context.year : String(object.year);
    if (!artist && !year) return null;
    return { artist, year };
  } catch {
    return null;
  }
}

async function resolveCityYear(
  text: string,
  context: ChatContext,
): Promise<ResolvedReferences | null> {
  const contextParts: string[] = [];
  if (context.city) contextParts.push(`city=${context.city.name}`);
  if (context.year) contextParts.push(`year=${context.year}`);

  try {
    const { object } = await generateObject({
      model: apple(),
      schema: CityYearSlots,
      system: CITY_YEAR_INSTRUCTIONS,
      prompt: buildPrompt(text, contextParts),
    });
    const city = isAbsentString(object.city) ? context.city?.name : object.city;
    const year = isAbsentNumber(object.year) ? context.year : String(object.year);
    if (!city && !year) return null;
    return { city, year };
  } catch {
    return null;
  }
}

async function resolveCountry(
  text: string,
  context: ChatContext,
): Promise<ResolvedReferences | null> {
  const contextParts: string[] = [];
  if (context.country) contextParts.push(`country=${context.country.name}`);

  try {
    const { object } = await generateObject({
      model: apple(),
      schema: CountrySlots,
      system: COUNTRY_INSTRUCTIONS,
      prompt: buildPrompt(text, contextParts),
    });
    const country = isAbsentString(object.country) ? context.country?.name : object.country;
    if (!country) return null;
    return { country };
  } catch {
    return null;
  }
}

/**
 * Only ever called when the deterministic parser already failed to match AND we have some
 * remembered context to resolve against. Dispatches to whichever single, minimal call fits
 * the context we're holding — never more than one on-device call per fallback turn. Returns
 * null on unavailability, any generation error (including guardrail refusals), or when
 * nothing could be resolved, so callers degrade to the existing "not understood" response.
 */
export async function resolveReferences(
  text: string,
  context: ChatContext,
): Promise<ResolvedReferences | null> {
  if (!apple.isAvailable()) return null;

  if (context.artist) return resolveArtistYear(text, context);
  if (context.city) return resolveCityYear(text, context);
  if (context.country) return resolveCountry(text, context);
  if (context.year) return resolveArtistYear(text, context);
  return null;
}
