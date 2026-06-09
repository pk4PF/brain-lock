import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

// Prefer EXPO_PUBLIC_* (auto-inlined by Expo at build time, set via EAS env);
// fall back to the older app.config.js `extra` plumbing for local dev.
const apiKey =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ||
  (Constants.expoConfig?.extra?.posthogProjectToken as string | undefined);
// Default to EU - that's where this project's PostHog instance lives.
// Pointing at us.i.posthog.com silently 404s every event (the silent
// killer that hid all our funnel data through builds 1-35).
const host =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ||
  (Constants.expoConfig?.extra?.posthogHost as string | undefined) ||
  'https://eu.i.posthog.com';
const isConfigured = !!apiKey && apiKey !== 'phc_YOUR_KEY_HERE';

// Create client synchronously at module load so PostHogProvider can use it immediately.
// flushAt: 1 means we POST every event individually. Slightly more network
// chatter, but onboarding fires ~17 events and we cannot afford to lose
// them when a tester backgrounds or quits before a 20-event batch fills.
// Once daily volume is high we can raise flushAt back to 5-10.
const posthog: PostHog | null = isConfigured
  ? new PostHog(apiKey!, {
      host,
      captureAppLifecycleEvents: true,
      flushAt: 1,
      flushInterval: 10000,
    })
  : null;

if (__DEV__) {
  if (posthog) {
    console.log('[Analytics] PostHog initialized', { host });
  } else {
    console.warn('[Analytics] PostHog token not configured - analytics disabled');
  }
}

/** Returns the PostHog singleton for use with PostHogProvider */
export function getPostHogClient(): PostHog | null {
  return posthog;
}

/** Kept for backwards compatibility - resolves immediately */
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
    // PostHog person properties are set via a `$set` payload on capture,
    // not via `register` (which only adds super-properties to subsequent
    // events, never to the person profile). Firing `$set` as its own
    // event guarantees the values land on the person record and become
    // available for breakdowns / cohorts.
    posthog?.capture('$set', { $set: properties });
    // Also register as super-properties so future events in this session
    // carry the same values for event-level filtering.
    posthog?.register(properties);
    if (__DEV__) console.log('[Analytics] setPersonProperties', properties);
  } catch (err) {
    if (__DEV__) console.warn('[Analytics] setPersonProperties failed:', err);
  }
}

export function screen(name: string, properties?: Record<string, any>) {
  try {
    posthog?.screen(name, properties);
  } catch (err) {
    if (__DEV__) console.warn('[Analytics] screen failed:', err);
  }
}

// Event name constants - use these to avoid typos
export const Events = {
  // Onboarding
  OnboardingStepViewed: 'onboarding_step_viewed',
  OnboardingCompleted: 'onboarding_completed',
  OnboardingSkipped: 'onboarding_skipped',
  StrugglesSelected: 'struggles_selected',
  AgeSelected: 'age_selected',
  NameEntered: 'name_entered',
  ScreentimeReported: 'screentime_reported',
  ScreentimeSkipped: 'screentime_skipped',
  GoalSelected: 'goal_selected',
  CommitmentLocked: 'commitment_locked',
  PaywallSkipped: 'paywall_skipped',
  ReferralSourceSelected: 'referral_source_selected',
  DemoGameSkipped: 'demo_game_skipped',

  // Earn
  EarnCategoryOpened: 'earn_category_opened',
  GameStarted: 'game_started',
  GameCompleted: 'game_completed',
  PushupStarted: 'pushup_started',
  PushupCompleted: 'pushup_completed',
  SquatStarted: 'squat_started',
  SquatCompleted: 'squat_completed',

  // Review
  ReviewPrompted: 'review_prompted',

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
