import { useRef, useState, type RefObject } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { LegendListRef } from '@legendapp/list/react-native';
import { buildLetterIndex, letterAt } from '@/utils/letterIndex';
import { useChronicleColors } from '@/utils/colors';
import { Haptic } from '@/utils/haptics';
import { Space, TAB_BAR_PADDING } from '@/utils/spacing';
import { Type } from '@/utils/typography';
import { LETTER_INDEX_WIDTH as WIDTH } from './letterIndexRoom';

const PADDING = Space.s8;

// LegendList aims a row under the header as it stands at the list's top, with the large title
// open (see useListTop). Once the title is shut, the row would end up this much lower, under the
// rows of the letter before. Measured on iOS 26 (iPhone 17 Pro).
const LARGE_TITLE_HEIGHT = 66;

type Props = {
  // In list order; see buildLetterIndex.
  letters: string[];
  onSelect: (letter: string) => void;
};

/**
 * The A–Z strip on the right of a list sorted by name, like the Music app's library and
 * Contacts: a tap or a drag along it jumps to the first row of the letter under the finger, with
 * a tick on each new letter. Lay it over the list, as the last child of the list's container.
 * VoiceOver reads it as one adjustable control: swipe up or down to step through the letters.
 */
export default function LetterIndex({ letters, onSelect }: Props) {
  const { t } = useTranslation();
  const colors = useChronicleColors();
  const insets = useSafeAreaInsets();
  const height = useRef(0);
  const last = useRef<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  const select = (letter: string) => {
    if (letter === last.current) return;
    last.current = letter;
    setCurrent(letter);
    Haptic.selection();
    onSelect(letter);
  };

  const selectAt = (event: GestureResponderEvent) => {
    // The letters take no touches, so the strip is the touch's view and locationY is measured
    // from its top, for the whole drag.
    const strip = { height: height.current, padding: PADDING };
    const letter = letterAt(event.nativeEvent.locationY, strip, letters);
    if (letter) select(letter);
  };

  // VoiceOver hears the first letter before any pick, so the first step goes to the second. A
  // letter a search took away counts as before the first.
  const shown = current ?? letters[0];
  const step = (by: 1 | -1) => {
    const at = letters.indexOf(shown) + by;
    const letter = letters[Math.min(letters.length - 1, Math.max(0, at))];
    if (letter) select(letter);
  };

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { paddingTop: insets.top + Space.s64 }]}>
      <View
        testID="letter-index"
        style={styles.strip}
        // The letters are narrow: the finger may land a little to their left.
        hitSlop={{ left: Space.s8 }}
        onLayout={(event) => {
          height.current = event.nativeEvent.layout.height;
        }}
        // The strip takes the touch from its first move, so a drag along it never scrolls the list.
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={selectAt}
        onResponderMove={selectAt}
        onResponderRelease={() => {
          last.current = null;
        }}
        onResponderTerminate={() => {
          last.current = null;
        }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('common.letterIndex')}
        accessibilityValue={{ text: shown }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          last.current = null;
          step(event.nativeEvent.actionName === 'increment' ? 1 : -1);
        }}
      >
        <View pointerEvents="none" style={styles.letters}>
          {letters.map((letter) => (
            // A fixed size: 26 letters at a large text size would not fit the screen.
            <Text
              key={letter}
              allowFontScaling={false}
              style={[styles.letter, { color: colors.accent }]}
            >
              {letter}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

type ListProps<T> = {
  list: RefObject<LegendListRef | null>;
  // The list's rows, sorted by name.
  items: readonly T[];
  nameOf: (item: T) => string | null | undefined;
  // Where the list rests at its top (useListTop's top): below 0 under a native large title.
  top?: RefObject<number>;
};

/** LetterIndex for a LegendList sorted by name: a letter jumps to its first row. */
export function ListLetterIndex<T>({ list, items, nameOf, top }: ListProps<T>) {
  const secondJump = useRef<number | null>(null);
  const { letters, firstIndex } = buildLetterIndex(items, nameOf);
  // One letter has nowhere to jump to.
  if (letters.length < 2) return null;
  return (
    <LetterIndex
      letters={letters}
      onSelect={(letter) => {
        const index = firstIndex.get(letter);
        if (index === undefined) return;
        const underLargeTitle = (top?.current ?? 0) < 0;
        const jump = () =>
          list.current?.scrollToIndex({
            index,
            animated: false,
            viewOffset: underLargeTitle ? -LARGE_TITLE_HEIGHT : 0,
          });
        jump();
        // A jump with the title open shuts it, and iOS moves the list as it does: jump again
        // from there. A drag past a letter within the frame drops that letter's second jump.
        if (secondJump.current !== null) cancelAnimationFrame(secondJump.current);
        secondJump.current = underLargeTitle ? requestAnimationFrame(jump) : null;
      }}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingBottom: TAB_BAR_PADDING,
  },
  strip: {
    width: WIDTH,
    paddingVertical: PADDING,
  },
  letters: {
    alignItems: 'center',
  },
  letter: {
    ...Type.captionStrong,
  },
});
