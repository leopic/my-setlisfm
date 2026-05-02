import type { Setlist } from '@/types/api';

// Returns a deterministic-ish pick from an array based on a seed value
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function concertQuip(setlists: Setlist[]): string {
  const candidates = setlists.filter((s) => s.artist?.name && s.venue?.city?.name);
  if (!candidates.length) return genericQuip(setlists);
  const s = pick(candidates, candidates.length * 7);
  const artist = s.artist?.name ?? '';
  const city = s.venue?.city?.name ?? '';
  const venue = s.venue?.name;

  const templates = [
    `oh, ${artist} in ${city}? heard that was a good one.`,
    `${artist} in ${city}... that one sounds like it was a night.`,
    venue ? `${artist} at ${venue} in ${city}. not a bad choice.` : `${artist} in ${city}. solid.`,
    `you caught ${artist} live in ${city}? people talk about that show.`,
    `${artist} in ${city} — that took some planning, probably.`,
    `${city} for ${artist}. you clearly have priorities.`,
  ];
  return pick(templates, candidates.length + artist.length);
}

function loyaltyQuip(setlists: Setlist[]): string {
  // Find artist with most appearances in the accumulated list
  const counts = new Map<string, number>();
  for (const s of setlists) {
    const name = s.artist?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const repeated = [...counts.entries()].filter(([, n]) => n >= 2);
  if (!repeated.length) return concertQuip(setlists);

  repeated.sort((a, b) => b[1] - a[1]);
  const [artist, count] = repeated[0];

  const templates = [
    `you saw ${artist} ${count} times. they must be doing something right.`,
    `${artist} keeps showing up in here. clearly they keep delivering.`,
    `${count} times with ${artist}. some people just know what they like.`,
    `${artist}, again and again. loyal.`,
  ];
  return pick(templates, count + artist.length);
}

function geoQuip(setlists: Setlist[]): string {
  const countries = new Set(setlists.map((s) => s.venue?.city?.country?.name).filter(Boolean));
  const cities = setlists.map((s) => s.venue?.city?.name).filter(Boolean);
  const uniqueCities = new Set(cities);

  if (countries.size >= 3) {
    const templates = [
      `concerts across ${countries.size} countries so far. this is serious.`,
      `${countries.size} countries already and we're still loading. you travel for this.`,
      `you've spread this across ${countries.size} countries. this is a lifestyle.`,
    ];
    return pick(templates, countries.size);
  }

  if (uniqueCities.size >= 5) {
    const templates = [
      `${uniqueCities.size} cities in the archive. you get around.`,
      `concerts in ${uniqueCities.size} different cities. no hometown comfort zone here.`,
    ];
    return pick(templates, uniqueCities.size);
  }

  return concertQuip(setlists);
}

function historyQuip(setlists: Setlist[]): string {
  const dates = setlists.map((s) => s.eventDate).filter(Boolean) as string[];
  if (!dates.length) return concertQuip(setlists);

  // eventDate format from API: "DD-MM-YYYY"
  const years = dates.map((d) => d.split('-')[2]).filter(Boolean);
  const earliest = years.reduce((a, b) => (a < b ? a : b));
  const total = setlists.length;

  const templates = [
    `this goes all the way back to ${earliest}. that's a proper archive.`,
    `${earliest}. the beginning of something, apparently.`,
    `${total} concerts so far, and we started in ${earliest}. you've been at this a while.`,
    `tracing back to ${earliest}. that's a long story you've got.`,
  ];
  return pick(templates, total + parseInt(earliest, 10));
}

function genericQuip(setlists: Setlist[]): string {
  const count = setlists.length;
  return count > 0
    ? `${count} concerts loaded so far. this is taking shape.`
    : `getting your data together...`;
}

/**
 * Generates a personalized quip based on setlists seen so far.
 * quipIndex cycles through four strategies: concert → loyalty → geography → history.
 */
export function generateSyncQuip(setlists: Setlist[], quipIndex: number): string {
  if (!setlists.length) return genericQuip(setlists);
  switch (quipIndex % 4) {
    case 0:
      return concertQuip(setlists);
    case 1:
      return loyaltyQuip(setlists);
    case 2:
      return geoQuip(setlists);
    case 3:
      return historyQuip(setlists);
    default:
      return concertQuip(setlists);
  }
}
