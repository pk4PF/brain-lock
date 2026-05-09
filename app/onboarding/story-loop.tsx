import { Redirect } from 'expo-router';

// @deprecated - story arc removed. Stale links redirect to the entry.
export default function StoryLoopRedirect() {
  return <Redirect href="/onboarding/screentime" />;
}
