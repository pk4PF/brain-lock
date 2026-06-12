//
//  DeviceActivityMonitorExtension.swift
//
//  Principal class for the DeviceActivityMonitor app extension.
//  Runs in its OWN process — fires when iOS reaches the intervalEnd of a
//  DeviceActivity schedule scheduled by the host app, even if the host app
//  is killed. We use this to re-apply shields when an unlock window expires.
//
//  Class name MUST be `DeviceActivityMonitorExtension` — the
//  @bacons/apple-targets generated Info.plist points NSExtensionPrincipalClass
//  at $(PRODUCT_MODULE_NAME).DeviceActivityMonitorExtension.
//

import DeviceActivity
import ManagedSettings
import FamilyControls
import Foundation

@available(iOS 16.0, *)
class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    // Must match the App Group used by SharedDataStore in the main app.
    private let suiteName = "group.com.pk4pf.brain-lock"
    private let selectionKey = "familyActivitySelection"
    private let appsUnlockedKey = "appsUnlocked"
    private let unlockExpiresAtKey = "unlockExpiresAt"

    private var defaults: UserDefaults? {
        UserDefaults(suiteName: suiteName)
    }

    /// Called by iOS when the unlock window's intervalEnd is reached.
    /// We re-apply the shield from the saved selection and clear the unlock flag.
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        guard activity == DeviceActivityName("unlockWindow") else { return }

        // Re-apply shield from the saved selection in the App Group.
        let selection: FamilyActivitySelection = {
            guard let data = defaults?.data(forKey: selectionKey) else {
                return FamilyActivitySelection()
            }
            return (try? PropertyListDecoder().decode(
                FamilyActivitySelection.self, from: data
            )) ?? FamilyActivitySelection()
        }()

        let store = ManagedSettingsStore()
        store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens)
        store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens

        // Clear the unlock flag so JS sees re-blocked state on next launch.
        defaults?.set(false, forKey: appsUnlockedKey)
        defaults?.removeObject(forKey: unlockExpiresAtKey)

        // Stop monitoring the now-expired one-shot.
        DeviceActivityCenter().stopMonitoring([activity])
    }

    /// No-op; we don't currently use threshold events but the override is here
    /// so future per-app usage limits can hook in without restructuring.
    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
    }
}
