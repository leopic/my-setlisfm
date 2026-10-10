import { createContext, use } from 'react';

// The root layout owns the onboarding gate (Stack.Protected guards keyed on
// whether a username is stored). Screens flip the gate through this context
// rather than navigating, because a router.replace into a still-protected
// route is rejected.
interface OnboardingContextValue {
  completeOnboarding: () => void;
  restartOnboarding: () => void;
}

export const OnboardingContext = createContext<OnboardingContextValue>({
  completeOnboarding: () => {},
  restartOnboarding: () => {},
});

export function useOnboardingContext() {
  return use(OnboardingContext);
}
