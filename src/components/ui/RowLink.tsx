import { cloneElement, useState, type ReactElement } from 'react';
import { StyleSheet, type PressableProps } from 'react-native';
import { Link, type Href } from 'expo-router';

type Props = {
  /** Where the row goes. Without one (the iPad, which opens a side pane) the row renders as is. */
  href?: Href;
  /** The row: a Pressable that does not navigate itself. */
  children: ReactElement<PressableProps>;
};

/**
 * Opens a row's screen through a Link, so a long press on iOS peeks at that screen first.
 * The Link answers the tap: the row inside must not navigate in its own onPress as well,
 * or the screen opens twice (Link's Slot calls both handlers).
 */
export default function RowLink({ href, children }: Props) {
  const [pressed, setPressed] = useState(false);
  if (!href) return children;

  // Link's Slot merges styles as `{ ...linkStyle, ...rowStyle }`: a Pressable's style function
  // spreads to nothing and the row loses its whole style. So resolve it here, flat (Slot also
  // throws on a style array), with the pressed state the Pressable would have passed.
  const { style } = children.props;
  const row = cloneElement(children, {
    style: StyleSheet.flatten(typeof style === 'function' ? style({ pressed }) : style),
    onPressIn: () => setPressed(true),
    onPressOut: () => setPressed(false),
  });
  return (
    <Link href={href} asChild>
      <Link.Trigger>{row}</Link.Trigger>
      <Link.Preview />
    </Link>
  );
}
