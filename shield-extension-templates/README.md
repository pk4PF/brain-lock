# Shield Extension Templates

These files live at the repo root (outside `modules/` and `ios/`) on purpose:
`ScreenTimeModule.podspec` recursively globs `**/*.swift`, so anything inside
`modules/screen-time-module/ios/` gets compiled into the main pod. Shield
extension base classes only exist inside extension targets, so building them
in the main pod fails. Keep this folder at the repo root.

They're templates to paste into two new Xcode extension targets that brand the
iOS block screen with Brain Lock.

## Why two targets

- **`BrainLockShield`** (Shield Configuration Extension) — controls the *look*
  of the shield (title, icon, colours, button labels).
- **`BrainLockShieldAction`** (Shield Action Extension) — controls what happens
  when the user taps the shield's primary/secondary buttons.

Both must:

1. Be added to App Group `group.com.pk4pf.brain-lock` (matches
   `SharedDataStore.swift`).
2. Have the `com.apple.developer.family-controls` entitlement.
3. Use the same Apple Developer Team as the main app.
4. Have bundle IDs prefixed with the main app's: e.g.
   `com.pk4pf.brain-lock.shield` and `com.pk4pf.brain-lock.shield-action`.

## Xcode steps

1. Open `ios/BrainLock.xcworkspace` in Xcode.
2. **File → New → Target → Shield Configuration Extension** → name
   `BrainLockShield`. Replace the auto-generated `ShieldConfigurationDataSource`
   subclass with the contents of `BrainLockShieldDataSource.swift`.
3. **File → New → Target → Shield Action Extension** → name
   `BrainLockShieldAction`. Replace the auto-generated `ShieldActionHandler`
   with the contents of `BrainLockShieldActionHandler.swift`.
4. For both targets: open *Signing & Capabilities* and add **App Groups**
   (`group.com.pk4pf.brain-lock`) and **Family Controls**.
5. Add a `ShieldIcon.png` (1x 60pt, 2x 120pt, 3x 180pt — transparent PNG of
   the Brain Lock mark) to the `BrainLockShield` target's asset catalog.
6. Bump `buildNumber` in `app.config.js` and run `eas build --profile production`
   (or `--profile preview` to test first). EAS will regenerate the
   provisioning profile with the new extension bundle IDs.

## Verification

Install the build, configure blocking on a low-stakes app (e.g. Calculator),
close Brain Lock, then tap Calculator on the home screen. Expected: the
Brain Lock-branded shield, not Apple's default "Restricted" sheet.
