import { buildLetterIndex, letterAt, letterOf } from '@/utils/letterIndex';

it('files a name under its first letter, without accents', () => {
  expect(letterOf('Radiohead')).toBe('R');
  expect(letterOf('arctic Monkeys')).toBe('A');
  expect(letterOf('Ásgeir')).toBe('A');
  expect(letterOf('  Zebrahead')).toBe('Z');
});

// localeCompare sorts these with their base letter, so the strip files them there too.
it('files letters with a stroke or a ligature under their base letter', () => {
  expect(letterOf('Øzil')).toBe('O');
  expect(letterOf('Łukasz')).toBe('L');
  expect(letterOf('Æon')).toBe('A');
  expect(letterOf('ßeta')).toBe('S');
});

it("files a digit, a sign or no name under '#'", () => {
  expect(letterOf('2 Minutos')).toBe('#');
  expect(letterOf('!!!')).toBe('#');
  expect(letterOf('')).toBe('#');
  expect(letterOf(null)).toBe('#');
  expect(letterOf(undefined)).toBe('#');
});

it('lists the letters in list order, each with its first row', () => {
  const names = ['2 Minutos', 'A Perfect Circle', 'AFI', 'Bad Religion', 'Ásgeir'];
  const { letters, firstIndex } = buildLetterIndex(names, (name) => name);
  expect(letters).toEqual(['#', 'A', 'B']);
  expect([...firstIndex]).toEqual([
    ['#', 0],
    ['A', 1],
    ['B', 3],
  ]);
});

it('finds the letter under the finger, one equal slot each between the paddings', () => {
  const strip = { height: 116, padding: 8 }; // 4 letters, 25 pt each
  const letters = ['A', 'C', 'M', 'O'];
  expect(letterAt(8, strip, letters)).toBe('A');
  expect(letterAt(32, strip, letters)).toBe('A');
  expect(letterAt(33, strip, letters)).toBe('C');
  expect(letterAt(60, strip, letters)).toBe('M');
  expect(letterAt(107, strip, letters)).toBe('O');
  // Above or below the letters: the first or the last.
  expect(letterAt(-40, strip, letters)).toBe('A');
  expect(letterAt(400, strip, letters)).toBe('O');
  // Not laid out yet.
  expect(letterAt(10, { height: 0, padding: 8 }, letters)).toBeUndefined();
});
