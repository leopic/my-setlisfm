import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getArtistImageUri } from '../services/artistImageService';
import { useColors } from '../utils/colors';

interface ArtistImageProps {
  mbid: string;
  size?: number;
  name?: string;
}

export default function ArtistImage({ mbid, size = 48, name }: ArtistImageProps) {
  const colors = useColors();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.backgroundPill,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        image: {
          width: size,
          height: size,
        },
      }),
    [colors, size],
  );

  useEffect(() => {
    let cancelled = false;
    getArtistImageUri(mbid).then((uri) => {
      if (!cancelled) {
        setImageUri(uri);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mbid]);

  return (
    <View
      style={styles.container}
      accessibilityRole={imageUri ? 'image' : undefined}
      accessibilityLabel={name ? name : undefined}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
      ) : loaded ? (
        <Ionicons name="person" size={size * 0.5} color={colors.textMuted} />
      ) : null}
    </View>
  );
}
