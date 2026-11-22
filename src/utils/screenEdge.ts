// The left and right margin iOS gives a screen's content (its layout margins): 16 pt on most
// iPhones, 20 pt on the wide ones (Plus, Max) and on iPad. Native bars (the large title, the
// search field) use the same margin, so content that follows it lines up with them.
// No react-native import here: the unit tests check this rule.
const WIDE_SCREEN = 414;

export const edgeForWidth = (width: number): 16 | 20 => (width >= WIDE_SCREEN ? 20 : 16);
