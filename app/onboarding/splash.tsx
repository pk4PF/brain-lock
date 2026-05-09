import { Redirect } from 'expo-router';

// @deprecated - splash removed from the onboarding flow.
// Anything that still navigates here lands on the new entry: screentime.
export default function SplashRedirect() {
  return <Redirect href="/onboarding/screentime" />;
}
