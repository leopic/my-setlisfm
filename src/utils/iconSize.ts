import { Type } from './typography';

// An icon next to text takes that text's size, as SF Symbols do on iOS. Pick the text style
// the icon sits with: the tape badge with footnote text, the search field with body text.
// `feature` is the big icon that stands alone above an empty state.
export const IconSize = {
  footnote: Type.footnote.fontSize,
  subheadline: Type.subheadline.fontSize,
  body: Type.body.fontSize,
  title3: Type.title3.fontSize,
  title1: Type.title1.fontSize,
  largeTitle: Type.largeTitle.fontSize,
  feature: 52,
} as const;
