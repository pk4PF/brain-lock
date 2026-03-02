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

        // MARK: - Schedule

        AsyncFunction("setSchedule") { [weak self] (startHour: Int, startMin: Int, endHour: Int, endMin: Int) -> Void in
            guard #available(iOS 16.0, *) else { return }
            guard let self = self else { return }
            let store = SharedDataStore.shared
            store.scheduleStartHour = startHour
            store.scheduleStartMinute = startMin
            store.scheduleEndHour = endHour
            store.scheduleEndMinute = endMin
            store.scheduleEnabled = true

            // Apply shields IMMEDIATELY so blocking starts right now
            self.applyShieldsFromStore()

            // Also set up DeviceActivity monitoring for background schedule enforcement
            try self.startMonitoringImpl()
        }

        AsyncFunction("getSchedule") { () -> [String: Any] in
            guard #available(iOS 16.0, *) else {
                return ["startHour": 0, "startMinute": 0, "endHour": 23, "endMinute": 59, "enabled": false]
            }
            let store = SharedDataStore.shared
            return [
                "startHour": store.scheduleStartHour,
                "startMinute": store.scheduleStartMinute,
                "endHour": store.scheduleEndHour,
                "endMinute": store.scheduleEndMinute,
                "enabled": store.scheduleEnabled,
            ]
        }

        AsyncFunction("setScheduleEnabled") { [weak self] (enabled: Bool) -> Void in
            guard #available(iOS 16.0, *) else { return }
            guard let self = self else { return }
            let store = SharedDataStore.shared
            store.scheduleEnabled = enabled
            if enabled {
                self.applyShieldsFromStore()
                try self.startMonitoringImpl()
            } else {
                DeviceActivityCenter().stopMonitoring()
                self.removeAllShields()
            }
        }

        AsyncFunction("isScheduleEnabled") { () -> Bool in
            guard #available(iOS 16.0, *) else { return false }
            return SharedDataStore.shared.scheduleEnabled
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

        // MARK: - Unlock state (shared with DeviceActivity extension)

        AsyncFunction("setAppsUnlocked") { (unlocked: Bool) -> Void in
            guard #available(iOS 16.0, *) else { return }
            SharedDataStore.shared.appsUnlocked = unlocked
            print("[ScreenTimeModule] appsUnlocked set to \(unlocked)")
        }

        AsyncFunction("getAppsUnlocked") { () -> Bool in
            guard #available(iOS 16.0, *) else { return false }
            return SharedDataStore.shared.appsUnlocked
        }

        // MARK: - Ensure blocking on app launch

        AsyncFunction("ensureBlocking") { [weak self] () -> Void in
            guard #available(iOS 16.0, *) else { return }
            guard let self = self else { return }
            let store = SharedDataStore.shared
            guard store.scheduleEnabled else { return }

            if store.appsUnlocked {
                print("[ScreenTimeModule] Apps unlocked for today — skipping shield re-apply")
                return
            }

            print("[ScreenTimeModule] Re-applying shields on app launch")
            self.applyShieldsFromStore()
            try? self.startMonitoringImpl()
        }
    }

    // MARK: - Private Helpers

    @available(iOS 16.0, *)
    private func applyShieldsFromStore() {
        let sel = SharedDataStore.shared.savedSelection
        let managedStore = ManagedSettingsStore()
        managedStore.shield.applications = sel.applicationTokens
        managedStore.shield.applicationCategories = .specific(sel.categoryTokens)
        managedStore.shield.webDomains = sel.webDomainTokens
        print("[ScreenTimeModule] Shields applied: \(sel.applicationTokens.count) apps, \(sel.categoryTokens.count) categories")
    }

    @available(iOS 16.0, *)
    private func removeAllShields() {
        let managedStore = ManagedSettingsStore()
        managedStore.shield.applications = nil
        managedStore.shield.applicationCategories = nil
        managedStore.shield.webDomains = nil
        print("[ScreenTimeModule] All shields removed")
    }

    @available(iOS 16.0, *)
    private func startMonitoringImpl() throws {
        let store = SharedDataStore.shared
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(
                hour: store.scheduleStartHour,
                minute: store.scheduleStartMinute
            ),
            intervalEnd: DateComponents(
                hour: store.scheduleEndHour,
                minute: store.scheduleEndMinute
            ),
            repeats: true
        )
        let center = DeviceActivityCenter()
        center.stopMonitoring()
        try center.startMonitoring(.daily, during: schedule)
        print("[ScreenTimeModule] Monitoring started: \(store.scheduleStartHour):\(store.scheduleStartMinute) - \(store.scheduleEndHour):\(store.scheduleEndMinute)")
    }
}

// MARK: - DeviceActivityName Extension

@available(iOS 16.0, *)
extension DeviceActivityName {
    static let daily = Self("daily")
}
