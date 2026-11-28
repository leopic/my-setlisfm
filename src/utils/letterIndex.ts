/**
 * The letter a name files under in a list sorted by name: its first letter without accents
 * ("Ásgeir" under A), or '#' for a digit, a sign or no name at all.
 */
export function letterOf(name: string | null | undefined): string {
  // One character: 'ß'.toUpperCase() is 'SS'.
  const first = (name ?? '').trim().normalize('NFD').charAt(0).toUpperCase().charAt(0);
  const letter = BASE_LETTER[first] ?? first;
  return /[A-Z]/.test(letter) ? letter : '#';
}

// Letters NFD leaves alone, filed where localeCompare sorts them: "Øzil" between O and P.
const BASE_LETTER: Record<string, string> = {
  Æ: 'A',
  Đ: 'D',
  Ł: 'L',
  Ø: 'O',
  Œ: 'O',
  Þ: 'T',
};

/**
 * The letter under a finger y points below the strip's top. The letters fill the strip between
 * its top and bottom padding, one equal slot each; above or below them, the first or last letter.
 */
export function letterAt(
  y: number,
  strip: { height: number; padding: number },
  letters: readonly string[],
): string | undefined {
  const inner = strip.height - 2 * strip.padding;
  if (inner <= 0) return undefined;
  const at = Math.floor(((y - strip.padding) / inner) * letters.length);
  return letters[Math.min(letters.length - 1, Math.max(0, at))];
}

/**
 * The letters of a list sorted by name, in list order, each with the index of its first row.
 * List order, not A to Z: localeCompare puts digits and signs ('#') first.
 */
export function buildLetterIndex<T>(
  items: readonly T[],
  nameOf: (item: T) => string | null | undefined,
): { letters: string[]; firstIndex: Map<string, number> } {
  const firstIndex = new Map<string, number>();
  items.forEach((item, index) => {
    const letter = letterOf(nameOf(item));
    if (!firstIndex.has(letter)) firstIndex.set(letter, index);
  });
  return { letters: [...firstIndex.keys()], firstIndex };
}
