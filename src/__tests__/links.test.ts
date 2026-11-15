import { Linking } from 'react-native';
import { isWebUrl, openWebUrl } from '@/utils/links';

// The unit project runs without React Native; only Linking is used.
jest.mock('react-native', () => ({ Linking: { openURL: jest.fn() } }));

describe('isWebUrl', () => {
  it.each(['https://www.setlist.fm/venue/x.html', 'http://example.com', ' HTTPS://Example.com/a '])(
    'accepts %s',
    (url) => expect(isWebUrl(url)).toBe(true),
  );

  it.each([
    'tel:+491234',
    'sms:123',
    'javascript:alert(1)',
    'chronicles://demo',
    'file:///etc/passwd',
    'https://',
    '',
    null,
    undefined,
  ])('rejects %p', (url) => expect(isWebUrl(url)).toBe(false));
});

describe('openWebUrl', () => {
  beforeEach(() => {
    jest.mocked(Linking.openURL).mockReset().mockResolvedValue(undefined);
  });

  it('opens a web link', () => {
    openWebUrl('https://www.setlist.fm/venue/x.html');
    expect(Linking.openURL).toHaveBeenCalledWith('https://www.setlist.fm/venue/x.html');
  });

  it('ignores any other scheme', () => {
    openWebUrl('tel:+491234');
    expect(Linking.openURL).not.toHaveBeenCalled();
  });
});
