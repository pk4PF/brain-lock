import { requireNativeModule, EventEmitter, type Subscription } from 'expo-modules-core';
import { Platform } from 'react-native';

interface ScreenTimeModuleNative {
  requestAuthorization(): Promise<string>;
  getAuthorizationStatus(): Promise<string>;
  showAppPicker(): Promise<void>;
  getSelectionCount(): Promise<number>;
  blockApps(): Promise<void>;
  unblockAll(): Promise<void>;
  applyShieldNow(): Promise<void>;
  removeShieldNow(): Promise<void>;
  ensureBlocking(): Promise<void>;
  scheduleUnlockExpiry(minutes: number): Promise<void>;
  cancelUnlockExpiry(): Promise<void>;
  setAppsUnlocked(unlocked: boolean): Promise<void>;
  getAppsUnlocked(): Promise<boolean>;
  getUnlockExpiresAt(): Promise<number>;
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

const emitter = NativeModule ? new EventEmitter(NativeModule as any) : null;

export const ScreenTime = {
  /** Whether Screen Time APIs are available (iOS only) */
  isAvailable: Platform.OS === 'ios',

  /** Listen for selection changes from the native app picker. */
  addSelectionChangeListener(callback: (event: { count: number }) => void): Subscription | null {
    if (!emitter) return null;
    return emitter.addListener('onSelectionChange', callback);
  },

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

  /** Apply the shield to currently-selected apps. Idempotent. */
  async blockApps(): Promise<void> {
    if (!NativeModule) return;
    await NativeModule.blockApps();
  },

  /** Lift the shield and cancel any active unlock window. */
  async unblockAll(): Promise<void> {
    if (!NativeModule) return;
    await NativeModule.unblockAll();
  },

  /** Immediately apply shields to selected apps. */
  async applyShieldNow(): Promise<void> {
    if (!NativeModule) throw new Error('Screen Time is only available on iOS');
    await NativeModule.applyShieldNow();
  },

  /** Immediately remove all shields. */
  async removeShieldNow(): Promise<void> {
    if (!NativeModule) throw new Error('Screen Time is only available on iOS');
    await NativeModule.removeShieldNow();
  },

  /** Re-apply shields on app launch if a selection exists and no unlock window is active. */
  async ensureBlocking(): Promise<void> {
    if (!NativeModule) return;
    await NativeModule.ensureBlocking();
  },

  /**
   * Schedule the DeviceActivityMonitor extension to fire at `now + minutes`.
   * When the interval ends, the extension re-applies the shield even if the
   * host app has been killed. Call this from JS right after `removeShieldNow`.
   */
  async scheduleUnlockExpiry(minutes: number): Promise<void> {
    if (!NativeModule) return;
    await NativeModule.scheduleUnlockExpiry(minutes);
  },

  /** Cancel any pending unlock-window expiry (e.g. when re-blocking manually). */
  async cancelUnlockExpiry(): Promise<void> {
    if (!NativeModule) return;
    await NativeModule.cancelUnlockExpiry();
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

  /** Read unlock expiry timestamp (unix seconds, 0 if no active window). */
  async getUnlockExpiresAt(): Promise<number> {
    if (!NativeModule) return 0;
    return await NativeModule.getUnlockExpiresAt();
  },
};
