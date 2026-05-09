# DeviceActivityMonitor Extension Setup

This file is **NOT compiled** as part of the screen-time-module pod. It's a
template to paste into a new Xcode extension target — `BrainLockMonitor` —
that re-engages the shield when an unlock window expires.

## Why this extension is required

The host app's JavaScript timer cannot re-apply the shield when BrainLock is
backgrounded or killed. Apple's only supported way to run code at a precise
time without the host app being alive is a `DeviceActivityMonitor` extension.
iOS launches this extension in its own process at the moment the
`DeviceActivitySchedule.intervalEnd` is reached (scheduled from JS via
`ScreenTime.scheduleUnlockExpiry()`).

## Xcode steps

1. Open `ios/BrainLock.xcworkspace` in Xcode.
2. **File → New → Target → Device Activity Monitor Extension** (look under
   "Application Extension"). Name it `BrainLockMonitor`.
   - Bundle identifier: `com.pk4pf.brain-lock.monitor`
   - Team: same as the main app
   - Embed in `BrainLock` (the main app target)
3. Replace the auto-generated `DeviceActivityMonitor` subclass file with the
   contents of `BrainLockDeviceActivityMonitor.swift` from this folder.
   - Make sure the file is added to the `BrainLockMonitor` target only,
     **not** the main app target.
4. In *Signing & Capabilities* for `BrainLockMonitor`:
   - Add **App Groups** → `group.com.pk4pf.brain-lock`
   - Add **Family Controls**
5. In `BrainLockMonitor`'s `Info.plist`, confirm the `NSExtension` key:
   ```xml
   <key>NSExtension</key>
   <dict>
       <key>NSExtensionPointIdentifier</key>
       <string>com.apple.deviceactivity.monitor-extension</string>
       <key>NSExtensionPrincipalClass</key>
       <string>$(PRODUCT_MODULE_NAME).BrainLockDeviceActivityMonitor</string>
   </dict>
   ```
6. Bump `buildNumber` in `app.config.js` and run
   `eas build --profile preview --platform ios` to test, then `--profile production`.
   EAS will regenerate the provisioning profile with the new extension bundle ID.

## Verification (on real device)

1. Pick 2 apps via the picker → confirm shield applies immediately.
2. Open a brain game → win → spend credits to unlock.
3. While unlocked, **kill BrainLock** from the app switcher.
4. Wait until the unlock window expires (set `UNLOCK_MINUTES = 1` in
   `src/store/useStore.ts` for testing — revert before submission).
5. Try to open one of the blocked apps → shield should appear.
6. Reopen BrainLock → state shows blocked, credits unchanged.

If 5 passes with BrainLock fully killed, the extension is wired correctly.

## Troubleshooting

- **Shield doesn't re-apply at intervalEnd:** check that the extension target
  has the App Group entitlement and that `selectionKey` matches the main app's
  `SharedDataStore` (`familyActivitySelection`).
- **Extension never fires:** check Console.app on Mac for crash logs from
  `BrainLockMonitor`. Most common cause is a missing Family Controls entitlement.
- **Build fails with "FamilyControls not found":** confirm deployment target
  is iOS 16.0+ on the extension target.
