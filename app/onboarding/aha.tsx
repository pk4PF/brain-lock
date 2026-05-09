import { Redirect } from 'expo-router';

// @deprecated - removed from the onboarding flow. Stale links land at the
// new entry point (screentime) rather than 404.
export default function AhaRedirect() {
  return <Redirect href="/onboarding/screentime" />;
}
