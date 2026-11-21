// How much of the background covers the hero photo, top to bottom, as gradient stops. The photo
// shows most behind the status bar and the artist name; from the venue line down (about 45% of
// the hero) it is nearly covered, as the small date text there is only 3:1 on a plain
// background. The back link sits on its own pill over the photo (BackButton `onPhoto`), so only
// the large artist name reads on the veil: at 0.6 it keeps 6:1 on the light theme even over a
// black photo.
const VEIL_TOP = { light: 0.6, dark: 0.72 };
const VEIL_TEXT = 0.95;

export function heroVeil(scheme: 'light' | 'dark'): { offset: number; opacity: number }[] {
  return [
    { offset: 0, opacity: VEIL_TOP[scheme] },
    { offset: 0.3, opacity: VEIL_TOP[scheme] },
    { offset: 0.45, opacity: VEIL_TEXT },
    { offset: 1, opacity: 1 },
  ];
}
