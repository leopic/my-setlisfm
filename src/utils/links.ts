import { Linking } from 'react-native';

// Venue URLs come from setlist.fm, not from us. Only web links open: a stored
// `tel:`, `sms:` or app-scheme link would otherwise leave the app unasked.
export function isWebUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^https?:\/\/[^\s/]+/i.test(url.trim());
}

export function openWebUrl(url: string | null | undefined): void {
  if (!isWebUrl(url)) return;
  Linking.openURL(url.trim()).catch((error: unknown) => {
    console.warn('Could not open link:', error);
  });
}
