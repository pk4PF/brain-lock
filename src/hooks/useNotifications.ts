import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useStore } from '../store/useStore';
import { registerForPushNotifications } from '../services/notifications';
import { track } from '../services/analytics';

/**
 * Hook that registers for push notifications after onboarding is complete.
 *
 * - Requests permission once (won't re-prompt if already granted/denied).
 * - Stores the ExpoPushToken in Zustand so it persists across launches.
 * - Tracks the permission result via PostHog for funnel analysis.
 * - Sets up listeners for incoming notifications and tap responses.
 *
 * Call this once in the root layout.
 */
export function useNotifications() {
  const onboardingComplete = useStore((s) => s.onboardingComplete);
  const existingToken = useStore((s) => s.expoPushToken);
  const setExpoPushToken = useStore((s) => s.setExpoPushToken);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Don't prompt during onboarding - wait until they're in the app.
    if (!onboardingComplete) return;

    // Register for push notifications (will only prompt if undetermined).
    registerForPushNotifications().then((token) => {
      if (token && token !== existingToken) {
        setExpoPushToken(token);
        track('push_token_registered', { token });
      }
    });

    // Listener: notification received while app is foregrounded.
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        track('push_notification_received', {
          title: notification.request.content.title,
          foreground: true,
        });
      });

    // Listener: user tapped a notification (from background or killed state).
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        track('push_notification_tapped', {
          title: response.notification.request.content.title,
        });
        // TODO: deep-link handling based on notification data.
        // const data = response.notification.request.content.data;
        // if (data?.screen) router.push(data.screen);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [onboardingComplete]);
}
