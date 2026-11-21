import { useEffect, useState } from 'react';
import { dbOperations } from '@/database/operations';
import { storeArtistPhotoColor, subscribeArtistPhotoColor } from '@/services/artistColorService';
import { getArtistImageUri } from '@/services/artistImageService';
import { artistTint, type ArtistTint } from '@/utils/artistTint';
import { useChronicleColors } from '@/utils/colors';

/**
 * The artist's photo color for the current theme, or null while it is unknown or the photo has
 * no clear color. Updates when the color is found while the screen is open.
 */
export function useArtistTint(mbid: string | undefined): ArtistTint | null {
  const colors = useChronicleColors();
  // Kept with its mbid, so another artist's color never shows while the new one loads.
  const [stored, setStored] = useState<{ mbid: string; color: string } | null>(null);

  useEffect(() => {
    if (!mbid) return;
    let cancelled = false;
    let asked = false;
    const load = () =>
      dbOperations
        .getArtistImageColor(mbid)
        .then(async (color) => {
          if (cancelled) return;
          // '' (no clear color) is kept too, so it replaces a color shown before.
          if (color !== null) setStored({ mbid, color });
          else if (!asked) {
            // Not found yet, and this screen may show no photo that would find it: ask once.
            asked = true;
            const imageUrl = await getArtistImageUri(mbid);
            if (imageUrl) await storeArtistPhotoColor(mbid, imageUrl);
          }
        })
        .catch(() => {}); // no tint is fine
    load();
    const unsubscribe = subscribeArtistPhotoColor((changed) => {
      if (changed === mbid) load();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [mbid]);

  const color = stored && stored.mbid === mbid ? stored.color : null;
  return color ? artistTint(color, colors) : null;
}
