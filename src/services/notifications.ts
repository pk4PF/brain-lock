import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Push notification service for Brainlock.
 *
 * Uses Expo's push infrastructure (ExpoPushToken) which proxies through
 * APNs on iOS and FCM on Android. No custom server is needed to *register*
 * - only to *send* (via https://exp.host/--/api/v2/push/send or a service
 * like OneSignal / Supabase Edge Functions).
 *
 * Setup checklist (one-time, outside this codebase):
 *  1. Generate an APNs key in Apple Developer → Keys → APNs.
 *  2. Upload the .p8 key to EAS: `eas credentials` → iOS → Push Notifications.
 *  3. For Android: FCM is auto-configured by Expo's managed workflow.
 */

// Configure how notifications appear when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request permission and register for push notifications.
 * Returns the Expo push token string (e.g. "ExponentPushToken[xxx]")
 * or null if permission was denied or unavailable.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices.
  if (!Device.isDevice) {
    if (__DEV__) console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permission status.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // If not already granted, ask.
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (__DEV__) console.log('Push notification permission denied');
    return null;
  }

  // Android requires a notification channel.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F2660E',
    });
  }

  // Get the Expo push token.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenData.data;
}

/**
 * Get the current notification permission status without prompting.
 */
export async function getNotificationPermissionStatus(): Promise<
  'granted' | 'denied' | 'undetermined'
> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}
