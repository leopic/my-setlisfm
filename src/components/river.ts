import { Space } from '@/utils/spacing';
import { Type } from '@/utils/typography';

// The concert timeline ("river"): each entry starts with its date line, and the 9 pt dot on
// the spine sits level with that line.
export const RIVER_ENTRY_PADDING = Space.s12;
export const RIVER_DOT_SIZE = 9;
export const RIVER_DOT_TOP = RIVER_ENTRY_PADDING + (Type.footnote.lineHeight - RIVER_DOT_SIZE) / 2;
