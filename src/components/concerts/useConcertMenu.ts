import { useTranslation } from 'react-i18next';
import type { RowMenuAction } from '@/components/ui/RowLink';

/**
 * The long-press menu of a concert row: open its artist or its venue. Each opens in its own
 * tab, as the list screens there open their setlists in that tab.
 */
export function useConcertMenu() {
  const { t } = useTranslation();
  return ({ artistMbid, venueId }: { artistMbid?: string | null; venueId?: string | null }) => {
    const actions: RowMenuAction[] = [];
    if (artistMbid) {
      actions.push({
        label: t('concerts.openArtist'),
        icon: 'music.mic',
        href: { pathname: '/(artists)/concerts', params: { artist: artistMbid } },
      });
    }
    if (venueId) {
      actions.push({
        label: t('concerts.openVenue'),
        icon: 'mappin.and.ellipse',
        href: { pathname: '/(venues)/concerts', params: { venue: venueId } },
      });
    }
    return actions;
  };
}
