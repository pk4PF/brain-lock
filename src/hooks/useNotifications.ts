import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useStore } from '../store/useStore';
import { registerForPushNotifications } from '../services/notifications';
import { scheduleAll } from '../services/scheduledNotifications';
import { track } from '../services/analytics';

/**
 * Hook that registers for push notifications after onboarding is complete
 * and schedules local daily reminders.
 *
 * - Requests permission once (won't re-prompt if already granted/denied).
 * - Stores the ExpoPushToken in Zustand so it persists across launches.
 * - Schedules morning + streak-at-risk local notifications.
 * - Reschedules on every app foreground so they stay fresh.
 * - Sets up listeners for incoming notifications and tap responses.
 *
 * Call this once in the root layout.
 */
export function useNotifications() {
  const onboardingComplete = useStore((s) => s.onboardingComplete);
  const existingToken = useStore((s) => s.expoPushToken);
  const setExpoPushToken = useStore((s) => s.setExpoPushToken);
  const progress = useStore((s) => s.progress);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Helper: check state and schedule notifications.
  const reschedule = () => {
    const today = new Date().toISOString().split('T')[0];
    const playedToday = progress.lastPlayedDate === today;
    scheduleAll(playedToday, progress.currentStreak).catch(() => {});
  };

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

    // Schedule local notifications on mount.
    reschedule();

    // Reschedule on every app foreground so times stay accurate.
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') reschedule();
    };
    const sub = AppState.addEventListener('change', handleAppState);

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
      });

    return () => {
      sub.remove();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [onboardingComplete]);

  // Reschedule whenever progress changes (user played a game → cancel today's reminders).
  useEffect(() => {
    if (!onboardingComplete) return;
    reschedule();
  }, [progress.lastPlayedDate, progress.currentStreak]);
}
