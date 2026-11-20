/**
 * Joins the parts of a place into one line, e.g. "Berlin, Germany". Empty parts are left
 * out, and so is a part that repeats the one before it: Berlin is a city and a state,
 * Singapore a city and a country. Case and accents don't count ("Zurich" = "Zürich").
 */
export function formatPlace(...parts: (string | null | undefined)[]): string {
  const kept: string[] = [];
  for (const part of parts) {
    const name = part?.trim();
    if (!name) continue;
    const previous = kept[kept.length - 1];
    // A fixed locale, so the result doesn't depend on the device language.
    if (previous?.localeCompare(name, 'en', { sensitivity: 'base' }) === 0) continue;
    kept.push(name);
  }
  return kept.join(', ');
}
