<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into BrainLock. Here's a summary of all changes made:

**Infrastructure:**
- Created `app.config.js` (replacing static `app.json`) so PostHog credentials are injected via `process.env.POSTHOG_PROJECT_TOKEN` / `process.env.POSTHOG_HOST` at build time using Expo's `extra` config
- Created `.env` with `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` (covered by `.gitignore`)
- Refactored `src/services/analytics.ts` to read credentials from `Constants.expoConfig.extra` and create the PostHog client **synchronously** at module load time
- Added `PostHogProvider` wrapping the app in `app/_layout.tsx` with autocapture (touch events) and manual screen tracking via `usePathname` + `useGlobalSearchParams`

**New events instrumented:**

| Event | Description | File |
|---|---|---|
| `game_started` | User selects difficulty and begins a brain game | `app/games/math.tsx` |
| `game_completed` | Brain game session ends (score, correct count, difficulty, credits earned) | `app/games/math.tsx` |
| `auth_requested` | User taps to enable Screen Time permission | `app/(tabs)/lock.tsx` |
| `apps_selected` | User finishes selecting apps in iOS app picker | `app/(tabs)/lock.tsx` |
| `schedule_set` | User activates a blocking schedule (start hour, end hour, days) | `app/(tabs)/lock.tsx` |
| `schedule_disabled` | User disables the blocking schedule | `app/(tabs)/lock.tsx` |
| `unlock_attempted` | User taps the unlock button in the lock tab | `app/(tabs)/lock.tsx` |
| `unlock_attempted` | User taps the home hero CTA to unlock apps | `app/(tabs)/index.tsx` |

**Previously existing events (already instrumented):**
`name_entered`, `age_selected`, `struggles_selected`, `onboarding_completed`, `earn_category_opened`, `pushup_started`, `pushup_completed`, `squat_started`, `squat_completed`, `paywall_shown`, `paywall_dismissed`, `purchase_started`, `purchase_completed`, `purchase_failed`, `restore_attempted`, `review_prompt_shown`

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://eu.posthog.com/project/166707/dashboard/643936
- **Onboarding Funnel** (name → age → struggles → completed): https://eu.posthog.com/project/166707/insights/K7acFcYx
- **Paywall Conversion Funnel** (shown → started → completed): https://eu.posthog.com/project/166707/insights/jDUAMxkg
- **App Blocking Setup Funnel** (auth → apps selected → schedule set): https://eu.posthog.com/project/166707/insights/bxwOPUQV
- **Game Engagement** (started vs completed daily): https://eu.posthog.com/project/166707/insights/g1sW1Fal
- **Unlock Attempts vs Purchase Completions:** https://eu.posthog.com/project/166707/insights/s0nOZc8G

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
