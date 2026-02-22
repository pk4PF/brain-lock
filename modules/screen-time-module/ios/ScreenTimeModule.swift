import ExpoModulesCore
import FamilyControls
import DeviceActivity
import ManagedSettings
import SwiftUI

@available(iOS 16.0, *)
public class ScreenTimeModule: Module {

    private let store = SharedDataStore.shared
    private let center = DeviceActivityCenter()

    public func definition() -> ModuleDefinition {
        Name("ScreenTimeModule")

        Events("onSelectionChange")

        // MARK: - Authorization

        AsyncFunction("requestAuthorization") { () -> String in
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                return "approved"
            } catch {
                return "denied"
            }
        }

        AsyncFunction("getAuthorizationStatus") { () -> String in
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
            guard let self = self else { return }
            await MainActor.run {
                guard let scene = UIApplication.shared.connectedScenes
                    .compactMap({ $0 as? UIWindowScene })
                    .first,
                      let rootVC = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
                else { return }

                // Walk up to the topmost presented controller
                var topVC = rootVC
                while let presented = topVC.presentedViewController {
                    topVC = presented
                }

                let picker = ScreenTimeActivityPicker(store: self.store) { [weak self] in
                    topVC.dismiss(animated: true)
                    let sel = self?.store.savedSelection
                    let count = (sel?.applicationTokens.count ?? 0) + (sel?.categoryTokens.count ?? 0)
                    self?.sendEvent("onSelectionChange", ["count": count])
                }
                let hostingController = UIHostingController(rootView: picker)
                hostingController.modalPresentationStyle = .pageSheet
                topVC.present(hostingController, animated: true)
            }
        }

        AsyncFunction("getSelectionCount") { [weak self] () -> Int in
            guard let self = self else { return 0 }
            let sel = self.store.savedSelection
            return sel.applicationTokens.count + sel.categoryTokens.count
        }

        // MARK: - Schedule

        AsyncFunction("setSchedule") { [weak self] (startHour: Int, startMin: Int, endHour: Int, endMin: Int) -> Void in
            guard let self = self else { return }
            self.store.scheduleStartHour = startHour
            self.store.scheduleStartMinute = startMin
            self.store.scheduleEndHour = endHour
            self.store.scheduleEndMinute = endMin
            self.store.scheduleEnabled = true
            try self.startMonitoring()
        }

        AsyncFunction("getSchedule") { [weak self] () -> [String: Any] in
            guard let self = self else {
                return ["startHour": 0, "startMinute": 0, "endHour": 23, "endMinute": 59, "enabled": false]
            }
            return [
                "startHour": self.store.scheduleStartHour,
                "startMinute": self.store.scheduleStartMinute,
                "endHour": self.store.scheduleEndHour,
                "endMinute": self.store.scheduleEndMinute,
                "enabled": self.store.scheduleEnabled,
            ]
        }

        AsyncFunction("setScheduleEnabled") { [weak self] (enabled: Bool) -> Void in
            guard let self = self else { return }
            self.store.scheduleEnabled = enabled
            if enabled {
                try self.startMonitoring()
            } else {
                self.center.stopMonitoring()
            }
        }

        AsyncFunction("isScheduleEnabled") { [weak self] () -> Bool in
            return self?.store.scheduleEnabled ?? false
        }

        // MARK: - Shield (immediate apply/remove for testing)

        AsyncFunction("applyShieldNow") { [weak self] () -> Void in
            guard let self = self else { return }
            let sel = self.store.savedSelection
            let managedStore = ManagedSettingsStore()
            managedStore.shield.applications = sel.applicationTokens
            managedStore.shield.applicationCategories = .specific(sel.categoryTokens)
            managedStore.shield.webDomains = sel.webDomainTokens
        }

        AsyncFunction("removeShieldNow") { () -> Void in
            let managedStore = ManagedSettingsStore()
            managedStore.shield.applications = nil
            managedStore.shield.applicationCategories = nil
            managedStore.shield.webDomains = nil
        }
    }

    // MARK: - Private

    private func startMonitoring() throws {
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
        center.stopMonitoring()
        try center.startMonitoring(.daily, during: schedule)
    }
}

// MARK: - DeviceActivityName Extension

@available(iOS 16.0, *)
extension DeviceActivityName {
    static let daily = Self("daily")
}
