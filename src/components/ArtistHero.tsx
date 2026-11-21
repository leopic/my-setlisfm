import { useEffect, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { getArtistImageUri } from '@/services/artistImageService';
import { useChronicleColors } from '@/utils/colors';
import { deezerPhotoUrl } from '@/utils/deezerPhoto';
import { heroVeil } from '@/utils/heroVeil';

export const HERO_HEIGHT = 280;
// Nearly the 1179 px a phone needs at 3×, without the full 1900 px original; the blur and the
// veil hide the small upscale.
const HERO_PHOTO_SIZE = 1000;

/** The large photo URL for the hero, or null while it loads or for an artist without a photo. */
export function useArtistHeroPhoto(mbid: string | undefined): string | null {
  // Kept with its mbid, so another artist's photo never shows while the new one loads.
  const [photo, setPhoto] = useState<{ mbid: string; url: string } | null>(null);

  useEffect(() => {
    if (!mbid) return;
    let cancelled = false;
    getArtistImageUri(mbid)
      .then((url) => {
        if (!cancelled && url) setPhoto({ mbid, url: deezerPhotoUrl(url, HERO_PHOTO_SIZE) });
      })
      .catch(() => {}); // no photo is fine
    return () => {
      cancelled = true;
    };
  }, [mbid]);

  return photo && photo.mbid === mbid ? photo.url : null;
}

/**
 * The artist's photo behind the top of a screen, under a veil of the background color that
 * thickens towards the bottom, so the text on it stays readable and the photo fades into the
 * screen. Place it first inside the screen's container, so the content draws on top.
 */
export default function ArtistHero({ photoUrl }: { photoUrl: string }) {
  const colors = useChronicleColors();
  const veil = heroVeil(useColorScheme() === 'dark' ? 'dark' : 'light');

  return (
    <View
      style={styles.hero}
      pointerEvents="none"
      testID="artist-hero"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={{ uri: photoUrl }}
        testID="artist-hero-photo"
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top"
        cachePolicy="disk"
        transition={300}
        blurRadius={3}
      />
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="heroVeil" x1="0" y1="0" x2="0" y2="1">
            {veil.map(({ offset, opacity }) => (
              <Stop
                key={offset}
                offset={offset}
                stopColor={colors.background}
                stopOpacity={opacity}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#heroVeil)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT },
});
