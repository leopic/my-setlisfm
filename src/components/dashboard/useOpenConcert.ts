import { useRouter, type Href } from 'expo-router';

/** The dashboard's setlist screen, for a row that opens it through a Link (RowLink). */
export const concertHref = (setlistId: string): Href => ({
  pathname: '/(home)/concert/[id]',
  params: { id: setlistId },
});

export function useOpenConcert() {
  const router = useRouter();
  return (setlistId: string) => router.push(concertHref(setlistId));
}
