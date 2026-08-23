/** Formats a positive integer with its ordinal suffix, e.g. 1 -> "1st", 12 -> "12th", 23 -> "23rd". */
export function toOrdinal(n: number): string {
  const remainder100 = n % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${n}th`;

  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
