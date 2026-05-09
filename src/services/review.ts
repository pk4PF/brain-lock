import { useStore } from '../store/useStore';
import { track, Events } from './analytics';

/**
 * Shows the native App Store review prompt once per install.
 * Called after onboarding completes (in letsgo screen).
 */
export async function maybeShowReviewPrompt() {
  try {
    const state = useStore.getState();
    if (state.reviewPromptShownAt) {
      if (__DEV__) console.log('[Review] already shown, skipping');
      return;
    }

    // Use require inside try/catch - dynamic import() is synchronous in RN/Metro
    // and will throw at call time if the native module isn't in the build
    let StoreReview: typeof import('expo-store-review');
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      StoreReview = require('expo-store-review');
    } catch {
      if (__DEV__) console.log('[Review] expo-store-review native module not available');
      return;
    }

    const available = await StoreReview.isAvailableAsync();
    if (!available) {
      if (__DEV__) console.log('[Review] not available');
      return;
    }

    const hasAction = await StoreReview.hasAction();
    if (!hasAction) {
      if (__DEV__) console.log('[Review] hasAction false');
      return;
    }

    await StoreReview.requestReview();
    useStore.getState().markReviewPromptShown();
    track(Events.ReviewPromptShown);
    if (__DEV__) console.log('[Review] prompt shown');
  } catch (err) {
    if (__DEV__) console.warn('[Review] failed:', err);
  }
}
