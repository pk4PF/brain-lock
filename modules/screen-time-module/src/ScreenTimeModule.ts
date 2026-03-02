import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

interface ScreenTimeModuleNative {
  requestAuthorization(): Promise<string>;
  getAuthorizationStatus(): Promise<string>;
  showAppPicker(): Promise<void>;
  getSelectionCount(): Promise<number>;
  setSchedule(
    startHour: number,
    startMin: number,
    endHour: number,
    endMin: number
  ): Promise<void>;
  getSchedule(): Promise<{
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    enabled: boolean;
  }>;
  setScheduleEnabled(enabled: boolean): Promise<void>;
  isScheduleEnabled(): Promise<boolean>;
  applyShieldNow(): Promise<void>;
  removeShieldNow(): Promise<void>;
  ensureBlocking(): Promise<void>;
  setAppsUnlocked(unlocked: boolean): Promise<void>;
  getAppsUnlocked(): Promise<boolean>;
}

const NativeModule: ScreenTimeModuleNative | null = (() => {
  if (Platform.OS !== 'ios') return null;
  try {
    return requireNativeModule('ScreenTimeModule');
  } catch (e) {
    console.warn('ScreenTimeModule native module not found. The app needs to be built natively.');
    return null;
  }
})();

export const ScreenTime = {
  /** Whether Screen Time APIs are available (iOS only) */
  isAvailable: Platform.OS === 'ios',

  /** Request FamilyControls authorization. Returns 'approved' or 'denied'. */
  async requestAuthorization(): Promise<'approved' | 'denied'> {
    if (!NativeModule) throw new Error('Screen Time is only available on iOS');
    const result = await NativeModule.requestAuthorization();
    return result as 'approved' | 'denied';
  },

  /** Get current authorization status: 'approved', 'denied', or 'notDetermined'. */
  async getAuthorizationStatus(): Promise<
    'approved' | 'denied' | 'notDetermined'
  > {
    if (!NativeModule) return 'notDetermined';
    const result = await NativeModule.getAuthorizationStatus();
    return result as 'approved' | 'denied' | 'notDetermined';
  },

  /** Present the native FamilyActivityPicker to select apps/categories. */
  async showAppPicker(): Promise<void> {
    if (!NativeModule) throw new Error('Screen Time is only available on iOS');
    await NativeModule.showAppPicker();
  },

  /** Get the number of selected apps + categories. */
  async getSelectionCount(): Promise<number> {
    if (!NativeModule) return 0;
    return await NativeModule.getSelectionCount();
  },

  /** Set the blocked hours schedule (24h format) and enable monitoring. */
  async setSchedule(
    startHour: number,
    startMin: number,
    endHour: number,
    endMin: number
  ): Promise<void> {
    if (!NativeModule) throw new Error('Screen Time is only available on iOS');
    await NativeModule.setSchedule(startHour, startMin, endHour, endMin);
  },

  /** Get the current schedule configuration. */
  async getSchedule() {
    if (!NativeModule) {
      return {
        startHour: 0,
        startMinute: 0,
        endHour: 23,
        endMinute: 59,
        enabled: false,
      };
    }
    return await NativeModule.getSchedule();
  },

  /** Enable or disable the scheduled monitoring. */
  async setScheduleEnabled(enabled: boolean): Promise<void> {
    if (!NativeModule) throw new Error('Screen Time is only available on iOS');
    await NativeModule.setScheduleEnabled(enabled);
  },

  /** Check if schedule monitoring is currently enabled. */
  async isScheduleEnabled(): Promise<boolean> {
    if (!NativeModule) return false;
    return await NativeModule.isScheduleEnabled();
  },

  /** Immediately apply shields to selected apps (for testing). */
  async applyShieldNow(): Promise<void> {
    if (!NativeModule) throw new Error('Screen Time is only available on iOS');
    await NativeModule.applyShieldNow();
  },

  /** Immediately remove all shields. */
  async removeShieldNow(): Promise<void> {
    if (!NativeModule) throw new Error('Screen Time is only available on iOS');
    await NativeModule.removeShieldNow();
  },

  /** Re-apply shields on app launch if blocking was previously enabled. */
  async ensureBlocking(): Promise<void> {
    if (!NativeModule) return;
    await NativeModule.ensureBlocking();
  },

  /** Write unlock state to shared UserDefaults so native code + extension can read it. */
  async setAppsUnlocked(unlocked: boolean): Promise<void> {
    if (!NativeModule) return;
    await NativeModule.setAppsUnlocked(unlocked);
  },

  /** Read unlock state from shared UserDefaults. */
  async getAppsUnlocked(): Promise<boolean> {
    if (!NativeModule) return false;
    return await NativeModule.getAppsUnlocked();
  },
};
