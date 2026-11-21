import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { ArtistTint } from '@/utils/artistTint';

const GLOW_HEIGHT = 320;

/**
 * A soft wash of the artist's color behind the top of a screen, under the status bar too.
 * Place it first inside the screen's container, so the content draws on top.
 */
export default function ArtistGlow({ tint }: { tint: ArtistTint }) {
  return (
    <Svg style={styles.glow} pointerEvents="none" testID="artist-glow">
      <Defs>
        <LinearGradient id="artistGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={tint.accent} stopOpacity={tint.glowOpacity} />
          <Stop offset="1" stopColor={tint.accent} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#artistGlow)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: GLOW_HEIGHT },
});
