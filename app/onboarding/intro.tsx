// This screen is no longer in the main onboarding flow.
// Redirect any stale navigation here to the aha screen.
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function IntroRedirect() {
    useEffect(() => {
        router.replace('/onboarding/aha');
    }, []);
    return null;
}
