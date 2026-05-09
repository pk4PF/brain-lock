import { useEffect } from 'react';
import { track, Events } from '../services/analytics';

/**
 * Fires a single `onboarding_step_viewed` event when an onboarding screen
 * mounts. Pass the canonical step name (matches the route file) so PostHog
 * funnels can be built reliably:
 *
 *   useOnboardingStepView('paywall')
 *
 * Extra props are merged into the event payload - useful for screens that
 * want to attach selected option, plan, etc.
 */
export function useOnboardingStepView(
  step: string,
  extra?: Record<string, any>,
) {
  useEffect(() => {
    track(Events.OnboardingStepViewed, { step, ...extra });
    // Intentionally only fire once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
}
