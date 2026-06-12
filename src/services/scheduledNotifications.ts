import * as Notifications from 'expo-notifications';

/**
 * One daily reminder at 9 AM. Rescheduled each time the app opens.
 * If the user already played today, it won't fire until tomorrow.
 */

const TITLES = [
  'Your brain is waiting.',
  'Quick round?',
  '60 seconds. That\'s all it takes.',
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleAll(
  playedToday: boolean,
  streak: number,
): Promise<void> {
  await cancelAll();

  // If they already played, no reminder needed today.
  // Either way, set up tomorrow's 9 AM.
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder',
    content: {
      title: streak >= 2 && !playedToday
        ? `${streak}-day streak. Don't lose it.`
        : pick(TITLES),
      body: 'Open Brainlock',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}
