import { StyleSheet } from 'react-native';
import { Space } from '@/utils/spacing';

// The A–Z strip's width (LetterIndex). A list that shows it keeps this much room on its right
// (letterIndexRoom), or the strip would cover the rows' chevrons and counts and take their taps.
export const LETTER_INDEX_WIDTH = Space.s20;
export const letterIndexRoom = StyleSheet.create({
  list: { paddingRight: LETTER_INDEX_WIDTH },
}).list;
