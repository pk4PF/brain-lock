//
//  BrainLockDeviceActivityMonitor.swift
//
//  Principal class for the DeviceActivityMonitor app extension.
//  Runs in its OWN process — fires when iOS reaches the intervalEnd of a
//  DeviceActivity schedule scheduled by the host app, even if the host app
//  is killed. We use this to re-apply shields when an unlock window expires.
//
//  This file is NOT compiled as part of the main app. It belongs to the
//  `BrainLockMonitor` Xcode extension target (see README in this folder).
//

import DeviceActivity
import ManagedSettings
import FamilyControls
import Foundation

@available(iOS 16.0, *)
class BrainLockDeviceActivityMonitor: DeviceActivityMonitor {

    // Must match the App Group used by SharedDataStore in the main app.
    private let suiteName = "group.com.pk4pf.brain-lock"
    private let selectionKey = "familyActivitySelection"
    private let appsUnlockedKey = "appsUnlocked"
    private let unlockExpiresAtKey = "unlockExpiresAt"

    private var defaults: UserDefaults? {
        UserDefaults(suiteName: suiteName)
    }

    /// Fires daily at midnight for the `alwaysBlock` schedule, and also
    /// after device reboots. Re-applies shields so blocking survives
    /// power cycles without the user opening the app.
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        guard activity == DeviceActivityName("alwaysBlock") else { return }

        // If an unlock window is active, don't re-block.
        if let expiry = defaults?.object(forKey: unlockExpiresAtKey) as? Date,
           Date() < expiry {
            return
        }

        applyShieldsFromSelection()
    }

    /// Called by iOS when the unlock window's intervalEnd is reached.
    /// Re-applies shields and clears the unlock flag.
    ///
    /// Guard: iOS may deliver this callback late — after the user has already
    /// started a NEW unlock. If `unlockExpiresAt` is still in the future, a
    /// fresher schedule owns the window; this stale callback must not re-block
    /// or stop monitoring, otherwise the second unlock dies ~30 s in.
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        if activity == DeviceActivityName("unlockWindow") {
            if let expiry = defaults?.object(forKey: unlockExpiresAtKey) as? Date,
               Date() < expiry {
                return
            }

            applyShieldsFromSelection()
            defaults?.set(false, forKey: appsUnlockedKey)
            defaults?.removeObject(forKey: unlockExpiresAtKey)
            DeviceActivityCenter().stopMonitoring([activity])
        }
    }

    /// No-op; we don't currently use threshold events but the override is here
    /// so future per-app usage limits can hook in without restructuring.
    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
    }

    private func applyShieldsFromSelection() {
        guard let data = defaults?.data(forKey: selectionKey),
              let selection = try? PropertyListDecoder().decode(
                  FamilyActivitySelection.self, from: data
              ) else { return }

        let store = ManagedSettingsStore()
        store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens)
        store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
    }
}
