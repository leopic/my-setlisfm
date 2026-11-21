import { heroVeil } from '@/utils/heroVeil';

describe.each(['light', 'dark'] as const)('the %s theme', (scheme) => {
  const veil = heroVeil(scheme);

  it('lets at least a quarter of the photo show behind the status bar and the name', () => {
    expect(veil[0]).toEqual({ offset: 0, opacity: expect.any(Number) });
    expect(veil[0].opacity).toBeLessThanOrEqual(0.75);
  });

  // The small date text below the venue name is only 3:1 on a plain background.
  it('covers the photo from the venue line down', () => {
    for (const stop of veil.filter(({ offset }) => offset >= 0.45)) {
      expect(stop.opacity).toBeGreaterThanOrEqual(0.95);
    }
  });
});

// The back link sits on a pill there, so only the large artist name reads on the photo.
it('shows more of the photo in light mode than before the back link had its pill', () => {
  expect(heroVeil('light')[0].opacity).toBeLessThanOrEqual(0.6);
});
