import { Redirect } from 'expo-router';

// @deprecated - removed from the onboarding flow per user request:
// "get rid of this for the second appearance" - explanatory content lives
// on `howitworks` (currency) and `inside` (visual mockups). Stale links
// bounce silently to the next live screen.
export default function PrincipleRedirect() {
  return <Redirect href="/onboarding/inside" />;
}
