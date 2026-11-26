import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getArtistImageUri } from '@/services/artistImageService';
import { storeArtistPhotoColor } from '@/services/artistColorService';
import { useChronicleColors } from '@/utils/colors';
import { Radius } from '@/utils/radius';
import { PhotoSize, type PhotoSizeName } from '@/utils/photoSize';

interface ArtistImageProps {
  mbid: string;
  size?: PhotoSizeName;
  name?: string;
  /** Pre-loaded URL from a DB query — skips the async lookup entirely. */
  imageUrl?: string | null;
}

export default function ArtistImage({
  mbid,
  size: sizeName = 'row',
  name,
  imageUrl: preloaded,
}: ArtistImageProps) {
  const colors = useChronicleColors();
  const size = PhotoSize[sizeName];

  // Only treat a string as pre-resolved: '' = tried, no image; 'https://...' = valid URL.
  // undefined and null both mean "not yet fetched" — resolve lazily via getArtistImageUri.
  const hasPreloaded = typeof preloaded === 'string';
  const [fetchedUri, setFetchedUri] = useState<string | null>(null);
  const [fetchedLoaded, setFetchedLoaded] = useState(false);

  // Derive display values from prop directly so prop changes are reflected without setState in effect.
  const imageUri = hasPreloaded ? preloaded || null : fetchedUri;
  const loaded = hasPreloaded || fetchedLoaded;

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: Radius.full,
      backgroundColor: colors.surfaceRaised,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: size,
      height: size,
    },
  });

  useEffect(() => {
    if (hasPreloaded) return;
    let cancelled = false;
    getArtistImageUri(mbid).then((uri) => {
      if (!cancelled) {
        setFetchedUri(uri);
        setFetchedLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mbid, hasPreloaded]);

  // Find the photo's color in the background, for screens tinted by the artist.
  useEffect(() => {
    if (imageUri) storeArtistPhotoColor(mbid, imageUri);
  }, [mbid, imageUri]);

  return (
    <View
      testID="artist-photo"
      style={styles.container}
      accessibilityRole={imageUri ? 'image' : undefined}
      accessibilityLabel={name ?? undefined}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="disk"
        />
      ) : loaded ? (
        <Ionicons name="person" size={size * 0.5} color={colors.textMuted} />
      ) : null}
    </View>
  );
}
