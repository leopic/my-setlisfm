import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * The current time, refreshed every minute and when the app comes back to the front, so a
 * screen that stays open doesn't keep saying "just now".
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, 60 * 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);
  return now;
}
