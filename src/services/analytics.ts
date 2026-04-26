import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const isConfigured = !!apiKey && apiKey !== 'phc_YOUR_KEY_HERE';

// Create client synchronously at module load so PostHogProvider can use it immediately
const posthog: PostHog | null = isConfigured
  ? new PostHog(apiKey!, {
      host,
      captureAppLifecycleEvents: true,
      flushAt: 20,
      flushInterval: 30000,
    })
  : null;

if (__DEV__) {
  if (posthog) {
    console.log('[Analytics] PostHog initialized');
  } else {
    console.warn('[Analytics] PostHog token not configured — analytics disabled');
  }
}

/** Returns the PostHog singleton for use with PostHogProvider */
export function getPostHogClient(): PostHog | null {
  return posthog;
}

/** Kept for backwards compatibility — resolves immediately */
export async function initAnalytics(): Promise<PostHog | null> {
  return posthog;
}

export function track(event: string, properties?: Record<string, any>) {
  try {
    posthog?.capture(event, properties);
    if (__DEV__) console.log(`[Analytics] ${event}`, properties ?? '');
  } catch (err) {
    if (__DEV__) console.warn('[Analytics] track failed:', err);
  }
}

export function identify(userId: string, properties?: Record<string, any>) {
  try {
    posthog?.identify(userId, properties);
    if (__DEV__) console.log(`[Analytics] identify ${userId}`, properties ?? '');
  } catch (err) {
    if (__DEV__) console.warn('[Analytics] identify failed:', err);
  }
}

export function setPersonProperties(properties: Record<string, any>) {
  try {
    posthog?.register(properties);
    if (__DEV__) console.log('[Analytics] register', properties);
  } catch (err) {
    if (__DEV__) console.warn('[Analytics] register failed:', err);
  }
}

export function screen(name: string, properties?: Record<string, any>) {
  try {
    posthog?.screen(name, properties);
  } catch (err) {
    if (__DEV__) console.warn('[Analytics] screen failed:', err);
  }
}

// Event name constants — use these to avoid typos
export const Events = {
  // Onboarding
  OnboardingStepViewed: 'onboarding_step_viewed',
  OnboardingCompleted: 'onboarding_completed',
  OnboardingSkipped: 'onboarding_skipped',
  StrugglesSelected: 'struggles_selected',
  AgeSelected: 'age_selected',
  NameEntered: 'name_entered',

  // Earn
  EarnCategoryOpened: 'earn_category_opened',
  GameStarted: 'game_started',
  GameCompleted: 'game_completed',
  PushupStarted: 'pushup_started',
  PushupCompleted: 'pushup_completed',
  SquatStarted: 'squat_started',
  SquatCompleted: 'squat_completed',

  // Paywall
  PaywallShown: 'paywall_shown',
  PaywallDismissed: 'paywall_dismissed',
  PurchaseStarted: 'purchase_started',
  PurchaseCompleted: 'purchase_completed',
  PurchaseFailed: 'purchase_failed',
  RestoreAttempted: 'restore_attempted',

  // Unlock
  UnlockAttempted: 'unlock_attempted',
  UnlockExpired: 'unlock_expired',

  // App blocking
  AuthRequested: 'auth_requested',
  AppsSelected: 'apps_selected',
  ScheduleSet: 'schedule_set',
  ScheduleDisabled: 'schedule_disabled',

  // Review
  ReviewPromptShown: 'review_prompt_shown',
} as const;
