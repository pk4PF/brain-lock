import ExpoModulesCore
import SwiftUI
import FamilyControls
import DeviceActivity
import ManagedSettings

public class ScreenTimeModule: Module {

    public func definition() -> ModuleDefinition {
        Name("ScreenTimeModule")

        Events("onSelectionChange")

        // MARK: - Authorization

        AsyncFunction("requestAuthorization") { () -> String in
            guard #available(iOS 16.0, *) else {
                return "denied:iOS 16+ required"
            }
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                return "approved"
            } catch {
                print("[ScreenTimeModule] Authorization error: \(error)")
                print("[ScreenTimeModule] Error localizedDescription: \(error.localizedDescription)")
                return "denied:\(error.localizedDescription)"
            }
        }

        AsyncFunction("getAuthorizationStatus") { () -> String in
            guard #available(iOS 16.0, *) else {
                return "notDetermined"
            }
            switch AuthorizationCenter.shared.authorizationStatus {
            case .approved:
                return "approved"
            case .denied:
                return "denied"
            case .notDetermined:
                return "notDetermined"
            @unknown default:
                return "notDetermined"
            }
        }

        // MARK: - App Picker

        AsyncFunction("showAppPicker") { [weak self] () -> Void in
            guard #available(iOS 16.0, *) else { return }
            guard let self = self else { return }
            let store = SharedDataStore.shared
            await MainActor.run {
                guard let scene = UIApplication.shared.connectedScenes
                    .compactMap({ $0 as? UIWindowScene })
                    .first,
                      let rootVC = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
                else { return }

                var topVC = rootVC
                while let presented = topVC.presentedViewController {
                    topVC = presented
                }

                let picker = ScreenTimeActivityPicker(store: store) { [weak self] in
                    topVC.dismiss(animated: true)
                    let sel = store.savedSelection
                    let count = sel.applicationTokens.count + sel.categoryTokens.count
                    self?.sendEvent("onSelectionChange", ["count": count])
                }
                let hostingController = UIHostingController(rootView: picker)
                hostingController.modalPresentationStyle = .pageSheet
                topVC.present(hostingController, animated: true)
            }
        }

        AsyncFunction("getSelectionCount") { () -> Int in
            guard #available(iOS 16.0, *) else { return 0 }
            let sel = SharedDataStore.shared.savedSelection
            return sel.applicationTokens.count + sel.categoryTokens.count
        }

        // MARK: - Block apps (no schedule)
        //
        // The model is now: pick apps → blocked. The only way to unlock is
        // to spend credits, which schedules a one-shot DeviceActivity event
        // to re-block at the unlock-window's intervalEnd.

        AsyncFunction("blockApps") { [weak self] () -> Void in
            guard #available(iOS 16.0, *) else { return }
            self?.applyShieldsFromStore()
            self?.startAlwaysBlockSchedule()
            DeviceActivityCenter().stopMonitoring([.unlockWindow])
            SharedDataStore.shared.appsUnlocked = false
        }

        AsyncFunction("unblockAll") { [weak self] () -> Void in
            guard #available(iOS 16.0, *) else { return }
            self?.removeAllShields()
            DeviceActivityCenter().stopMonitoring()
            SharedDataStore.shared.appsUnlocked = false
        }

        // MARK: - Shield (immediate apply/remove)

        AsyncFunction("applyShieldNow") { [weak self] () -> Void in
            guard #available(iOS 16.0, *) else { return }
            self?.applyShieldsFromStore()
        }

        AsyncFunction("removeShieldNow") { [weak self] () -> Void in
            guard #available(iOS 16.0, *) else { return }
            self?.removeAllShields()
        }

        // MARK: - Unlock window scheduling
        //
        // When the user spends credits to unlock, JS calls scheduleUnlockExpiry
        // with the duration in minutes. iOS schedules a DeviceActivity event
        // whose intervalEnd is `now + minutes`. At that moment, the system wakes
        // BrainLockMonitor (a separate process) which re-applies shields from
        // SharedDataStore.savedSelection — works even if the host app is killed.

        AsyncFunction("scheduleUnlockExpiry") { (minutes: Int) -> Void in
            guard #available(iOS 16.0, *) else { return }
            let cal = Calendar.current
            let minutes = max(1, minutes)

            // Nudge intervalStart 2 seconds into the future so iOS never
            // considers it "already passed" by the time startMonitoring runs.
            let startDate = Date().addingTimeInterval(2)
            let endDate = startDate.addingTimeInterval(TimeInterval(minutes * 60))

            // Include year/month/day/hour/minute/second so the schedule is
            // anchored to today rather than interpreted as a recurring daily
            // time-of-day window.
            let anchorComps: Set<Calendar.Component> = [.year, .month, .day, .hour, .minute, .second]
            let startComps = cal.dateComponents(anchorComps, from: startDate)
            let endComps = cal.dateComponents(anchorComps, from: endDate)

            let schedule = DeviceActivitySchedule(
                intervalStart: startComps,
                intervalEnd: endComps,
                repeats: false
            )

            SharedDataStore.shared.unlockExpiresAt = endDate
            SharedDataStore.shared.appsUnlocked = true

            let center = DeviceActivityCenter()
            center.stopMonitoring([.unlockWindow])
            do {
                try center.startMonitoring(.unlockWindow, during: schedule)
                print("[ScreenTimeModule] unlockWindow monitoring started, expires at \(endDate)")
            } catch {
                print("[ScreenTimeModule] startMonitoring failed: \(error)")
            }
        }

        AsyncFunction("cancelUnlockExpiry") { () -> Void in
            guard #available(iOS 16.0, *) else { return }
            DeviceActivityCenter().stopMonitoring([.unlockWindow])
            SharedDataStore.shared.appsUnlocked = false
            SharedDataStore.shared.unlockExpiresAt = nil
        }

        // MARK: - Unlock state (read-only convenience for JS)

        AsyncFunction("setAppsUnlocked") { (unlocked: Bool) -> Void in
            guard #available(iOS 16.0, *) else { return }
            SharedDataStore.shared.appsUnlocked = unlocked
        }

        AsyncFunction("getAppsUnlocked") { () -> Bool in
            guard #available(iOS 16.0, *) else { return false }
            return SharedDataStore.shared.appsUnlocked
        }

        AsyncFunction("getUnlockExpiresAt") { () -> Double in
            guard #available(iOS 16.0, *) else { return 0 }
            return SharedDataStore.shared.unlockExpiresAt?.timeIntervalSince1970 ?? 0
        }

        // MARK: - Ensure blocking on app launch
        //
        // Called once on app foreground. Re-applies shields if the user has
        // selected apps and is not currently within an active unlock window.
        // This is a belt-and-braces fallback in case ManagedSettings was
        // somehow cleared (extremely rare; ManagedSettings persists across
        // launches by default).

        AsyncFunction("ensureBlocking") { [weak self] () -> Void in
            guard #available(iOS 16.0, *) else { return }
            guard let self = self else { return }
            let store = SharedDataStore.shared
            let sel = store.savedSelection
            let hasSelection = !sel.applicationTokens.isEmpty || !sel.categoryTokens.isEmpty
            guard hasSelection else { return }

            if store.appsUnlocked {
                print("[ScreenTimeModule] Active unlock window — leaving shields removed")
                return
            }

            print("[ScreenTimeModule] ensureBlocking: re-applying shields")
            self.applyShieldsFromStore()
            self.startAlwaysBlockSchedule()
        }
    }

    // MARK: - Private Helpers

    @available(iOS 16.0, *)
    private func applyShieldsFromStore() {
        let sel = SharedDataStore.shared.savedSelection
        let managedStore = ManagedSettingsStore()
        managedStore.shield.applications = sel.applicationTokens.isEmpty ? nil : sel.applicationTokens
        managedStore.shield.applicationCategories = sel.categoryTokens.isEmpty ? nil : .specific(sel.categoryTokens)
        managedStore.shield.webDomains = sel.webDomainTokens.isEmpty ? nil : sel.webDomainTokens
        print("[ScreenTimeModule] Shields applied: \(sel.applicationTokens.count) apps, \(sel.categoryTokens.count) categories")
    }

    @available(iOS 16.0, *)
    private func startAlwaysBlockSchedule() {
        let center = DeviceActivityCenter()
        // A repeating midnight-to-midnight schedule. The system fires
        // intervalDidStart on the monitor extension every day at 00:00,
        // including after device reboots, so shields get re-applied
        // without the user opening the app.
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true
        )
        // Don't stop-then-start — just start. If already monitoring this
        // activity, startMonitoring replaces the existing schedule.
        do {
            try center.startMonitoring(.alwaysBlock, during: schedule)
            print("[ScreenTimeModule] alwaysBlock schedule registered")
        } catch {
            print("[ScreenTimeModule] alwaysBlock schedule failed: \(error)")
        }
    }

    @available(iOS 16.0, *)
    private func removeAllShields() {
        let managedStore = ManagedSettingsStore()
        managedStore.shield.applications = nil
        managedStore.shield.applicationCategories = nil
        managedStore.shield.webDomains = nil
        print("[ScreenTimeModule] All shields removed")
    }
}

// MARK: - DeviceActivityName Extension

@available(iOS 16.0, *)
extension DeviceActivityName {
    static let unlockWindow = Self("unlockWindow")
    static let alwaysBlock = Self("alwaysBlock")
}
